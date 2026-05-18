# 🔧 Setup & Installation Guide

Complete step-by-step guide to set up Universal Apps for development and production.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Development Setup](#development-setup)
4. [Production Build](#production-build)
5. [Troubleshooting](#troubleshooting)
6. [Environment Configuration](#environment-configuration)
7. [Platform-Specific Guides](#platform-specific-guides)

---

## 📊 System Requirements

### Minimum Requirements
- **OS**: Windows 10+ / macOS 10.13+ / Linux (Ubuntu 18.04+)
- **RAM**: 2GB minimum, 4GB+ recommended
- **Storage**: 500MB free space
- **CPU**: Dual-core processor, 2GHz+
- **Internet**: Required for initial setup only

### Recommended Requirements
- **OS**: Windows 11 / macOS 12+ / Ubuntu 20.04+
- **RAM**: 8GB or higher
- **Storage**: 1GB SSD free space
- **CPU**: Quad-core processor, 2.5GHz+
- **Network**: Broadband internet (for faster npm downloads)

---

## 📥 Prerequisites Installation

### 1️⃣ Install Node.js (v20 or Higher)

#### Windows
```bash
# Option A: Download installer
# Visit https://nodejs.org/
# Download LTS version (18.x or 20.x)
# Run installer, follow prompts

# Option B: Using Chocolatey (if installed)
choco install nodejs

# Verify installation
node --version
npm --version
```

#### macOS
```bash
# Option A: Using Homebrew (recommended)
brew install node@20

# Option B: Download installer
# Visit https://nodejs.org/
# Download macOS installer
# Run installer, follow prompts

# Verify installation
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using apt (may be older version)
sudo apt-get update
sudo apt-get install -y nodejs npm

# Verify installation
node --version
npm --version
```

### 2️⃣ Install Rust & Cargo

#### All Platforms
```bash
# Download and run rustup installer
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the on-screen prompts (choose option 1 for default installation)

# Reload your shell environment
source $HOME/.cargo/env  # On Linux/macOS
# On Windows: restart terminal

# Verify installation
rustc --version
cargo --version

# Update Rust to latest
rustup update
```

### 3️⃣ Platform-Specific Prerequisites

#### ✅ Windows
```bash
# Install WebView2 Runtime
# Visit: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
# Download and install WebView2 Runtime

# Install Wix Toolset (for installer creation)
# Visit: https://wixtoolset.org/
# Download and install Wix Toolset v4

# Verify Visual Studio Build Tools (if not present)
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"

# Verify in PowerShell
where.exe wix
where.exe WebView2
```

#### ✅ macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Wait for installation to complete, then verify
xcode-select --version

# Update to latest
sudo xcode-select --reset
```

#### ✅ Linux (Ubuntu/Debian)
```bash
# Install required system dependencies
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev

# For Ubuntu 22.04+, also install
sudo apt-get install -y libayatana-appindicator3-dev

# Verify installations
gcc --version
libssl3 --version
```

---

## 🚀 Development Setup

### Step 1: Clone Repository

```bash
# Using HTTPS
git clone https://github.com/HrshD1eux/Universal_apps.git
cd Universal_apps

# Using SSH (if SSH key configured)
git clone git@github.com:HrshD1eux/Universal_apps.git
cd Universal_apps
```

### Step 2: Install Dependencies

```bash
# Clear npm cache (if you have issues)
npm cache clean --force

# Install all dependencies
npm install

# This will install:
# - Node packages (from package.json)
# - Tauri dependencies
# - Rust crates (from Cargo.toml)

# Wait for installation to complete (5-10 minutes typically)
```

### Step 3: Verify Setup

```bash
# Check Node.js installation
npm --version

# Check Rust installation
cargo --version

# Check Tauri installation
npm run tauri --version

# Type check TypeScript files
npm run typecheck

# Run linting
npm run lint
```

### Step 4: Start Development

```bash
# Option A: Using Tauri dev (recommended)
npm run dev:tauri

# This will:
# 1. Start Next.js dev server (http://localhost:9002)
# 2. Build and launch Tauri application
# 3. Enable hot reload for both frontend and backend

# Option B: Dev server only (for web testing)
npm run dev

# Application opens automatically at http://localhost:9002
```

### Step 5: Development Tips

```bash
# Hot reload during development
# 1. Edit files in src/
# 2. Changes appear automatically in running application
# 3. Full page reload if needed: Ctrl/Cmd + R

# Enable debug console
# Press F12 or Ctrl+Shift+I to open DevTools

# Restart Tauri app
# Press Ctrl/Cmd + Shift + R in DevTools

# Clear application data
# Go to: ~/.config/Universal_apps/ (Linux/macOS)
#        %APPDATA%\Universal_apps\ (Windows)
```

---

## 📦 Production Build

### Full Production Build

```bash
# Build Next.js application
npm run build

# Create optimized Tauri binary for your OS
npm run tauri build

# Output locations:
# Windows: src-tauri/target/release/bundle/msi/*.msi
# macOS:   src-tauri/target/release/bundle/dmg/*.dmg
# Linux:   src-tauri/target/release/bundle/deb/*.deb
```

### Build for Specific Platform

```bash
# Windows (from any OS)
npm run tauri build -- --target x86_64-pc-windows-msvc

# macOS (from macOS only)
npm run tauri build -- --target x86_64-apple-darwin
# For Apple Silicon (M1/M2/M3)
npm run tauri build -- --target aarch64-apple-darwin

# Linux (from Linux)
npm run tauri build -- --target x86_64-unknown-linux-gnu
# For Ubuntu 20.04
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

### Build Optimization

```bash
# Enable optimizations in Cargo.toml
# [profile.release]
# opt-level = 3
# lto = true
# codegen-units = 1

# Rebuild with optimizations
cargo build --release

# Strip unnecessary symbols (Linux/macOS)
strip src-tauri/target/release/universal_apps

# Check binary size
ls -lh src-tauri/target/release/bundle/
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### ❌ "Command not found: node"
```bash
# Node.js not installed or not in PATH
# Solution: Reinstall Node.js from https://nodejs.org/

# On Linux, add to ~/.bashrc or ~/.zshrc
export PATH="/usr/local/bin:$PATH"

# On Windows, add to System Environment Variables
# Add: C:\Program Files\nodejs
```

#### ❌ "Permission denied: cargo"
```bash
# Rust not properly installed
# Solution: Reinstall Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Or ensure $HOME/.cargo/bin is in PATH
export PATH="$HOME/.cargo/bin:$PATH"
```

#### ❌ "WebView2 not found" (Windows)
```bash
# WebView2 runtime not installed
# Solution: Download from
# https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# Or install via winget
winget install Microsoft.EdgeWebView2Runtime
```

#### ❌ "Tauri build fails with linking errors"
```bash
# Missing system dependencies (Linux)
# Solution: Install development headers
sudo apt-get install libwebkit2gtk-4.1-dev \
  libgtk-3-dev libssl-dev

# Clear Tauri cache
rm -rf src-tauri/target

# Rebuild
npm run tauri build
```

#### ❌ "npm install hangs or fails"
```bash
# Network connectivity or registry issues
# Solution: Clear cache and retry
npm cache clean --force
npm install

# Or use different npm registry
npm config set registry https://registry.npmjs.org/
npm install

# Update npm itself
npm install -g npm@latest
```

#### ❌ Port 9002 already in use
```bash
# Another application using the port
# Solution: Use different port
npm run dev -- -p 3000

# Or kill process using the port
# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :9002
kill -9 <PID>
```

#### ❌ "TypeScript errors in development"
```bash
# Type checking failed
# Solution: Run type checker
npm run typecheck

# Fix issues reported
# Enable strict mode in tsconfig.json for catching errors early
```

### Performance Issues

```bash
# Application running slowly
# Solutions:
# 1. Close other applications
# 2. Check RAM usage: top (Linux), Activity Monitor (macOS), Task Manager (Windows)
# 3. Rebuild application: npm run tauri build
# 4. Clear app cache: rm -rf ~/.config/Universal_apps/

# Development slow
# Solutions:
# 1. Disable unused tools in development
# 2. Use npm run dev for web-only testing
# 3. Check disk space: df -h (Linux/macOS), diskpart (Windows)
```

---

## ⚙️ Environment Configuration

### Create Environment File

```bash
# Create .env.local file in project root
touch .env.local

# Windows
type nul > .env.local
```

### Environment Variables

```bash
# .env.local (optional configurations)

# Application Version (for self-update tracking)
NEXT_PUBLIC_APP_VERSION=0.1.0

# Environment
NEXT_PUBLIC_ENV=development
# or for production: production

# Analytics (disabled by default for privacy)
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Debug Mode
NEXT_PUBLIC_DEBUG=false

# API Configuration (if future APIs added)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Build Configuration

```bash
# src-tauri/tauri.conf.json modifications for custom builds

{
  "build": {
    "devUrl": "http://localhost:9002",
    "frontendDist": "../out",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "Universal Apps",
        "width": 1200,
        "height": 800,
        "minWidth": 400,
        "minHeight": 300
      }
    ]
  }
}
```

---

## 🖥️ Platform-Specific Guides

### Windows Complete Setup

```batch
:: Install Chocolatey (if not already installed)
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.ServicePointManager).ServerCertificateValidationCallback = {$true}); iex(New-Object Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

:: Install dependencies via Chocolatey
choco install nodejs rust git -y

:: Install WebView2
# Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

:: Install Wix Toolset
# Download from: https://wixtoolset.org/

:: Clone and setup
git clone https://github.com/HrshD1eux/Universal_apps.git
cd Universal_apps
npm install

:: Run development
npm run dev:tauri
```

### macOS Complete Setup

```bash
#!/bin/bash

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node@20 rust

# Install Xcode Command Line Tools
xcode-select --install

# Clone and setup
git clone https://github.com/HrshD1eux/Universal_apps.git
cd Universal_apps
npm install

# Run development
npm run dev:tauri
```

### Linux (Ubuntu) Complete Setup

```bash
#!/bin/bash

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Tauri dependencies
sudo apt-get install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev

# For Ubuntu 22.04+
sudo apt-get install -y libayatana-appindicator3-dev

# Clone and setup
git clone https://github.com/HrshD1eux/Universal_apps.git
cd Universal_apps
npm install

# Run development
npm run dev:tauri
```

---

## ✅ Verification Checklist

Use this checklist to verify your setup is complete:

- [ ] Node.js v20+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Rust installed (`rustc --version`)
- [ ] Cargo installed (`cargo --version`)
- [ ] Git installed (`git --version`)
- [ ] Repository cloned successfully
- [ ] `npm install` completed without errors
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run dev:tauri` launches application
- [ ] Application loads with all tools visible
- [ ] Dark/Light theme toggle works
- [ ] Tools are interactive and responsive
- [ ] (Windows) WebView2 installed
- [ ] (Windows) Wix Toolset installed
- [ ] (macOS) Xcode Command Line Tools installed
- [ ] (Linux) libwebkit2gtk-4.1-dev installed

---

## 🎯 Next Steps

1. **Run the application**: `npm run dev:tauri`
2. **Explore tools**: Browse all 85+ calculators
3. **Read documentation**: Check [README.md](./README.md)
4. **Review code**: Explore `src/` directory
5. **Make changes**: Edit and test with hot reload
6. **Build for production**: `npm run tauri build`

---

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Node.js Guide](https://nodejs.org/en/docs/)
- [Git Documentation](https://git-scm.com/doc)

---

**Last Updated**: 2026-05-18  
**Maintained by**: HrshD1eux
