var tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    document.documentElement.classList.add("tg-themed");
    if (tg.colorScheme === "dark") document.documentElement.classList.add("dark-tg");
  } catch (e) {}
}
function haptic(kind, style) {
  try {
    if (!tg || !tg.HapticFeedback) return;
    if (kind === "impact") tg.HapticFeedback.impactOccurred(style || "light");
    else if (kind === "notify") tg.HapticFeedback.notificationOccurred(style);
    else if (kind === "select") tg.HapticFeedback.selectionChanged();
  } catch (e) {}
}

var LEVELS = {
  easy:   { name: "Лёгкий",  cols: 9,  rows: 9,  mines: 10 },
  medium: { name: "Средний", cols: 10, rows: 14, mines: 25 },
  hard:   { name: "Сложный", cols: 12, rows: 16, mines: 40 }
};
var NUM_COLORS = ["", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"];

var $ = function (id) { return document.getElementById(id); };
var boardEl = $("board"), minesEl = $("mines"), timeEl = $("time"), modeBtn = $("mode"),
    resultEl = $("result"), rtitle = $("rtitle"), rsub = $("rsub");

var levelKey = "easy";
try { var saved = localStorage.getItem("ms_level"); if (saved && LEVELS[saved]) levelKey = saved; } catch (e) {}

var g = null;          // состояние игры
var cellEls = [];
var flagMode = false;

function getBest(key) {
  try { var v = localStorage.getItem("ms_best_" + key); return v ? parseInt(v, 10) : null; } catch (e) { return null; }
}
function setBest(key, v) {
  try { localStorage.setItem("ms_best_" + key, String(v)); } catch (e) {}
}

function renderLevels() {
  var box = $("levels");
  box.innerHTML = "";
  Object.keys(LEVELS).forEach(function (k) {
    var b = document.createElement("button");
    b.textContent = LEVELS[k].name;
    if (k === levelKey) b.className = "active";
    b.onclick = function () {
      levelKey = k;
      try { localStorage.setItem("ms_level", k); } catch (e) {}
      renderLevels();
      newGame();
      haptic("select");
    };
    box.appendChild(b);
  });
}

function idx(r, c) { return r * g.cols + c; }
function neighbors(i) {
  var r = Math.floor(i / g.cols), c = i % g.cols, out = [];
  for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    var nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < g.rows && nc >= 0 && nc < g.cols) out.push(idx(nr, nc));
  }
  return out;
}

function newGame() {
  stopTimer();
  var L = LEVELS[levelKey];
  g = {
    cols: L.cols, rows: L.rows, mines: L.mines,
    cells: [], started: false, over: false, won: false,
    opened: 0, flags: 0, seconds: 0, timer: null, hit: -1
  };
  for (var i = 0; i < L.cols * L.rows; i++) g.cells.push({ mine: false, open: false, flag: false, n: 0 });
  resultEl.className = "result";
  buildBoard();
  updateStats();
}
