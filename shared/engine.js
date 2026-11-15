/* Question engine shared by every page: play screen, answer inputs, Spanish keyboard, sound, results.
   Load after progress.js. Based on the engine of the maths app (~/math/shared/engine.js).

   A question is an object:
     text      what is asked (HTML allowed)
     picture   optional HTML shown above it (an emoji, a small drawing…)
     input     how the child answers:
       "choice"  2–4 big buttons. answer = the right choice text; choices = list of texts
       "gap"     a word with a gap (gap: "ca_allo"); buttons fill the gap. answer = the text that fills it ("b"); choices = list
       "text"    on-screen Spanish keyboard (ñ, ´ for á é í ó ú, ¨ for ü, capitals). answer = text, or a list of texts that all count.
                 keys: extra keys for this question, e.g. ["¿", "?"]. maxLen (default 30).
                 caseSensitive: capitals count (default: they don't).
                 strictAccent: accents always count (default: only once accents are mastered, see L4.prog.accentsStrict)
       "words"   tap words in a sentence. words = list of words (punctuation marks on their own are not tappable);
                 answer = list of the indexes of the right words. one: true → the first tap answers (one right word)
       "order"   tap cards to put them in order. items = the cards in the RIGHT order (the engine shuffles them);
                 joiner = what goes between them when shown as text (default " "; "" for letters or syllables)
     check     optional function(given) → true/false, to accept more than one answer
     explain   HTML shown when the answer is wrong (the rule and the right answer)
     solution  short text for the "para practicar" list on the results screen (default: the right answer)
     key       optional: a short id, to avoid the same question twice in a round (default: text + gap)
     tag       optional: shown after the title in the top bar (the daily mix shows the skill)
*/
(function(){
"use strict";
const L4 = window.L4 = window.L4 || {};
const $ = L4.$ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
L4.esc = esc;

/* ---------- helpers ---------- */
L4.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
L4.pick = arr => arr[Math.floor(Math.random() * arr.length)];
L4.rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
L4.sample = (arr, n) => L4.shuffle(arr.slice()).slice(0, n);
L4.weightedPick = function(items, weights, n){
  const it = items.slice(), w = weights.slice(), out = [];
  while (out.length < n && it.length){
    const tot = w.reduce((s,x) => s + x, 0);
    let r = Math.random() * tot, i = 0;
    while (i < w.length - 1 && r >= w[i]){ r -= w[i]; i++; }
    out.push(it[i]); it.splice(i,1); w.splice(i,1);
  }
  return out;
};
L4.show = function(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo(0,0);
};

/* ---------- comparing written answers ----------
   Spaces at the ends and double spaces never count. Capitals count only with caseSensitive.
   Only the acute accent (á é í ó ú) is treated as "an accent": ñ and ü are letters of their own. */
const ACUTE = { "á":"a", "é":"e", "í":"i", "ó":"o", "ú":"u", "Á":"A", "É":"E", "Í":"I", "Ó":"O", "Ú":"U" };
L4.noAcute = s => s.replace(/[áéíóúÁÉÍÓÚ]/g, c => ACUTE[c]);
L4.tidy = s => s.normalize("NFC").replace(/\s+/g, " ").trim();
/* → "ok", "accent" (right except for the accents) or "wrong" */
L4.compareText = function(given, answers, caseSensitive){
  const fold = s => { s = L4.tidy(s); return caseSensitive ? s : s.toLocaleLowerCase("es"); };
  const g = fold(given), list = (Array.isArray(answers) ? answers : [answers]).map(fold);
  if (list.includes(g)) return "ok";
  if (list.some(a => L4.noAcute(a) === L4.noAcute(g))) return "accent";
  return "wrong";
};

/* ---------- sound & confetti ---------- */
let actx = null;
function tone(freqs){
  if (!L4.prog.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime;
    freqs.forEach((f,i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = t0 + i * .1;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.25, t + .015);
      g.gain.exponentialRampToValueAtTime(.0001, t + .2);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + .22);
    });
  } catch(e){}
}
const goodSound = () => tone([660, 880]);
const nearSound = () => tone([660, 620]);
const badSound  = () => tone([300, 220]);
const winSound  = () => tone([523, 659, 784, 1047]);
function confetti(){
  const box = document.createElement("div"); box.className = "confetti";
  const em = ["⭐","🎉","✨","🌟","🎊"];
  for (let i = 0; i < 40; i++){
    const s = document.createElement("span");
    s.textContent = em[i % em.length];
    s.style.left = Math.random() * 100 + "vw";
    s.style.animationDelay = Math.random() * .8 + "s";
    s.style.fontSize = (18 + Math.random() * 22) + "px";
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3600);
}
L4.sound = { good:goodSound, bad:badSound, win:winSound };
L4.confetti = confetti;

/* ---------- play & results screens (added to every page) ---------- */
const KB_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l","ñ"],
  ["shift","z","x","c","v","b","n","m","del"],
  ["acute","diaer","space","ok"]
];
const KB_LABEL = { shift:"⇧", del:"⌫", acute:"´", diaer:"¨", space:"espacio", ok:"Comprobar ✓" };
const KB_ARIA = { shift:"Mayúscula", del:"Borrar", acute:"Tilde", diaer:"Diéresis", space:"Espacio", ok:"Comprobar" };
document.body.insertAdjacentHTML("beforeend", `
<section id="play" class="screen">
  <div class="playtop">
    <button id="quitBtn" class="ghost">✕ Salir</button>
    <span id="playTitle"></span>
    <span id="progress"></span>
  </div>
  <div class="playbody">
    <div id="qpic" class="qpic"></div>
    <div id="qtext" class="q"></div>
    <div id="answer" class="answer"></div>
    <div id="board" class="board"></div>
    <div id="feedback" class="feedback" aria-live="polite"></div>
    <div id="cont"></div>
    <div class="choices" id="choices"></div>
    <div class="kbd" id="kbd">
      <div class="kxtra" id="kxtra"></div>
      ${KB_ROWS.map(r => `<div class="krow">${r.map(k =>
        `<button data-k="${k}" class="k-${k.length > 1 ? k : "l"}"${KB_ARIA[k] ? ` aria-label="${KB_ARIA[k]}"` : ""}>${KB_LABEL[k] || k}</button>`).join("")}</div>`).join("")}
    </div>
  </div>
</section>
<section id="results" class="screen">
  <div class="res">
    <h1 id="resTitle"></h1>
    <div id="resScore" class="bigscore"></div>
    <p id="resMsg" style="font-size:1.2rem"></p>
    <div id="resList"></div>
    <div id="resButtons" class="btnrow"></div>
  </div>
</section>`);

L4.showResults = function(o){
  $("#resTitle").textContent = o.title;
  $("#resScore").textContent = o.score;
  $("#resMsg").textContent = o.msg;
  const seen = new Set();
  const missed = o.missed.filter(r => { const k = keyOf(r.q); if (seen.has(k)) return false; seen.add(k); return true; });
  $("#resList").innerHTML = missed.length
    ? `<h3>${o.missedTitle || "Para practicar"}</h3><div class="chips">${missed.map(r =>
        `<span class="chip"><b>${esc(solutionOf(r.q))}</b><small>${r.givenText === null ? "sin respuesta" : "tu respuesta: " + esc(r.givenText)}</small></span>`).join("")}</div>`
    : "";
  const box = $("#resButtons"); box.innerHTML = "";
  o.buttons.forEach(([label, fn, cls]) => {
    const b = document.createElement("button");
    b.textContent = label; b.className = "btn " + (cls || ""); b.onclick = fn;
    box.appendChild(b);
  });
  L4.show("results");
  if (o.celebrate){ confetti(); winSound(); }
};

/* ---------- question engine ----------
   startSession(cfg) options:
     title, questions[], requeue + maxQ (wrong ones come back a few questions later),
     waitOnWrong (wait for "Siguiente" after a wrong answer), okDelay, badDelay,
     onAnswer(q, ok, ms, given, result), onFinish(results)
   result is "ok", "accent" (right but for the accents, counted as right while accents are soft) or "wrong". */
let S = null, sid = 0;
const inputOf = q => q.input || "choice";
const keyOf = q => q.key || (q.text || "") + "|" + (q.gap || "") + "|" + (q.words || q.items || []).join(" ");
const answersOf = q => Array.isArray(q.answer) ? q.answer : [q.answer];
function solutionOf(q){
  if (q.solution) return q.solution;
  const m = inputOf(q);
  if (m === "gap") return q.gap.replace(/_+/, q.answer);
  if (m === "words") return q.answer.map(i => q.words[i]).join(", ");
  if (m === "order") return q.items.join(q.joiner === undefined ? " " : q.joiner);
  return answersOf(q)[0];
}
L4.solutionOf = solutionOf;
function later(fn, ms){ const id = S && S.id; setTimeout(() => { if (S && S.id === id) fn(); }, ms); }
function stopSession(){ S = null; }
function finishSession(){ const s = S; stopSession(); s.onFinish(s.results); }
function updateProgress(){ $("#progress").textContent = `${S.i + 1} / ${S.questions.length}`; }

function startSession(cfg){
  stopSession();
  S = Object.assign({ i:0, right:0, results:[], id:++sid, busy:true }, cfg);
  L4.show("play");
  $("#playTitle").textContent = cfg.title;
  nextQuestion();
}

/* ---- the answer area for each input ---- */
function renderText(){
  const el = $("#answer");
  el.innerHTML = `${esc(S.typed).replace(/ /g, "&nbsp;")}<span class="caret"></span>`;
  document.querySelectorAll("#kbd [data-k]").forEach(b => {
    const k = b.dataset.k;
    if (k === "shift") b.classList.toggle("on", S.shift);
    if (k === "acute") b.classList.toggle("on", S.dead === "acute");
    if (k === "diaer") b.classList.toggle("on", S.dead === "diaer");
    if (k.length === 1 && /[a-zñ]/.test(k)){
      // after ´ the vowels show á é í ó ú (and after ¨ the u shows ü), so the child sees what will be typed
      const c = S.shift ? k.toLocaleUpperCase("es") : k;
      const map = S.dead === "acute" ? ADD_ACUTE : S.dead === "diaer" ? ADD_DIAER : null;
      b.textContent = map && map[c] ? map[c] : c;
      b.classList.toggle("lit", !!(map && map[c]));
    }
  });
}
function renderGap(q, fill, cls){
  const [a, b] = q.gap.split(/_+/);
  $("#answer").innerHTML = `${esc(a)}<span class="slot ${cls || ""}">${fill ? esc(fill) : "&nbsp;&nbsp;"}</span>${esc(b || "")}`;
}
const isMark = w => /^[.,;:!?¡¿…«»"()—-]+$/.test(w);
function renderWords(q){
  $("#board").innerHTML = `<div class="sentence">${q.words.map((w, i) => isMark(w)
    ? `<span class="mark">${esc(w)}</span>`
    : `<button class="word ${S.picked.has(i) ? "on" : ""}" data-w="${i}">${esc(w)}</button>`).join("")}</div>`;
}
function renderOrder(q){
  const j = q.joiner === undefined ? " " : q.joiner;
  $("#board").innerHTML =
    `<div class="built ${j === "" ? "tight" : ""}">${S.built.length ? S.built.map((p, n) => `<button class="card on" data-b="${n}">${esc(S.pool[p])}</button>`).join("")
      : `<span class="muted hint">Toca las tarjetas en orden</span>`}</div>
     <div class="pool">${S.pool.map((t, p) => S.built.includes(p) ? `<span class="card ghostcard">${esc(t)}</span>` : `<button class="card" data-p="${p}">${esc(t)}</button>`).join("")}</div>`;
  $("#choices").innerHTML = S.built.length === S.pool.length ? `<button class="choice check" data-check>Comprobar ✓</button>` : "";
}

function nextQuestion(){
  if (S.i >= S.questions.length){ finishSession(); return; }
  const q = S.questions[S.i], m = inputOf(q);
  $("#playTitle").textContent = q.tag ? `${S.title} · ${q.tag}` : S.title;
  updateProgress();
  $("#qtext").innerHTML = q.text || "";
  $("#qpic").innerHTML = q.picture || "";
  Object.assign(S, { typed:"", shift:false, dead:null, choice:undefined, picked:new Set(), built:[], pool:[] });
  const ans = $("#answer"), board = $("#board"), ch = $("#choices"), kbd = $("#kbd");
  ans.className = "answer"; ans.innerHTML = ""; board.innerHTML = ""; ch.innerHTML = "";
  ans.style.display = m === "text" || m === "gap" ? "" : "none";
  board.style.display = m === "words" || m === "order" ? "" : "none";
  kbd.style.display = m === "text" ? "" : "none";
  ch.className = "choices" + (m === "gap" ? " row" : "");
  if (m === "choice" || m === "gap")
    ch.innerHTML = q.choices.map((c,i) => `<button class="choice" data-c="${i}">${esc(c)}</button>`).join("");
  if (m === "gap") renderGap(q);
  if (m === "text"){
    $("#kxtra").innerHTML = (q.keys || []).map(k => `<button data-k="${esc(k)}" class="k-l">${esc(k)}</button>`).join("");
    renderText();
  }
  if (m === "words"){
    renderWords(q);
    if (!q.one) ch.innerHTML = `<button class="choice check" data-check>Comprobar ✓</button>`;
  }
  if (m === "order"){
    // shuffle the cards, but never show them already in the right order
    const j = q.joiner === undefined ? " " : q.joiner, right = q.items.join(j);
    let pool = q.items.slice();
    for (let t = 0; t < 20 && (pool.join(j) === right) && new Set(q.items).size > 1; t++) pool = L4.shuffle(q.items.slice());
    S.pool = pool;
    renderOrder(q);
  }
  $("#feedback").innerHTML = ""; $("#feedback").className = "feedback";
  $("#cont").innerHTML = "";
  S.busy = false;
  S.start = performance.now();
}

function readGiven(q){
  const m = inputOf(q);
  if (m === "choice" || m === "gap") return S.choice === undefined ? null : S.choice;
  if (m === "text") return L4.tidy(S.typed) === "" ? null : L4.tidy(S.typed);
  if (m === "words") return S.picked.size ? [...S.picked].sort((a, b) => a - b) : null;
  if (m === "order") return S.built.length ? S.built.map(p => S.pool[p]) : null;
  return null;
}
function givenText(q, g){
  if (g === null) return null;
  const m = inputOf(q);
  if (m === "words") return g.map(i => q.words[i]).join(", ");
  if (m === "order") return g.join(q.joiner === undefined ? " " : q.joiner);
  if (m === "gap") return q.gap.replace(/_+/, g);
  return String(g);
}
/* → "ok", "accent" or "wrong" */
function judge(q, g){
  if (g === null) return "wrong";
  if (q.check) return q.check(g) ? "ok" : "wrong";
  const m = inputOf(q);
  if (m === "text"){
    const r = L4.compareText(g, answersOf(q), q.caseSensitive);
    if (r === "accent" && (q.strictAccent || L4.prog.accentsStrict())) return "wrong";
    return r;
  }
  if (m === "words"){
    const want = q.answer.slice().sort((a, b) => a - b);
    return want.length === g.length && want.every((x, i) => x === g[i]) ? "ok" : "wrong";
  }
  if (m === "order") return g.join("\u0001") === q.items.join("\u0001") ? "ok" : "wrong";
  return answersOf(q).includes(g) ? "ok" : "wrong";
}

function submit(){
  if (!S || S.busy) return;
  S.busy = true;
  const q = S.questions[S.i], m = inputOf(q);
  const ms = performance.now() - S.start;
  const given = readGiven(q);
  const result = judge(q, given), ok = result !== "wrong";
  if (S.onAnswer) S.onAnswer(q, ok, ms, given, result);
  if (ok) S.right++;
  S.results.push({ q, given, givenText:givenText(q, given), ok, result, ms });

  // show what was right and wrong
  if (m === "choice" || m === "gap"){
    document.querySelectorAll("#choices .choice").forEach(b => {
      const c = q.choices[+b.dataset.c];
      if (answersOf(q).includes(c) && (c === given || !ok)) b.classList.add("right");
      else if (c === given) b.classList.add("wrongpick");
      b.disabled = true;
    });
    if (m === "gap") renderGap(q, ok ? given : given, ok ? "right" : "wrongpick");
  }
  if (m === "text") $("#answer").classList.add(result === "ok" ? "right" : result === "accent" ? "near" : "wrong");
  if (m === "words"){
    const want = new Set(q.answer);
    document.querySelectorAll("#board .word").forEach(b => {
      const i = +b.dataset.w, on = S.picked.has(i);
      if (want.has(i)) b.classList.add(on ? "right" : "missed");
      else if (on) b.classList.add("wrongpick");
      b.disabled = true;
    });
    $("#choices").innerHTML = "";
  }
  if (m === "order"){
    document.querySelector("#board .built").classList.add(ok ? "right" : "wrong");
    document.querySelectorAll("#board button").forEach(b => { b.disabled = true; });
    $("#choices").innerHTML = "";
  }

  const fb = $("#feedback");
  if (result === "ok"){
    fb.textContent = L4.pick(["✓ ¡Muy bien!", "✓ ¡Correcto!", "✓ ¡Genial!", "✓ ¡Perfecto!", "✓ ¡Estupendo!"]);
    fb.className = "feedback good"; goodSound();
  } else if (result === "accent"){
    const right = answersOf(q).find(a => L4.noAcute(L4.tidy(a)).toLocaleLowerCase("es") === L4.noAcute(given).toLocaleLowerCase("es")) || answersOf(q)[0];
    fb.innerHTML = `≈ Casi: se escribe <b>${esc(right)}</b>. ¡Fíjate en la tilde!`;
    fb.className = "feedback near"; nearSound();
  } else {
    let why = q.explain || `La respuesta es <b>${esc(solutionOf(q))}</b>.`;
    if (m === "text" && L4.compareText(given || "", answersOf(q), q.caseSensitive) === "accent")
      why = `Casi: solo falla la tilde. ${why}`;
    fb.innerHTML = `✗ ${why}`;
    fb.className = "feedback bad"; badSound();
    if (m === "gap") $("#answer").insertAdjacentHTML("beforeend", ` <span class="fix">→ ${esc(solutionOf(q))}</span>`);
  }
  // a wrong answer, or one with an accent slip, comes back a few questions later
  if (result !== "ok" && S.requeue && S.questions.length < S.maxQ && !q.retry)
    S.questions.splice(Math.min(S.questions.length, S.i + 4), 0, Object.assign({}, q, { retry:true }));
  updateProgress();
  if (S.waitOnWrong && result === "wrong"){   // give time to read the rule, then tap "Siguiente"
    S.waiting = true;
    $("#cont").innerHTML = `<button class="btn primary" id="contBtn">Siguiente ▶</button>`;
    return;
  }
  S.i++;
  later(nextQuestion, result === "ok" ? (S.okDelay || 900) : (S.badDelay || 2600));
}
function proceed(){ S.waiting = false; $("#cont").innerHTML = ""; S.i++; nextQuestion(); }

/* ---- typing (on-screen keyboard and a real keyboard) ---- */
const ADD_ACUTE = { a:"á", e:"é", i:"í", o:"ó", u:"ú", A:"Á", E:"É", I:"Í", O:"Ó", U:"Ú" };
const ADD_DIAER = { u:"ü", U:"Ü" };
function type(k){
  if (!S) return;
  if (S.waiting){ if (k === "ok") proceed(); return; }
  if (S.busy) return;
  const q = S.questions[S.i];
  if (inputOf(q) !== "text") return;
  if (k === "ok"){ if (L4.tidy(S.typed) !== "") submit(); return; }
  if (k === "del"){ if (S.dead) S.dead = null; else S.typed = S.typed.slice(0, -1); }
  else if (k === "shift") S.shift = !S.shift;
  else if (k === "acute" || k === "diaer") S.dead = S.dead === k ? null : k;
  else if (S.typed.length < (q.maxLen || 30)){
    let c = k === "space" ? " " : k;
    if (k === "space" && (S.typed === "" || S.typed.endsWith(" "))) c = "";
    if (S.shift && c.length === 1){ c = c.toLocaleUpperCase("es"); S.shift = false; }
    if (S.dead){
      const map = S.dead === "acute" ? ADD_ACUTE : ADD_DIAER;
      c = map[c] || c;                             // ´ before a consonant: the accent is just dropped
      S.dead = null;
    }
    S.typed += c;
  }
  renderText();
}
function choose(i){
  if (!S || S.busy) return;
  const q = S.questions[S.i], m = inputOf(q);
  if ((m !== "choice" && m !== "gap") || i < 0 || i >= q.choices.length) return;
  S.choice = q.choices[i];
  submit();
}
L4.startSession = startSession;
L4.stopSession = stopSession;

/* ---------- wiring ---------- */
$("#kbd").addEventListener("pointerdown", e => {
  const b = e.target.closest("button[data-k]"); if (!b) return;
  e.preventDefault();
  b.classList.add("down"); setTimeout(() => b.classList.remove("down"), 120);
  type(b.dataset.k);
});
$("#choices").addEventListener("click", e => {
  const b = e.target.closest("[data-c]"); if (b){ choose(+b.dataset.c); return; }
  if (e.target.closest("[data-check]") && S && !S.busy && readGiven(S.questions[S.i]) !== null) submit();
});
$("#board").addEventListener("click", e => {
  if (!S || S.busy) return;
  const q = S.questions[S.i], m = inputOf(q);
  const w = e.target.closest("[data-w]");
  if (m === "words" && w){
    const i = +w.dataset.w;
    if (q.one){ S.picked = new Set([i]); submit(); return; }
    if (S.picked.has(i)) S.picked.delete(i); else S.picked.add(i);
    w.classList.toggle("on", S.picked.has(i));
    return;
  }
  const p = e.target.closest("[data-p]"), b = e.target.closest("[data-b]");
  if (m === "order" && p){ S.built.push(+p.dataset.p); renderOrder(q); }
  if (m === "order" && b){ S.built.splice(+b.dataset.b, 1); renderOrder(q); }
});
$("#cont").addEventListener("click", e => { if (e.target.closest("#contBtn") && S && S.waiting) proceed(); });
document.addEventListener("keydown", e => {
  if (!$("#play").classList.contains("active") || !S || e.ctrlKey || e.metaKey || e.altKey) return;
  if (S.waiting){ if (e.key === "Enter"){ e.preventDefault(); proceed(); } return; }
  if (S.busy) return;
  const q = S.questions[S.i], m = inputOf(q);
  if ((m === "choice" || m === "gap") && /^[1-9]$/.test(e.key)){ choose(+e.key - 1); return; }
  if (m === "text"){
    if (e.key === "Enter"){ e.preventDefault(); type("ok"); }
    else if (e.key === "Backspace"){ e.preventDefault(); type("del"); }
    else if (e.key === " "){ e.preventDefault(); type("space"); }
    else if (e.key.length === 1){                   // a real keyboard already makes á, ñ, ü itself
      e.preventDefault();
      const shift = S.shift; S.shift = false;
      type(shift ? e.key.toLocaleUpperCase("es") : e.key);
    }
    return;
  }
  if (e.key === "Enter" && (m === "words" || m === "order") && readGiven(q) !== null){ e.preventDefault(); submit(); }
});
$("#quitBtn").addEventListener("click", () => { stopSession(); if (L4.onQuit) L4.onQuit(); });

/* ---------- offline support (works on https sites such as GitHub Pages) ---------- */
L4.registerOffline = function(path){
  if ("serviceWorker" in navigator && window.isSecureContext){
    window.addEventListener("load", () => { navigator.serviceWorker.register(path).catch(() => {}); });
  }
};
})();
