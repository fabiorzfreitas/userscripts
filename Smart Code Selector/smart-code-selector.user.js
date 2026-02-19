// ==UserScript==
// @name         Smart Code Selector
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      1.1
// @description  Quad-click (4x) selects the entire code block; 2x clicks still select a word.
// @author       fabiorzfreitas
// @match        *://*/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/Smart%20Code%20Selector/smart-code-selector.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/Smart%20Code%20Selector/smart-code-selector.user.js
// ==/UserScript==

(function() {
    'use strict';

    // We use 'click' because it fires for every hit, 
    // and we check the 'detail' property for the count.
    document.addEventListener('click', function(e) {
        // Find the nearest code-related container
        const target = e.target.closest('code, pre, kbd, samp');

        // detail == 4 means a quadruple click
        if (target && e.detail === 4) {
            const selection = window.getSelection();
            const range = document.createRange();

            // Select only the contents inside the tag
            range.selectNodeContents(target);
            selection.removeAllRanges();
            selection.addRange(range);

            // Optional: Copy to clipboard automatically on the 4th click
            // navigator.clipboard.writeText(target.innerText);

            console.log("Quad-click: Code block selected.");
        }
    });
})();
