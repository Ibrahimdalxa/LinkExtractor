# Link Extractor ⬇️

A fast, lightweight, and privacy-focused Chrome Extension designed to deep-scan webpages and instantly extract download links. It automatically categorizes files by type, allows fluid searching, and enables bulk copy or download actions through a clean, developer-centric dark UI.

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Chrome Extensions](https://img.shields.io/badge/Chrome_Extensions-Manifest_V3-blue?style=for-the-badge&logo=google-chrome&logoColor=white)

---

## ✨ Features

*   **Instant Auto-Scan:** Scans the current webpage automatically the moment you open the extension popup.
*   **Smart Type Classification:** Intuitively filters and badges discovered assets:
    *   📄 **PDF:** Portable Document Format files.
    *   📦 **Archive:** `.zip`, `.rar`, `.7z`, `.tar.gz`, etc.
    *   📝 **Doc:** Text documents, spreadsheets, presentations (`.docx`, `.xlsx`, `.txt`, `.epub`).
    *   🎵 **Media:** Audio and video extensions (`.mp3`, `.mp4`, `.mkv`, `.wav`).
    *   🖼️ **Image:** Images, vector shapes, and modern media layouts (`.png`, `.jpg`, `.svg`, `.webp`).
    *   🚀 **App:** Desktop/mobile software installers (`.exe`, `.msi`, `.dmg`, `.apk`, `.iso`).
    *   💻 **Code:** Coding files (`.py`, `.js`, `.ts`, `.json`, `.sql`, `.cpp`).
*   **Fuzzy Filter Search:** Match filenames, anchor strings, or raw URL fragments live as you type.
*   **Mass Clipboard Extraction:** Copy all matched resource strings cleanly separated onto individual rows.
*   **Sequential Bulk Downloading:** Saves assets locally with programmatic delay management to prevent file queue choking.

---

## 🛠️ Installation & Local Setup

Since this project runs directly via local manifest integration, you can easily side-load it inside any Chromium browser:

1. **Clone or Download the Repository:**
```bash
   git clone [https://github.com/YOUR_USERNAME/link-extractor.git](https://github.com/YOUR_USERNAME/link-extractor.git)
