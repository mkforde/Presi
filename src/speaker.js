'use strict';

const blessed = require('blessed');
const { getSocketPath, SyncClient } = require('./sync');

function runSpeaker(filePath, presentation) {
  const { slides, style } = presentation;
  const socketPath = getSocketPath(filePath);

  let currentIndex = 0;

  const screen = blessed.screen({
    smartCSR: true,
    title: `presi speaker — ${presentation.meta.title}`,
    fullUnicode: true,
    forceUnicode: true,
  });

  // Header bar: current slide indicator
  const headerBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    border: { type: 'line', fg: style.primary_color },
    style: { fg: style.primary_color, bg: 'black' },
  });

  // Current slide preview (top half of main area)
  const currentBox = blessed.box({
    top: 3,
    left: 0,
    width: '100%',
    height: '50%-1',
    tags: false,
    border: { type: 'line', fg: style.primary_color },
    label: ' Current Slide ',
    style: { fg: style.primary_color, bg: 'black',
      label: { fg: style.primary_color } },
    scrollable: true,
    padding: { top: 0, left: 1, right: 1, bottom: 0 },
  });

  // Speaker notes (bottom portion)
  const notesBox = blessed.box({
    top: '50%+2',
    left: 0,
    width: '60%',
    height: '50%-2',
    tags: false,
    border: { type: 'line', fg: style.secondary_color },
    label: ' Speaker Notes ',
    style: { fg: 'white', bg: 'black',
      label: { fg: style.secondary_color } },
    scrollable: true,
    alwaysScroll: true,
    padding: { top: 0, left: 1, right: 1, bottom: 0 },
  });

  // Next slide preview
  const nextBox = blessed.box({
    top: '50%+2',
    left: '60%',
    width: '40%',
    height: '50%-2',
    tags: false,
    border: { type: 'line', fg: style.secondary_color },
    label: ' Up Next ',
    style: { fg: style.secondary_color, bg: 'black',
      label: { fg: style.secondary_color } },
    padding: { top: 0, left: 1, right: 1, bottom: 0 },
  });

  // Connection status overlay
  const statusOverlay = blessed.box({
    top: 'center',
    left: 'center',
    width: 50,
    height: 5,
    tags: true,
    border: { type: 'line', fg: 'yellow' },
    style: { fg: 'yellow', bg: 'black' },
    content: '\n  {center}Connecting to presentation...{/center}',
    hidden: false,
  });

  screen.append(headerBox);
  screen.append(currentBox);
  screen.append(notesBox);
  screen.append(nextBox);
  screen.append(statusOverlay);

  function getSlideLabel(index) {
    const slide = slides[index];
    if (!slide) return '(none)';
    if (slide.isTitleSlide) return slide.title;
    return slide.text.slice(0, 60) + (slide.text.length > 60 ? '…' : '');
  }

  function wrapText(text, width) {
    if (!text) return '';
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      if (!line) { line = w; continue; }
      if (line.length + 1 + w.length <= width) {
        line += ' ' + w;
      } else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines.join('\n');
  }

  function renderSlide(index) {
    const slide = slides[index];
    const nextSlide = slides[index + 1];
    const total = slides.length;

    // Header
    headerBox.setContent(
      `  {bold}Slide ${index + 1}/${total}{/bold}  —  ${getSlideLabel(index)}`
    );

    // Current slide content
    const currentText = slide.isTitleSlide
      ? `${slide.title}\n\n${slide.author}  |  ${slide.date}${slide.text ? '\n\n' + slide.text : ''}`
      : slide.text;
    currentBox.setContent(currentText);

    // Speaker notes
    const notesWidth = Math.floor(screen.width * 0.6) - 4;
    notesBox.setContent(
      slide.speaker_notes
        ? wrapText(slide.speaker_notes, notesWidth)
        : '(no speaker notes)'
    );

    // Next slide
    if (nextSlide) {
      const nextText = nextSlide.isTitleSlide
        ? nextSlide.title
        : nextSlide.text;
      nextBox.setLabel(' Up Next ');
      nextBox.setContent(nextText.slice(0, 200));
    } else {
      nextBox.setLabel(' Up Next ');
      nextBox.setContent('(end of presentation)');
    }

    screen.render();
  }

  // Connect to main presentation
  const client = new SyncClient(socketPath, (index) => {
    if (index !== currentIndex) {
      currentIndex = index;
      renderSlide(currentIndex);
    }
  });

  client.connect(
    () => {
      // Connected
      statusOverlay.hide();
      renderSlide(currentIndex);
    },
    (err) => {
      // Connection error
      statusOverlay.show();
      statusOverlay.setContent(
        `\n  {center}{red-fg}Cannot connect to presentation.{/red-fg}{/center}\n` +
        `  {center}Start: presi ${filePath}{/center}`
      );
      screen.render();

      // Retry every 2 seconds
      const retry = setInterval(() => {
        client.connect(
          () => {
            clearInterval(retry);
            statusOverlay.hide();
            renderSlide(currentIndex);
          },
          () => {}
        );
      }, 2000);
    }
  );

  // Allow manual navigation in speaker view too
  screen.key(['right', 'space', 'down'], () => {
    if (currentIndex < slides.length - 1) {
      currentIndex++;
      renderSlide(currentIndex);
    }
  });
  screen.key(['left', 'backspace', 'up'], () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderSlide(currentIndex);
    }
  });
  screen.key(['q', 'C-c', 'escape'], () => {
    client.disconnect();
    process.exit(0);
  });

  screen.on('resize', () => renderSlide(currentIndex));

  screen.render();
}

module.exports = runSpeaker;
