// ==UserScript==
// @name         MyGamatoto Layout QoL
// @namespace    https://github.com/fabiorzfreitas/userscripts
// @version      3.2.1
// @description  Flatten layout, change level input into number type, and default page size to 1500 without scroll jump.
// @author       fabiorzfreitas
// @match        https://mygamatoto.com/comparecats/*
// @grant        GM_addStyle
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/mygamatoto-layout-qol/mygamatoto-layout-qol.user.js
// @updateURL    https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/mygamatoto-layout-qol/mygamatoto-layout-qol.user.js
// ==/UserScript==

(function () {
  "use strict";

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

        /* 4. Flatten scrollable areas */
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

        /* 5. Keep horizontal scrolling for the table itself */
        .ant-table-content {
            overflow-x: auto !important;
        }

        /* 6. Hide sidebar to maximize width if it exists */
        aside.ant-layout-sider {
            display: none !important;
        }

        /* 7. Re-center footer/logo area */
        .logo, .ant-row {
            width: 100% !important;
        }
    `);

  // 1. Function to transform the site's input whenever it appears
  function handleSiteInput(input) {
    // Find the parent table cell (td)
    const parentCell = input.closest("td");

    // Target logic:
    // 1. Must be inside a TD
    // 2. That TD must be the 5th child (Level column)
    // 3. That TD must be inside the table body (tbody)
    if (
      !parentCell ||
      parentCell.cellIndex !== 4 || // cellIndex is 0-based, so 4 is the 5th column
      !parentCell.closest(".ant-table-tbody")
    ) {
      return;
    }

    // Change type to number to get the arrows
    input.type = "number";
    input.min = "1";
    input.max = "130";
    input.style.textAlign = "center";
    input.style.width = "100%";

    // Trigger the site's update logic when the arrows are clicked
    input.addEventListener("change", () => {
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  // 2. Function to switch pagination to 1500 / page while preserving scroll position
  let isChangingPageSize = false;

  function setDefaultPageSize() {
    if (isChangingPageSize) return;

    const sizeChanger = document.querySelector(
      ".ant-pagination-options-size-changer",
    );
    if (!sizeChanger) return;

    const currentText = sizeChanger.innerText || "";
    if (currentText.includes("1500")) return;

    isChangingPageSize = true;

    // Save scroll position before layout shift
    const savedScrollY = window.scrollY;

    sizeChanger.click();

    setTimeout(() => {
      const options = document.querySelectorAll(
        ".ant-select-dropdown-menu-item",
      );
      for (const option of options) {
        if (option.innerText.includes("1500")) {
          option.click();

          // Restore exact scroll position after re-render completes
          requestAnimationFrame(() => {
            window.scrollTo(0, savedScrollY);
            setTimeout(() => {
              window.scrollTo(0, savedScrollY);
              isChangingPageSize = false;
            }, 50);
          });
          break;
        }
      }
    }, 50);
  }

  // 3. Observe the document for inputs and pagination dropdowns
  const observer = new MutationObserver((mutations) => {
    setDefaultPageSize();

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === "INPUT") {
          handleSiteInput(node);
        } else if (node.querySelectorAll) {
          const inputs = node.querySelectorAll("input");
          inputs.forEach(handleSiteInput);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // 4. CSS width fixes for spin buttons
  const style = document.createElement("style");
  style.innerHTML = `
        .editable-cell-value-wrap input[type="number"]::-webkit-inner-spin-button,
        .editable-cell-value-wrap input[type="number"]::-webkit-outer-spin-button {
            opacity: 1 !important; /* Always show arrows */
        }
    `;
  document.head.appendChild(style);
})();
