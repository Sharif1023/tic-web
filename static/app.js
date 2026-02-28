const boardEl = document.getElementById("board");
const turnPill = document.getElementById("turnPill");
const movesPill = document.getElementById("movesPill");
const resetBtn = document.getElementById("resetBtn");
const newBtn = document.getElementById("newBtn");
const toastEl = document.getElementById("toast");

const turnXBtn = document.getElementById("turnX");
const turnOBtn = document.getElementById("turnO");

const modePvpBtn = document.getElementById("modePvp");
const modeAiBtn = document.getElementById("modeAi");

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

  // first turn selectable once
  firstTurnLocked: false,

  // mode
  modeLocked: false,
  mode: "pvp",            // "pvp" | "ai"
  human: "X",             // only used in ai mode
  ai: "O",

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

function lockModeButtons() {
  state.modeLocked = true;
  if (modePvpBtn) modePvpBtn.disabled = true;
  if (modeAiBtn) modeAiBtn.disabled = true;
}

function unlockModeButtons() {
  state.modeLocked = false;
  if (modePvpBtn) modePvpBtn.disabled = false;
  if (modeAiBtn) modeAiBtn.disabled = false;
}

function setModeButtonUI() {
  if (!modePvpBtn || !modeAiBtn) return;

  const active = "bg-white/20 border-white/25";
  const normal = "bg-white/10 border-white/15";

  modePvpBtn.className = modePvpBtn.className.replace(active, "").replace(normal, "").trim() + " " + (state.mode === "pvp" ? active : normal);
  modeAiBtn.className = modeAiBtn.className.replace(active, "").replace(normal, "").trim() + " " + (state.mode === "ai" ? active : normal);
}

function setStatus() {
  const x = countPieces("X");
  const o = countPieces("O");

  if (!state.gameOver) {
    const pieces = state.turn === "X" ? x : o;
    const phase = pieces < state.maxPiecesPerPlayer ? "Place" : "Move";
    const modeLabel = state.mode === "ai" ? "AI" : "PvP";
    turnPill.textContent = `Turn: ${state.turn} (${phase}) • ${modeLabel}`;
  } else {
    turnPill.textContent = "Game Over";
  }

  movesPill.textContent = `Pieces: X ${x}/3 • O ${o}/3`;

  xWinsEl.textContent = String(state.scores.X);
  oWinsEl.textContent = String(state.scores.O);
  drawsEl.textContent = String(state.scores.D);

  setModeButtonUI();
}

function checkWinner(board = state.board) {
  for (const [a,b,c] of WIN_LINES) {
    const v = board[a];
    if (v && v === board[b] && v === board[c]) {
      return { winner: v, line: [a,b,c] };
    }
  }
  return null;
}

function endGame(message, winner=null, line=null) {
  state.gameOver = true;

  if (winner === "X") state.scores.X += 1;
  else if (winner === "O") state.scores.O += 1;
  else state.scores.D += 1;

  renderBoard(line);
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

function onFirstValidMoveLockButtons() {
  if (!state.firstTurnLocked) lockFirstTurnButtons();
  if (!state.modeLocked) lockModeButtons();
}

function cellBaseClasses() {
  return [
    "aspect-square",
    "rounded-2xl",
    "border",
    "border-white/10",
    "bg-white/5",
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
    cell.type = "button";
    cell.dataset.index = i;
    cell.className = cellBaseClasses();

    if (state.selectedFrom === i) cell.className += " " + selectedClasses();
    if (winSet.has(i)) cell.className += " " + winClasses();

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

/* ---------------- AI HELPERS ---------------- */

function cloneBoard(b) {
  return b.slice();
}

function empties(board) {
  const out = [];
  for (let i = 0; i < 9; i++) if (board[i] === "") out.push(i);
  return out;
}

function piecesOf(board, p) {
  const out = [];
  for (let i = 0; i < 9; i++) if (board[i] === p) out.push(i);
  return out;
}

function applyMove(board, player, move) {
  const nb = cloneBoard(board);
  if (move.type === "place") {
    nb[move.to] = player;
  } else {
    nb[move.from] = "";
    nb[move.to] = player;
  }
  return nb;
}

function legalMovesFor(board, player) {
  const pCount = piecesOf(board, player).length;
  const empty = empties(board);

  if (pCount < state.maxPiecesPerPlayer) {
    return empty.map(to => ({ type: "place", to }));
  }

  const ps = piecesOf(board, player);
  const moves = [];
  for (const from of ps) {
    for (const to of empty) {
      moves.push({ type: "move", from, to });
    }
  }
  return moves;
}

// simple scoring: win > block > center > corner > anything
function pickBestMove(board, player) {
  const opp = player === "X" ? "O" : "X";
  const moves = legalMovesFor(board, player);
  if (!moves.length) return null;

  // 1) can win now?
  for (const m of moves) {
    const nb = applyMove(board, player, m);
    const res = checkWinner(nb);
    if (res && res.winner === player) return m;
  }

  // 2) must block opponent win next?
  for (const m of moves) {
    const nb = applyMove(board, player, m);
    // if after this move opponent cannot immediately win, prefer it
    const oppMoves = legalMovesFor(nb, opp);
    let oppCanWin = false;
    for (const om of oppMoves) {
      const nb2 = applyMove(nb, opp, om);
      const r2 = checkWinner(nb2);
      if (r2 && r2.winner === opp) { oppCanWin = true; break; }
    }
    if (!oppCanWin) return m;
  }

  // 3) prefer center
  const center = 4;
  const centerMove = moves.find(m => m.to === center);
  if (centerMove) return centerMove;

  // 4) prefer corners
  const corners = new Set([0,2,6,8]);
  const cornerMove = moves.find(m => corners.has(m.to));
  if (cornerMove) return cornerMove;

  // 5) else any move
  return moves[Math.floor(Math.random() * moves.length)];
}

function maybeAIMove() {
  if (state.gameOver) return;
  if (state.mode !== "ai") return;
  if (state.turn !== state.ai) return;

  // small delay to feel natural
  setTimeout(() => {
    if (state.gameOver) return;
    if (state.turn !== state.ai) return;

    const move = pickBestMove(state.board, state.ai);
    if (!move) return;

    // apply AI move to real state
    if (move.type === "place") {
      state.board[move.to] = state.ai;
      state.lastPlaced[state.ai] = move.to;
    } else {
      state.board[move.from] = "";
      state.board[move.to] = state.ai;
      state.lastPlaced[state.ai] = move.to;
    }

    onFirstValidMoveLockButtons();

    const res = checkWinner(state.board);
    if (res) {
      renderBoard(res.line);
      setStatus();
      endGame(`✅ ${res.winner} wins!`, res.winner, res.line);
      return;
    }

    switchTurn();
    renderBoard();
    setStatus();

    // if somehow ai gets consecutive turn (shouldn't), guard above will stop it
  }, 350);
}

/* --------------- GAME INPUT --------------- */

function onCellClick(e) {
  if (state.gameOver) return;

  // In AI mode, block human from playing on AI's turn
  if (state.mode === "ai" && state.turn !== state.human) {
    showToast("AI is thinking...");
    return;
  }

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

    onFirstValidMoveLockButtons();

    const res = checkWinner(state.board);
    if (res) {
      renderBoard(res.line);
      setStatus();
      endGame(`✅ ${res.winner} wins!`, res.winner, res.line);
      return;
    }

    switchTurn();
    renderBoard();
    setStatus();
    maybeAIMove();
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

    // if no selection -> move last used piece
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

    onFirstValidMoveLockButtons();

    const res = checkWinner(state.board);
    if (res) {
      renderBoard(res.line);
      setStatus();
      endGame(`✅ ${res.winner} wins!`, res.winner, res.line);
      return;
    }

    switchTurn();
    renderBoard();
    setStatus();
    maybeAIMove();
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
  unlockModeButtons();

  renderBoard();
  setStatus();
  showToast("Board reset");
}

function newGameKeepScores() {
  resetBoardOnly();
  showToast("New game started");
}

/* --------------- BUTTONS --------------- */

resetBtn.addEventListener("click", resetBoardOnly);
newBtn.addEventListener("click", newGameKeepScores);

// First turn selection (only before first move)
turnXBtn.addEventListener("click", () => {
  if (state.firstTurnLocked) return;
  state.turn = "X";
  if (state.mode === "ai") { state.human = "X"; state.ai = "O"; }
  clearSelection();
  setStatus();
  showToast("First turn set to X");
});

turnOBtn.addEventListener("click", () => {
  if (state.firstTurnLocked) return;
  state.turn = "O";
  if (state.mode === "ai") { state.human = "O"; state.ai = "X"; }
  clearSelection();
  setStatus();
  showToast("First turn set to O");
});

// Mode selection (only before first move)
if (modePvpBtn) {
  modePvpBtn.addEventListener("click", () => {
    if (state.modeLocked) return;
    state.mode = "pvp";
    setStatus();
    showToast("Mode: PvP");
  });
}

if (modeAiBtn) {
  modeAiBtn.addEventListener("click", () => {
    if (state.modeLocked) return;
    state.mode = "ai";
    // human = current selected first turn (state.turn) by default
    state.human = state.turn;
    state.ai = state.turn === "X" ? "O" : "X";
    setStatus();
    showToast("Mode: AI");
    // if AI is supposed to start (rare, if user set first turn to ai side)
    // actually human is always the selected first turn here, so AI won't start.
  });
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "r") resetBoardOnly();
  if (key === "n") newGameKeepScores();
});

renderBoard();
setStatus();
showToast("Ready! Choose PvP or AI, then select first turn.");