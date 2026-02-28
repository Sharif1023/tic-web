const boardEl = document.getElementById("board");
const turnPill = document.getElementById("turnPill");
const movesPill = document.getElementById("movesPill");
const resetBtn = document.getElementById("resetBtn");
const newBtn = document.getElementById("newBtn");
const toastEl = document.getElementById("toast");

const turnXBtn = document.getElementById("turnX");
const turnOBtn = document.getElementById("turnO");

const xWinsEl = document.getElementById("xWins");
const oWinsEl = document.getElementById("oWins");
const drawsEl = document.getElementById("draws");

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let state = {
  board: Array(9).fill(""),
  turn: "X",
  gameOver: false,

  maxPiecesPerPlayer: 3,
  selectedFrom: null,
  lastPlaced: { X: null, O: null },

  // ✅ NEW: only first turn selection
  firstTurnLocked: false,

  scores: { X: 0, O: 0, D: 0 }
};

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1200);
}

function countPieces(p) {
  return state.board.filter(v => v === p).length;
}

function lockFirstTurnButtons() {
  state.firstTurnLocked = true;
  turnXBtn.disabled = true;
  turnOBtn.disabled = true;
}

function unlockFirstTurnButtons() {
  state.firstTurnLocked = false;
  turnXBtn.disabled = false;
  turnOBtn.disabled = false;
}

function setStatus() {
  const x = countPieces("X");
  const o = countPieces("O");

  if (!state.gameOver) {
    const pieces = state.turn === "X" ? x : o;
    const phase = pieces < state.maxPiecesPerPlayer ? "Place" : "Move";
    turnPill.textContent = `Turn: ${state.turn} (${phase})`;
  } else {
    turnPill.textContent = "Game Over";
  }

  movesPill.textContent = `Pieces: X ${x}/3 • O ${o}/3`;

  xWinsEl.textContent = String(state.scores.X);
  oWinsEl.textContent = String(state.scores.O);
  drawsEl.textContent = String(state.scores.D);
}

function checkWinner() {
  for (const [a,b,c] of WIN_LINES) {
    const v = state.board[a];
    if (v && v === state.board[b] && v === state.board[c]) {
      return { winner: v, line: [a,b,c] };
    }
  }
  return null;
}

function glowLine(line) {
  const cells = [...document.querySelectorAll(".cell")];
  line.forEach(i => cells[i].classList.add("winGlow"));
}

function endGame(message, winner=null, line=null) {
  state.gameOver = true;

  if (winner === "X") state.scores.X += 1;
  else if (winner === "O") state.scores.O += 1;
  else state.scores.D += 1;

  renderBoard();
  setStatus();
  if (line) glowLine(line);
  showToast(message);
}

function clearSelection() {
  state.selectedFrom = null;
}

function renderBoard() {
  boardEl.innerHTML = "";
  state.board.forEach((v, i) => {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.dataset.index = i;

    if (state.selectedFrom === i) cell.classList.add("selected");

    if (v) {
      const span = document.createElement("span");
      span.className = `mark ${v.toLowerCase()}`;
      span.textContent = v;
      cell.appendChild(span);
    }

    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  });
}

// ✅ Auto switch after every valid move (after first move too)
function switchTurn() {
  state.turn = state.turn === "X" ? "O" : "X";
  clearSelection();
}

function onFirstValidMoveLockTurnButtons() {
  if (!state.firstTurnLocked) {
    lockFirstTurnButtons();
    showToast(`First turn locked: ${state.turn} started`);
  }
}

function onCellClick(e) {
  if (state.gameOver) return;

  const idx = Number(e.currentTarget.dataset.index);
  const cellVal = state.board[idx];
  const player = state.turn;

  const pieces = countPieces(player);
  const inPlacePhase = pieces < state.maxPiecesPerPlayer;

  // -------- PLACE PHASE (place new piece if < 3) --------
  if (inPlacePhase) {
    if (cellVal) return; // can't place on occupied

    state.board[idx] = player;
    state.lastPlaced[player] = idx;

    // ✅ first move done -> lock turn selection buttons
    onFirstValidMoveLockTurnButtons();

    const res = checkWinner();
    if (res) {
      renderBoard();
      setStatus();
      glowLine(res.line);
      endGame(`✅ ${res.winner} wins!`, res.winner, res.line);
      return;
    }

    // ✅ auto switch
    switchTurn();
    renderBoard();
    setStatus();
    return;
  }

  // -------- MOVE PHASE (must move: withdraw + place) --------
  // click on your own piece => select/deselect
  if (cellVal === player) {
    state.selectedFrom = (state.selectedFrom === idx) ? null : idx;
    renderBoard();
    setStatus();
    return;
  }

  // click on empty => move selected piece (or auto lastPlaced)
  if (cellVal === "") {
    let from = state.selectedFrom;

    // If no selection, auto move last used piece
    if (from === null) {
      from = state.lastPlaced[player];

      // safety fallback
      if (from === null || state.board[from] !== player) {
        from = state.board.findIndex(v => v === player);
      }
    }

    if (from === -1 || from === null || state.board[from] !== player) {
      showToast("No piece to move");
      return;
    }

    // move
    state.board[from] = "";
    state.board[idx] = player;
    state.lastPlaced[player] = idx;
    clearSelection();

    // ✅ first move lock (in case someone didn’t place but moved later; rare)
    onFirstValidMoveLockTurnButtons();

    const res = checkWinner();
    if (res) {
      renderBoard();
      setStatus();
      glowLine(res.line);
      endGame(`✅ ${res.winner} wins!`, res.winner, res.line);
      return;
    }

    // ✅ auto switch
    switchTurn();
    renderBoard();
    setStatus();
    return;
  }

  // click opponent piece => ignore
}

function resetBoardOnly() {
  state.board = Array(9).fill("");
  state.turn = "X";
  state.gameOver = false;
  state.selectedFrom = null;
  state.lastPlaced = { X: null, O: null };

  // ✅ allow first-turn selection again after reset/new
  unlockFirstTurnButtons();

  renderBoard();
  setStatus();
  showToast("Board reset");
}

function newGameKeepScores() {
  resetBoardOnly();
  showToast("New game started");
}

resetBtn.addEventListener("click", resetBoardOnly);
newBtn.addEventListener("click", newGameKeepScores);

// ✅ First-turn selection ONLY (disabled after first valid move)
turnXBtn.addEventListener("click", () => {
  if (state.firstTurnLocked) return;
  state.turn = "X";
  clearSelection();
  setStatus();
  showToast("First turn set to X");
});

turnOBtn.addEventListener("click", () => {
  if (state.firstTurnLocked) return;
  state.turn = "O";
  clearSelection();
  setStatus();
  showToast("First turn set to O");
});

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "r") resetBoardOnly();
  if (key === "n") newGameKeepScores();
});

renderBoard();
setStatus();
showToast("Ready! Select who starts (X/O).");