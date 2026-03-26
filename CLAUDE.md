# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla HTML/CSS/JavaScript frontend project containing two independent web pages:

1. **index.html** - Spring Festival (Chinese New Year) 2026 celebration page
   - Real-time countdown to Spring Festival (2026-02-17)
   - Canvas-based particle fireworks system
   - Auto-rotating blessing cards with manual navigation
   - Interactive lanterns with sound effects
   - Background music toggle

2. **minesweeper.html** - Classic Windows Minesweeper game clone
   - 4 difficulty levels: beginner (9×9, 10 mines), intermediate (16×16, 40 mines), expert (16×30, 99 mines), custom
   - Left click to reveal, right click to flag
   - Sound effects for actions
   - Timer and mine counter

## Development Commands

This is a static site with no build system. To run locally:

```bash
# Using Python
cd newyear && python -m http.server 8000

# Using Node.js
cd newyear && npx serve .

# Using PHP
cd newyear && php -S localhost:8000
```

Then open `http://localhost:8000` for the Spring Festival page or `http://localhost:8000/minesweeper.html` for the Minesweeper game.

## Code Architecture

### Spring Festival Page (`index.html`, `style.css`, `script.js`)

**Key Classes in script.js:**
- `Particle` - Individual firework particle with physics (gravity, decay)
- `Firework` - Explosion composed of 100 particles with random colors

**Main Systems:**
- Canvas animation loop using `requestAnimationFrame`
- Mouse-move throttled fireworks (30% chance, 100ms debounce)
- Keyboard shortcuts: Space (music), ArrowRight (next blessing), F (fireworks), L (lantern)
- Audio handling with autoplay restrictions (user interaction required first)

**DOM Structure:**
- Full-screen canvas (`#fireworksCanvas`) for fireworks behind content
- Flexbox-based responsive layout
- Blessing cards use CSS opacity/visibility for transitions

### Minesweeper (`minesweeper.html`, `minesweeper.css`, `minesweeper.js`)

**Key Class: `Minesweeper`**
- Configuration object with 4 difficulty presets
- 2D array `board[row][col]` storing cell state: `{isMine, isRevealed, isFlagged, neighborMines}`
- First-click protection: mines placed after first click, ensuring safe start

**Game Logic:**
- Recursive reveal for empty cells (flood fill)
- Win condition: all safe cells revealed (`revealedCount === rows*cols - mines`)
- Responsive cell sizing based on viewport (35px/30px/25px)

**Keyboard Shortcuts:**
- Space: New game
- F1: Help
- Escape: Close difficulty selector

## External Dependencies

Both pages use CDN resources (no local package management):
- Font Awesome 6.4.0 for icons
- Google Fonts (Ma Shan Zheng, Noto Sans SC, Segoe UI)
- Mixkit for audio assets (SFX and music)

## Assets

- `assets/images/` - Empty directory
- `assets/fonts/` - Empty directory
- All media loaded from external CDNs

## Notes for Development

- No linting, testing, or build tools configured
- No package.json - this is vanilla JS
- Audio files may fail to load if external CDN is unavailable
- Spring Festival date is hardcoded in `script.js` line 2: `2026-02-17`
