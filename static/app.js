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

  firstTurnLocked: false,

  scores: { X: 0, O: 0, D: 0 }
};

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("opacity-0", "translate-y-2");
  toastEl.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toastEl.classList.add("opacity-0", "translate-y-2");
    toastEl.classList.remove("opacity-100", "translate-y-0");
  }, 1400);
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

function endGame(message, winner=null) {
  state.gameOver = true;

  if (winner === "X") state.scores.X += 1;
  else if (winner === "O") state.scores.O += 1;
  else state.scores.D += 1;

  renderBoard();
  setStatus();
  showToast(message);
}

function clearSelection() {
  state.selectedFrom = null;
}

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

function cellBaseClasses() {
  return [
    "aspect-square",
    "rounded-2xl",
    "border",
    "border-white/10",
    "bg-white/5",
    "shadow-[0_0_0_rgba(0,0,0,0)]",
    "transition",
    "active:scale-[0.992]",
    "hover:bg-white/10",
    "focus-visible:outline-none",
    "focus-visible:ring-4",
    "focus-visible:ring-blue-400/30",
    "grid",
    "place-items-center",
    "select-none",
    "touch-manipulation"
  ].join(" ");
}

function selectedClasses() {
  return "ring-4 ring-blue-400/25 border-white/20 shadow-[0_18px_55px_rgba(0,0,0,.32)]";
}

function winClasses() {
  return "ring-4 ring-emerald-400/25 border-white/25 shadow-[0_22px_70px_rgba(0,0,0,.40)]";
}

function renderBoard(winLine = null) {
  boardEl.innerHTML = "";

  const winSet = new Set(winLine || []);

  state.board.forEach((v, i) => {
    const cell = document.createElement("button");
    cell.className = cellBaseClasses();
    cell.type = "button";
    cell.dataset.index = i;

    if (state.selectedFrom === i) {
      cell.className += " " + selectedClasses();
    }

    if (winSet.has(i)) {
      cell.className += " " + winClasses();
    }

    if (state.gameOver) {
      cell.disabled = true;
      cell.className += " opacity-80 cursor-not-allowed";
    }

    if (v) {
      const span = document.createElement("span");
      span.textContent = v;
      span.className =
        v === "X"
          ? "text-[clamp(44px,9vw,64px)] font-black text-emerald-300 drop-shadow-[0_12px_32px_rgba(99,245,200,.20)]"
          : "text-[clamp(44px,9vw,64px)] font-black text-blue-300 drop-shadow-[0_12px_32px_rgba(122,167,255,.20)]";
      cell.appendChild(span);
    }

    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
  });
}

function onCellClick(e) {
  if (state.gameOver) return;

  const idx = Number(e.currentTarget.dataset.index);
  const cellVal = state.board[idx];
  const player = state.turn;

  const pieces = countPieces(player);
  const inPlacePhase = pieces < state.maxPiecesPerPlayer;

  // PLACE PHASE
  if (inPlacePhase) {
    if (cellVal) return;

    state.board[idx] = player;
    state.lastPlaced[player] = idx;

    onFirstValidMoveLockTurnButtons();

    const res = checkWinner();
    if (res) {
      renderBoard(res.line);
      setStatus();
      endGame(`✅ ${res.winner} wins!`, res.winner);
      return;
    }

    switchTurn();
    renderBoard();
    setStatus();
    return;
  }

  // MOVE PHASE
  if (cellVal === player) {
    state.selectedFrom = (state.selectedFrom === idx) ? null : idx;
    renderBoard();
    setStatus();
    return;
  }

  if (cellVal === "") {
    let from = state.selectedFrom;

    // If no selection -> auto move last used piece
    if (from === null) {
      from = state.lastPlaced[player];
      if (from === null || state.board[from] !== player) {
        from = state.board.findIndex(v => v === player);
      }
    }

    if (from === -1 || from === null || state.board[from] !== player) {
      showToast("No piece to move");
      return;
    }

    state.board[from] = "";
    state.board[idx] = player;
    state.lastPlaced[player] = idx;
    clearSelection();

    onFirstValidMoveLockTurnButtons();

    const res = checkWinner();
    if (res) {
      renderBoard(res.line);
      setStatus();
      endGame(`✅ ${res.winner} wins!`, res.winner);
      return;
    }

    switchTurn();
    renderBoard();
    setStatus();
    return;
  }
}

function resetBoardOnly() {
  state.board = Array(9).fill("");
  state.turn = "X";
  state.gameOver = false;
  state.selectedFrom = null;
  state.lastPlaced = { X: null, O: null };

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