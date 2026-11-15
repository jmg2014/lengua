/* Tildes (accents), Phase 2 of the roadmap: Units 1–4 of Santillana's 4.º book.
   Words are sorted BY HAND into groups below; tests/skills.html checks every group against the accent rules
   (L4.tonica, L4.tipoAcento, L4.reglaTilde in shared/silabas.js), so a word in the wrong group is caught.
   Words whose accent-less spelling is a real word (papá/papa, médico/medico, inglés/ingles…) are left out of the
   "¿lleva tilde?" questions, so the child is never told a real word is wrong. */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, esc } = L4;
const list = s => s.trim().split(/\s+/);

const W = {
  agudaT:list("camión ratón sofá café jabón balón avión canción corazón limón melón botón cajón autobús menú allí aquí colibrí bambú champú sillón jamón también después detrás jardín delfín calcetín violín cojín sartén tazón dragón ciclón pulmón"),
  aguda:list("reloj papel pared ciudad verdad color calor señor mujer comer vivir jugar feliz nariz arroz animal hospital azul total sabor motor doctor cristal profesor español estoy jersey"),
  llanaT:list("árbol lápiz fácil difícil útil azúcar cárcel césped débil móvil túnel fútbol carácter cráter álbum huésped"),
  llana:list("casa mesa perro libro ventana zapato martes lunes joven examen imagen mochila pelota escuela cuaderno camino amigo verano montaña tortuga elefante flores cosas"),
  esdrujula:list("pájaro música sábado plátano lámpara teléfono brújula película cámara murciélago matemáticas miércoles océano pirámide rápido fantástico mágico árboles exámenes jóvenes imágenes águila brócoli")
};
/* words that are fine to classify but where a wrong way of writing them is a real word, so they are not used for
   "¿lleva tilde?": lampara, caminó, libró, amigó, veranó, arboles are verb forms, and futbol is also accepted by the RAE */
const NOT_FOR_RULE = new Set(["lámpara", "camino", "libro", "amigo", "verano", "árboles", "fútbol"]);
const ALL = [...W.agudaT, ...W.aguda, ...W.llanaT, ...W.llana, ...W.esdrujula];
const WITH_TILDE = [...W.agudaT, ...W.llanaT, ...W.esdrujula];
const NO_TILDE = [...W.aguda, ...W.llana];

const sil = w => L4.silabas(w);
const showSyl = (w, mark) => sil(w).map((s, i) => i === mark ? `<b>${esc(s)}</b>` : esc(s)).join("-");
const why = w => {
  const t = L4.tipoAcento(w), k = L4.tonica(w), last = w.slice(-1), has = /[áéíóú]/.test(w);
  const ending = "aeiouáéíóú".includes(last) ? "en vocal" : last === "n" ? "en n" : last === "s" ? "en s" : `en ${last}`;
  const rule = t === "aguda" ? `Las agudas llevan tilde si acaban en vocal, n o s; <b>${esc(w)}</b> acaba ${ending}`
             : t === "llana" ? `Las llanas llevan tilde si NO acaban en vocal, n ni s; <b>${esc(w)}</b> acaba ${ending}`
             : "Las esdrújulas llevan tilde siempre";
  return `${showSyl(w, k)}: es <b>${t}</b>. ${rule}, así que <b>${has ? "lleva tilde" : "no lleva tilde"}</b>.`;
};

/* ---------- sílabas ---------- */
const SYL_NAME = ["", "monosílaba", "bisílaba", "trisílaba", "polisílaba"];
const sylWords = [...new Set([...ALL, ...L4.WORDS.nouns.map(n => n.w)])];
const silabas = {
  id:"ti-silabas", name:"Sílabas", emoji:"👏",
  desc:"Separar las palabras en sílabas, como dando palmadas.",
  rule:`Una <b>sílaba</b> es cada golpe de voz de una palabra: ma-ri-po-sa (4 palmadas).
    <ul><li>Cada sílaba tiene al menos una vocal.</li>
    <li>Una consonante entre dos vocales va con la segunda: ca-sa.</li>
    <li><b>ch</b>, <b>ll</b>, <b>rr</b> no se separan: co-che, ca-lle, pe-rro.</li>
    <li>Por el número de sílabas: <b>monosílabas</b> (1: sol), <b>bisílabas</b> (2: ca-sa), <b>trisílabas</b> (3: za-pa-to) y <b>polisílabas</b> (4 o más).</li></ul>`,
  levels:[
    { name:"¿Cuántas sílabas?", desc:"Cuenta las sílabas" },
    { name:"¿Cómo se separa?", desc:"Elige la separación correcta" },
    { name:"Sepáralas tú", desc:"Escribe la palabra separada en sílabas" }
  ],
  words:sylWords,
  make(level){
    const w = pick(sylWords), s = sil(w), n = s.length;
    if (level === 1){
      const name = SYL_NAME[Math.min(n, 4)], label = k => `${k}${k >= 4 ? " o más" : ""} (${SYL_NAME[k]})`;
      return { input:"choice", text:`¿Cuántas sílabas tiene <b>${esc(w)}</b>?`, choices:[1, 2, 3, 4].map(label), answer:label(Math.min(n, 4)),
        explain:`<b>${s.join("-")}</b>: ${n} sílaba${n > 1 ? "s" : ""}, es <b>${name}</b>.`, key:"sy1" + w };
    }
    if (level === 2){
      if (n < 2) return this.make(2);
      // wrong splits: move one boundary one letter left or right
      const right = s.join("-"), wrong = new Set();
      for (let t = 0; t < 30 && wrong.size < 2; t++){
        const k = 1 + Math.floor(Math.random() * (n - 1)), shift = Math.random() < .5 ? -1 : 1;
        const parts = s.slice();
        if (shift < 0 && parts[k - 1].length > 1){ parts[k] = parts[k - 1].slice(-1) + parts[k]; parts[k - 1] = parts[k - 1].slice(0, -1); }
        else if (shift > 0 && parts[k].length > 1){ parts[k - 1] += parts[k][0]; parts[k] = parts[k].slice(1); }
        const j = parts.join("-");
        if (j !== right && parts.every(x => /[aeiouáéíóúü]/i.test(x))) wrong.add(j);   // every piece keeps a vowel: no easy give-aways
      }
      if (!wrong.size) return this.make(2);
      return { input:"choice", text:`¿Cómo se separa <b>${esc(w)}</b> en sílabas?`, choices:shuffle([right, ...wrong]), answer:right,
        explain:`Se separa así: <b>${right}</b>.`, key:"sy2" + w };
    }
    return { input:"text", keys:["-"], text:`Separa en sílabas con guiones: <b>${esc(w)}</b>`, answer:s.join("-"), explain:`Se separa así: <b>${s.join("-")}</b>.`, key:"sy3" + w };
  }
};

/* ---------- sílaba tónica ---------- */
const tonica = {
  id:"ti-tonica", name:"Sílaba tónica", emoji:"📢",
  desc:"La sílaba que suena más fuerte.",
  rule:`La <b>sílaba tónica</b> es la que suena más fuerte: ra-<b>tón</b>, <b>me</b>-sa, <b>pá</b>-ja-ro.
    Las demás son <b>átonas</b>. Truco: di la palabra como si llamaras a alguien desde lejos.
    Si una sílaba lleva tilde, esa es la tónica.`,
  levels:[
    { name:"Con tilde", desc:"Palabras con tilde: la tilde te ayuda" },
    { name:"Sin tilde", desc:"Palabras sin tilde" },
    { name:"Todas", desc:"Palabras con y sin tilde, más largas" }
  ],
  make(level){
    const pool = level === 1 ? WITH_TILDE : level === 2 ? NO_TILDE : ALL.filter(w => sil(w).length >= 3);
    const w = pick(pool), s = sil(w), k = L4.tonica(w);
    const q = { input:"words", one:true, text:`Toca la <b>sílaba tónica</b> de <b>${esc(w)}</b>:`, words:s, answer:[k],
      explain:`En <b>${esc(w)}</b> suena más fuerte <b>${esc(s[k])}</b>: ${showSyl(w, k)}.`, solution:showSyl(w, k).replace(/<\/?b>/g, ""), key:"to" + level + w };
    if (L4.canSpeak()) q.say = w;
    return q;
  }
};

/* ---------- aguda, llana o esdrújula ---------- */
const TYPES = ["aguda", "llana", "esdrújula"];
const clase = {
  id:"ti-clase", name:"Agudas, llanas y esdrújulas", emoji:"🎯",
  desc:"Según dónde está la sílaba tónica.",
  rule:`Contando desde el final:
    <ul><li><b>Aguda</b>: la tónica es la <b>última</b> sílaba (ra-<b>tón</b>, re-<b>loj</b>).</li>
    <li><b>Llana</b>: la tónica es la <b>penúltima</b> (<b>me</b>-sa, <b>ár</b>-bol).</li>
    <li><b>Esdrújula</b>: la tónica es la <b>antepenúltima</b> (<b>pá</b>-ja-ro).</li></ul>`,
  levels:[
    { name:"Con tilde", desc:"La tilde te dice cuál es la tónica" },
    { name:"Sin tilde", desc:"Busca tú la sílaba tónica" },
    { name:"Todas", desc:"Mezcla de todas" }
  ],
  make(level){
    const pool = level === 1 ? WITH_TILDE : level === 2 ? NO_TILDE : ALL;
    const w = pick(pool), t = L4.tipoAcento(w), k = L4.tonica(w);
    const q = { input:"choice", text:`La palabra <b>${esc(w)}</b>, ¿es aguda, llana o esdrújula?`, choices:TYPES.slice(), answer:t,
      explain:`${showSyl(w, k)}: la tónica es la ${["antepenúltima", "penúltima", "última"][2 - (sil(w).length - 1 - k)]} sílaba, así que es <b>${t}</b>.`, key:"cl" + level + w };
    if (L4.canSpeak()) q.say = w;
    return q;
  }
};

/* ---------- ¿lleva tilde? (once this skill has its ⭐, accents count everywhere in the app) ---------- */
const RULE_WORDS = { 1:[...W.agudaT, ...W.aguda], 2:[...W.llanaT, ...W.llana], 3:ALL };
const forRule = lv => RULE_WORDS[lv].filter(w => !NOT_FOR_RULE.has(w));
/* the wrong ways to write a word: without its accent, with an accent it doesn't need, or on the wrong syllable */
function wrongForms(w){
  const out = new Set(), k = L4.tonica(w), n = sil(w).length;
  if (/[áéíóú]/.test(w)) out.add(L4.sinTilde(w));
  else { const a = L4.conTildeEn(w, k); if (a) out.add(a); }
  for (let j = 0; j < n; j++) if (j !== k){ const a = L4.conTildeEn(w, j); if (a) out.add(a); }
  out.delete(w);
  return [...out];
}
const regla = {
  id:"ti-regla", name:"¿Lleva tilde?", emoji:"✍️",
  desc:"Las reglas de la tilde. Cuando consigas la ⭐, ¡las tildes contarán en toda la app!",
  rule:`<ul><li><b>Agudas</b>: llevan tilde si acaban en <b>vocal, n o s</b> (sofá, camión, autobús). Reloj, papel: no.</li>
    <li><b>Llanas</b>: llevan tilde si <b>no</b> acaban en vocal, n ni s (árbol, lápiz). Mesa, joven: no.</li>
    <li><b>Esdrújulas</b>: llevan tilde <b>siempre</b> (pájaro, música).</li></ul>
    Primero busca la sílaba tónica, luego mira cómo acaba la palabra.`,
  levels:[
    { name:"Agudas", desc:"¿Lleva tilde esta palabra aguda?" },
    { name:"Llanas", desc:"¿Lleva tilde esta palabra llana?" },
    { name:"Todas", desc:"Escribe la palabra con o sin tilde" }
  ],
  wrongForms, ruleWords:() => [...new Set([...forRule(1), ...forRule(2), ...forRule(3)])],
  make(level){
    const w = pick(forRule(level));
    if (level < 3){
      const wrongs = wrongForms(w), main = /[áéíóú]/.test(w) ? L4.sinTilde(w) : L4.conTildeEn(w, L4.tonica(w));
      const others = wrongs.filter(x => x !== main);
      const choices = shuffle([w, main, ...(others.length && Math.random() < .5 ? [pick(others)] : [])]);
      return { input:"choice", text:"¿Cuál está bien escrita?", choices, answer:w, explain:why(w), key:"re" + level + w, wrongs:choices.filter(c => c !== w) };
    }
    const q = { input:"text", strictAccent:true, text:`Escribe <b>${esc(L4.sinTilde(w))}</b> poniendo la tilde si la lleva:`, answer:w, explain:why(w),
      key:"re3" + w, wrongs:wrongForms(w) };
    if (L4.canSpeak()) q.say = w;
    return q;
  }
};

/* ---------- diptongos e hiatos ---------- */
const DIPTONGO = list("cuento piano aire auto peine jaula fuego ciudad nieve cielo agua huevo tierra puerta bueno siete viaje cuadro ruido cuidado reina boina aula");
const HIATO = list("día río país maíz baúl tío leer poeta león océano caer frío sandía reír oído teatro museo héroe tranvía todavía energía panadería");
/* hiatus words with í or ú whose accent-less form is not a real word: used for "¿lleva tilde?" (not río, frío, sandía: rio, frio, sandia are real words) */
const HIATO_TILDE = list("día país maíz baúl tío oído tranvía todavía energía panadería");
const V = "aeiouáéíóúü";
function firstPair(w){
  for (let i = 0; i < w.length - 1; i++){
    if (V.includes(w[i]) && V.includes(w[i + 1]) && !(w[i] === "u" && i > 0 && "qg".includes(w[i - 1]))) return i;
  }
  return -1;
}
const showPair = w => { const i = firstPair(w); return esc(w.slice(0, i)) + `<b class="vv">${esc(w.slice(i, i + 2))}</b>` + esc(w.slice(i + 2)); };
const isHiato = w => { const i = firstPair(w); let pos = 0; for (const s of sil(w)){ pos += s.length; if (pos === i + 1) return true; } return false; };
const diptongo = {
  id:"ti-diptongo", name:"Diptongos e hiatos", emoji:"🔗",
  desc:"Dos vocales juntas: ¿en la misma sílaba o separadas?",
  rule:`Las vocales <b>a, e, o</b> son <b>abiertas</b> y las <b>i, u</b> son <b>cerradas</b>.
    <ul><li><b>Diptongo</b>: dos vocales juntas en la <b>misma sílaba</b>: una abierta y una cerrada, o dos cerradas (<b>cue</b>-to, <b>ciu</b>-dad).</li>
    <li><b>Hiato</b>: dos vocales juntas en <b>sílabas distintas</b>: dos abiertas (le-<b>ón</b>, po-<b>e</b>-ta),
      o una cerrada que suena fuerte, que lleva tilde <b>siempre</b> (dí-a, pa-ís, ba-úl).</li></ul>`,
  levels:[
    { name:"¿Diptongo o hiato?", desc:"Mira las dos vocales marcadas" },
    { name:"Busca el hiato", desc:"Toca la palabra que tiene hiato" },
    { name:"La tilde del hiato", desc:"día, país, baúl: ¿con o sin tilde?" }
  ],
  lists:{ DIPTONGO, HIATO, HIATO_TILDE }, isHiato,
  make(level){
    if (level === 1){
      const h = Math.random() < .5, w = pick(h ? HIATO : DIPTONGO);
      return { input:"choice", text:`En <b>${showPair(w)}</b>, las vocales marcadas forman…`, choices:["diptongo", "hiato"], answer:h ? "hiato" : "diptongo",
        explain:`<b>${sil(w).join("-")}</b>: las vocales están ${h ? "en sílabas distintas: es un <b>hiato</b>" : "en la misma sílaba: es un <b>diptongo</b>"}.`, key:"di1" + w };
    }
    if (level === 2){
      const h = pick(HIATO), others = sample(DIPTONGO, 3), words = shuffle([h, ...others]);
      return { input:"words", one:true, text:"Toca la palabra que tiene un <b>hiato</b>:", words, answer:[words.indexOf(h)],
        explain:`<b>${sil(h).join("-")}</b> tiene hiato: sus vocales están en sílabas distintas. Las demás tienen diptongo: ${others.map(o => sil(o).join("-")).join(", ")}.`,
        solution:h, key:"di2" + h };
    }
    const w = pick(HIATO_TILDE), bare = L4.sinTilde(w);
    return { input:"choice", text:"¿Cuál está bien escrita?", choices:shuffle([w, bare]), answer:w,
      explain:`<b>${sil(w).join("-")}</b>: la <b>í</b> o la <b>ú</b> suena fuerte y se separa de la otra vocal (hiato), así que lleva tilde siempre.`,
      key:"di3" + w, wrongs:[bare] };
  }
};

/* ---------- tilde diacrítica: tú/tu, él/el… ---------- */
const PAIRS = {
  tu:{ forms:["tú", "tu"], why:"<b>tú</b> con tilde es la persona (tú eres, tú vienes); <b>tu</b> sin tilde va delante de una cosa (tu mochila)." },
  el:{ forms:["él", "el"], why:"<b>él</b> con tilde es la persona (él juega, para él); <b>el</b> sin tilde va delante de un nombre (el perro)." },
  mi:{ forms:["mí", "mi"], why:"<b>mí</b> con tilde va después de para, a, de… (para mí); <b>mi</b> sin tilde va delante de una cosa (mi casa)." },
  si:{ forms:["sí", "si"], why:"<b>sí</b> con tilde es la respuesta afirmativa (¡sí!); <b>si</b> sin tilde pone una condición (si llueve…) o pregunta (no sé si…)." },
  te:{ forms:["té", "te"], why:"<b>té</b> con tilde es la bebida; <b>te</b> sin tilde acompaña a un verbo (te quiero, te llamo)." },
  esta:{ forms:["está", "esta"], why:"<b>está</b> con tilde es el verbo estar (está en casa); <b>esta</b> sin tilde va delante de una cosa (esta mochila)." },
  que:{ forms:["qué", "que"], why:"<b>qué</b> lleva tilde cuando pregunta o exclama (¿qué hora es?, ¡qué bonito!); si no, <b>que</b> va sin tilde." },
  como:{ forms:["cómo", "como"], why:"<b>cómo</b> lleva tilde cuando pregunta o exclama (¿cómo te llamas?, no sé cómo…); <b>como</b> sin tilde compara (como un león) o es del verbo comer." },
  donde:{ forms:["dónde", "donde"], why:"<b>dónde</b> lleva tilde cuando pregunta (¿dónde vives?, no sé dónde…); si no, <b>donde</b> va sin tilde (la casa donde vivo)." },
  cuando:{ forms:["cuándo", "cuando"], why:"<b>cuándo</b> lleva tilde cuando pregunta (¿cuándo vienes?); si no, <b>cuando</b> va sin tilde (cuando llegue…)." }
};
/* "_" is the gap; the word after "=" is the right answer. Written and checked by hand. */
const DIA = [
  ["tu", ["_ eres mi mejor amigo.=tú", "¿Dónde está _ mochila?=tu", "¿Quieres venir _ también?=tú", "_ hermano juega al fútbol.=tu", "Me gusta mucho _ dibujo.=tu", "Hoy friegas _ los platos.=tú"]],
  ["el", ["_ perro de mi vecino es muy grande.=el", "Este regalo es para _.=él", "_ siempre llega tarde al colegio.=él", "Me encanta _ chocolate.=el", "Mi hermano dice que _ no ha sido.=él", "Desde la ventana vemos _ mar.=el"]],
  ["mi", ["Este libro es para _.=mí", "_ abuela hace pasteles riquísimos.=mi", "A _ me gusta la playa.=mí", "He perdido _ lápiz rojo.=mi", "¿Ese regalo es para _?=mí", "_ casa está cerca del parque.=mi"]],
  ["si", ["¿Quieres helado? ¡_, por favor!=sí", "_ llueve, nos quedamos en casa.=si", "Le pregunté _ quería jugar.=si", "¿Vienes? Mi madre ha dicho que _.=sí", "_ estudias, aprenderás mucho.=si"]],
  ["te", ["Mi abuela toma _ con leche.=té", "_ espero en la puerta.=te", "¿_ gusta el chocolate?=te", "Este _ está muy caliente.=té", "Mañana _ llamo por teléfono.=te"]],
  ["esta", ["Mi madre _ en la cocina.=está", "_ mochila es nueva.=esta", "¿Dónde _ el gato?=está", "Me gusta mucho _ canción.=esta", "La sopa _ muy caliente.=está", "_ tarde vamos al cine.=esta"]],
  ["que", ["¿_ hora es?=qué", "Creo _ va a llover.=que", "¡_ bonito es tu dibujo!=qué", "El niño _ vive al lado es mi amigo.=que", "¿_ has comido hoy?=qué", "Mi padre dice _ es tarde.=que"]],
  ["como", ["¿_ te llamas?=cómo", "Corre _ un guepardo.=como", "¡_ llueve hoy!=cómo", "Mañana _ en casa de mis abuelos.=como", "No sé _ se hace este ejercicio.=cómo"]],
  ["donde", ["¿_ vives?=dónde", "Esta es la casa _ nací.=donde", "¿_ están mis zapatillas?=dónde", "Vamos al parque _ juegan mis amigos.=donde", "No sé _ he dejado las llaves.=dónde"]],
  ["cuando", ["¿_ es tu cumpleaños?=cuándo", "_ llegue a casa, haré los deberes.=cuando", "¿_ vamos a la playa?=cuándo", "Me pongo contento _ veo a mis abuelos.=cuando"]]
];
const DIA_LEVEL = { 1:["tu", "el", "mi"], 2:["si", "te", "esta"], 3:["que", "como", "donde", "cuando"] };
const cap = s => s[0].toLocaleUpperCase("es") + s.slice(1);
const diacritica = {
  id:"ti-diacritica", name:"tú o tu, él o el…", emoji:"🎭",
  desc:"Palabras que se escriben igual y la tilde las distingue.",
  rule:`Algunas palabras cortas llevan tilde para no confundirlas con otras que se escriben igual:
    <ul><li><b>tú</b> eres / <b>tu</b> mochila · <b>él</b> juega / <b>el</b> perro · para <b>mí</b> / <b>mi</b> casa</li>
    <li>¡<b>sí</b>! / <b>si</b> llueve · un <b>té</b> / <b>te</b> quiero · <b>está</b> en casa / <b>esta</b> mochila</li>
    <li><b>qué, cómo, dónde, cuándo</b> llevan tilde cuando preguntan o exclaman: ¿<b>dónde</b> vives? / la casa <b>donde</b> vivo.</li></ul>`,
  levels:[
    { name:"tú, él, mí", desc:"tú/tu, él/el, mí/mi" },
    { name:"sí, té, está", desc:"sí/si, té/te, está/esta" },
    { name:"qué, cómo, dónde, cuándo", desc:"Cuando preguntan o exclaman" }
  ],
  sentences:DIA,
  make(level){
    const id = pick(DIA_LEVEL[level]), [, sents] = DIA.find(d => d[0] === id), P = PAIRS[id];
    const [s, ans] = pick(sents).split("=");
    const atStart = /^[¿¡]?_/.test(s);
    const show = f => atStart ? cap(f) : f;
    const [a, b] = s.split("_");
    return { input:"choice", text:`${esc(a)}<b>___</b>${esc(b)}`, choices:P.forms.map(show), answer:show(ans),
      explain:`${esc(a)}<b>${esc(show(ans))}</b>${esc(b)}<br>${P.why}`, solution:a + show(ans) + b, key:"dc" + s };
  }
};

L4.TOPICS.push({ id:"tildes", title:"Tildes", emoji:"Á", skills:[silabas, tonica, clase, regla, diptongo, diacritica], W, NOT_FOR_RULE });
})();
