/* A topic page: one tab per skill, a rule card ("Recuerda"), 3 levels per skill, a ⭐ for passing level 3.
   Each topic folder has a skills.js that adds a topic to L4.TOPICS:
     { id, title, emoji, skills:[ { id, name, emoji, desc, rule, levels:[{name, desc} ×3], make(level) → question } ] }
   rule is a short HTML explanation of the rule, shown before playing (there is no teacher to explain it).
   index.html calls L4.openTopic(id). */
(function(){
"use strict";
const L4 = window.L4, $ = L4.$, P = L4.prog;
const ROUND = 10, PASS = 8;
let T = null, cur = null;

function tabKey(){ return "lengua4-tab-" + T.id; }
function remember(){ try { localStorage.setItem(tabKey(), cur.id); } catch(e){} }
function recall(){ try { return localStorage.getItem(tabKey()); } catch(e){ return null; } }

L4.openTopic = function(id){
  T = L4.TOPICS.find(t => t.id === id);
  document.title = T.title + " · Lengua 4.º";
  document.body.insertAdjacentHTML("afterbegin", `
<section id="topic" class="screen active">
  <div class="top"><h1>${T.emoji} ${T.title}</h1>
    <div class="topbtns"><button id="soundBtn" class="ghost" aria-label="Sonido sí o no"></button><a class="ghost" href="../">🏠 Inicio</a></div></div>
  <div class="tabs" id="tabs"></div>
  <div id="skillPanel" class="panel"></div>
</section>`);
  // a link like ortografia/#or-bv opens that skill's tab (used by the curriculum map)
  cur = T.skills.find(s => s.id === location.hash.slice(1)) || T.skills.find(s => s.id === recall()) || T.skills[0];
  L4.onQuit = renderTopic;
  $("#tabs").addEventListener("click", e => {
    const b = e.target.closest("[data-s]"); if (!b) return;
    cur = T.skills.find(s => s.id === b.dataset.s); remember(); renderTopic();
  });
  $("#skillPanel").addEventListener("click", e => {
    const b = e.target.closest("[data-l]"); if (b && !b.disabled) start(cur, +b.dataset.l);
  });
  $("#soundBtn").addEventListener("click", () => { P.sound = !P.sound; renderTopic(); });
  renderTopic();
  L4.registerOffline("../sw.js");
};

function renderTopic(){
  L4.stopSession();
  $("#soundBtn").textContent = P.sound ? "🔊" : "🔇";
  $("#tabs").innerHTML = T.skills.map(s => {
    const r = P.peek(s.id);
    return `<button class="tab ${s === cur ? "on" : ""}" data-s="${s.id}">${s.emoji} ${s.name}${r && r.star ? " ⭐" : ""}</button>`;
  }).join("");
  const st = P.skill(cur.id);
  const acc = st.seen ? Math.round(st.correct / st.seen * 100) : 0;
  $("#skillPanel").innerHTML = `<h2>${cur.emoji} ${cur.name} ${st.star ? "⭐" : ""}</h2>
    <p class="muted">${cur.desc}</p>
    ${cur.rule ? `<details class="rule" ${st.seen ? "" : "open"}><summary>📘 Recuerda</summary><div>${cur.rule}</div></details>` : ""}
    <div class="llist">${cur.levels.map((L, i) => {
      const n = i + 1, locked = n > st.level, done = n < st.level || (n === 3 && st.star);
      return `<button class="lbtn" data-l="${n}" ${locked ? "disabled" : ""}><b>${locked ? "🔒" : done ? "✅" : n + "."} ${L.name}</b><small>${L.desc}</small></button>`;
    }).join("")}</div>
    <p class="muted">${st.star ? "⭐ ¡Dominado! Juega al nivel 3 de vez en cuando para no olvidarlo."
                               : `Acierta ${PASS} de ${ROUND} para desbloquear el siguiente nivel. Supera el nivel 3 para ganar una ⭐.`}
       ${st.seen ? `<br>${st.seen} respuestas hasta ahora · ${acc}% bien` : ""}</p>`;
  L4.show("topic");
}

function makeRound(skill, lv){
  const qs = [], seen = new Set();
  for (let g = 0; qs.length < ROUND && g < 300; g++){
    const q = skill.make(lv), k = q.key || (q.text || "") + "|" + (q.gap || "") + "|" + (q.words || q.items || []).join(" ");
    if (seen.has(k) && g < 200) continue;          // avoid repeats when possible
    seen.add(k); qs.push(q);
  }
  return qs;
}
L4.makeRound = makeRound;

function start(skill, lv){
  let questions;
  try { questions = makeRound(skill, lv); }
  catch(e){    // usually old and new files mixed up after an update: say so instead of doing nothing
    $("#skillPanel").insertAdjacentHTML("afterbegin",
      `<p class="feedback bad" style="margin-top:0">Esta página necesita actualizarse. Cierra la app del todo y ábrela otra vez con wifi.</p>`);
    return;
  }
  L4.startSession({ title:`${skill.name} · Nivel ${lv}`, questions,
    requeue:true, maxQ:ROUND + 4, waitOnWrong:true,
    onAnswer:(q, ok, ms) => P.record(skill.id, ok, ms),
    onFinish:res => finish(skill, lv, res) });
}

function finish(skill, lv, res){
  const score = res.filter(r => !r.q.retry && r.ok).length;   // second tries don't count towards the score
  const pass = score >= PASS;
  const st = P.skill(skill.id);
  let title, msg, celebrate = false;
  if (pass){
    if (lv < 3){
      const fresh = st.level < lv + 1;
      if (fresh) st.level = lv + 1;
      title = "¡Nivel superado! 🎉"; msg = fresh ? `Ya puedes jugar al nivel ${lv + 1}.` : "¡Muy bien!";
    } else {
      const first = !st.star; st.star = true; celebrate = true;
      title = `¡${skill.name} dominado! ⭐`; msg = first ? "¡Has ganado una estrella!" : "Sigues teniendo tu estrella. ¡Genial!";
    }
  } else {
    title = "¡Casi lo tienes!";
    msg = `Necesitas ${PASS} o más para superarlo. Mira las de abajo y vuelve a intentarlo.`;
  }
  P.save();
  const btns = [];
  if (pass && lv < 3) btns.push(["Siguiente nivel ▶", () => start(skill, lv + 1), "primary"]);
  btns.push([pass ? "Jugar otra vez" : "Intentarlo otra vez", () => start(skill, lv), (pass && lv < 3) ? "" : "primary"]);
  btns.push([`Volver a ${T.title}`, renderTopic, ""]);
  btns.push(["Inicio", () => { location.href = "../"; }, ""]);
  L4.showResults({ title, score:`${score} / ${ROUND}`, msg, missed:res.filter(r => !r.ok), buttons:btns, celebrate });
}
})();
