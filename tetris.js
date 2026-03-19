(function () {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30;
  const COLORS = [
    null,
    '#00d4aa', // I - cyan/teal
    '#f0b429', // O - yellow
    '#a855f7', // T - purple
    '#22c55e', // S - green
    '#ef4444', // Z - red
    '#3b82f6', // J - blue
    '#f97316', // L - orange
  ];

  const SHAPES = [
    null,
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[1, 1], [1, 1]],                                           // O
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],                         // T
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],                         // S
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],                         // Z
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],                         // J
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],                         // L
  ];

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('nextCanvas');
  const nextCtx = nextCanvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayMessage = document.getElementById('overlayMessage');
  const startBtn = document.getElementById('startBtn');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');

  let board = createBoard();
  let current = null;
  let next = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let gameOver = false;
  let paused = false;
  let dropInterval = 1000;
  let lastDrop = 0;
  let animationId = null;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomPiece() {
    const type = (Math.floor(Math.random() * 7) % 7) + 1;
    return {
      type,
      shape: SHAPES[type].map(row => [...row]),
      x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
      y: 0,
    };
  }

  function rotate(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  }

  function collide(piece, dx = 0, dy = 0) {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const ny = piece.y + r + dy;
        const nx = piece.x + c + dx;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function merge() {
    const shape = current.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const y = current.y + r;
          const x = current.x + c;
          if (y >= 0) board[y][x] = current.type;
        }
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    let row = ROWS - 1;
    while (row >= 0) {
      if (board[row].every(cell => cell !== 0)) {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
      } else {
        row--;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800];
      score += (points[cleared] || 800 + (cleared - 4) * 200) * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 80);
      updateUI();
    }
  }

  function spawn() {
    current = next;
    next = randomPiece();
    drawNext();
    if (current && collide(current)) {
      gameOver = true;
      overlay.classList.remove('hidden');
      overlayMessage.textContent = 'Game Over';
      startBtn.textContent = 'Play Again';
      return;
    }
  }

  function drop() {
    if (gameOver || paused || !current) return;
    if (collide(current, 0, 1)) {
      merge();
      clearLines();
      spawn();
      return;
    }
    current.y++;
  }

  function hardDrop() {
    if (gameOver || paused || !current) return;
    while (!collide(current, 0, 1)) {
      current.y++;
      score += 2;
    }
    merge();
    clearLines();
    updateUI();
    spawn();
  }

  function move(dx) {
    if (gameOver || paused || !current) return;
    if (!collide(current, dx, 0)) current.x += dx;
  }

  function rotatePiece() {
    if (gameOver || paused || !current) return;
    const rotated = rotate(current.shape);
    const prev = current.shape;
    current.shape = rotated;
    if (collide(current)) {
      current.shape = prev;
    }
  }

  function updateUI() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
  }

  function drawBlock(ctx, x, y, type, size = BLOCK_SIZE) {
    const color = COLORS[type] || '#333';
    const pad = 1;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, size - pad * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x * size + pad, y * size + pad, size - pad * 2, 4);
    ctx.fillRect(x * size + pad, y * size + pad, 4, size - pad * 2);
  }

  function drawBoard() {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          drawBlock(ctx, c, r, board[r][c]);
        }
      }
    }

    if (current) {
      const shape = current.shape;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            drawBlock(ctx, current.x + c, current.y + r, current.type);
          }
        }
      }
    }
  }

  function drawNext() {
    const size = 30;
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!next) return;
    const shape = next.shape;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          drawBlock(nextCtx, offsetX + c, offsetY + r, next.type, size);
        }
      }
    }
  }

  function gameLoop(now = 0) {
    if (gameOver) return;
    if (!paused && current && now - lastDrop > dropInterval) {
      drop();
      lastDrop = now;
    }
    drawBoard();
    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    board = createBoard();
    next = randomPiece();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    dropInterval = 1000;
    lastDrop = 0;
    overlay.classList.add('hidden');
    updateUI();
    spawn();
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
  }

  function togglePause() {
    if (gameOver || !current) return;
    paused = !paused;
    if (paused) {
      overlay.classList.remove('hidden');
      overlayMessage.textContent = 'Paused';
      startBtn.textContent = 'Resume';
    } else {
      overlay.classList.add('hidden');
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      e.preventDefault();
      if (gameOver) return;
      togglePause();
      return;
    }
    if (paused || gameOver) return;
    e.preventDefault();
    switch (e.code) {
      case 'ArrowLeft':
        move(-1);
        break;
      case 'ArrowRight':
        move(1);
        break;
      case 'ArrowDown':
        drop();
        score += 1;
        updateUI();
        break;
      case 'ArrowUp':
        rotatePiece();
        break;
      case 'Space':
        hardDrop();
        break;
    }
  });

  startBtn.addEventListener('click', () => {
    if (gameOver || !current) {
      startGame();
    } else if (paused) {
      togglePause();
    }
  });

  overlay.classList.remove('hidden');
  overlayMessage.textContent = 'Tetris';
  startBtn.textContent = 'Start Game';
  drawBoard();
})();
