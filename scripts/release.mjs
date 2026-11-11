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

// 6. Push commit and tag to GitHub
console.log(`📡 Pushing to GitHub (origin main & tags)...`);
try {
  execSync('git push origin main --follow-tags', { stdio: 'inherit' });
} catch (e) {
  console.warn('Push warning (check connection):', e.message);
}

// 7. Auto-trigger GitHub Actions release workflow
function getGitHubToken() {
  try {
    const creds = execSync('echo protocol=https\nhost=github.com | git credential fill', { encoding: 'utf8' });
    const match = creds.match(/password=(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return process.env.GITHUB_TOKEN || null;
  }
}

const token = getGitHubToken();
if (token) {
  console.log(`⚡ Dispatching GitHub Actions Build & Release workflow...`);
  try {
    const res = await fetch('https://api.github.com/repos/HrshD1eux/Universal_apps/actions/workflows/build-release.yml/dispatches', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          bump: 'none',
          custom_version: newVersion
        }
      })
    });
    if (res.status === 204) {
      console.log(`✅ GitHub Actions release pipeline started successfully!`);
    } else {
      console.log(`Workflow dispatch response: ${res.status}`);
    }
  } catch (err) {
    console.warn(`Could not dispatch workflow via API:`, err.message);
  }
}

console.log(`\n🎉 Release ${tag} is queued and building in GitHub Actions!`);
console.log(`🔗 Monitor live build: https://github.com/HrshD1eux/Universal_apps/actions/workflows/build-release.yml\n`);
