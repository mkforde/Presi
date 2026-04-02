# presi

Terminal presentation tool built on the [Takahashi Method](https://en.wikipedia.org/wiki/Takahashi_method) — one large idea per slide, keeping the audience focused on what you say rather than what they read.

Built with [blessed](https://github.com/chjj/blessed) (Node.js TUI library) and compiled to a single binary with [pkg](https://github.com/yao-pkg/pkg).

---

## Installation

Download the pre-built binary from releases, or build from source:

```bash
git clone https://github.com/mkforde/presi
cd presi
npm install
npm run build         # produces dist/presi (linux x64)
sudo cp dist/presi /usr/local/bin/presi
```

---

## Usage

```
presi <file.toml>              Open a presentation
presi <file.toml> --speaker    Open speaker notes (syncs with running presentation)
presi --font-viewer            Browse the 5 supported fonts
presi --help                   Show help
presi --version                Show version
```

### Presentation navigation

| Key | Action |
|-----|--------|
| `→` `Space` `n` | Next slide |
| `←` `Backspace` `p` | Previous slide |
| `Home` / `g` | First slide |
| `End` / `G` | Last slide |
| `q` `Esc` | Quit |

---

## Presentation file format (`.toml`)

```toml
# Top-level keys — these become slide 0 (the title slide)
title = "My Talk"
author = "Jane Doe"
date = "2025-06-01"
text = "Welcome"                          # optional subtitle text for slide 0
speaker_notes = "Greet the audience..."  # optional

# Numbered slides — must start at 1, no gaps
[slides.1]
text = "The Problem"
speaker_notes = "Explain what problem we're solving..."

[slides.2]
text = "The Solution"
speaker_notes = "Walk through the approach..."

[slides.3]
text = "Demo"
speaker_notes = "Live demo time. Show the terminal split."

# Optional styling (all fields optional — sensible defaults apply)
[style]
font = "doom"               # standard | big | slant | doom | banner3
slide_font_size = 48        # informational, figlet auto-sizes
speaker_note_size = 14
primary_color = "#00ff00"   # text color and border color
secondary_color = "#888888" # subtitle, accents, speaker notes border
```

**Validation rules:**
- `title`, `author`, `date` are required top-level keys
- At least `[slides.1]` must exist
- Slide numbers must be contiguous (1, 2, 3 … no gaps)
- Each `[slides.N]` must have a `text` field
- Colors must be in `#rrggbb` hex format
- `font` must be one of the 5 supported fonts

---

## Split screen workflow

`presi` is designed for live terminal demos. Run the presentation on one side, your shell on the other.

**Terminal split example (tmux):**
```bash
# Pane 1 — presentation
presi my-talk.toml

# Pane 2 (split) — speaker notes, syncs automatically
presi my-talk.toml --speaker

# Pane 3 (split) — live demo shell
```

When you navigate slides in the main window, the speaker notes window updates automatically via a Unix domain socket. The speaker view shows:
- **Current slide** text
- **Speaker notes** for the current slide
- **Next slide** preview

If the speaker window is opened before the presentation, it will keep retrying the connection every 2 seconds.

---

## Fonts

Five fonts are supported (use `presi --font-viewer` to preview them):

| Key | Style |
|-----|-------|
| `standard` | Clean, readable default |
| `big` | Bold block letters |
| `slant` | Dynamic slanted style |
| `doom` | Classic heavy Doom font |
| `banner3` | Wide banner characters |

---

## Development

```bash
npm install
node src/index.js example.toml        # run without compiling
node src/index.js --font-viewer
npm run build                         # compile to dist/presi
```

**Project structure:**
```
src/
  index.js        CLI entry point, argument parsing
  parser.js       TOML parser and validation
  presentation.js Main presentation TUI (blessed)
  speaker.js      Speaker notes TUI (blessed)
  font-viewer.js  Font browser TUI (blessed)
  sync.js         Unix socket sync between sessions
  render.js       Figlet text rendering utilities
  fonts.js        Font configuration (5 supported fonts)
example.toml      Example presentation
```
