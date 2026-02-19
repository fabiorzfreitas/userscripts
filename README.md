# Userscripts

A collection of custom UserScripts to enhance web browsing functionality, specifically tailored for Floorp/Firefox users.

## 🚀 Scripts

### 1. Smart Code Selector
This script improves the "double-click" behavior on technical sites. It allows for precise word selection while providing a quick mouse-only gesture to grab entire code snippets without catching surrounding punctuation or line breaks.

* **2 Clicks:** Selects a single word (default browser behavior).
* **3 Clicks:** Selects the entire line (default browser behavior).
* **4 Clicks:** Selects the **exact content** of the `<code>`, `<pre>`, `<kbd>`, or `<samp>` block.

**[➔ Install Smart Code Selector](https://raw.githubusercontent.com/fabiorzfreitas/userscripts/main/smart-code-selector/smart-code-selector.user.js)**

---

## 🛠 Installation

1. Install a userscript manager extension:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. Click the "Install" link in the section above.
3. Confirm the installation in the extension popup.

## 🔧 Technical Notes (Firefox/Floorp)

To ensure custom styling and scripts work optimally for code selection, it is recommended to toggle the following in `about:config`:

| Preference | Value | Description |
| :--- | :--- | :--- |
| `layout.word_select.stop_at_punctuation` | `true` | Stops double-click selection at symbols/delimiters. |
| `layout.word_select.eat_space_to_next_word` | `false` | Prevents the selection from grabbing the trailing space. |

## 📜 License
MIT