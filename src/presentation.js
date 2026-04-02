'use strict';

const blessed = require('blessed');
const { buildSlideContent, buildTitleContent } = require('./render');
const { getSocketPath, SyncServer } = require('./sync');

function runPresentation(filePath, presentation) {
  const { slides, style } = presentation;
  const socketPath = getSocketPath(filePath);

  // Start sync server so speaker notes can connect
  const server = new SyncServer(socketPath);
  server.start();

  let currentIndex = 0;

  const screen = blessed.screen({
    smartCSR: true,
    title: `presi — ${presentation.meta.title}`,
    fullUnicode: true,
    forceUnicode: true,
  });

  // Main content box
  const contentBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-3',
    tags: false,
    scrollable: false,
    style: {
      fg: style.primary_color,
      bg: 'black',
    },
    border: {
      type: 'line',
      fg: style.primary_color,
    },
    padding: { top: 1, left: 2, right: 2, bottom: 1 },
  });

  // Status bar at bottom
  const statusBar = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
      fg: style.secondary_color,
      bg: 'black',
      border: { fg: style.primary_color },
    },
    border: {
      type: 'line',
      fg: style.primary_color,
    },
    content: '',
  });

  screen.append(contentBox);
  screen.append(statusBar);

  function getSlideContent(index) {
    const slide = slides[index];
    const w = screen.width - 6;
    const h = screen.height - 6;

    if (slide.isTitleSlide) {
      return buildTitleContent(slide, style, w, h);
    }
    return buildSlideContent(slide, style, w, h);
  }

  function updateStatus(index) {
    const slide = slides[index];
    const total = slides.length;
    const slideNum = index + 1;

    let keys = ' {bold}←/→{/bold} navigate   {bold}q{/bold} quit';
    if (index < total - 1) keys += `   {bold}→{/bold} next`;

    statusBar.setContent(
      `{bold}{yellow-fg} Slide ${slideNum}/${total} {/yellow-fg}{/bold}` +
      `  ${slide.isTitleSlide ? slide.title : slide.text.slice(0, 40)}` +
      `${keys}`
    );
  }

  function renderSlide(index) {
    const content = getSlideContent(index);
    const lines = content.split('\n');

    const boxH = screen.height - 6;
    const topPad = Math.max(0, Math.floor((boxH - lines.length) / 2));
    const padded = '\n'.repeat(topPad) + content;

    contentBox.setContent(padded);
    updateStatus(index);
    server.broadcast(index);
    screen.render();
  }

  function goTo(index) {
    if (index < 0 || index >= slides.length) return;
    currentIndex = index;
    renderSlide(currentIndex);
  }

  // Key bindings
  screen.key(['right', 'space', 'down', 'l', 'n'], () => goTo(currentIndex + 1));
  screen.key(['left', 'backspace', 'up', 'h', 'p'], () => goTo(currentIndex - 1));
  screen.key(['home', 'g'], () => goTo(0));
  screen.key(['end', 'G'], () => goTo(slides.length - 1));
  screen.key(['q', 'C-c', 'escape'], () => {
    server._cleanup();
    process.exit(0);
  });

  // Handle resize
  screen.on('resize', () => {
    renderSlide(currentIndex);
  });

  // Initial render
  renderSlide(0);
}

module.exports = runPresentation;
