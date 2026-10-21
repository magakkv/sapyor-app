function updateStats() {
  minesEl.textContent = "💣 " + (g.mines - g.flags);
  timeEl.textContent = "⏱ " + g.seconds;
  modeBtn.className = "btn" + (flagMode ? " on" : "");
  modeBtn.textContent = flagMode ? "🚩" : "⛏";
  var best = getBest(levelKey);
  document.title = "Сапёр" + (best !== null ? " · рекорд " + best + " с" : "");
  for (var i = 0; i < g.cells.length; i++) paint(i);
}

function paint(i) {
  var c = g.cells[i], el = cellEls[i], cls = "cell", txt = "";
  if (g.over) {
    if (i === g.hit) { cls += " open boom"; txt = "💥"; }
    else if (c.mine) { cls += " open"; txt = g.won || c.flag ? "🚩" : "💣"; }
    else if (c.flag) { cls += " open wrong"; txt = "❌"; }
    else if (c.open) { cls += " open"; if (c.n) { cls += " " + NUM_COLORS[c.n]; txt = c.n; } }
  } else if (c.open) {
    cls += " open";
    if (c.n) { cls += " " + NUM_COLORS[c.n]; txt = c.n; }
  } else if (c.flag) {
    txt = "🚩";
  }
  if (el.className !== cls) el.className = cls;
  if (el.textContent !== String(txt)) el.textContent = txt;
}

// Управление: тап — открыть/флаг (по режиму), долгое нажатие — флаг
var press = null;
boardEl.addEventListener("pointerdown", function (e) {
  var el = e.target.closest(".cell");
  if (!el || g.over) return;
  var i = parseInt(el.dataset.i, 10);
  press = { i: i, long: false, x: e.clientX, y: e.clientY };
  press.timer = setTimeout(function () {
    if (!press) return;
    press.long = true;
    toggleFlag(i);
    updateStats();
  }, 420);
});
boardEl.addEventListener("pointermove", function (e) {
  if (press && (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10)) {
    clearTimeout(press.timer); press = null;
  }
});
function endPress(e) {
  if (!press) return;
  clearTimeout(press.timer);
  var p = press; press = null;
  if (p.long || g.over) return;
  var c = g.cells[p.i];
  if (c.open) { chord(p.i); }
  else if (flagMode) { toggleFlag(p.i); }
  else { openCell(p.i); if (!g.over) haptic("impact", "light"); }
  updateStats();
}
boardEl.addEventListener("pointerup", endPress);
boardEl.addEventListener("pointercancel", function () { if (press) { clearTimeout(press.timer); press = null; } });
boardEl.addEventListener("pointerleave", function () { if (press) { clearTimeout(press.timer); press = null; } });
boardEl.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  var el = e.target.closest(".cell");
  if (el && !g.over) { toggleFlag(parseInt(el.dataset.i, 10)); updateStats(); }
});

modeBtn.onclick = function () { flagMode = !flagMode; haptic("select"); updateStats(); };
$("restart").onclick = function () { haptic("select"); newGame(); };
$("again").onclick = function () { newGame(); };

window.addEventListener("resize", function () { if (g) { buildBoard(); updateStats(); } });

renderLevels();
newGame();
