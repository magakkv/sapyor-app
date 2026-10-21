function buildBoard() {
  var wrapW = Math.min(window.innerWidth, 440) - 28;
  var size = Math.max(22, Math.min(46, Math.floor((wrapW - (g.cols - 1) * 2) / g.cols)));
  boardEl.style.gridTemplateColumns = "repeat(" + g.cols + ", " + size + "px)";
  boardEl.style.gridAutoRows = size + "px";
  boardEl.style.fontSize = Math.round(size * 0.55) + "px";
  boardEl.innerHTML = "";
  cellEls = [];
  for (var i = 0; i < g.cells.length; i++) {
    var d = document.createElement("div");
    d.className = "cell";
    d.dataset.i = i;
    boardEl.appendChild(d);
    cellEls.push(d);
  }
}

function placeMines(safe) {
  var forbidden = {};
  forbidden[safe] = true;
  neighbors(safe).forEach(function (n) { forbidden[n] = true; });
  var pool = [];
  for (var i = 0; i < g.cells.length; i++) if (!forbidden[i]) pool.push(i);
  for (var k = pool.length - 1; k > 0; k--) {
    var j = Math.floor(Math.random() * (k + 1));
    var t = pool[k]; pool[k] = pool[j]; pool[j] = t;
  }
  pool.slice(0, g.mines).forEach(function (i) { g.cells[i].mine = true; });
  for (var m = 0; m < g.cells.length; m++) {
    g.cells[m].n = neighbors(m).filter(function (x) { return g.cells[x].mine; }).length;
  }
  g.started = true;
  startTimer();
}

function startTimer() {
  g.timer = setInterval(function () { g.seconds++; updateStats(); }, 1000);
}
function stopTimer() {
  if (g && g.timer) { clearInterval(g.timer); g.timer = null; }
}

function openCell(i) {
  var c = g.cells[i];
  if (g.over || c.open || c.flag) return;
  if (!g.started) placeMines(i);
  if (c.mine) { lose(i); return; }
  var stack = [i];
  while (stack.length) {
    var cur = stack.pop(), cc = g.cells[cur];
    if (cc.open || cc.flag) continue;
    cc.open = true; g.opened++;
    if (cc.n === 0) neighbors(cur).forEach(function (n) { if (!g.cells[n].open && !g.cells[n].flag) stack.push(n); });
  }
  if (g.opened === g.cells.length - g.mines) win();
}

function toggleFlag(i) {
  var c = g.cells[i];
  if (g.over || c.open) return;
  if (!c.flag && g.flags >= g.mines) { haptic("notify", "warning"); return; }
  c.flag = !c.flag;
  g.flags += c.flag ? 1 : -1;
  haptic("impact", "medium");
}

function chord(i) {
  var c = g.cells[i];
  if (!c.open || c.n === 0) return;
  var nb = neighbors(i);
  var f = nb.filter(function (x) { return g.cells[x].flag; }).length;
  if (f !== c.n) return;
  nb.forEach(function (x) { if (!g.over) openCell(x); });
}

function lose(i) {
  g.over = true; g.hit = i;
  stopTimer();
  haptic("notify", "error");
  rtitle.textContent = "💥 Бум!";
  rsub.textContent = "Время: " + g.seconds + " с";
  resultEl.className = "result show";
}

function win() {
  g.over = true; g.won = true;
  stopTimer();
  haptic("notify", "success");
  var best = getBest(levelKey), isNew = best === null || g.seconds < best;
  if (isNew) setBest(levelKey, g.seconds);
  rtitle.textContent = "🏆 Победа!";
  rsub.textContent = "Время: " + g.seconds + " с" + (isNew ? " — новый рекорд!" : " · рекорд: " + best + " с");
  resultEl.className = "result show";
}
