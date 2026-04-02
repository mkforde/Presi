#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');

// Inline minimal help display (before loading heavy deps)
const HELP_TEXT = `
  presi — Takahashi Method Terminal Presentation Tool

  Usage:
    presi <file.toml>              Open a presentation
    presi <file.toml> --speaker    Open speaker notes (syncs with presentation)
    presi --font-viewer            Browse supported fonts
    presi --help                   Show this help message
    presi --version                Show version

  Navigation (in presentation):
    →  space  n     Next slide
    ←  backspace p  Previous slide
    Home / g        First slide
    End  / G        Last slide
    q  Esc          Quit

  Supported fonts (set in .toml [style] section):
    standard, big, slant, doom, banner3

  Example .toml:
    title = "My Talk"
    author = "Jane Doe"
    date = "2025-01-01"
    text = "Welcome!"
    speaker_notes = "Intro notes"

    [slides.1]
    text = "The Topic"
    speaker_notes = "Explain the topic"

    [slides.2]
    text = "Key Point"
    speaker_notes = "Elaborate here"

    [style]
    font = "doom"
    primary_color = "#00ff00"
    secondary_color = "#888888"
`;

const args = process.argv.slice(2);

// Handle --help / -h early
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(HELP_TEXT);
  process.exit(0);
}

// Handle --version
if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log(`presi v${pkg.version}`);
  process.exit(0);
}

// Handle --font-viewer
if (args.includes('--font-viewer')) {
  require('./font-viewer')();
  return;
}

// Check if first arg looks like an unknown flag
const knownTopLevel = ['--help', '-h', '--version', '-v', '--font-viewer'];
if (args[0] && args[0].startsWith('-') && !knownTopLevel.includes(args[0])) {
  console.error(`Error: Unknown option: ${args[0]}\n`);
  console.log(HELP_TEXT);
  process.exit(1);
}

// Expect first arg to be a .toml file
const fileArg = args[0];
if (!fileArg) {
  console.error('Error: No presentation file specified.\n');
  console.log(HELP_TEXT);
  process.exit(1);
}

// Unknown flags check
const knownFlags = ['--speaker', '--font-viewer', '--help', '-h', '--version', '-v'];
const unknownFlags = args.slice(1).filter(a => a.startsWith('-') && !knownFlags.includes(a));
if (unknownFlags.length > 0) {
  console.error(`Error: Unknown option(s): ${unknownFlags.join(', ')}\n`);
  console.log(HELP_TEXT);
  process.exit(1);
}

const isSpeaker = args.includes('--speaker');

// Resolve file path
const filePath = path.resolve(fileArg);

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

if (!filePath.endsWith('.toml')) {
  console.error(`Error: Expected a .toml file, got: ${fileArg}`);
  process.exit(1);
}

// Parse presentation
const { parsePresentation } = require('./parser');
let presentation;
try {
  presentation = parsePresentation(filePath);
} catch (e) {
  console.error(`Error parsing presentation: ${e.message}`);
  process.exit(1);
}

if (isSpeaker) {
  require('./speaker')(filePath, presentation);
} else {
  require('./presentation')(filePath, presentation);
}
