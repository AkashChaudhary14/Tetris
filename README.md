# Tetris

A classic Tetris game that runs in the browser. Built with vanilla HTML, CSS, and JavaScript—no build step required.

## How to Run

### Option 1: Open directly
Double-click `index.html` or open it in your browser (File → Open File).

### Option 2: Local server
From the project folder, run:

```bash
npx serve .
```

Then open the URL shown (e.g. `http://localhost:3000`) in your browser.

## Controls

| Key     | Action     |
|---------|------------|
| **← →** | Move left/right |
| **↑**   | Rotate piece   |
| **↓**   | Soft drop      |
| **Space** | Hard drop   |
| **P**   | Pause          |

## Features

- All 7 standard tetrominoes (I, O, T, S, Z, J, L)
- Next piece preview
- Score, level, and lines cleared
- Level increases every 10 lines; game speeds up as you level up
- Pause and play again after game over

## Project Structure

```
Tetris/
├── index.html   # Main page and game layout
├── styles.css   # Styling and layout
├── tetris.js    # Game logic
└── README.md    # This file
```

## License

Use and modify as you like.
