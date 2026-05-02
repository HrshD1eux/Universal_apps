const fs = require('fs');
const path = require('path');

const pageTsxPath = path.resolve('h:/Programming/Main Projects/Universal Calculator/Universa_Apps_By_Harsh/src/app/page.tsx');
const i18nPath = path.resolve('h:/Programming/Main Projects/Universal Calculator/Universa_Apps_By_Harsh/src/lib/i18n.ts');

const pageContent = fs.readFileSync(pageTsxPath, 'utf8');
const toolsMatch = pageContent.match(/const TOOLS = \[([\s\S]*?)\] as const;/);

if (!toolsMatch) {
  console.log("Could not find TOOLS array.");
  process.exit(1);
}

const toolsStr = toolsMatch[1];
const hrefRegex = /href:\s*'([^']+)'/g;
const titleKeyRegex = /titleKey:\s*'([^']+)'/g;
const descKeyRegex = /descKey:\s*'([^']+)'/g;

let hrefs = [];
let match;
while ((match = hrefRegex.exec(toolsStr)) !== null) {
  hrefs.push(match[1]);
}

let titleKeys = [];
while ((match = titleKeyRegex.exec(toolsStr)) !== null) {
  titleKeys.push(match[1]);
}

let descKeys = [];
while ((match = descKeyRegex.exec(toolsStr)) !== null) {
  descKeys.push(match[1]);
}

console.log(`Found ${hrefs.length} tools.`);

// Verify routes and components
let missingRoutes = [];
let missingComponents = [];
hrefs.forEach(href => {
  const routePath = path.join('h:/Programming/Main Projects/Universal Calculator/Universa_Apps_By_Harsh/src/app', href, 'page.tsx');
  if (!fs.existsSync(routePath)) {
    missingRoutes.push(routePath);
  } else {
    // Check if the page.tsx imports a component from src/components
    const routeContent = fs.readFileSync(routePath, 'utf8');
    const compMatch = routeContent.match(/from '@\/components\/([^']+)'/);
    if (compMatch) {
      const compName = compMatch[1];
      const compPath = path.join('h:/Programming/Main Projects/Universal Calculator/Universa_Apps_By_Harsh/src/components', `${compName}.tsx`);
      if (!fs.existsSync(compPath)) {
        missingComponents.push(compPath);
      }
    } else {
      console.log(`Warning: Could not parse component import in ${routePath}`);
    }
  }
});

// Verify i18n keys
const i18nContent = fs.readFileSync(i18nPath, 'utf8');
const enMatch = i18nContent.match(/const en = {([\s\S]*?)};/);
const hiMatch = i18nContent.match(/const hi = {([\s\S]*?)};/);

let missingI18nKeys = [];
const allKeys = [...titleKeys, ...descKeys];

if (enMatch && hiMatch) {
  allKeys.forEach(key => {
    if (!enMatch[1].includes(`${key}:`)) missingI18nKeys.push(`en missing ${key}`);
    if (!hiMatch[1].includes(`${key}:`)) missingI18nKeys.push(`hi missing ${key}`);
  });
}

console.log("Missing routes:", missingRoutes);
console.log("Missing components:", missingComponents);
console.log("Missing i18n keys:", missingI18nKeys);
