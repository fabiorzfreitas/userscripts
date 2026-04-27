// ==UserScript==
// @name         MyGamatoto Layout Flattener
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      2.0
// @description  Flatten the nested scrollbars and expand the container width.
// @author       fabiorzfreitas
// @match        https://mygamatoto.com/comparecats/*
// @grant        GM_addStyle
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/mygamatoto-layout-flatener/mygamatoto-layout-flatener.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/mygamatoto-layout-flatener/mygamatoto-layout-flatener.user.js

// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        /* 1. Force the root containers to take full width and let content flow naturally */
        html, body, #root, #root > div, #root > div > div {
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
        }

        /* 2. Target the 'flexible-width-max' section specifically */
        /* We want this to be sequential, not a separate floating container */
        .flexible-width-max {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 20px !important;
            position: relative !important;
            display: block !important;
        }

        /* 3. Handle the Ant Design Layout that wraps the table */
        section.ant-layout {
            display: block !important;
            width: 100% !important;
            height: auto !important;
        }

        /* Optimized Section 4 */
        .ant-table-body,
        .ant-table-body-outer,
        .ant-table-body-inner,
        .ant-table-scroll,
        .ant-table-fixed-left,
        .ant-table-fixed-right {
            max-height: none !important;
            overflow-y: visible !important;
            height: auto !important;
        }

        /* 5. Keep horizontal scrolling for the table itself so it doesn't squish */
        .ant-table-content {
            overflow-x: auto !important;
        }

        /* 6. Hide sidebar to maximize width if it exists */
        aside.ant-layout-sider {
            display: none !important;
        }

        /* 7. Re-center the footer/logo area if it got weirdly aligned */
        .logo, .ant-row {
            width: 100% !important;
        }
    `);
})();