'use strict';

const blessed = require('blessed');
const figlet = require('figlet');
const { FONTS, FONT_NAMES, resolveFigletFont } = require('./fonts');

const SAMPLE_TEXT = 'Hello';

function runFontViewer() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'presi — Font Viewer',
    fullUnicode: true,
    forceUnicode: true,
  });

  let currentFontIndex = 0;

  // Left sidebar: font list
  const sidebar = blessed.list({
    top: 0,
    left: 0,
    width: 20,
    height: '100%',
    tags: true,
    border: { type: 'line', fg: '#00ff00' },
    label: ' Fonts ',
    style: {
      fg: 'white',
      bg: 'black',
      border: { fg: '#00ff00' },
      label: { fg: '#00ff00' },
      selected: { fg: 'black', bg: '#00ff00' },
      item: { fg: 'white' },
    },
    keys: true,
    vi: true,
    items: FONT_NAMES.map(f => ` ${FONTS[f].label}`),
  });

  // Right panel: font preview
  const previewBox = blessed.box({
    top: 0,
    left: 20,
    width: '100%-20',
    height: '70%',
    tags: false,
    border: { type: 'line', fg: '#00ff00' },
    label: ' Preview ',
    style: {
      fg: '#00ff00',
      bg: 'black',
      border: { fg: '#00ff00' },
      label: { fg: '#00ff00' },
    },
    padding: { top: 1, left: 2, right: 2, bottom: 1 },
  });

  // Info panel
  const infoBox = blessed.box({
    top: '70%',
    left: 20,
    width: '100%-20',
    height: '30%',
    tags: true,
    border: { type: 'line', fg: '#888888' },
    label: ' Info ',
    style: {
      fg: 'white',
      bg: 'black',
      border: { fg: '#888888' },
      label: { fg: '#888888' },
    },
    padding: { top: 0, left: 2, right: 2, bottom: 0 },
  });

  // Help bar
  const helpBar = blessed.box({
    bottom: 0,
    left: 0,
    width: 20,
    height: 3,
    tags: true,
    border: { type: 'line', fg: '#888888' },
    style: { fg: '#888888', bg: 'black', border: { fg: '#888888' } },
    content: ' {bold}q{/bold} quit',
  });

  screen.append(sidebar);
  screen.append(previewBox);
  screen.append(infoBox);
  screen.append(helpBar);

  function renderFont(fontIndex) {
    const fontKey = FONT_NAMES[fontIndex];
    const font = FONTS[fontKey];
    const figletFont = resolveFigletFont(fontKey);

    let rendered;
    try {
      rendered = figlet.textSync(SAMPLE_TEXT, {
        font: figletFont,
        horizontalLayout: 'default',
        width: screen.width - 28,
        whitespaceBreak: true,
      });
    } catch (e) {
      rendered = `(error rendering font: ${e.message})`;
    }

    // Center the preview
    const lines = rendered.split('\n');
    const previewH = Math.floor(screen.height * 0.7) - 4;
    const topPad = Math.max(0, Math.floor((previewH - lines.length) / 2));
    previewBox.setContent('\n'.repeat(topPad) + rendered);
    previewBox.setLabel(` Preview — "${SAMPLE_TEXT}" `);

    infoBox.setContent(
      `\n  {bold}Name:{/bold}        ${font.label}\n` +
      `  {bold}Config key:{/bold}  ${fontKey}\n` +
      `  {bold}Description:{/bold} ${font.description}\n\n` +
      `  Use {bold}font = "${fontKey}"{/bold} in your .toml [style] section.`
    );

    sidebar.select(fontIndex);
    screen.render();
  }

  sidebar.on('select item', (item, index) => {
    currentFontIndex = index;
    renderFont(currentFontIndex);
  });

  screen.key(['q', 'C-c', 'escape'], () => process.exit(0));
  screen.on('resize', () => renderFont(currentFontIndex));

  sidebar.focus();
  renderFont(0);
}

module.exports = runFontViewer;
