# Universal Apps by Harsh 🚀

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A premium, all-in-one desktop toolkit featuring 50+ high-performance tools. Designed with a "Privacy-First" philosophy, every calculation and encryption happens locally on your machine.

---

## 🏗️ Project Architecture

This application is built using a hybrid **Tauri + Next.js** architecture, combining the performance of Rust with the modern UI capabilities of React.

### Folder Structure
```bash
.
├── src-tauri/              # Native Backend (Rust)
│   ├── src/                # Rust commands and main entry point
│   └── tauri.conf.json     # Native app configuration (permissions, icons, etc.)
├── src/                    # Frontend (Next.js)
│   ├── app/                # File-based Routing
│   │   ├── [tool-name]/    # Individual tool routes (wrappers)
│   │   └── page.tsx        # Main Dashboard / Tool Hub
│   ├── components/         # Core Logic & UI Components
│   │   ├── ui/             # Reusable Shadcn base components
│   │   └── [tool].tsx      # The actual functional logic for each tool
│   ├── context/            # Global State (Theme, Language, Settings)
│   ├── lib/                # Shared utilities & Business Logic
│   │   ├── i18n.ts         # Multi-language translation dictionary
│   │   └── utils.ts        # Common helper functions
│   └── hooks/              # Custom React hooks
└── public/                 # Static assets (icons, images)
```

---

## ⚙️ Detailed Setup Guide

### 1. Prerequisites
Ensure your development environment meets these requirements:
*   **Node.js**: v20 or newer.
*   **Rust**: Install via [rustup](https://rustup.rs/).
*   **Windows**: 
    *   [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
    *   [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
    *   [Wix Toolset v4](https://wixtoolset.org/) (for building MSI installers).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/HrshD1eux/Universal_apps.git
cd Universal_apps

# Install dependencies
npm install
```

### 3. Development
Run the app in developer mode with hot-reloading:
```bash
npm run tauri dev
```

### 4. Building for Production
Create a highly optimized, native installer for your specific OS:
```bash
npm run tauri build
```
Find your installer in: `src-tauri/target/release/bundle/[msi|dmg|deb]/`

---

## 🛠️ How to Modify & Extend

### Adding a New Tool
1.  **Create the Component**: Create `src/components/my-new-tool.tsx`. Use Tailwind CSS and Shadcn UI for consistent styling.
2.  **Create the Route**: Add a folder `src/app/my-new-tool/` with a `page.tsx` that renders your component.
3.  **Register the Tool**: Open `src/app/page.tsx` and add your tool details to the `TOOLS_DATA` array.
4.  **Add Translations**: Add the `titleKey` and `descKey` values to `src/lib/i18n.ts` for both English and Hindi.

### Modifying Design System
*   **Global Styles**: Adjust `src/app/globals.css` for theme colors and glassmorphic variables.
*   **Theme Provider**: Check `src/context/settings-context.tsx` to modify how theme colors are applied globally.

---

## 🔒 Security & Privacy
*   **Zero-Server Architecture**: All data processed by "Password Vault" or "Note Shredder" is encrypted using the **Web Crypto API (AES-256-GCM)**.
*   **Key Derivation**: We use **PBKDF2** for deriving encryption keys from master passwords, ensuring maximum resistance to brute-force attacks.
*   **Local Storage**: Encrypted data is stored in your local IndexedDB; it is never transmitted over the internet.

---

## ❓ FAQ & Troubleshooting
*   **WebView2 Error on Windows**: Ensure you have the latest Microsoft Edge WebView2 Runtime installed.
*   **Build Failures**: Check that your Rust `cargo` is up to date (`rustup update`).
*   **Icon Mismatch**: If adding a new tool, ensure you import the corresponding icon from `lucide-react` in `src/app/page.tsx`.

---

## 📄 License
MIT License. Created by **Harsh** ([HrshD1eux](https://github.com/HrshD1eux)).
