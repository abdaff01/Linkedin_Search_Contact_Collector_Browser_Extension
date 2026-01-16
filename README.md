# Linkedin Search Contact Collector — Browser Extension

⚠️ This project is for educational purposes only. Do NOT use it to violate LinkedIn's Terms of Service, privacy rules, or local laws. The author is not responsible for misuse.

A simple browser extension (Chrome / Chromium / Firefox) that demonstrates techniques for collecting contact-like information from LinkedIn search results pages. The code is intended as a learning resource for browser extension development, DOM scraping, and data export. It is NOT a polished product.

## Table of contents
- [What it does](#what-it-does)
- [Status](#status)
- [Features](#features)
- [Quick demo / usage](#quick-demo--usage)
- [Prerequisites](#prerequisites)
- [Install (development / test)](#install-development--test)
- [Folder structure](#folder-structure)
- [Development](#development)
- [Export formats](#export-formats)
- [Configuration & customization](#configuration--customization)
- [Legal, privacy & ethics](#legal-privacy--ethics)
- [Contributing](#contributing)
- [Security & reporting](#security--reporting)
- [License](#license)
- [Contact](#contact)

## What it does
This extension visits a LinkedIn search results page, extracts visible profile information (for example: name, headline, and current role as displayed on the search results page), and allows the user to export collected items into a CSV or JSON file.

Important: It only reads data visible in the browser at the time the extension runs. It does not bypass authentication, nor does it use LinkedIn private APIs.

## Status
- Educational prototype
- Minimal UI
- No guarantees about robustness or compatibility with LinkedIn layout changes
- Tested against Chromium-based browsers and Firefox developer builds (manifest compatibility may vary)

## Features
- Parse visible search result entries to collect:
  - Name
  - Headline / summary snippet
  - Current company / role snippet (as shown in the search list)
  - Public profile URL (if visible on the page)
- Simple popup UI to start/stop collection and export results
- Export to CSV and JSON
- Minimal configuration (batch size / throttling) to reduce aggressive scraping

## Quick demo / usage
1. Open LinkedIn and perform a people search (e.g., "site:linkedin.com/in AND software engineer" or use LinkedIn's built-in search).
2. Install the extension locally (see Install below).
3. On the search results page click the extension icon to open the popup.
4. Click "Collect" (or similar UI button) — the extension will parse the visible results on the page.
5. When finished, click "Export" to download a CSV or JSON file of the collected data.

Note: If the page uses infinite scroll, scroll down to load more results, then run collection again to capture the newly loaded entries.

## Prerequisites
- A Chromium-based browser (Chrome, Edge) or Firefox for development/testing.
- Node.js (if the project contains build tooling; otherwise none required).
- Basic familiarity with browser extension developer mode / loading unpacked extensions.

## Install (development / test)
To load the extension into Chrome / Edge:
1. Open chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project directory (the folder containing `manifest.json`)

To load the extension into Firefox:
1. Open about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on…" and select the `manifest.json` file in the project folder

Notes:
- Manifest v3 vs v2: Check which manifest version the extension uses and whether your target browser supports it.
- The extension will request permissions to access LinkedIn pages (e.g., `https://www.linkedin.com/*`) — review and approve those permissions during testing.

## Folder structure
A typical layout for this type of project:
- manifest.json — extension manifest (permissions, content scripts, background/service worker, etc.)
- src/
  - popup.html, popup.js — UI for user interaction
  - content-script.js — injected into LinkedIn pages to parse DOM and collect data
  - background.js/service-worker.js — background logic, message routing, downloads
- icons/ — extension icons
- package.json — build scripts (optional)
- README.md — this file

Adjust names/locations to match the repository code.

## Development
- Make changes to files in `src/` (content scripts and popup).
- If a build step exists (Webpack / Rollup / esbuild), run:
  - npm install
  - npm run build
- Load the unpacked extension (see Install) and test on LinkedIn pages.
- Use the browser console (DevTools) to debug content scripts and background scripts.

Tips:
- Use small time delays and optional throttling when scanning content to avoid causing excessive load.
- Keep selectors robust: LinkedIn changes its DOM frequently; prefer semantically meaningful selectors when possible.
- If the extension uses background messaging, log messages to ensure content script ↔ background communication works as expected.

## Export formats
- CSV: Comma-separated values; typically contains columns: name, headline, company_role, profile_url, source_page, timestamp
- JSON: Array of objects with the same fields

Example CSV header:
name,headline,company_role,profile_url,source_page,timestamp

## Configuration & customization
- Throttling: add per-collection delay to avoid rapid repeated reads
- Fields: extend parser to capture additional visible fields (location, mutual connections, etc.)
- Output: add other formats (Google Sheets, Excel) or direct API uploads (careful with privacy/terms)

## Legal, privacy & ethics
- This repository is provided for learning and demonstration only.
- Scraping, automated data collection, and bulk exporting of profile data may violate LinkedIn's Terms of Service and applicable laws (including privacy and data protection laws such as the GDPR).
- Always obtain consent where required and respect robots.txt and site policies.
- Do not use for mass outreach, doxxing, profiling, or any activity that harms people or violates privacy.

By using or modifying this code you agree to ensure your usage complies with applicable laws and site terms.

## Contributing
Contributions are welcome if they align with the educational intent and do not facilitate abusive automation. When opening issues or PRs:
- Describe the change and the reason
- Include steps to reproduce or test
- Keep changes focused and small
- Avoid adding code that bypasses security controls or automates high-volume scraping

If you want help improving documentation, tests, or resilience against DOM changes, open an issue or PR.

## Security & reporting
- If you find a security issue in the code, open an issue titled "Security issue" or contact the repository owner directly.
- Do NOT publish sensitive data (API keys, credentials) in issues or pull requests.

## License
Specify a license for your repository (e.g., MIT, Apache-2.0). If you haven't chosen one yet, add a LICENSE file. Example: MIT License.

## Contact
If you have questions about the code or want to discuss improvements, open an issue or contact the repository owner: @abdaff01

---

Reminder: This project is educational. Respect privacy, site terms, and the law when experimenting.
