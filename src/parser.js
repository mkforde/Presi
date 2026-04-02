'use strict';

const fs = require('fs');
const TOML = require('@iarna/toml');
const { FONT_NAMES } = require('./fonts');

const REQUIRED_TOP_LEVEL = ['title', 'author', 'date'];

function parsePresentation(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    throw new Error(`Cannot read file "${filePath}": ${e.message}`);
  }

  let doc;
  try {
    doc = TOML.parse(raw);
  } catch (e) {
    throw new Error(`TOML parse error in "${filePath}": ${e.message}`);
  }

  // Validate required top-level keys
  for (const key of REQUIRED_TOP_LEVEL) {
    if (!doc[key] && doc[key] !== 0) {
      throw new Error(`Missing required top-level key: "${key}"`);
    }
  }

  // Build slide 0 from top-level text/speaker_notes
  const slide0 = {
    index: 0,
    title: String(doc.title),
    author: String(doc.author),
    date: String(doc.date),
    text: doc.text ? String(doc.text) : '',
    speaker_notes: doc.speaker_notes ? String(doc.speaker_notes) : '',
    isTitleSlide: true,
  };

  // Parse numbered slides from [slides.1], [slides.2], ...
  const slidesRaw = doc.slides;
  const numberedSlides = [];

  if (slidesRaw && typeof slidesRaw === 'object' && !Array.isArray(slidesRaw)) {
    // Collect numeric keys
    const keys = Object.keys(slidesRaw)
      .filter(k => /^\d+$/.test(k))
      .map(Number)
      .sort((a, b) => a - b);

    if (keys.length === 0) {
      throw new Error('No slides found. Add at least [slides.1] to your presentation.');
    }

    // Validate slides.1 exists
    if (keys[0] !== 1) {
      throw new Error('Slides must start at [slides.1]. Found first slide index: ' + keys[0]);
    }

    // Validate contiguous (no gaps)
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] !== i + 1) {
        throw new Error(
          `Slides must be contiguous without gaps. Missing [slides.${i + 1}] (found ${keys[i]} after ${keys[i - 1]})`
        );
      }
    }

    for (const k of keys) {
      const s = slidesRaw[String(k)];
      if (!s || typeof s !== 'object') {
        throw new Error(`[slides.${k}] must be a table with at least a "text" key`);
      }
      if (!s.text && s.text !== 0) {
        throw new Error(`[slides.${k}] is missing required "text" field`);
      }
      numberedSlides.push({
        index: k,
        text: String(s.text),
        speaker_notes: s.speaker_notes ? String(s.speaker_notes) : '',
        isTitleSlide: false,
      });
    }
  } else {
    throw new Error('No [slides.N] tables found. Add at least [slides.1] to your presentation.');
  }

  const slides = [slide0, ...numberedSlides];

  // Parse style (optional)
  const styleRaw = doc.style || {};
  const style = parseStyle(styleRaw);

  return { slides, style, meta: { title: slide0.title, author: slide0.author, date: slide0.date } };
}

function parseStyle(styleRaw) {
  const style = {
    font: 'standard',
    slide_font_size: 'large',
    speaker_note_size: 14,
    primary_color: '#00ff00',
    secondary_color: '#888888',
  };

  if (styleRaw.font !== undefined) {
    const f = String(styleRaw.font).toLowerCase();
    if (!FONT_NAMES.includes(f)) {
      throw new Error(`Invalid font "${styleRaw.font}". Supported: ${FONT_NAMES.join(', ')}`);
    }
    style.font = f;
  }

  if (styleRaw.slide_font_size !== undefined) {
    style.slide_font_size = styleRaw.slide_font_size;
  }

  if (styleRaw.speaker_note_size !== undefined) {
    const sz = Number(styleRaw.speaker_note_size);
    if (!isNaN(sz) && sz > 0) style.speaker_note_size = sz;
  }

  if (styleRaw.primary_color !== undefined) {
    style.primary_color = validateHex(styleRaw.primary_color, 'primary_color');
  }

  if (styleRaw.secondary_color !== undefined) {
    style.secondary_color = validateHex(styleRaw.secondary_color, 'secondary_color');
  }

  return style;
}

function validateHex(val, name) {
  const s = String(val).trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) {
    throw new Error(`Invalid hex color for "${name}": "${s}". Expected format: #rrggbb`);
  }
  return s;
}

module.exports = { parsePresentation };
