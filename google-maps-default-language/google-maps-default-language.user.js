// ==UserScript==
// @name         Google Maps Default Language (pt-BR Fork)
// @namespace    https://github.com/fabiorzfreitas/userscripts/google-maps-default-language
// @version      1.1.0
// @description  On first use, switches non-Portuguese Google Maps to Brazilian Portuguese (pt-BR), then remembers languages manually selected by the user in Google Maps, forked from Codex's original script
// @author       fabiorzfreitas (Forked from Codex)
// @match        https://www.google.com/maps*
// @match        https://maps.google.com/*
// @include      /^https:\/\/(?:www|maps)\.google\.[^/]+\/(?:maps.*)?$/
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/google-maps-default-language/google-maps-default-language.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/google-maps-default-language/google-maps-default-language.user.js
// ==/UserScript==

(function () {
  "use strict";

  const FALLBACK_LANGUAGE = "pt-BR";
  const PREFERENCE_KEY = "google-maps-preferred-language";
  const REDIRECT_KEY = "google-maps-language-auto-redirect";
  const INTERACTION_KEY = "google-maps-language-user-interaction";
  const RECENT_INTERACTION_MS = 15_000;
  const REDIRECT_MARKER_MS = 30_000;

  let observedUrlLanguage = getUrlLanguage(location.href);
  let observedDocumentLanguage = getDocumentLanguage();

  installUserInteractionTracking();
  registerMenuCommands();
  applyPreferredLanguage();
  observeLanguageChanges();

  /**
   * Determines the language to use for this session:
   * 1. If a preference already exists, always apply the preference.
   * 2. On first run, if the current language is Portuguese, keep the current Portuguese locale.
   * 3. On first run, if the current language is not Portuguese, switch to Brazilian Portuguese (pt-BR).
   */
  function applyPreferredLanguage() {
    let preferred = normalizeLanguage(GM_getValue(PREFERENCE_KEY, ""));
    const urlLanguage = getUrlLanguage(location.href);
    const documentLanguage = getDocumentLanguage();

    // At document-start, <html lang> may not have appeared yet; on first run,
    // we must wait until it is available, otherwise an already Portuguese page might be mistakenly identified as non-Portuguese.
    if (
      !preferred &&
      !urlLanguage &&
      !documentLanguage &&
      document.readyState === "loading"
    ) {
      document.addEventListener("DOMContentLoaded", applyPreferredLanguage, {
        once: true,
      });
      return;
    }

    if (preferred) {
      // If the language menu does not add hl to the URL, wait until the new page's <html lang>
      // appears before evaluating, preventing an immediate revert to the old preference before it renders.
      if (
        !urlLanguage &&
        hasRecentUserInteraction() &&
        !documentLanguage &&
        document.readyState === "loading"
      ) {
        document.addEventListener("DOMContentLoaded", applyPreferredLanguage, {
          once: true,
        });
        return;
      }

      if (
        !urlLanguage &&
        hasRecentUserInteraction() &&
        documentLanguage &&
        !sameLanguage(documentLanguage, preferred)
      ) {
        savePreference(documentLanguage);
        clearUserInteraction();
        ensureLanguage(documentLanguage);
        return;
      }

      const wasAutomaticRedirect = consumeAutomaticRedirectMarker(urlLanguage);

      // Some Google Maps language menus reload the page first, making it impossible to directly
      // retrieve the selection result from the old page; use recent user interaction to detect this language change.
      if (
        urlLanguage &&
        !sameLanguage(urlLanguage, preferred) &&
        !wasAutomaticRedirect &&
        hasRecentUserInteraction()
      ) {
        savePreference(urlLanguage);
        clearUserInteraction();
        return;
      }

      clearUserInteraction();
      ensureLanguage(preferred);
      return;
    }

    const currentLanguage = urlLanguage || documentLanguage;
    preferred = isPortuguese(currentLanguage)
      ? currentLanguage
      : FALLBACK_LANGUAGE;

    savePreference(preferred);
    clearUserInteraction();
    ensureLanguage(preferred);
  }

  /** Adds hl to the current URL; replace() prevents leaving an extra page in browser history. */
  function ensureLanguage(language) {
    const urlLanguage = getUrlLanguage(location.href);

    if (urlLanguage && sameLanguage(urlLanguage, language)) {
      return;
    }

    const target = new URL(location.href);
    target.searchParams.set("hl", language);
    markAutomaticRedirect(language, target.href);
    location.replace(target.href);
  }

  /**
   * When the user clicks a Google Maps language link, saves the selection before navigating away.
   * Also records all trusted clicks to cover menus controlled by JavaScript without an href.
   */
  function installUserInteractionTracking() {
    document.addEventListener(
      "click",
      (event) => {
        if (!event.isTrusted) return;

        markUserInteraction();

        const destination = getMapsDestinationFromEvent(event);
        const selectedLanguage = destination
          ? getUrlLanguage(destination.href)
          : null;

        if (selectedLanguage) {
          savePreference(selectedLanguage);
          clearUserInteraction();
        }
      },
      true,
    );

    document.addEventListener(
      "submit",
      (event) => {
        if (!event.isTrusted || !(event.target instanceof HTMLFormElement)) {
          return;
        }

        const formData = new FormData(event.target);
        const selectedLanguage = normalizeLanguage(formData.get("hl"));
        if (selectedLanguage) {
          savePreference(selectedLanguage);
          clearUserInteraction();
        } else {
          markUserInteraction();
        }
      },
      true,
    );

    document.addEventListener(
      "change",
      (event) => {
        if (!event.isTrusted || !(event.target instanceof HTMLSelectElement)) {
          return;
        }

        if (event.target.name === "hl") {
          const selectedLanguage = normalizeLanguage(event.target.value);
          if (selectedLanguage) savePreference(selectedLanguage);
        }
      },
      true,
    );
  }

  /** Watches for Maps SPA URL changes and <html lang> changes. */
  function observeLanguageChanges() {
    const check = () => {
      const urlLanguage = getUrlLanguage(location.href);
      const documentLanguage = getDocumentLanguage();
      const recentInteraction = hasRecentUserInteraction();

      if (
        recentInteraction &&
        urlLanguage &&
        !sameLanguage(urlLanguage, observedUrlLanguage)
      ) {
        savePreference(urlLanguage);
        clearUserInteraction();
      } else if (
        recentInteraction &&
        documentLanguage &&
        !sameLanguage(documentLanguage, observedDocumentLanguage)
      ) {
        savePreference(documentLanguage);
        clearUserInteraction();
      }

      observedUrlLanguage = urlLanguage;
      observedDocumentLanguage = documentLanguage;
    };

    window.addEventListener("popstate", check, true);
    window.addEventListener("hashchange", check, true);

    const startObserver = () => {
      if (!document.documentElement) return;
      new MutationObserver(check).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
    };

    if (document.documentElement) {
      startObserver();
    } else {
      document.addEventListener("DOMContentLoaded", startObserver, {
        once: true,
      });
    }

    // pushState/replaceState do not trigger popstate, so check periodically at a low frequency as a fallback.
    window.setInterval(check, 1_000);
  }

  function getMapsDestinationFromEvent(event) {
    for (const node of event.composedPath()) {
      if (!(node instanceof Element)) continue;

      const href = node.getAttribute("href");
      if (!href) continue;

      try {
        const destination = new URL(href, location.href);
        if (isGoogleMapsUrl(destination)) return destination;
      } catch {
        // Ignore href values that are not valid URLs.
      }
    }
    return null;
  }

  function isGoogleMapsUrl(url) {
    const googleHost = /^(?:www|maps)\.google\.[a-z.]+$/i.test(url.hostname);
    return (
      googleHost &&
      (url.hostname.startsWith("maps.") || url.pathname.startsWith("/maps"))
    );
  }

  function getUrlLanguage(urlValue) {
    try {
      return normalizeLanguage(
        new URL(urlValue, location.href).searchParams.get("hl"),
      );
    } catch {
      return null;
    }
  }

  function getDocumentLanguage() {
    return normalizeLanguage(document.documentElement?.lang);
  }

  function normalizeLanguage(value) {
    if (typeof value !== "string") return null;

    const cleaned = value.trim().replaceAll("_", "-");
    if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(cleaned)) return null;

    return cleaned
      .split("-")
      .map((part, index) => {
        if (index === 0) return part.toLowerCase();
        if (/^[a-z]{4}$/i.test(part)) {
          return part[0].toUpperCase() + part.slice(1).toLowerCase();
        }
        if (/^[a-z]{2}$/i.test(part)) return part.toUpperCase();
        return part.toLowerCase();
      })
      .join("-");
  }

  function sameLanguage(left, right) {
    const normalizedLeft = normalizeLanguage(left);
    const normalizedRight = normalizeLanguage(right);
    return Boolean(
      normalizedLeft &&
      normalizedRight &&
      normalizedLeft.toLowerCase() === normalizedRight.toLowerCase(),
    );
  }

  function isPortuguese(language) {
    const normalized = normalizeLanguage(language);
    return Boolean(normalized && normalized.toLowerCase().startsWith("pt"));
  }

  function savePreference(language) {
    const normalized = normalizeLanguage(language);
    if (normalized) GM_setValue(PREFERENCE_KEY, normalized);
  }

  function markAutomaticRedirect(language, href) {
    sessionStorage.setItem(
      REDIRECT_KEY,
      JSON.stringify({
        language,
        href,
        timestamp: Date.now(),
      }),
    );
  }

  function consumeAutomaticRedirectMarker(currentLanguage) {
    const marker = readSessionValue(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);

    return Boolean(
      marker &&
      Date.now() - marker.timestamp <= REDIRECT_MARKER_MS &&
      sameLanguage(marker.language, currentLanguage) &&
      marker.href === location.href,
    );
  }

  function markUserInteraction() {
    sessionStorage.setItem(
      INTERACTION_KEY,
      JSON.stringify({
        timestamp: Date.now(),
      }),
    );
  }

  function hasRecentUserInteraction() {
    const marker = readSessionValue(INTERACTION_KEY);
    return Boolean(
      marker && Date.now() - marker.timestamp <= RECENT_INTERACTION_MS,
    );
  }

  function clearUserInteraction() {
    sessionStorage.removeItem(INTERACTION_KEY);
  }

  function readSessionValue(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null");
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  }

  function registerMenuCommands() {
    GM_registerMenuCommand("Set default language to pt-BR", () => {
      savePreference(FALLBACK_LANGUAGE);
      ensureLanguage(FALLBACK_LANGUAGE);
    });

    GM_registerMenuCommand("Clear remembered language", () => {
      GM_deleteValue(PREFERENCE_KEY);
      location.reload();
    });
  }
})();
