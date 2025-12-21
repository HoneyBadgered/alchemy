#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findPackageJsons(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file === 'node_modules' || file === 'dist' || file === '.git') return;
      results = results.concat(findPackageJsons(filePath));
    } else if (file === 'package.json') {
      results.push(filePath);
    }
  });
  return results;
}

const root = process.cwd();
const pkgs = findPackageJsons(root);
const localPkgs = new Set();

// First pass: collect all local package names
for (const pkgPath of pkgs) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.name && pkg.name.startsWith('@alchemy/')) {
    localPkgs.add(pkg.name);
  }
}

// Second pass: check all dependencies for local package references
let foundIssues = false;
for (const pkgPath of pkgs) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (pkg[depType]) {
      for (const dep in pkg[depType]) {
        if (localPkgs.has(dep)) {
          const version = pkg[depType][dep];
          if (version !== '*') {
            foundIssues = true;
            console.log(`❌ ${pkgPath}: ${depType} -> ${dep} should be "*" but is "${version}"`);
          }
        }
      }
    }
  });
}
if (!foundIssues) {
  console.log('✅ All local @alchemy/* dependencies use version "*"');
}
