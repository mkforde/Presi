#!/usr/bin/env node
'use strict';
// Copies the built binary to a directory on $PATH.

const fs = require('fs');
const path = require('path');
const os = require('os');

const platform = os.platform();
const src = path.join(__dirname, '..', 'dist', platform === 'win32' ? 'presi.exe' : 'presi');

if (!fs.existsSync(src)) {
  console.error('Binary not found. Run "npm run build" first.');
  process.exit(1);
}

// Preferred install locations (tried in order)
const candidates = platform === 'win32'
  ? [path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps')]
  : ['/usr/local/bin', path.join(os.homedir(), '.local', 'bin'), path.join(os.homedir(), 'bin')];

let dest = null;
for (const dir of candidates) {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    dest = path.join(dir, platform === 'win32' ? 'presi.exe' : 'presi');
    break;
  } catch (_) {}
}

if (!dest) {
  console.error(
    'No writable install directory found. Try:\n' +
    `  sudo cp ${src} /usr/local/bin/presi`
  );
  process.exit(1);
}

fs.copyFileSync(src, dest);
fs.chmodSync(dest, 0o755);
console.log(`Installed: ${dest}`);
console.log('Run "presi --help" to get started.');
