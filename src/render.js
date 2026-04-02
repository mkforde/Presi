'use strict';

const figlet = require('figlet');
const { resolveFigletFont } = require('./fonts');

// Synchronously render text with figlet, centering within given width
function renderFiglet(text, fontName, maxWidth) {
  const figletFont = resolveFigletFont(fontName);

  let rendered;
  try {
    rendered = figlet.textSync(text, {
      font: figletFont,
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: maxWidth || 200,
      whitespaceBreak: true,
    });
  } catch (e) {
    // Fallback: just return the text in a simple box
    rendered = text;
  }

  return rendered;
}

// Center lines within a given width
function centerLines(text, width) {
  return text
    .split('\n')
    .map(line => {
      const pad = Math.max(0, Math.floor((width - line.length) / 2));
      return ' '.repeat(pad) + line;
    })
    .join('\n');
}

// Wrap text at word boundaries for given width
function wordWrap(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}

// Build content for a regular slide (Takahashi method)
function buildSlideContent(slide, style, termWidth, termHeight) {
  const text = slide.text || '';
  const rendered = renderFiglet(text, style.font, termWidth - 4);
  return centerLines(rendered, termWidth);
}

// Build title slide content
function buildTitleContent(slide, style, termWidth) {
  const titleRendered = renderFiglet(slide.title, style.font, termWidth - 4);
  const centeredTitle = centerLines(titleRendered, termWidth);
  const authorLine = `  ${slide.author}  —  ${slide.date}`;
  const centeredAuthor = ' '.repeat(Math.max(0, Math.floor((termWidth - authorLine.length) / 2))) + authorLine;

  let parts = [centeredTitle, '', centeredAuthor];

  if (slide.text) {
    parts.push('', slide.text);
  }

  return parts.join('\n');
}

module.exports = { renderFiglet, centerLines, wordWrap, buildSlideContent, buildTitleContent };
