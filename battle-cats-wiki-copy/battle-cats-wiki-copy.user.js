// ==UserScript==
// @name         Battle Cats Wiki Copy (Universal)
// @namespace    https://github.com/fabiorzfreitas/userscripts/battle-cats-wiki-copy
// @version      1.2
// @description  Copy unit data from banner pages on both Fandom and Miraheze wikis
// @author       fabiorzfreitas
// @match        https://battle-cats.fandom.com/wiki/*
// @match        https://battlecats.miraheze.org/wiki/*
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/battle-cats-wiki-copy/battle-cats-wiki-copy.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/battle-cats-wiki-copy/battle-cats-wiki-copy.user.js
// ==/UserScript==

const title = document.querySelector("h1");

if (title) {
  title.style.cursor = "pointer";
  title.style.borderBottom = "2px dashed #007bff"; // Visual cue that it's clickable

  title.onclick = () => {
    const isMiraheze = window.location.hostname.includes("miraheze");
    let unitNames = [];
    let rares = [];

    // --- Data Extraction Logic ---
    if (isMiraheze) {
      // Miraheze Logic: Ubers/Legends are in tables with a "Unit" cell
      unitNames = [...document.querySelectorAll("tr")]
        .filter(tr => tr.innerText.includes("Unit"))
        .map(tr => {
          const link = tr.querySelector("td a");
          return link ? link.textContent.trim() : null;
        })
        .filter(n => n);

      // Miraheze Logic: Rares/Super Rares in the general pool section
      rares = [...document.querySelectorAll(".mw-parser-output b a")]
        .filter(el => el.href.includes("Super_Rare_Cat") || el.href.includes("Rare_Cat"))
        .map(el => el.textContent.trim());

    } else {
      // Original Fandom Logic
      unitNames = [...document.querySelectorAll("tr th:nth-child(1)")]
        .filter((_) => _.textContent.includes("Normal: "))
        .map((_) => _.querySelector("a").textContent.trim());

      rares = [...document.querySelectorAll("tr td b a")]
        .filter((el) => {
          const href = el.href;
          return href.includes("Super_Rare_Cat") || href.includes("Rare_Cat");
        })
        .map((el) => el.textContent.trim());
    }

    // --- Formatting ---
    if (rares.length > 0) {
      rares.unshift("// others");
    }

    // Option 1: Target the specific title span to avoid hidden "Copy only title" text
    const cleanTitle = title.querySelector(".mw-page-title-main")?.textContent || title.textContent;

    const content = {
      title: cleanTitle.replace(/\(.*?\)/, "").trim(),
      link: window.location.href,
      units: [...new Set([...unitNames, ...rares])], // Deduplicate
    };

    // --- Clipboard & Feedback ---
    navigator.clipboard.writeText(JSON.stringify(content))
      .then(() => {
        if (content.units.length === 0) {
          alert("Nothing found to copy.");
        } else {
          alert(`Content Copied: ${content.title}\nUnits: ${content.units.length}`);
        }
      })
      .catch(err => {
        console.error('Error copying to clipboard', err);
        alert("Failed to copy to clipboard.");
      });
  };
}