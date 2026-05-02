# Universal Apps by Harsh 🚀

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.80+-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A premium, all-in-one desktop toolkit designed for professionals, students, and power users. Featuring 50+ high-performance tools ranging from advanced financial calculators to privacy-focused dev utilities, all wrapped in a stunning glassmorphic UI.

---

## 💎 Premium Features

### 🛡️ Privacy & Stealth Suite
*   **Deep File Steganography**: Hide any file (ZIP, EXE, PDF) inside an image invisibly.
*   **EXIF Metadata Stripper**: Purge GPS and camera tracking data from your photos.
*   **Zero-Knowledge Shredder**: Encrypt sensitive notes with AES-256 local security.
*   **Private Password Vault**: Local-only encrypted storage for your sensitive logins with backup/restore support.
*   **Emoji Cipher**: Hide messages inside random emojis for secure sharing.
*   **Image Camouflage**: Blur or pixelate faces and sensitive text in screenshots.

### 📐 Advanced Mathematics & Science
*   **Calculus Studio**: Numerical integration and differentiation with dynamic graphing.
*   **Graphing Calculator Pro**: High-precision function plotter with multi-curve support.
*   **Number Theory Lab**: Step-by-step primes, GCD/LCM, and factorization trees.
*   **Linear Algebra Pro**: Eigenvalues, SVD, and vector space transformations.
*   **Periodic Table Pro**: Interactive chemistry suite with element data and lab tools.
*   **Boolean Logic Lab**: K-Map solver, truth tables, and logic gate simulations.

### 💰 Finance & Wealth Management
*   **Tax India (Old vs New)**: Side-by-side comparison of Indian tax regimes.
*   **FIRE Calculator**: Plan your early retirement and financial freedom.
*   **Step-up SIP**: Calculate wealth generation with annual contribution increases.
*   **Compound Interest**: Advanced wealth projection with multiple frequencies.
*   **Loan Comparison**: Real-time side-by-side analyzer for EMIs.

### 💻 Developer Utilities
*   **Text Pro Utilities**: Professional formatting, counting, and cleaning tools.
*   **JSON Formatter & Converter**: Industrial-grade validation and conversion (JSON to TS, etc.).
*   **JWT Decoder**: Securely decode JSON Web Tokens on the client side.
*   **Code Snippet Maker**: Create beautiful macOS-style code screenshots.
*   **Regex Tester**: Test regular expressions with live match highlighting.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 15 (App Router), React 19
*   **Desktop Engine**: Tauri 2.0 (Rust)
*   **Styling**: Tailwind CSS, Framer Motion (Animations)
*   **UI Components**: Shadcn UI (Radix UI)
*   **Icons**: Lucide React
*   **Storage**: IndexedDB / LocalStorage (Zero-server, local-only privacy)

---

## 📦 Setup & Installation

### Prerequisites
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [Rust & Cargo](https://www.rust-lang.org/tools/install)
*   **Windows Users**: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) and [Wix Toolset v4](https://wixtoolset.org/) (for building installers).

### Development Environment
1.  **Clone & Install**:
    ```bash
    git clone https://github.com/HrshD1eux/Universal_apps.git
    cd Universal_apps
    npm install
    ```
2.  **Launch Developer Mode**:
    ```bash
    npm run tauri dev
    ```

### Production Build
To generate a tiny, optimized native installer for your OS:
```bash
npm run tauri build
```
The binary will be located in `src-tauri/target/release/bundle/`.

---

## 🎨 Design Philosophy
*   **Performance First**: Sub-millisecond calculation times.
*   **Local-Only Privacy**: Your data never leaves your machine. No servers, no tracking.
*   **Aesthetic Excellence**: Vibrant gradients, smooth 60fps animations, and intuitive layouts.

---

## 🤝 Contributing
Found a bug or want to suggest a tool? Open an issue or submit a PR.

## 📄 License
MIT License. Built with ❤️ by **Harsh**.
