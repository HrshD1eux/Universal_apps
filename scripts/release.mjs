import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const type = (process.argv[2] || 'patch').trim().toLowerCase();

// 1. Run bump-version.mjs
const bumpScript = path.resolve(process.cwd(), 'scripts/bump-version.mjs');
const newVersion = execSync(`node "${bumpScript}" "${type}"`, { encoding: 'utf8' }).trim();
const tag = `v${newVersion}`;

console.log(`\n🚀 Preparing Release ${tag}...`);

// 2. Update docs/index.html version badge if present
const docsPath = path.resolve(process.cwd(), 'docs/index.html');
if (fs.existsSync(docsPath)) {
  let docsHtml = fs.readFileSync(docsPath, 'utf8');
  docsHtml = docsHtml.replace(/Universal Apps v\d+\.\d+\.\d+/g, `Universal Apps ${tag}`);
  fs.writeFileSync(docsPath, docsHtml, 'utf8');
}

// 3. Stage version changes
execSync('git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock docs/index.html', { stdio: 'inherit' });

// 4. Commit
const commitMsg = `chore(release): release ${newVersion}`;
try {
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
} catch {
  console.log('No additional changes to commit.');
}

// 5. Create Git Tag
console.log(`🏷️ Creating Git Tag ${tag}...`);
try {
  execSync(`git tag -a "${tag}" -m "Release ${tag}"`, { stdio: 'inherit' });
} catch (e) {
  console.log(`Tag ${tag} already exists or continuing.`);
}

// 6. Push commit and tag to GitHub (triggers build-release.yml via tag push)
console.log(`📡 Pushing to GitHub (origin main & tags)...`);
execSync('git push origin main --follow-tags', { stdio: 'inherit' });

console.log(`\n🎉 Release ${tag} pushed! GitHub Actions Build & Release is now building binaries.`);
console.log(`🔗 Monitor live build: https://github.com/HrshD1eux/Universal_apps/actions/workflows/build-release.yml\n`);
