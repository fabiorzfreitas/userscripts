// ==UserScript==
// @name         GitHub Default Issues Filter
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      1.0
// @description  Removes the default "is:open" filter from GitHub issues so you always see all issues.
// @author       fabiorzfreitas
// @match        https://github.com/*
// @grant        none
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/github-default-issues-filter/github-default-issues-filter.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/github-default-issues-filter/github-default-issues-filter.user.js
// ==/UserScript==

(function() {
    'use strict';

    const rewrite = () => {
        // Target specifically the nav links and any internal links to issues/pulls
        const links = document.querySelectorAll('a[href*="/issues"], a[href*="/pulls"]');

        links.forEach(link => {
            try {
                const url = new URL(link.href, window.location.origin);

                // Only modify links that are exactly /issues or /pulls with default or no filters
                const isDefaultIssues = url.pathname.match(/\/issues\/?$/) && (!url.search || url.search.includes('is%3Aopen'));
                const isDefaultPulls = url.pathname.match(/\/pulls\/?$/) && (!url.search || url.search.includes('is%3Aopen'));

                if (isDefaultIssues) {
                    url.searchParams.set('q', 'is:issue');
                    link.href = url.toString();
                } else if (isDefaultPulls) {
                    url.searchParams.set('q', 'is:pr');
                    link.href = url.toString();
                }
            } catch (e) { /* Ignore invalid URLs */ }
        });
    };

    // Use a robust observer that doesn't disconnect on navigation
    const observer = new MutationObserver(rewrite);

    const startObserving = () => {
        observer.disconnect(); // Prevent duplicates
        observer.observe(document.body, { childList: true, subtree: true });
        rewrite();
    };

    // 1. Initial boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        startObserving();
    }

    // 2. Handle Turbo lifecycle (Back/Forward and AJAX navigation)
    // 'turbo:load' fires on every page change, including 'Back' button clicks
    window.addEventListener('turbo:load', startObserving);

    // Fallback for older GitHub fragments or standard popstate
    window.addEventListener('popstate', startObserving);

})();