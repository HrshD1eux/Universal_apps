# Universal Apps by Harsh

A sleek, modern, and intuitive desktop application featuring a collection of essential calculators. Built for speed and simplicity using Next.js and Tauri.

## 🚀 Features

- **GST Calculator**: Quickly calculate Goods and Services Tax with customizable rates.
- **Marks Calculator**: Easily compute total marks and overall percentage for academic assessments.
- **Percentage Calculator**: Perform various percentage-based calculations with precision.
- **QR Generator**: Instantly generate high-quality QR codes for URLs, text, and more.

## 🛠️ Built With

- **Next.js**: React framework for the frontend.
- **Tauri**: Framework for building tiny, fast binaries for all major desktop platforms.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Beautiful & consistent icons.
- **Framer Motion**: Production-ready motion library for animations.
- **Shadcn UI**: High-quality UI components.

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Wix Toolset](https://wixtoolset.org/releases/) (Required for generating MSI installers on Windows)
- [.NET SDK](https://dotnet.microsoft.com/download) (Required by Wix Toolset v4)

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/HrshD1eux/Universal_apps.git
   cd "Universal Apps by Harsh"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run tauri dev
   ```

### Production Build

To generate a production-ready installer (MSI/EXE):

```bash
npm run tauri build
```

The generated installers will be located in:
- `src-tauri/target/release/bundle/msi/` (MSI)
- `src-tauri/target/release/bundle/nsis/` (EXE)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
