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

// ✅ HARD difficulty knobs
const AI_DIFFICULTY = "hard";
const AI_DEPTH = {
  easy:   { place: 6,  move: 4 },
  medium: { place: 8,  move: 6 },
  hard:   { place: 10, move: 8 }
}[AI_DIFFICULTY];

let state = {
  board: Array(9).fill(""),
  turn: "X",
  gameOver: false,

  maxPiecesPerPlayer: 3,
  selectedFrom: null,
  lastPlaced: { X: null, O: null },

  firstTurnLocked: false,

  modeLocked: false,
  mode: "pvp",     // "pvp" | "ai"
  human: "X",
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

function countPieces(p, board = state.board) {
  return board.reduce((acc, v) => acc + (v === p ? 1 : 0), 0);
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

  const clean = (cls) => cls
    .replace(active, "")
    .replace(normal, "")
    .replace(/\s+/g, " ")
    .trim();

  modePvpBtn.className = clean(modePvpBtn.className) + " " + (state.mode === "pvp" ? active : normal);
  modeAiBtn.className = clean(modeAiBtn.className) + " " + (state.mode === "ai" ? active : normal);
}

function setStatus() {
  const x = countPieces("X");
  const o = countPieces("O");

  if (!state.gameOver) {
    const pieces = state.turn === "X" ? x : o;
    const phase = pieces < state.maxPiecesPerPlayer ? "Place" : "Move";
    const modeLabel = state.mode === "ai" ? "AI (Hard)" : "PvP";
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
    if (v && v === board[b] && v === board[c]) return { winner: v, line: [a,b,c] };
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

/* ---------------- UI cells ---------------- */

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

/* ---------------- AI (HARD: Minimax + alpha-beta + BLOCK FIRST) ---------------- */

function cloneBoard(b) { return b.slice(); }

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

function applyMoveLastPlaced(lastPlacedLocal, player, move) {
  const nl = { X: lastPlacedLocal.X, O: lastPlacedLocal.O };
  nl[player] = move.to;
  return nl;
}

function legalMovesFor(board, player, lastPlacedLocal) {
  const pCount = piecesOf(board, player).length;
  const empty = empties(board);

  // Place phase: center > corners > edges
  if (pCount < state.maxPiecesPerPlayer) {
    const pref = [4,0,2,6,8,1,3,5,7];
    const emptySet = new Set(empty);
    const ordered = pref.filter(i => emptySet.has(i));
    return ordered.map(to => ({ type: "place", to }));
  }

  // Move phase: withdraw + place (from last used first)
  const ps = piecesOf(board, player);
  const last = lastPlacedLocal?.[player] ?? null;

  const orderedFrom = (last !== null && ps.includes(last))
    ? [last, ...ps.filter(x => x !== last)]
    : ps;

  const prefTo = [4,0,2,6,8,1,3,5,7];
  const emptySet = new Set(empty);
  const orderedTo = prefTo.filter(i => emptySet.has(i));

  const moves = [];
  for (const from of orderedFrom) {
    for (const to of orderedTo) moves.push({ type: "move", from, to });
  }
  return moves;
}

// evaluation tuned for 3-piece variant
function evaluateBoard(board, aiPlayer) {
  const opp = aiPlayer === "X" ? "O" : "X";
  const res = checkWinner(board);
  if (res) {
    if (res.winner === aiPlayer) return 1000000;
    if (res.winner === opp) return -1000000;
  }

  let score = 0;

  for (const [a,b,c] of WIN_LINES) {
    const line = [board[a], board[b], board[c]];
    const aiCount = line.filter(v => v === aiPlayer).length;
    const opCount = line.filter(v => v === opp).length;
    const emptyCount = 3 - aiCount - opCount;

    if (aiCount > 0 && opCount === 0) {
      if (aiCount === 2 && emptyCount === 1) score += 220;
      else if (aiCount === 1 && emptyCount === 2) score += 30;
    }

    if (opCount > 0 && aiCount === 0) {
      if (opCount === 2 && emptyCount === 1) score -= 260;
      else if (opCount === 1 && emptyCount === 2) score -= 34;
    }
  }

  const posWeight = [18,10,18, 10,26,10, 18,10,18];
  for (let i = 0; i < 9; i++) {
    if (board[i] === aiPlayer) score += posWeight[i];
    else if (board[i] === opp) score -= posWeight[i];
  }

  return score;
}

function keyOf(board, turn, lastPlacedLocal, depth) {
  const lpX = lastPlacedLocal?.X ?? -1;
  const lpO = lastPlacedLocal?.O ?? -1;
  return board.join("") + "|" + turn + "|" + lpX + "|" + lpO + "|d" + depth;
}

function chooseAIMove(board, turn, lastPlacedLocal, aiPlayer) {
  const aiCount = countPieces(aiPlayer, board);
  const depth = aiCount < state.maxPiecesPerPlayer ? AI_DEPTH.place : AI_DEPTH.move;

  const memo = new Map();
  const opp = aiPlayer === "X" ? "O" : "X";

  function minimax(b, t, lp, d, alpha, beta) {
    const res = checkWinner(b);
    if (res || d === 0) {
      return { score: evaluateBoard(b, aiPlayer), move: null };
    }

    const k = keyOf(b, t, lp, d);
    if (memo.has(k)) return memo.get(k);

    const isMax = (t === aiPlayer);
    const moves = legalMovesFor(b, t, lp);

    if (!moves.length) {
      const out = { score: evaluateBoard(b, aiPlayer), move: null };
      memo.set(k, out);
      return out;
    }

    // immediate win shortcut
    for (const m of moves) {
      const nb = applyMove(b, t, m);
      const r = checkWinner(nb);
      if (r && r.winner === t) {
        const out = { score: isMax ? 999999 : -999999, move: m };
        memo.set(k, out);
        return out;
      }
    }

    let best = { score: isMax ? -Infinity : Infinity, move: null };

    for (const m of moves) {
      const nb = applyMove(b, t, m);
      const nlp = applyMoveLastPlaced(lp, t, m);
      const nt = (t === "X") ? "O" : "X";

      const child = minimax(nb, nt, nlp, d - 1, alpha, beta);
      const sc = child.score;

      if (isMax) {
        if (sc > best.score) best = { score: sc, move: m };
        alpha = Math.max(alpha, best.score);
        if (beta <= alpha) break;
      } else {
        if (sc < best.score) best = { score: sc, move: m };
        beta = Math.min(beta, best.score);
        if (beta <= alpha) break;
      }
    }

    memo.set(k, best);
    return best;
  }

  const movesNow = legalMovesFor(board, turn, lastPlacedLocal);

  // ✅ 1) BLOCK FIRST (opponent next move win থাকলে আগে block)
  const oppImmediateWins = [];
  for (const om of legalMovesFor(board, opp, lastPlacedLocal)) {
    const b2 = applyMove(board, opp, om);
    const r2 = checkWinner(b2);
    if (r2 && r2.winner === opp) oppImmediateWins.push(om);
  }

  if (oppImmediateWins.length > 0) {
    for (const m of movesNow) {
      const nb = applyMove(board, turn, m);
      const nlp = applyMoveLastPlaced(lastPlacedLocal, turn, m);

      let stillWin = false;
      const oppReplies = legalMovesFor(nb, opp, nlp);
      for (const om of oppReplies) {
        const nb2 = applyMove(nb, opp, om);
        const r2 = checkWinner(nb2);
        if (r2 && r2.winner === opp) { stillWin = true; break; }
      }

      if (!stillWin) return m; // block found
    }
    // If can't fully block, continue minimax (best survival)
  }

  // ✅ 2) If no block needed, try win now
  for (const m of movesNow) {
    const nb = applyMove(board, turn, m);
    const r = checkWinner(nb);
    if (r && r.winner === turn) return m;
  }

  // ✅ 3) Otherwise minimax (hard)
  const result = minimax(board, turn, lastPlacedLocal, depth, -Infinity, Infinity);
  return result.move || movesNow[0] || null;
}

function maybeAIMove() {
  if (state.gameOver) return;
  if (state.mode !== "ai") return;
  if (state.turn !== state.ai) return;

  setTimeout(() => {
    if (state.gameOver) return;
    if (state.turn !== state.ai) return;

    const move = chooseAIMove(state.board, state.ai, state.lastPlaced, state.ai);
    if (!move) return;

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
  }, 220);
}

/* ---------------- GAME INPUT ---------------- */

function onCellClick(e) {
  if (state.gameOver) return;

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
  }
}

/* ---------------- RESET / NEW ---------------- */

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

/* ---------------- BUTTONS ---------------- */

resetBtn.addEventListener("click", resetBoardOnly);
newBtn.addEventListener("click", newGameKeepScores);

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
    state.human = state.turn;                 // human is selected first turn
    state.ai = state.turn === "X" ? "O" : "X";
    setStatus();
    showToast("Mode: AI (Hard) • Block First");
  });
}

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "r") resetBoardOnly();
  if (key === "n") newGameKeepScores();
});

/* ---------------- INIT ---------------- */

renderBoard();
setStatus();
showToast("Ready! Choose PvP or AI, then select first turn.");