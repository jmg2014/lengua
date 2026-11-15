/* Gramática, Phase 3 of the roadmap.
   A small sentence maker builds sentences where every word carries its class (D determinante, N sustantivo,
   ADJ adjetivo, V verbo, P preposición, ADV adverbio, PRON pronombre), with agreement worked out from the gender
   and number of the noun. Most skills ask questions about those sentences; sentence types, prepositions in context
   and pronoun substitutions are written by hand.
   tests/skills.html re-checks agreement independently, and every word goes through the dictionary check. */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, rnd, esc } = L4;
const cap = s => s[0].toLocaleUpperCase("es") + s.slice(1);

/* ---------- plurals, following the accent rules ----------
   vowel → +s (casa → casas, sofá → sofás); consonant → +es (flor → flores); z → ces (lápiz → lápices);
   the stress stays on the same syllable, so the accent may go (camión → camiones) or appear (joven → jóvenes). */
function plural(w){
  const last = w.slice(-1);
  if ("aeiouáéó".includes(last)) return w + "s";
  if ("íú".includes(last)) return w + "s";               // menú → menús (colibrí → colibríes is also right, not asked)
  const k = L4.tonica(w);
  let p = L4.sinTilde(w);
  p = last === "z" ? p.slice(0, -1) + "ces" : p + "es";
  return L4.tonica(p) === k ? p : L4.conTildeEn(p, k);
}
L4.plural = plural;

/* ---------- regular verbs ---------- */
const VERBS = {
  ar:["cantar", "bailar", "saltar", "nadar", "pintar", "caminar", "dibujar", "escuchar", "hablar", "mirar", "ayudar", "estudiar", "trabajar", "cocinar", "lavar", "preparar", "viajar"],
  er:["comer", "beber", "correr", "aprender", "barrer", "vender", "comprender", "responder", "romper"],
  ir:["escribir", "vivir", "subir", "abrir", "recibir", "decidir", "compartir", "partir"]
};
const ENDINGS = {
  presente:{ ar:["o", "as", "a", "amos", "áis", "an"], er:["o", "es", "e", "emos", "éis", "en"], ir:["o", "es", "e", "imos", "ís", "en"] },
  "pretérito perfecto simple":{ ar:["é", "aste", "ó", "amos", "asteis", "aron"], er:["í", "iste", "ió", "imos", "isteis", "ieron"], ir:["í", "iste", "ió", "imos", "isteis", "ieron"] },
  "pretérito imperfecto":{ ar:["aba", "abas", "aba", "ábamos", "abais", "aban"], er:["ía", "ías", "ía", "íamos", "íais", "ían"], ir:["ía", "ías", "ía", "íamos", "íais", "ían"] },
  futuro:{ ar:["é", "ás", "á", "emos", "éis", "án"], er:["é", "ás", "á", "emos", "éis", "án"], ir:["é", "ás", "á", "emos", "éis", "án"] }
};
const TENSE_TIME = { presente:"presente", "pretérito perfecto simple":"pasado", "pretérito imperfecto":"pasado", futuro:"futuro" };
const PERSONS = ["yo", "tú", "él / ella", "nosotros", "vosotros", "ellos / ellas"];
const PERSON_NAME = ["1.ª persona del singular", "2.ª persona del singular", "3.ª persona del singular", "1.ª persona del plural", "2.ª persona del plural", "3.ª persona del plural"];
const group = inf => inf.slice(-2);
function conj(inf, tense, p){
  const g = group(inf), e = ENDINGS[tense][g][p];
  return tense === "futuro" ? inf + e : inf.slice(0, -2) + e;
}
L4.conj = conj;
const ALL_FORMS = [];
for (const g of Object.keys(VERBS)) for (const inf of VERBS[g]) for (const t of Object.keys(ENDINGS)) for (let p = 0; p < 6; p++) ALL_FORMS.push({ inf, t, p, f:conj(inf, t, p) });
/* a form is only asked about if it can't be read as another tense or person (cantamos is present AND past; cantaba is yo AND él) */
const formsOf = f => ALL_FORMS.filter(x => x.f === f.f);
const uniqueTense = f => formsOf(f).every(x => TENSE_TIME[x.t] === TENSE_TIME[f.t]);
const uniquePerson = f => formsOf(f).every(x => x.p === f.p);

/* ---------- determiners ---------- */
const DETS = {
  artículo:[["el", "la", "los", "las"], ["un", "una", "unos", "unas"]],
  demostrativo:[["este", "esta", "estos", "estas"], ["ese", "esa", "esos", "esas"], ["aquel", "aquella", "aquellos", "aquellas"]],
  posesivo:[["mi", "mi", "mis", "mis"], ["tu", "tu", "tus", "tus"], ["su", "su", "sus", "sus"], ["nuestro", "nuestra", "nuestros", "nuestras"]],
  numeral:[[null, null, "dos", "dos"], [null, null, "tres", "tres"], [null, null, "cuatro", "cuatro"]],
  indefinido:[[null, null, "algunos", "algunas"], [null, null, "varios", "varias"], [null, null, "muchos", "muchas"], [null, null, "pocos", "pocas"]]
};
const slot = (g, pl) => (g === "f" ? 1 : 0) + (pl ? 2 : 0);
const DET_TYPE = {};
for (const [type, sets] of Object.entries(DETS)) for (const set of sets) for (const f of set) if (f) DET_TYPE[f] = type;
function det(g, pl, types){
  for (let t = 0; t < 50; t++){
    const type = pick(types || Object.keys(DETS)), set = pick(DETS[type]), f = set[slot(g, pl)];
    if (f) return { w:f, c:"D", type, set };
  }
  return { w:DETS.artículo[0][slot(g, pl)], c:"D", type:"artículo", set:DETS.artículo[0] };
}

/* ---------- nouns and adjectives for subjects ---------- */
const PEOPLE = [["niño", "niña"], ["abuelo", "abuela"], ["hermano", "hermana"], ["amigo", "amiga"], ["vecino", "vecina"], ["profesor", "profesora"], ["primo", "prima"]];
const ANIMALS = [["perro", "m"], ["gato", "m"], ["caballo", "m"], ["conejo", "m"], ["ratón", "m"], ["elefante", "m"], ["oveja", "f"], ["vaca", "f"], ["tortuga", "f"], ["rana", "f"], ["jirafa", "f"]];
const ADJ_PEOPLE = [["alto", "alta"], ["bajo", "baja"], ["simpático", "simpática"], ["divertido", "divertida"], ["contento", "contenta"], ["triste", "triste"], ["feliz", "feliz"]];
const ADJ_ANIMALS = [["grande", "grande"], ["pequeño", "pequeña"], ["blanco", "blanca"], ["negro", "negra"], ["bonito", "bonita"], ["viejo", "vieja"], ["lento", "lenta"], ["feliz", "feliz"]];
const adjForm = (a, g, pl) => { const s = g === "f" ? a[1] : a[0]; return pl ? plural(s) : s; };

/* predicates: "C:word" pairs; the verb is "V:sg/pl" */
const PRED_PEOPLE = [
  "V:lee/leen D:un N:libro", "V:escribe/escriben D:una N:carta", "V:canta/cantan D:una N:canción", "V:juega/juegan P:en D:el N:parque",
  "V:vive/viven ADV:cerca", "V:baila/bailan ADV:muy ADV:bien", "V:come/comen D:una N:manzana", "V:estudia/estudian P:en D:la N:biblioteca",
  "V:llega/llegan ADV:tarde", "V:corre/corren ADV:deprisa", "V:pinta/pintan D:un N:dibujo", "V:habla/hablan P:con D:sus N:amigos",
  "V:camina/caminan P:por D:la N:calle", "V:trabaja/trabajan P:en D:una N:tienda"
];
const PRED_ANIMALS = [
  "V:corre/corren P:por D:el N:campo", "V:come/comen ADV:despacio", "V:duerme/duermen P:en D:el N:jardín", "V:juega/juegan P:con D:una N:pelota",
  "V:vive/viven P:en D:la N:granja", "V:bebe/beben N:agua", "V:salta/saltan ADV:mucho", "V:descansa/descansan P:bajo D:un N:árbol",
  "V:pasea/pasean P:por D:la N:playa"
];
const parsePred = (s, pl) => s.split(" ").map(t => {
  const [c, w] = t.split(":");
  if (c !== "V") return { c, w };
  const [sg, plf] = w.split("/");
  return { c, w:pl ? plf : sg, alt:pl ? sg : plf };      // alt: the other number, for agreement mistakes
});
const W2 = w => Object.assign({}, w);

/* a subject: determiner + noun (+ adjective), with its gender and number */
function subject(opts){
  opts = opts || {};
  const people = opts.kind ? opts.kind === "people" : Math.random() < .55;
  const pl = opts.pl !== undefined ? opts.pl : Math.random() < .45;
  let noun, g;
  if (people){ const p = pick(PEOPLE); g = Math.random() < .5 ? "m" : "f"; noun = g === "m" ? p[0] : p[1]; }
  else { const a = pick(ANIMALS); noun = a[0]; g = a[1]; }
  const d = det(g, pl, opts.types);
  const toks = [d, { w:pl ? plural(noun) : noun, c:"N", nucleo:true }];
  if (opts.adj || (opts.adj !== false && Math.random() < .6)){
    const a = pick(people ? ADJ_PEOPLE : ADJ_ANIMALS);
    toks.push({ w:adjForm(a, g, pl), c:"ADJ", adj:a });
  }
  toks.forEach(t => { t.subj = true; t.g = g; t.pl = pl; });
  return { toks, g, pl, people, noun };
}
/* a whole sentence: subject + predicate (opts.invert puts "en el parque juegan los niños") */
function sentence(opts){
  opts = opts || {};
  for (let tries = 0; tries < 40; tries++){
    const s = subject(opts);
    const preds = (s.people ? PRED_PEOPLE : PRED_ANIMALS).filter(p => !opts.needP || /\bP:/.test(p))
      .filter(p => !opts.invert || /^V:\S+ P:\S+ D:\S+ N:\S+$/.test(p))
      .filter(p => !opts.needAdv || /ADV:/.test(p));
    if (!preds.length) continue;
    const pr = parsePred(pick(preds), s.pl);
    pr.forEach(t => { t.pred = true; if (t.c === "V") t.pl = s.pl; });
    let toks = opts.invert ? [...pr.slice(1), pr[0], ...s.toks] : [...s.toks, ...pr];
    toks = toks.map(W2);
    toks[0].w = cap(toks[0].w);
    toks.push({ w:".", c:"." });
    return { toks, s };
  }
  throw new Error("no sentence");
}
const words = toks => toks.map(t => t.w);
const text = toks => toks.map(t => t.w).join(" ").replace(/ \./g, ".");
const idx = (toks, f) => toks.map((t, i) => f(t) ? i : -1).filter(i => i >= 0);
const CLASS_NAME = { N:"sustantivo", D:"determinante", ADJ:"adjetivo", V:"verbo", P:"preposición", ADV:"adverbio", PRON:"pronombre" };
const CLASS_ART = { N:"el", D:"el", ADJ:"el", V:"el", P:"la", ADV:"el", PRON:"el" };
const CLASS_PL = { N:"sustantivos", D:"determinantes", ADJ:"adjetivos", V:"verbos", P:"preposiciones", ADV:"adverbios", PRON:"pronombres" };

/* ---------- 1. sujeto y predicado ---------- */
const oracion = {
  id:"gr-oracion", name:"Sujeto y predicado", emoji:"🧱",
  desc:"Quién hace la acción (sujeto) y lo que se dice de él (predicado).",
  rule:`Una oración tiene dos partes:
    <ul><li>El <b>sujeto</b>: de quién se habla. Pregunta al verbo <b>¿quién?</b>: <i>¿Quién come? → <b>El perro blanco</b></i>.</li>
    <li>El <b>predicado</b>: lo que se dice del sujeto. Empieza por el <b>verbo</b>: <i>come hierba</i>.</li>
    <li>El sujeto y el verbo <b>concuerdan</b>: el perro come / los perros com<b>en</b>.</li>
    <li>A veces el sujeto va al final: <i>En el parque juegan <b>los niños</b></i>.</li></ul>`,
  levels:[
    { name:"El sujeto", desc:"Toca las palabras del sujeto" },
    { name:"El verbo", desc:"Toca el verbo, que es lo principal del predicado" },
    { name:"Sujeto al final", desc:"El sujeto no siempre va delante" }
  ],
  make(level){
    const { toks, s } = sentence({ invert:level === 3 });
    const subj = idx(toks, t => t.subj), verb = idx(toks, t => t.c === "V");
    const sj = subj.map(i => toks[i].w).join(" ");
    const v = toks[verb[0]].w;
    if (level === 2) return { input:"words", one:true, text:"Toca el <b>verbo</b>:", words:words(toks), answer:verb, tagged:toks,
      explain:`El verbo es <b>${v}</b>: dice lo que hace el sujeto (<i>${sj}</i>).`, solution:v, key:"or2" + text(toks) };
    return { input:"words", text:"Toca todas las palabras del <b>sujeto</b>:", words:words(toks), answer:subj, tagged:toks,
      explain:`¿${s.pl ? "Quiénes" : "Quién"} ${v.toLowerCase()}? <b>${sj}</b>: ese es el sujeto. ${s.pl ? "Es plural, y el verbo también" : "Es singular, y el verbo también"}.`,
      solution:sj, key:"or" + level + text(toks) };
  }
};

/* ---------- 2. clases de oraciones ---------- */
const TIPOS = {
  "enunciativa afirmativa":["Mi hermano juega al fútbol.", "Hoy hace sol.", "Los gatos duermen mucho.", "Me gusta leer cuentos.", "El tren llega a las cinco.", "Mañana vamos a la playa."],
  "enunciativa negativa":["No me gusta la sopa.", "Mi perro no come verdura.", "Hoy no hay colegio.", "Lucía no ha venido a clase.", "No quiero ir a la cama.", "Mis abuelos no tienen coche."],
  interrogativa:["¿Cómo te llamas?", "¿Quieres jugar conmigo?", "¿Dónde está mi mochila?", "¿Qué hora es?", "¿Vienes al parque?", "¿Cuántos años tienes?"],
  exclamativa:["¡Qué bonito es tu dibujo!", "¡Cuánto llueve!", "¡Qué frío hace!", "¡Me encanta este libro!", "¡Hemos ganado!", "¡Qué sorpresa!"],
  imperativa:["Cierra la puerta, por favor.", "Recoge tus juguetes.", "Haz los deberes.", "No corras por el pasillo.", "Lávate las manos.", "Apaga la luz."],
  desiderativa:["Ojalá haga sol mañana.", "Que tengas un buen día.", "Ojalá ganemos el partido.", "Que te mejores pronto.", "Ojalá venga la abuela.", "Que cumplas muchos más."]
};
const TIPO_WHY = {
  "enunciativa afirmativa":"cuenta algo que pasa: es <b>enunciativa afirmativa</b>.",
  "enunciativa negativa":"cuenta algo que NO pasa (lleva <b>no</b>): es <b>enunciativa negativa</b>.",
  interrogativa:"pregunta algo y va entre <b>¿ ?</b>: es <b>interrogativa</b>.",
  exclamativa:"expresa sorpresa, alegría o enfado y va entre <b>¡ !</b>: es <b>exclamativa</b>.",
  imperativa:"da una orden o pide algo: es <b>imperativa</b>.",
  desiderativa:"expresa un deseo (<b>ojalá</b>, <b>que</b>…): es <b>desiderativa</b>."
};
const tipos = {
  id:"gr-tipos", name:"Clases de oraciones", emoji:"💬",
  desc:"Enunciativas, interrogativas, exclamativas, imperativas y desiderativas.",
  rule:`Según lo que queremos decir:
    <ul><li><b>Enunciativa</b>: cuenta algo. Puede ser <b>afirmativa</b> (Hace sol) o <b>negativa</b> (No hace sol).</li>
    <li><b>Interrogativa</b>: pregunta: <b>¿</b>Qué hora es<b>?</b></li>
    <li><b>Exclamativa</b>: expresa emoción: <b>¡</b>Qué frío<b>!</b></li>
    <li><b>Imperativa</b>: da una orden o pide algo: Cierra la puerta.</li>
    <li><b>Desiderativa</b>: expresa un deseo: <b>Ojalá</b> haga sol.</li></ul>`,
  levels:[
    { name:"Tres clases", desc:"Enunciativa, interrogativa o exclamativa" },
    { name:"Cinco clases", desc:"También imperativa y desiderativa" },
    { name:"Afirmativa o negativa", desc:"Todas, y las enunciativas afirmativas o negativas" }
  ],
  sentences:TIPOS,
  make(level){
    const types = level === 1 ? ["enunciativa afirmativa", "enunciativa negativa", "interrogativa", "exclamativa"] : Object.keys(TIPOS);
    const t = pick(types), s = pick(TIPOS[t]);
    const label = x => level < 3 && x.startsWith("enunciativa") ? "enunciativa" : x;
    const choices = level === 1 ? ["enunciativa", "interrogativa", "exclamativa"]
                  : level === 2 ? ["enunciativa", "interrogativa", "exclamativa", "imperativa", "desiderativa"]
                  : Object.keys(TIPOS);
    return { input:"choice", text:`«${esc(s)}»<br>¿Qué clase de oración es?`, choices, answer:label(t), explain:`«${esc(s)}» ${TIPO_WHY[t]}`, key:"ti" + level + s };
  }
};

/* ---------- 3. el grupo nominal ---------- */
const grupo = {
  id:"gr-grupo", name:"El grupo nominal", emoji:"🧺",
  desc:"Determinante + sustantivo + adjetivo; el sustantivo es el núcleo.",
  rule:`Un <b>grupo nominal</b> es un grupo de palabras cuya palabra principal (el <b>núcleo</b>) es un <b>sustantivo</b>:
    <i>aquellos <b>perros</b> pequeños</i>. Suele llevar un <b>determinante</b> delante y puede llevar un <b>adjetivo</b>.
    Todas sus palabras concuerdan en género y número con el núcleo.`,
  levels:[
    { name:"El núcleo", desc:"Toca el sustantivo (núcleo) del grupo nominal" },
    { name:"Sus partes", desc:"Toca el determinante o el adjetivo" },
    { name:"En la oración", desc:"Toca el núcleo del sujeto de una oración" }
  ],
  make(level){
    if (level === 3){
      const { toks } = sentence({});
      const n = idx(toks, t => t.subj && t.c === "N");
      const sj = idx(toks, t => t.subj).map(i => toks[i].w).join(" ");
      return { input:"words", one:true, text:"Toca el <b>núcleo del sujeto</b>:", words:words(toks), answer:n, tagged:toks,
        explain:`El sujeto es <i>${sj}</i>, y su núcleo es el sustantivo <b>${toks[n[0]].w}</b>.`, solution:toks[n[0]].w, key:"gn3" + text(toks) };
    }
    const s = subject({ adj:true });
    const toks = s.toks.map(W2), phrase = words(toks).join(" ");
    if (level === 1) return { input:"words", one:true, text:"Toca el <b>núcleo</b> del grupo nominal:", words:words(toks), answer:[1], tagged:toks,
      explain:`En <i>${phrase}</i> el núcleo es el sustantivo <b>${toks[1].w}</b>.`, solution:toks[1].w, key:"gn1" + phrase };
    const askDet = Math.random() < .5, k = askDet ? 0 : 2;
    return { input:"words", one:true, text:`Toca el <b>${askDet ? "determinante" : "adjetivo"}</b>:`, words:words(toks), answer:[k], tagged:toks,
      explain:`En <i>${phrase}</i>: <b>${toks[0].w}</b> es el determinante, <b>${toks[1].w}</b> el núcleo y <b>${toks[2].w}</b> el adjetivo.`,
      solution:toks[k].w, key:"gn2" + phrase + k };
  }
};

/* ---------- 4. sustantivos ---------- */
const PROPER = ["Lucía", "Madrid", "Pablo", "España", "Sevilla", "Marta", "Londres"];
const COMMON = ["perro", "ciudad", "niño", "país", "río", "niña", "mesa", "montaña"];
const COLECTIVOS = [["oveja", "rebaño"], ["abeja", "enjambre"], ["árbol", "bosque"], ["músico", "orquesta"], ["lobo", "manada"], ["pino", "pinar"], ["barco", "flota"], ["alumno", "alumnado"]];
const PLURAL_POOL = ["casa", "flor", "árbol", "lápiz", "camión", "ratón", "joven", "examen", "imagen", "pared", "reloj", "papel", "pez", "luz", "nariz",
  "sofá", "café", "jardín", "canción", "autobús", "mes", "rey", "ley", "jabón", "balón", "botón", "limón", "animal", "señor", "mujer", "ciudad", "corazón", "avión"];
const sustantivo = {
  id:"gr-sustantivo", name:"Sustantivos", emoji:"🏷️",
  desc:"Nombran personas, animales, cosas y lugares. Comunes y propios, género y número.",
  rule:`Los <b>sustantivos</b> nombran personas, animales, cosas, lugares o ideas.
    <ul><li><b>Comunes</b> (perro, ciudad) o <b>propios</b> (Lucía, Madrid: con mayúscula).</li>
    <li><b>Individuales</b> (oveja) o <b>colectivos</b>: nombran un grupo (rebaño).</li>
    <li>Tienen <b>género</b> (masculino: el niño / femenino: la niña) y <b>número</b> (singular / plural).</li>
    <li>El plural: vocal + <b>s</b> (casas); consonante + <b>es</b> (flores); <b>z → ces</b> (lápices). ¡Ojo con la tilde! camión → camiones, joven → jóvenes.</li></ul>`,
  levels:[
    { name:"Encuéntralos", desc:"Toca los sustantivos de la oración" },
    { name:"Clases", desc:"Común o propio, género y número, individual o colectivo" },
    { name:"El plural", desc:"Escribe el plural (¡cuidado con la tilde!)" }
  ],
  pluralPool:PLURAL_POOL, colectivos:COLECTIVOS,
  make(level){
    if (level === 1){
      const { toks } = sentence({});
      const n = idx(toks, t => t.c === "N");
      return { input:"words", text:"Toca todos los <b>sustantivos</b>:", words:words(toks), answer:n, tagged:toks,
        explain:`Los sustantivos son <b>${n.map(i => toks[i].w).join(", ")}</b>: nombran personas, animales, cosas o lugares.`,
        solution:n.map(i => toks[i].w).join(", "), key:"su1" + text(toks) };
    }
    if (level === 2){
      const kind = pick(["prop", "gn", "col"]);
      if (kind === "prop"){
        const isProp = Math.random() < .5, w = pick(isProp ? PROPER : COMMON);
        return { input:"choice", text:`<b>${esc(w)}</b> es un sustantivo…`, choices:["común", "propio"], answer:isProp ? "propio" : "común",
          explain:isProp ? `<b>${w}</b> es <b>propio</b>: es el nombre de una persona o lugar concreto, y va con mayúscula.` : `<b>${w}</b> es <b>común</b>: nombra a cualquiera de su clase.`, key:"su2p" + w };
      }
      if (kind === "col"){
        const [ind, col] = pick(COLECTIVOS), others = sample(COLECTIVOS.filter(c => c[1] !== col), 2).map(c => c[1]);
        return { input:"choice", text:`¿Cómo se llama un grupo de <b>${plural(ind)}</b>?`, choices:shuffle([col, ...others]), answer:col,
          explain:`<b>${col}</b> es un sustantivo <b>colectivo</b>: nombra un grupo de ${plural(ind)}.`, key:"su2c" + col };
      }
      const s = subject({ adj:false }), n = s.toks[1].w;
      const label = `${s.g === "m" ? "masculino" : "femenino"} ${s.pl ? "plural" : "singular"}`;
      return { input:"choice", text:`¿Qué género y número tiene <b>${esc(s.toks[0].w)} ${esc(n)}</b>?`,
        choices:["masculino singular", "masculino plural", "femenino singular", "femenino plural"], answer:label,
        explain:`<b>${n}</b> es <b>${label}</b>.`, key:"su2g" + s.toks[0].w + n };
    }
    const w = pick(PLURAL_POOL), p = plural(w);
    return { input:"text", text:`Escribe el plural de <b>${esc(w)}</b>:`, answer:p,
      explain:`${esc(w)} → <b>${esc(p)}</b>. ${"aeiouáéó".includes(w.slice(-1)) ? "Acaba en vocal: se añade -s." : w.endsWith("z") ? "Acaba en z: la z cambia a c y se añade -es." : "Acaba en consonante: se añade -es."}${/[áéíóú]/.test(w) !== /[áéíóú]/.test(p) ? " Y la tilde cambia, porque la palabra cambia de aguda a llana o de llana a esdrújula." : ""}`,
      key:"su3" + w };
  }
};

/* ---------- 5. determinantes ---------- */
const DET_WHY = {
  artículo:"Los <b>artículos</b> son el, la, los, las, un, una, unos, unas.",
  demostrativo:"Los <b>demostrativos</b> dicen si algo está cerca o lejos: este, ese, aquel…",
  posesivo:"Los <b>posesivos</b> dicen de quién es: mi, tu, su, nuestro…",
  numeral:"Los <b>numerales</b> dicen cuántos hay: dos, tres… (o el orden: primero, segundo…).",
  indefinido:"Los <b>indefinidos</b> hablan de una cantidad sin decir el número exacto: algún, varios, muchos, pocos."
};
const determinantes = {
  id:"gr-determinantes", name:"Determinantes", emoji:"👉",
  desc:"Artículos, demostrativos, posesivos, numerales e indefinidos.",
  rule:`Los <b>determinantes</b> van delante del sustantivo y concuerdan con él:
    <ul><li><b>Artículos</b>: el, la, los, las, un, una, unos, unas.</li>
    <li><b>Demostrativos</b>: este, ese, aquel (y sus femeninos y plurales).</li>
    <li><b>Posesivos</b>: mi, tu, su, nuestro…</li>
    <li><b>Numerales</b>: dos, tres… · <b>Indefinidos</b>: algún, varios, muchos, pocos.</li></ul>`,
  levels:[
    { name:"El artículo", desc:"Elige el artículo que concuerda" },
    { name:"¿Qué clase es?", desc:"Artículo, demostrativo, posesivo, numeral o indefinido" },
    { name:"Que concuerde", desc:"Elige la forma que concuerda con el sustantivo" }
  ],
  make(level){
    const s = subject({ adj:false, types:level === 1 ? ["artículo"] : undefined }), d = s.toks[0], n = s.toks[1].w;
    if (level === 1){
      const set = DETS.artículo[0];
      return { input:"choice", text:`<b>___ ${esc(n)}</b>`, choices:set.slice(), answer:set[slot(s.g, s.pl)],
        explain:`<b>${set[slot(s.g, s.pl)]} ${n}</b>: ${n} es ${s.g === "m" ? "masculino" : "femenino"} ${s.pl ? "plural" : "singular"}.`, key:"de1" + n };
    }
    if (level === 2){
      const types = Object.keys(DETS);
      return { input:"choice", text:`En <b>${esc(d.w)} ${esc(n)}</b>, ¿qué clase de determinante es <b>${esc(d.w)}</b>?`, choices:types, answer:d.type,
        explain:`<b>${d.w}</b> es un ${d.type}. ${DET_WHY[d.type]}`, key:"de2" + d.w + n };
    }
    const forms = [...new Set(d.set.filter(Boolean))];
    if (forms.length < 2) return this.make(3);
    return { input:"choice", text:`Elige el ${d.type} que concuerda:<br><b>___ ${esc(n)}</b>`, choices:forms, answer:d.w,
      explain:`<b>${d.w} ${n}</b>: el determinante concuerda con ${n} (${s.g === "m" ? "masculino" : "femenino"} ${s.pl ? "plural" : "singular"}).`, key:"de3" + d.w + n };
  }
};

/* ---------- 6. adjetivos ---------- */
/* a mistake in agreement: change one word of a sentence to the wrong gender or number */
function concordMistake(){
  for (let t = 0; t < 40; t++){
    const { toks, s } = sentence({ adj:true });
    const i = pick(idx(toks, x => x.c === "ADJ" || x.c === "V" || (x.c === "D" && x.subj))), tk = toks[i];
    const atStart = i === 0, low = tk.w.toLocaleLowerCase("es");
    let opts = [];
    if (tk.c === "V") opts = [tk.alt];
    if (tk.c === "ADJ") opts = [adjForm(tk.adj, s.g === "m" ? "f" : "m", s.pl), adjForm(tk.adj, s.g, !s.pl)];
    if (tk.c === "D") opts = [tk.set[slot(s.g === "m" ? "f" : "m", s.pl)], tk.set[slot(s.g, !s.pl)]];
    opts = opts.filter(x => x && x !== low);
    if (!opts.length) continue;
    let wrong = pick(opts);
    if (atStart) wrong = cap(wrong);
    const ws = words(toks); ws[i] = wrong;
    return { ws, i, right:tk.w, wrong, toks, s };
  }
  throw new Error("no mistake");
}
const adjetivo = {
  id:"gr-adjetivo", name:"Adjetivos y concordancia", emoji:"🎨",
  desc:"Dicen cómo es el sustantivo y concuerdan con él.",
  rule:`Los <b>adjetivos calificativos</b> dicen cómo es un sustantivo: <i>perro <b>blanco</b></i>, <i>niña <b>simpática</b></i>.
    Concuerdan con él en <b>género</b> y <b>número</b>: el gato negr<b>o</b>, la gata negr<b>a</b>, los gatos negr<b>os</b>, las gatas negr<b>as</b>.
    Algunos tienen una sola forma para masculino y femenino: <i>grande, feliz, triste</i>.`,
  levels:[
    { name:"Encuéntralos", desc:"Toca el adjetivo" },
    { name:"La terminación", desc:"Elige -o, -a, -os o -as" },
    { name:"¿Qué no concuerda?", desc:"Toca la palabra que no concuerda" }
  ],
  make(level){
    if (level === 1){
      const { toks } = sentence({ adj:true });
      const a = idx(toks, t => t.c === "ADJ");
      return { input:"words", one:a.length === 1, text:"Toca el <b>adjetivo</b>:", words:words(toks), answer:a, tagged:toks,
        explain:`<b>${a.map(i => toks[i].w).join(", ")}</b> dice cómo es el sustantivo: es un adjetivo.`, solution:a.map(i => toks[i].w).join(", "), key:"ad1" + text(toks) };
    }
    if (level === 2){
      for (let t = 0; t < 40; t++){
        const s = subject({ adj:true }), a = s.toks[2], base = a.adj[0];
        if (!base.endsWith("o") || a.adj[1] === base) continue;
        const stem = base.slice(0, -1), end = a.w.slice(stem.length);
        return { input:"gap", text:"Completa el adjetivo:", gap:`${s.toks[0].w} ${s.toks[1].w} ${stem}_`, choices:["o", "a", "os", "as"], answer:end,
          explain:`<b>${s.toks[0].w} ${s.toks[1].w} ${a.w}</b>: el adjetivo concuerda con ${s.toks[1].w} (${s.g === "m" ? "masculino" : "femenino"} ${s.pl ? "plural" : "singular"}).`,
          solution:`${s.toks[0].w} ${s.toks[1].w} ${a.w}`, key:"ad2" + a.w + s.toks[1].w };
      }
    }
    const m = concordMistake();
    return { input:"words", one:true, text:"Hay una palabra que <b>no concuerda</b>. Tócala:", words:m.ws, answer:[m.i],
      explain:`<b>${esc(m.wrong)}</b> no concuerda: debería ser <b>${esc(m.right)}</b>, porque el sujeto (<i>${m.s.toks.map(x => x.w).join(" ")}</i>) es ${m.s.g === "m" ? "masculino" : "femenino"} ${m.s.pl ? "plural" : "singular"}.`,
      solution:text(m.toks), key:"ad3" + m.ws.join(" "), tagged:m.toks, mistake:m };
  }
};

/* ---------- 7. pronombres personales ---------- */
const PRON_LIST = [["yo", 0], ["tú", 1], ["él", 2], ["ella", 2], ["nosotros", 3], ["nosotras", 3], ["vosotros", 4], ["vosotras", 4], ["ellos", 5], ["ellas", 5]];
/* group of words → the pronoun that replaces it. Mixed groups use the masculine plural. */
const SUBST = [
  ["mi hermano", "él"], ["la profesora", "ella"], ["las niñas", "ellas"], ["los niños", "ellos"], ["Pablo y Marta", "ellos"], ["Lucía y Elena", "ellas"],
  ["mi abuela", "ella"], ["el vecino", "él"], ["Luis y yo", "nosotros"], ["tú y Luis", "vosotros"], ["mis primos", "ellos"], ["las vacas", "ellas"],
  ["Marta", "ella"], ["Hugo", "él"]
];
const pronombres = {
  id:"gr-pronombres", name:"Pronombres personales", emoji:"🙋",
  desc:"yo, tú, él, ella, nosotros, vosotros, ellos…",
  rule:`Los <b>pronombres personales</b> sustituyen a un sustantivo o a un grupo nominal: <i>Mi hermano juega → <b>Él</b> juega</i>.
    <ul><li>1.ª persona (quien habla): <b>yo</b> · <b>nosotros, nosotras</b></li>
    <li>2.ª persona (a quien se habla): <b>tú</b> · <b>vosotros, vosotras</b></li>
    <li>3.ª persona (de quien se habla): <b>él, ella</b> · <b>ellos, ellas</b></li></ul>
    Si en un grupo hay chicos y chicas, se usa el masculino: Pablo y Marta → ellos.`,
  levels:[
    { name:"¿Cuál sustituye?", desc:"Elige el pronombre que sustituye al grupo" },
    { name:"Encuéntralo", desc:"Toca el pronombre de la oración" },
    { name:"Persona y número", desc:"¿Qué persona es?" }
  ],
  subst:SUBST,
  make(level){
    if (level === 1){
      const [grp, p] = pick(SUBST);
      const pool = ["él", "ella", "ellos", "ellas", "nosotros", "vosotros"], choices = shuffle([p, ...sample(pool.filter(x => x !== p), 3)]);
      return { input:"choice", text:`¿Qué pronombre sustituye a <b>${esc(grp)}</b>?`, choices, answer:p,
        explain:`<b>${grp}</b> → <b>${p}</b>.${/ y /.test(grp) ? " Un grupo de personas es plural." : ""}`, key:"pr1" + grp };
    }
    if (level === 2){
      const { toks, s } = sentence({});
      const sj = idx(toks, t => t.subj);
      const pron = s.pl ? (s.g === "f" ? "ellas" : "ellos") : (s.g === "f" ? "ella" : "él");
      const out = toks.filter((t, i) => !sj.includes(i) || i === sj[0]).map(W2);
      const at = sj[0];
      out[at] = { w:at === 0 ? cap(pron) : pron, c:"PRON" };
      const k = out.findIndex(t => t.c === "PRON");
      return { input:"words", one:true, text:"Toca el <b>pronombre personal</b>:", words:words(out), answer:[k], tagged:out,
        explain:`<b>${out[k].w}</b> es un pronombre personal: sustituye a <i>${sj.map(i => toks[i].w).join(" ").toLowerCase()}</i>.`, solution:out[k].w, key:"pr2" + text(out) };
    }
    const [p, n] = pick(PRON_LIST);
    return { input:"choice", text:`<b>${p}</b> es…`, choices:PERSON_NAME.slice(), answer:PERSON_NAME[n], explain:`<b>${p}</b> es la <b>${PERSON_NAME[n]}</b>.`, key:"pr3" + p };
  }
};

/* ---------- 8. el verbo ---------- */
const GROUP_NAME = { ar:"1.ª conjugación (-ar)", er:"2.ª conjugación (-er)", ir:"3.ª conjugación (-ir)" };
const verbo = {
  id:"gr-verbo", name:"El verbo", emoji:"🏃",
  desc:"Expresa acciones. Infinitivo, conjugación, tiempo, persona y número.",
  rule:`El <b>verbo</b> dice lo que hace o le pasa al sujeto.
    <ul><li>El <b>infinitivo</b> es su nombre: cant<b>ar</b>, com<b>er</b>, viv<b>ir</b>. Por él sabemos su <b>conjugación</b>: 1.ª (-ar), 2.ª (-er), 3.ª (-ir).</li>
    <li>Cada forma tiene <b>tiempo</b> (pasado, presente o futuro), <b>persona</b> (1.ª, 2.ª, 3.ª) y <b>número</b> (singular o plural):
      <i>cantaremos</i> = futuro, 1.ª persona del plural.</li></ul>`,
  levels:[
    { name:"Encuéntralo", desc:"Toca el verbo y di su conjugación" },
    { name:"El infinitivo", desc:"Escribe el infinitivo: bailaban → bailar" },
    { name:"Tiempo y persona", desc:"¿Pasado, presente o futuro? ¿Qué persona?" }
  ],
  forms:ALL_FORMS,
  make(level){
    if (level === 1){
      if (Math.random() < .5){
        const { toks } = sentence({});
        const v = idx(toks, t => t.c === "V");
        return { input:"words", one:true, text:"Toca el <b>verbo</b>:", words:words(toks), answer:v, tagged:toks,
          explain:`<b>${toks[v[0]].w}</b> es el verbo: dice lo que hace el sujeto.`, solution:toks[v[0]].w, key:"ve1" + text(toks) };
      }
      const g = pick(Object.keys(VERBS)), inf = pick(VERBS[g]);
      return { input:"choice", text:`¿De qué conjugación es <b>${inf}</b>?`, choices:Object.values(GROUP_NAME), answer:GROUP_NAME[g],
        explain:`<b>${inf}</b> acaba en <b>-${g}</b>: es de la ${GROUP_NAME[g]}.`, key:"ve1c" + inf };
    }
    if (level === 2){
      const f = pick(ALL_FORMS.filter(x => x.f !== x.inf));
      return { input:"text", text:`Escribe el infinitivo de <b>${f.f}</b>:`, answer:f.inf, explain:`<b>${f.f}</b> es una forma del verbo <b>${f.inf}</b>.`, key:"ve2" + f.f };
    }
    if (Math.random() < .5){
      const f = pick(ALL_FORMS.filter(uniqueTense));
      return { input:"choice", text:`<b>${f.f}</b> está en…`, choices:["pasado", "presente", "futuro"], answer:TENSE_TIME[f.t],
        explain:`<b>${f.f}</b> (${f.inf}) está en <b>${TENSE_TIME[f.t]}</b>${f.t.startsWith("pretérito") ? ` (${f.t})` : ""}.`, key:"ve3t" + f.f };
    }
    const f = pick(ALL_FORMS.filter(uniquePerson));
    return { input:"choice", text:`<b>${f.f}</b> es…`, choices:PERSON_NAME.slice(), answer:PERSON_NAME[f.p],
      explain:`<b>${f.f}</b> es la <b>${PERSON_NAME[f.p]}</b> (${PERSONS[f.p]}).`, key:"ve3p" + f.f };
  }
};

/* ---------- 9. conjugar ---------- */
const MODEL = { ar:"hablar", er:"beber", ir:"vivir" };
const conjugar = {
  id:"gr-conjugar", name:"Conjugar", emoji:"🔁",
  desc:"Escribir los verbos regulares en presente, pasado y futuro.",
  rule:`Los verbos <b>regulares</b> siguen siempre el mismo modelo. Por ejemplo, <b>cantar</b>:
    <ul><li><b>Presente</b>: canto, cantas, canta, cantamos, cantáis, cantan</li>
    <li><b>Pretérito perfecto simple</b> (pasado): canté, cantaste, cantó, cantamos, cantasteis, cantaron</li>
    <li><b>Pretérito imperfecto</b> (pasado): cantaba, cantabas, cantaba, cantábamos, cantabais, cantaban</li>
    <li><b>Futuro</b>: cantaré, cantarás, cantará, cantaremos, cantaréis, cantarán</li></ul>
    ¡Fíjate en las tildes: canté, cantó, cantará!`,
  levels:[
    { name:"Presente", desc:"yo canto, tú cantas…" },
    { name:"Pasado", desc:"yo canté, tú cantaste…" },
    { name:"Futuro e imperfecto", desc:"yo cantaré, yo cantaba…" }
  ],
  make(level){
    const tense = level === 1 ? "presente" : level === 2 ? "pretérito perfecto simple" : pick(["futuro", "pretérito imperfecto"]);
    const g = pick(Object.keys(VERBS)), inf = pick(VERBS[g].filter(v => v !== MODEL[g])), p = rnd(0, 5);
    const who = PERSONS[p].split(" / ")[Math.random() < .5 ? 0 : PERSONS[p].includes("/") ? 1 : 0];
    const ans = conj(inf, tense, p), model = conj(MODEL[g], tense, p);
    return { input:"text", text:`${tense[0].toUpperCase() + tense.slice(1)}. Como <i>${who} ${model}</i> (${MODEL[g]}), escribe con <b>${inf}</b>:<br>${who} ___`,
      answer:ans, explain:`${who} <b>${ans}</b> (${inf}, ${tense}).`, key:"co" + level + inf + p };
  }
};

/* ---------- 10. adverbios ---------- */
const ADV = {
  lugar:["aquí", "allí", "cerca", "lejos", "arriba", "abajo", "dentro", "fuera"],
  tiempo:["hoy", "ayer", "mañana", "pronto", "ahora", "luego", "siempre", "temprano"],
  modo:["bien", "mal", "despacio", "deprisa", "rápidamente", "tranquilamente"],
  cantidad:["mucho", "poco", "bastante", "demasiado", "muy"],
  afirmación:["sí", "también"],
  negación:["no", "tampoco"]
};
/* sentence frames: "{tipo}" is where the adverb goes; each frame only takes adverbs of that type that fit */
const ADV_FRAMES = [
  ["Mi abuela vive {lugar}.", "lugar", ["aquí", "allí", "cerca", "lejos"]],
  ["Los niños juegan {lugar}.", "lugar", ["aquí", "allí", "dentro", "fuera", "arriba", "abajo"]],
  ["{tiempo} vamos al cine.", "tiempo", ["hoy", "mañana", "pronto", "ahora", "luego"]],
  ["Mi hermano se levanta {tiempo}.", "tiempo", ["pronto", "temprano", "siempre"]],
  ["Mi perro corre {modo}.", "modo", ["bien", "mal", "despacio", "deprisa", "rápidamente"]],
  ["La tortuga camina {modo}.", "modo", ["despacio", "tranquilamente"]],
  ["Me gusta {cantidad} el chocolate.", "cantidad", ["mucho", "bastante"]],
  ["Este pastel está {cantidad} rico.", "cantidad", ["muy", "bastante", "demasiado", "poco"]],
  ["Yo {afirmación} quiero ir a la fiesta.", "afirmación", ["sí", "también"]],
  ["Mi gato {negación} come verdura.", "negación", ["no", "tampoco"]]
];
const adverbio = {
  id:"gr-adverbio", name:"Adverbios", emoji:"⏰",
  desc:"Dicen dónde, cuándo, cómo o cuánto: aquí, hoy, bien, mucho…",
  rule:`Los <b>adverbios</b> no cambian nunca (no tienen género ni número) y dicen:
    <ul><li><b>Lugar</b> (¿dónde?): aquí, allí, cerca, lejos, arriba, dentro…</li>
    <li><b>Tiempo</b> (¿cuándo?): hoy, ayer, mañana, pronto, siempre…</li>
    <li><b>Modo</b> (¿cómo?): bien, mal, despacio, deprisa, y muchos acabados en <b>-mente</b>.</li>
    <li><b>Cantidad</b> (¿cuánto?): mucho, poco, bastante, muy…</li>
    <li><b>Afirmación</b>: sí, también · <b>Negación</b>: no, tampoco.</li></ul>`,
  levels:[
    { name:"Encuéntralo", desc:"Toca el adverbio" },
    { name:"¿De qué clase?", desc:"Lugar, tiempo, modo, cantidad, afirmación o negación" },
    { name:"Dos adverbios", desc:"Toca los dos adverbios" }
  ],
  frames:ADV_FRAMES,
  make(level){
    const fill = () => { const [f, type, list] = pick(ADV_FRAMES), a = pick(list); const s = f.replace(`{${type}}`, a); return { s:cap(s), a, type }; };
    if (level === 3){
      // "Hoy" or "Ayer" at the start, and an adverb of manner or place; the verb changes to the past after "Ayer"
      const FR = [["Los niños juegan {lugar}.", "jugaron", "lugar", ["dentro", "fuera", "aquí", "allí"]],
                  ["Mi perro corre {modo}.", "corrió", "modo", ["bien", "mal", "despacio", "deprisa"]],
                  ["La tortuga camina {modo}.", "caminó", "modo", ["despacio", "tranquilamente"]]];
      const [f, past, type, list] = pick(FR), a = pick(list), t = pick(["Hoy", "Ayer"]);
      let body = f.replace(`{${type}}`, a);
      if (t === "Ayer") body = body.replace(/juegan|corre|camina/, past);
      const ws = `${t} ${body[0].toLowerCase()}${body.slice(1)}`.replace(/\.$/, " .").split(" ");
      return { input:"words", text:"Toca los <b>dos adverbios</b>:", words:ws, answer:[0, ws.indexOf(a)],
        explain:`<b>${t}</b> es un adverbio de tiempo y <b>${a}</b> es un adverbio de ${type}.`, solution:`${t}, ${a}`, key:"av3" + ws.join(" ") };
    }
    const { s, a, type } = fill();
    if (level === 1){
      const ws = s.replace(/\.$/, " .").split(" "), k = ws.findIndex(w => w.toLowerCase() === a);
      return { input:"words", one:true, text:"Toca el <b>adverbio</b>:", words:ws, answer:[k], explain:`<b>${a}</b> es un adverbio de ${type}.`, solution:a, key:"av1" + s };
    }
    return { input:"choice", text:`«${s.replace(new RegExp(`(^|\\s)(${a})(?=[\\s.])`, "i"), "$1<b>$2</b>")}»<br>¿De qué clase es el adverbio?`, choices:Object.keys(ADV), answer:type,
      explain:`<b>${a}</b> es un adverbio de <b>${type}</b>.`, key:"av2" + s };
  }
};

/* ---------- 11. preposiciones y conjunciones ---------- */
const PREP_LIST = "a, ante, bajo, con, contra, de, desde, durante, en, entre, hacia, hasta, para, por, según, sin, sobre, tras";
/* "_" is the gap; then the right answer, then two that don't fit at all. Written and checked by hand. */
const PREP_SENT = [
  ["El libro está _ la mesa.", "sobre", "durante", "según"],
  ["Mi abuela vive _ Sevilla.", "en", "durante", "sin"],
  ["Este regalo es _ ti.", "para", "con", "bajo"],
  ["Salimos de casa _ las ocho.", "a", "sin", "según"],
  ["No puedo vivir _ mi perro.", "sin", "sobre", "hacia"],
  ["Caminamos _ el río.", "hacia", "sin", "durante"],
  ["Estuvimos callados _ la película.", "durante", "hacia", "contra"],
  ["El vaso es _ cristal.", "de", "hacia", "durante"],
  ["Jugamos _ el equipo de Luis.", "contra", "durante", "bajo"],
  ["Te espero _ las cinco.", "hasta", "bajo", "sin"],
  ["Mi casa está _ el parque y el colegio.", "entre", "durante", "sin"],
  ["Fuimos al cine _ autobús.", "en", "contra", "hacia"],
  ["Vengo _ Madrid.", "de", "bajo", "durante"],
  ["Tengo un perro _ un gato.", "y", "porque", "según"],
  ["Quiero ir, _ estoy cansado.", "pero", "según", "hacia"],
  ["¿Quieres agua _ zumo?", "o", "ni", "pero"],
  ["No como carne _ pescado.", "ni", "desde", "hacia"]
];
const CONJ = ["y", "o", "pero", "ni"];
/* y → e before an "i" sound; o → u before an "o" sound */
const YE = [["padre", "hijo", "e"], ["Juan", "Inés", "e"], ["ciencia", "historia", "e"], ["aguja", "hilo", "e"], ["listo", "inteligente", "e"], ["pan", "queso", "y"], ["Marta", "Luis", "y"], ["agua", "hielo", "y"]];
const OU = [["siete", "ocho", "u"], ["uno", "otro", "u"], ["minutos", "horas", "u"], ["plata", "oro", "u"], ["mujer", "hombre", "u"], ["café", "té", "o"], ["perro", "gato", "o"]];
const prepos = {
  id:"gr-prepos", name:"Preposiciones y conjunciones", emoji:"🔗",
  desc:"Palabras que unen: a, con, de, en, para… y, o, pero, ni.",
  rule:`<ul><li>Las <b>preposiciones</b> unen palabras y nunca cambian: <i>${PREP_LIST}</i>.</li>
    <li>Las <b>conjunciones</b> unen palabras u oraciones: <b>y</b>, <b>o</b>, <b>ni</b>, <b>pero</b>…</li>
    <li><b>y</b> se cambia por <b>e</b> delante de una palabra que empieza por el sonido <b>i</b>: padre <b>e</b> hijo (pero agua y hielo, porque hie- suena «ye»).</li>
    <li><b>o</b> se cambia por <b>u</b> delante del sonido <b>o</b>: siete <b>u</b> ocho.</li></ul>`,
  levels:[
    { name:"Completa", desc:"Elige la preposición o conjunción que encaja" },
    { name:"Encuéntralas", desc:"Toca la preposición de la oración" },
    { name:"¿y o e? ¿o o u?", desc:"Cuándo y pasa a e, y o pasa a u" }
  ],
  sentences:PREP_SENT,
  make(level){
    if (level === 1){
      const [s, ans, ...bad] = pick(PREP_SENT), [a, b] = s.split("_");
      return { input:"choice", text:`${esc(a)}<b>___</b>${esc(b)}`, choices:shuffle([ans, ...bad]), answer:ans,
        explain:`${esc(a)}<b>${ans}</b>${esc(b)} <b>${ans}</b> es una ${CONJ.includes(ans) ? "conjunción" : "preposición"}.`, solution:s.replace("_", ans), key:"pp1" + s };
    }
    if (level === 2){
      const { toks } = sentence({ needP:true });
      const p = idx(toks, t => t.c === "P");
      return { input:"words", one:p.length === 1, text:"Toca la <b>preposición</b>:", words:words(toks), answer:p, tagged:toks,
        explain:`<b>${p.map(i => toks[i].w).join(", ")}</b> es una preposición. Las preposiciones son: ${PREP_LIST}.`, solution:p.map(i => toks[i].w).join(", "), key:"pp2" + text(toks) };
    }
    const ye = Math.random() < .5, [x, y, ans] = pick(ye ? YE : OU), choices = ye ? ["y", "e"] : ["o", "u"];
    return { input:"choice", text:`${esc(x)} <b>___</b> ${esc(y)}`, choices, answer:ans,
      explain:`<b>${x} ${ans} ${y}</b>. ${ans === "e" ? `<i>${y}</i> empieza por el sonido i, así que y pasa a <b>e</b>.`
        : ans === "u" ? `<i>${y}</i> empieza por el sonido o, así que o pasa a <b>u</b>.`
        : y.startsWith("hie") ? `<i>${y}</i> empieza por «ye», no por el sonido i: se queda <b>y</b>.`
        : `<i>${y}</i> no empieza por el sonido ${ye ? "i" : "o"}: se queda <b>${ans}</b>.`}`, key:"pp3" + x + y };
  }
};

/* ---------- 12. ¿qué clase de palabra es? ---------- */
const CLASS_LEVEL = { 1:["N", "V"], 2:["ADJ", "D"], 3:["P", "ADV", "N", "V", "ADJ", "D"] };
const clases = {
  id:"gr-clases", name:"¿Qué clase de palabra es?", emoji:"🧩",
  desc:"Repaso: sustantivos, verbos, adjetivos, determinantes, preposiciones y adverbios.",
  rule:`<ul><li><b>Sustantivo</b>: nombra (perro, Lucía). · <b>Verbo</b>: dice la acción (corre).</li>
    <li><b>Determinante</b>: va delante del sustantivo (el, este, mi). · <b>Adjetivo</b>: dice cómo es (blanco).</li>
    <li><b>Preposición</b>: une (en, con, por). · <b>Adverbio</b>: dónde, cuándo, cómo, cuánto (aquí, hoy, bien, muy).</li></ul>`,
  levels:[
    { name:"Sustantivos y verbos", desc:"Toca los sustantivos o el verbo" },
    { name:"Adjetivos y determinantes", desc:"Toca los adjetivos o los determinantes" },
    { name:"Todas", desc:"Cualquier clase de palabra" }
  ],
  make(level){
    for (let t = 0; t < 40; t++){
      const c = pick(CLASS_LEVEL[level]);
      const { toks } = sentence({ adj:c === "ADJ" ? true : undefined, needP:c === "P", needAdv:c === "ADV" });
      const ans = idx(toks, x => x.c === c);
      if (!ans.length) continue;
      return { input:"words", one:ans.length === 1, text:`Toca ${ans.length === 1 ? `${CLASS_ART[c]} <b>${CLASS_NAME[c]}</b>` : `${c === "P" ? "todas las" : "todos los"} <b>${CLASS_PL[c]}</b>`}:`, words:words(toks), answer:ans, tagged:toks,
        explain:toks.filter(x => x.c !== ".").map(x => `<b>${esc(x.w)}</b>: ${CLASS_NAME[x.c]}`).join(" · "), solution:ans.map(i => toks[i].w).join(", "), key:"cl" + c + text(toks) };
    }
    throw new Error("no question");
  }
};

L4.TOPICS.push({ id:"gramatica", title:"Gramática", emoji:"🧩",
  skills:[oracion, tipos, grupo, sustantivo, determinantes, adjetivo, pronombres, verbo, conjugar, adverbio, prepos, clases],
  DETS, DET_TYPE, sentence });
})();
