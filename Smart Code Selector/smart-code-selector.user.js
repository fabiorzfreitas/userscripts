// ==UserScript==
// @name         Smart Code Selector
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      1.0
// @description  Double-click + Shift selects the entire code block; Double-click alone selects a word.
// @author       fabiorzfreitas
// @match        *://*/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/smart-code-selector.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/smart-code-selector.user.js
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('dblclick', function(e) {
        // Target common code containers
        const target = e.target.closest('code, pre, kbd, samp');

        if (target && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            const selection = window.getSelection();
            const range = document.createRange();

            // Select everything inside the tag
            range.selectNodeContents(target);
            selection.removeAllRanges();
            selection.addRange(range);

            console.log("Selected entire code block via Shift+DblClick");
        }
    }, true);
})();