'use strict';

// 5 supported figlet fonts
const FONTS = {
  standard: { figlet: 'Standard', label: 'Standard', description: 'Clean, readable standard font' },
  big:      { figlet: 'Big',      label: 'Big',      description: 'Bold, large block letters' },
  slant:    { figlet: 'Slant',    label: 'Slant',    description: 'Dynamic slanted style' },
  doom:     { figlet: 'Doom',     label: 'Doom',     description: 'Classic Doom-style heavy font' },
  banner3:  { figlet: 'Banner3',  label: 'Banner3',  description: 'Wide banner characters' },
};

const FONT_NAMES = Object.keys(FONTS);
const DEFAULT_FONT = 'standard';

function resolveFigletFont(name) {
  const key = (name || DEFAULT_FONT).toLowerCase();
  if (!FONTS[key]) {
    throw new Error(
      `Unsupported font "${name}". Supported fonts: ${FONT_NAMES.join(', ')}`
    );
  }
  return FONTS[key].figlet;
}

module.exports = { FONTS, FONT_NAMES, DEFAULT_FONT, resolveFigletFont };
