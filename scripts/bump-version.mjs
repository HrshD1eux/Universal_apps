import fs from 'node:fs';
import path from 'node:path';

const type = (process.argv[2] || 'patch').trim().toLowerCase();

// 1. Read package.json
const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const currentVersion = pkg.version;

let [major, minor, patch] = currentVersion.split('.').map(Number);
if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
  console.error(`Invalid current version in package.json: ${currentVersion}`);
  process.exit(1);
}

let newVersion = '';
if (type === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (type === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else if (type === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else if (/^\d+\.\d+\.\d+.*$/.test(type)) {
  newVersion = type;
} else if (type === 'none') {
  newVersion = currentVersion;
} else {
  console.error(`Invalid bump type: "${type}". Use patch, minor, major, none, or an explicit version like 1.2.3`);
  process.exit(1);
}

// 2. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// 3. Update tauri.conf.json
const tauriConfPath = path.resolve(process.cwd(), 'src-tauri/tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
}

// 4. Update Cargo.toml
const cargoPath = path.resolve(process.cwd(), 'src-tauri/Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let cargoContent = fs.readFileSync(cargoPath, 'utf8');
  cargoContent = cargoContent.replace(
    /(\[package\][\s\S]*?version\s*=\s*)"[^"]+"/,
    `$1"${newVersion}"`
  );
  fs.writeFileSync(cargoPath, cargoContent, 'utf8');
}

console.log(newVersion);
