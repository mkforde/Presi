#!/usr/bin/env node
'use strict';
// Auto-detects platform and builds the appropriate binary.

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const platform = os.platform();
const arch = os.arch();

let target;
if (platform === 'linux') {
  target = arch === 'arm64' ? 'node22-linux-arm64' : 'node22-linux-x64';
} else if (platform === 'darwin') {
  target = arch === 'arm64' ? 'node22-macos-arm64' : 'node22-macos-x64';
} else if (platform === 'win32') {
  target = 'node22-win-x64';
} else {
  console.error(`Unsupported platform: ${platform}/${arch}`);
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, platform === 'win32' ? 'presi.exe' : 'presi');
const pkgBin = path.join(__dirname, '..', 'node_modules', '.bin', 'pkg');

console.log(`Building for ${platform}/${arch} (target: ${target})...`);
try {
  execSync(
    `"${pkgBin}" . --targets ${target} --output "${outFile}" --compress GZip`,
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
  console.log(`\nBinary written to: ${outFile}`);
} catch (e) {
  process.exit(1);
}
