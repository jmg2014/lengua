/* Ortografía (spelling), Phase 1 of the roadmap.
   Most skills are built by ruleSkill() from word lists grouped by rule:
     - uppercase letters mark the letters the question is about: "caBallo" → the b; "LLave" → the ll
     - "·" marks a place where a letter could go but doesn't: "·oso" → no h
     - "|🐴" after a word is its picture (only when the picture is clear)
   Levels of a rule skill:
     1. Elige la letra   – fill the gap (ca_allo: b or v)
     2. ¿Cuál está bien? – pick the right spelling from 3
     3. Escribe          – dictation (if the device can speak), write the word for a picture, or find the misspelled word
   Every word is checked against the es_ES dictionary by tests/check.py, and every misspelling the app can show is
   checked NOT to be a real word (so "baca" for "vaca" can never appear: those pairs are left out). */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, rnd, esc } = L4;

/* ---------- word lists ---------- */
function parseEntry(raw){
  const [m, emoji] = raw.split("|");
  const dot = m.indexOf("·");
  let at, target;
  if (dot >= 0){ at = dot; target = ""; }
  else {
    const r = /[A-ZÁÉÍÓÚÜÑ]+/.exec(m);
    if (!r) throw new Error("no target in " + raw);
    at = r.index; target = r[0].toLocaleLowerCase("es");
  }
  const plain = m.replace("·", "");
  const word = plain.toLocaleLowerCase("es");
  return { word, emoji:emoji || "", at, target, before:word.slice(0, at), after:word.slice(at + target.length) };
}
const parseWords = s => s.trim().split(/\s+/).map(parseEntry);

/* ---------- common mistakes, used to make wrong spellings to choose from ---------- */
const ALT = [["b", "v"], ["v", "b"], ["ll", "y"], ["ge", "je"], ["gi", "ji"], ["je", "ge"], ["ji", "gi"], ["ce", "ze"], ["ci", "zi"]];
function otherErrors(e){
  const w = e.word, out = new Set(), lo = e.at, hi = e.at + e.target.length;
  for (const [a, b] of ALT){
    for (let i = w.indexOf(a); i >= 0; i = w.indexOf(a, i + 1)){
      if (i + a.length <= lo || i >= hi) out.add(w.slice(0, i) + b + w.slice(i + a.length));
    }
  }
  if (lo > 0 && w[0] === "h" && "aeiouáéíóú".includes(w[1])) out.add(w.slice(1));        // drop an h at the start
  out.delete(w);
  return [...out];
}

/* ---------- a skill made from groups of words, one group per rule ----------
   cfg: { id, name, emoji, desc, rule (rule card HTML), groups:[{ opts, rule, ask?, words }], none? }
   opts are the letters to choose from in the gap; none is the label of the "no letter" choice (for h: "sin h"). */
function ruleSkill(cfg){
  const none = cfg.none || "sin h";
  const entries = cfg.groups.flatMap(g => parseWords(g.words).map(e => Object.assign(e, { g })));
  const label = t => t === "" ? none : t;
  const fill = t => t === none ? "" : t;
  const spell = (e, t) => e.before + fill(t) + e.after;
  const swaps = e => e.g.opts.filter(o => fill(o) !== e.target).map(o => spell(e, o));
  const misspellings = e => [...new Set([...swaps(e), ...otherErrors(e)])].filter(w => w !== e.word);
  const why = e => `<b>${esc(e.word)}</b> ${e.target === "" ? `se escribe sin <b>h</b>` : `se escribe con <b>${esc(e.target)}</b>`}. ${e.g.rule}`;
  const ask = g => g.ask || (g.opts.length === 2 ? `¿Con ${g.opts[0]} o con ${g.opts[1]}?` : `¿${g.opts.slice(0, -1).join(", ")} o ${g.opts[g.opts.length - 1]}?`);

  function level1(e){
    return { input:"gap", picture:e.emoji, text:ask(e.g), gap:e.before + "_" + e.after, choices:e.g.opts.slice(), answer:label(e.target),
      fills:{ [none]:"" }, explain:why(e), solution:e.word, key:"g1" + e.word, wrongs:swaps(e) };
  }
  function level2(e){
    const wrong = sample(swaps(e), 1);
    const more = misspellings(e).filter(w => !wrong.includes(w));
    wrong.push(...sample(more, 2 - wrong.length));
    return { input:"choice", picture:e.emoji, text:"¿Cuál está bien escrita?", choices:shuffle([e.word, ...wrong]), answer:e.word,
      explain:why(e), key:"g2" + e.word, wrongs:wrong };
  }
  function findMistake(e){
    const others = sample(entries.filter(x => x.word !== e.word), 3).map(x => x.word);
    const bad = pick(swaps(e));
    const words = shuffle([bad, ...others]);
    return { input:"words", one:true, text:"Toca la palabra que está <b>mal escrita</b>:", words, answer:[words.indexOf(bad)],
      explain:`La que está mal es <b>${esc(bad)}</b>: ${why(e)}`, solution:e.word, key:"g3f" + e.word, wrongs:[bad] };
  }
  function level3(e){
    const kinds = ["find"];
    if (L4.canSpeak()) kinds.push("say", "say");
    if (e.emoji) kinds.push("picture");
    const k = pick(kinds);
    if (k === "find") return findMistake(e);
    if (k === "say") return { input:"text", say:e.word, picture:e.emoji, text:"Escucha y escribe la palabra:", answer:e.word, explain:why(e), key:"g3s" + e.word };
    return { input:"text", picture:e.emoji, text:`Escribe el nombre: <b class="hint">${esc(hint(e.word, e.at))}</b>`, answer:e.word, explain:why(e), key:"g3p" + e.word };
  }
  return {
    id:cfg.id, name:cfg.name, emoji:cfg.emoji, desc:cfg.desc, rule:cfg.rule,
    levels:[
      { name:"Elige la letra", desc:cfg.l1 || "Completa la palabra con la letra que falta" },
      { name:"¿Cuál está bien escrita?", desc:"Elige la palabra bien escrita entre tres" },
      { name:"Escribe", desc:"Dictado, escribir el nombre de un dibujo y encontrar la palabra mal escrita" }
    ],
    entries, misspellings,
    make(level){ const e = pick(entries); return level === 1 ? level1(e) : level === 2 ? level2(e) : level3(e); }
  };
}

const NO_RULE = "No hay regla: ¡fíjate bien y apréndetela!";
/* a hint for writing a word from its picture: the first letter and a blank for each other letter,
   or only blanks when the first letter is the one the question is about (h _ _ _ _ would give "hielo" away) */
const hint = (w, at) => at === 0 ? "_ ".repeat(w.length).trim() : w[0] + " _".repeat(w.length - 1);

/* ---------- b / v ---------- */
const bv = ruleSkill({ id:"or-bv", name:"b / v", emoji:"🐝",
  desc:"Cuándo se escribe b y cuándo v.",
  rule:`<b>b</b> y <b>v</b> suenan igual. Estas reglas ayudan:
    <ul><li>Con <b>b</b>: <b>bl</b>, <b>br</b> (blanco, libro) y después de <b>m</b> (hombre).</li>
    <li>Con <b>b</b>: las formas en <b>-aba</b> (cantaba, jugábamos), los verbos en <b>-bir</b> (escribir, ¡menos vivir, servir y hervir!)
      y las palabras en <b>-ble</b> (amable).</li>
    <li>Con <b>b</b>: las que empiezan por <b>bu-, bus-, bur-</b> (buscar) y <b>bi-, bis-, biz-</b> (bicicleta).</li>
    <li>Con <b>v</b>: después de <b>n</b> (invierno), después de <b>ll-</b> (llave, lluvia) y los adjetivos en <b>-avo, -ave, -evo, -eve, -ivo, -iva</b> (nuevo, suave, activo).</li></ul>`,
  groups:[
    { opts:["b", "v"], rule:"Antes de <b>l</b> y <b>r</b> se escribe <b>b</b> (bl, br).",
      words:"Blanco Blusa pueBlo nieBla|🌫️ haBlar|🗣️ Brazo|💪 liBro|📕 caBra|🐐 aBrazo|🤗 aBril Broma Brillar fieBre|🤒 liBreta Bloque Bruja|🧙" },
    { opts:["b", "v"], rule:"Después de <b>m</b> siempre se escribe <b>b</b> (mb).",
      words:"homBre|👨 somBrero|👒 tamBor|🥁 nomBre camBio amBulancia|🚑 bomBero|🧑‍🚒 emBudo somBra homBro alamBre hamBre tamBién camBiar" },
    { opts:["b", "v"], rule:"Las formas de los verbos acabadas en <b>-aba</b> (cantaba, jugábamos) se escriben con <b>b</b>.",
      words:"cantaBa jugaBa saltaBa estaBa nadaBa miraBa pintaBan bailáBamos cantáBamos llegaBan jugaBas esperaBa andaBa dibujaBa" },
    { opts:["b", "v"], rule:"Los verbos acabados en <b>-bir</b> se escriben con <b>b</b> (menos vivir, servir y hervir).",
      words:"escriBir|📝 suBir|⬆️ reciBir descriBir prohiBir suBimos reciBió escriBe" },
    { opts:["b", "v"], rule:"Las palabras acabadas en <b>-ble</b> se escriben con <b>b</b>.",
      words:"amaBle posiBle terriBle mueBle agradaBle increíBle horriBle visiBle invisiBle" },
    { opts:["b", "v"], rule:"Las palabras que empiezan por <b>bu-</b>, <b>bus-</b> y <b>bur-</b> se escriben con <b>b</b>.",
      words:"Buscar|🔎 Búho|🦉 Bufanda|🧣 Burbuja Buzón|📮 Bueno Butaca Burro" },
    { opts:["b", "v"], rule:"Las palabras que empiezan por <b>bi-</b>, <b>bis-</b> o <b>biz-</b> (que significan «dos») se escriben con <b>b</b>.",
      words:"Bicicleta|🚲 Bisabuelo Bizcocho Bilingüe Bicolor" },
    { opts:["b", "v"], rule:"Después de <b>n</b> se escribe <b>v</b> (nv).",
      words:"inVierno|❄️ enViar inVitar inVentar inVisible inVitación" },
    { opts:["b", "v"], rule:"Los adjetivos acabados en <b>-avo, -ave, -evo, -eve, -ivo, -iva</b> se escriben con <b>v</b>.",
      words:"nueVo nueVa suaVe breVe actiVo deportiVo festiVo octaVo braVo creatiVo atractiVo positiVo negatiVo" },
    { opts:["b", "v"], rule:"Después de <b>ll-</b> se escribe <b>v</b> (llave, llevar, llover, lluvia).",
      words:"llaVe|🔑 lleVar lloVer lluVia|🌧️ llaVero lleVamos" },
    { opts:["b", "v"], rule:NO_RULE,
      words:"Barco|⛵ Ballena|🐋 aBeja|🐝 Bolsa caBeza caBallo|🐴 Botella|🍾 árBol|🌳 loBo|🐺 Bosque Bañera|🛁 Boca|👄 Beso|💋 Bandera Bebé|👶 " +
            "Ventana|🪟 Verano Verde Viento naVe uVa|🍇 aVión|✈️ claVel oVeja|🐑 Vestido|👗 joVen Volcán|🌋 Ventilador Violín|🎻 Vecino Viernes" }
  ] });

/* ---------- g / j ---------- */
const gj = ruleSkill({ id:"or-gj", name:"g / j / gu / gü", emoji:"🦒",
  desc:"ge, gi o je, ji; y cuándo se escribe gu y gü.",
  rule:`Delante de <b>e</b> e <b>i</b>, la <b>g</b> suena como la <b>j</b> (gente, jirafa). Estas reglas ayudan:
    <ul><li>Con <b>g</b>: los verbos en <b>-ger</b> y <b>-gir</b> (coger, elegir; ¡menos tejer y crujir!) y las palabras en <b>-gen</b>, <b>-gía</b>, <b>-gio</b>, <b>-gión</b> (imagen, magia, colegio, región).</li>
    <li>Con <b>j</b>: las palabras en <b>-aje</b>, <b>-eje</b> (viaje), en <b>-jero</b>, <b>-jera</b> (extranjero) y las de familia con j (rojo → rojizo).</li>
    <li>Para que la g suene suave delante de e, i se escribe <b>gu</b>: guerra, guitarra.</li>
    <li>Si esa <b>u</b> se pronuncia, lleva diéresis: <b>güe, güi</b> (pingüino, cigüeña).</li></ul>`,
  groups:[
    { opts:["g", "j"], rule:"Los verbos acabados en <b>-ger</b> y <b>-gir</b> se escriben con <b>g</b> (menos tejer y crujir).",
      words:"coGer recoGer proteGer eleGir correGir diriGir escoGer recoGemos" },
    { opts:["g", "j"], rule:"Las palabras acabadas en <b>-gen</b>, <b>-gía</b>, <b>-gio</b> y <b>-gión</b> se escriben con <b>g</b>.",
      words:"maGia coleGio|🏫 reGión reliGión enerGía imaGen oriGen marGen" },
    { opts:["g", "j"], rule:"Las palabras acabadas en <b>-aje</b> y <b>-eje</b> se escriben con <b>j</b>.",
      words:"viaJe garaJe paisaJe traJe mensaJe equipaJe pasaJe masaJe oleaJe eJe" },
    { opts:["g", "j"], rule:"Las palabras acabadas en <b>-jero</b> y <b>-jera</b> se escriben con <b>j</b>.",
      words:"extranJero cerraJero conseJero pasaJero" },
    { opts:["g", "j"], rule:"Si una palabra de la misma familia lleva <b>j</b>, esta también: rojo → rojizo, caja → cajita.",
      words:"roJizo caJita coneJito oJito caJero" },
    { opts:["g", "j"], rule:NO_RULE,
      words:"Gente Girasol|🌻 Gigante Gemelo páGina ánGel|👼 Gimnasia Genial Gesto " +
            "Jirafa|🦒 Jinete Jefe Jersey muJer tarJeta aJedrez teJer cruJir" },
    { opts:["g", "gu", "gü"], rule:"Para que la <b>g</b> suene suave delante de <b>e</b> e <b>i</b>, se escribe <b>gu</b> (la u no suena).",
      words:"GUerra GUitarra|🎸 juGUete|🧸 hoGUera|🔥 manGUera áGUila|🦅 GUisante hamburGUesa|🍔 GUepardo|🐆 GUiso" },
    { opts:["g", "gu", "gü"], rule:"Cuando la <b>u</b> suena entre la g y la e o la i, lleva diéresis: <b>güe</b>, <b>güi</b>.",
      words:"pinGÜino|🐧 ciGÜeña verGÜenza paraGÜero bilinGÜe lenGÜeta desaGÜe" }
  ] });

/* ---------- ll / y ---------- */
const lly = ruleSkill({ id:"or-lly", name:"ll / y", emoji:"🔑",
  desc:"Cuándo se escribe ll y cuándo y.",
  rule:`<b>ll</b> e <b>y</b> suenan casi igual. Estas reglas ayudan:
    <ul><li>Con <b>ll</b>: las palabras acabadas en <b>-illo</b>, <b>-illa</b> (bolsillo, ardilla).</li>
    <li>Con <b>y</b>: al final de palabra cuando suena como i (rey, hoy, muy), y su plural (reyes).</li>
    <li>Con <b>y</b>: muchas formas de verbos como leer, oír, huir o construir (leyendo, oyó, construyó).</li></ul>`,
  groups:[
    { opts:["ll", "y"], rule:"Las palabras acabadas en <b>-illo</b> e <b>-illa</b> se escriben con <b>ll</b>.",
      words:"bolsiLLo castiLLo|🏰 cuchiLLo|🔪 ardiLLa|🐿️ mantequiLLa|🧈 semiLLa zapatiLLa|👟 pasiLLo mejiLLa cepiLLo|🪥 rodiLLa tortiLLa amariLLo siLLa|🪑 aniLLo|💍" },
    { opts:["y", "i", "ll"], rule:"Al final de palabra, cuando suena como <b>i</b>, se escribe <b>y</b>.",
      words:"reY|🤴 hoY muY leY estoY doY soY jerseY bueY" },
    { opts:["ll", "y"], rule:"El plural de las palabras acabadas en <b>y</b> también lleva <b>y</b>: rey → reyes.",
      words:"reYes leYes bueYes" },
    { opts:["ll", "y"], rule:"Muchas formas de verbos como leer, caer, oír, huir o construir se escriben con <b>y</b>.",
      words:"leYendo|📖 leYó oYó oYendo construYó huYó creYó caYendo construYendo destruYó incluYe" },
    { opts:["ll", "y"], rule:NO_RULE,
      words:"LLave|🔑 LLuvia|🌧️ LLorar|😢 caLLe gaLLina|🐔 gaLLeta|🍪 baLLena|🐋 toaLLa LLegar LLeno LLamar estreLLa|⭐ boteLLa|🍾 cueLLo cameLLo|🐫 seLLo coLLar meLLizo " +
            "Yogur Yema paYaso|🤡 plaYa|🏖️ aYer aYudar Yate|🛥️ Yegua joYa|💎 desaYuno Yeso aYuntamiento maYonesa papagaYo|🦜" }
  ] });

/* ---------- r / rr ---------- */
const rr = ruleSkill({ id:"or-rr", name:"r / rr", emoji:"🦊",
  desc:"Cuándo se escribe r y cuándo rr.",
  rule:`<ul><li>Al <b>principio</b> de palabra se escribe <b>r</b>, aunque suene fuerte: ratón, rosa.</li>
    <li>Después de <b>n</b>, <b>l</b> y <b>s</b> también se escribe <b>r</b>: sonrisa, alrededor.</li>
    <li><b>Entre vocales</b>: si suena fuerte, <b>rr</b> (zorro, torre); si suena suave, <b>r</b> (loro, cara).</li>
    <li>Si a una palabra que empieza por r se le pone algo delante, la r pasa a <b>rr</b>: pelo + rojo = pelirrojo.</li></ul>`,
  groups:[
    { opts:["r", "rr"], rule:"Al principio de palabra se escribe <b>r</b>, aunque suene fuerte.",
      words:"Ratón|🐭 Rosa|🌹 Rana|🐸 Reloj|⏰ Río Rojo Regalo|🎁 Rueda Risa Rápido Ropa Ramo" },
    { opts:["r", "rr"], rule:"Después de <b>n</b>, <b>l</b> y <b>s</b> se escribe <b>r</b>, aunque suene fuerte.",
      words:"honRado alRededor enRedo sonRisa|😊 enRollar" },
    { opts:["r", "rr"], rule:"Entre vocales, si suena fuerte, se escribe <b>rr</b>.",
      words:"toRRe|🗼 goRRo|🧢 tieRRa|🌍 aRRoz|🍚 zoRRo|🦊 coRRer|🏃 aRRiba teRRemoto pizaRRa baRRer|🧹 caRRetera aRRuga" },
    { opts:["r", "rr"], rule:"Entre vocales, si suena suave, se escribe una sola <b>r</b>.",
      words:"loRo|🦜 maRiposa|🦋 naRiz|👃 coRona|👑 pájaRo|🐦 oRo caRamelo|🍬 naRanja|🍊 duRo" },
    { opts:["r", "rr"], rule:"Si a una palabra que empieza por <b>r</b> se le pone algo delante, la r pasa a <b>rr</b>: pelo + rojo = pelirrojo.",
      words:"peliRRojo contraRReloj autoRRetrato" }
  ] });

/* ---------- h ---------- */
const h = ruleSkill({ id:"or-h", name:"h", emoji:"🥚", none:"sin h",
  desc:"La letra que no suena: ¿lleva h o no?",
  rule:`La <b>h</b> no suena, así que hay que saber qué palabras la llevan:
    <ul><li>Las que empiezan por <b>hie-, hue-, hum-</b>: hielo, huevo, humo.</li>
    <li>Las formas de <b>haber</b>, <b>hacer</b> y <b>hablar</b>: hemos, hago, hablamos.</li>
    <li>Algunas la llevan en medio: almohada, zanahoria, búho.</li></ul>`,
  groups:[
    { opts:["h", "sin h"], ask:"¿Lleva h?", rule:"Las palabras que empiezan por <b>hie-</b>, <b>hue-</b> y <b>hum-</b> llevan <b>h</b>.",
      words:"Hielo|🧊 Hueso|🦴 Huevo|🥚 Huella|👣 Huerto Humo|💨 Humano Húmedo Humor Hueco" },
    { opts:["h", "sin h"], ask:"¿Lleva h?", rule:"Las formas de los verbos <b>haber</b>, <b>hacer</b>, <b>hablar</b> y <b>habitar</b> llevan <b>h</b>.",
      words:"Hemos Hacer Hago Hablar Hablamos Habitación Habitante" },
    { opts:["h", "sin h"], ask:"¿Lleva h?", rule:"Algunas palabras llevan la <b>h</b> en medio (h intercalada).",
      words:"almoHada zanaHoria|🥕 búHo|🦉 aHora coHete|🚀 proHibido aHorrar veHículo" },
    { opts:["h", "sin h"], ask:"¿Lleva h?", rule:NO_RULE,
      words:"Hormiga|🐜 Helado|🍦 Hermano Hoja|🍃 Hospital|🏥 Hotel|🏨 Hacha|🪓 Harina Hilo|🧵 Hijo Hombre Hoy Hada|🧚 Hamaca Hipopótamo|🦛 Hermoso Historia" },
    { opts:["h", "sin h"], ask:"¿Lleva h?", rule:"Esta palabra <b>no</b> lleva h: ¡no la pongas!",
      words:"·oso|🐻 ·orilla ·uva|🍇 ·árbol|🌳 ·agua|💧 ·ojo|👁️ ·oreja|👂 ·armario ·océano ·oveja|🐑 ·isla|🏝️ ·aire ·arena ·uña|💅 ·abeja|🐝 ·elefante|🐘 ·iglesia|⛪ ·ordenador|💻 ·invierno" }
  ] });

/* ---------- c / qu / z ---------- */
const cz = ruleSkill({ id:"or-cz", name:"c / qu / z", emoji:"🧀",
  desc:"ca, co, cu y que, qui; za, zo, zu y ce, ci.",
  rule:`<ul><li>Sonido <b>k</b>: <b>ca, co, cu</b>, pero <b>que, qui</b> (casa, queso).</li>
    <li>Sonido <b>z</b>: <b>za, zo, zu</b>, pero <b>ce, ci</b> (zapato, cebra).</li>
    <li>Por eso, cuando a una palabra acabada en <b>z</b> se le añade <b>-es</b>, la z cambia a <b>c</b>: pez → peces.</li></ul>`,
  groups:[
    { opts:["c", "qu"], rule:"Con el sonido k se escribe <b>ca, co, cu</b>, pero <b>que, qui</b>.",
      words:"Casa|🏠 Cometa Cuchara|🥄 QUince mosQUito|🦟 paQUete|📦 raQUeta|🎾 máQUina esQUina tranQUilo chaQUeta|🧥 Cuento Cocodrilo|🐊 Conejo|🐰 esCuela|🏫 boCadillo|🥪 QUerer" },
    { opts:["c", "z"], rule:"Con el sonido z se escribe <b>za, zo, zu</b>, pero <b>ce, ci</b>.",
      words:"Zapato|👞 Zumo|🧃 aZul Zanahoria|🥕 Cielo Cine|🎦 Cerdo|🐷 Ciudad Cereza|🍒 coCina aCeite Cena Cebolla|🧅 Ciruela Círculo" },
    { opts:["c", "z"], rule:"Cuando la <b>z</b> va delante de <b>e</b>, cambia a <b>c</b>: pez → peces, lápiz → lápices.",
      words:"lápiCes peCes|🐟 luCes|💡 nariCes voCes" }
  ] });

/* ---------- s / z ---------- */
const sz = ruleSkill({ id:"or-sz", name:"s / z / c", emoji:"🍲",
  desc:"No confundir la s con la z y la c.",
  rule:`En casi toda España, la <b>z</b> (y la <b>c</b> de ce, ci) suena distinta de la <b>s</b>: <i>zapato</i> no suena como <i>sapo</i>.
    Si en tu casa suenan igual (eso se llama <b>seseo</b> y es correcto al hablar), al escribir hay que aprenderse cada palabra.
    Truco: piensa en la familia de la palabra (lápiz → lapicero).`,
  groups:[
    { opts:["s", "z"], rule:NO_RULE, words:"Sol|☀️ Sueño Suelo Sombra Zapato|👞 aZúcar Zanahoria|🥕 lápiZ|✏️ Zorro|🦊 pereZoso" },
    { opts:["s", "c"], rule:NO_RULE, words:"Semana Selva Siete Serpiente|🐍 Señora Sirena|🧜 Cebolla|🧅 Cereza|🍒 coCina Cielo" }
  ] });

/* ---------- m / n before p, b, v ---------- */
const mn = ruleSkill({ id:"or-mn", name:"m / n", emoji:"🎺",
  desc:"m antes de p y b; n antes de v.",
  rule:`<ul><li>Antes de <b>p</b> y <b>b</b> se escribe <b>m</b>: campo, hombre.</li><li>Antes de <b>v</b> se escribe <b>n</b>: invierno, enviar.</li></ul>`,
  groups:[
    { opts:["m", "n"], rule:"Antes de <b>p</b> y <b>b</b> se escribe <b>m</b>.",
      words:"caMpo taMbién hoMbre|👨 sieMpre liMpio tieMpo coMprar eMpezar caMbiar noMbre coMpañero láMpara|💡 boMbero|🧑‍🚒 seMbrar troMpeta|🎺 aMbulancia|🚑 eMbudo teMprano chaMpú caMpana|🔔" },
    { opts:["m", "n"], rule:"Antes de <b>v</b> se escribe <b>n</b>.",
      words:"eNviar iNvierno|❄️ iNvitar iNventar iNvisible eNvase coNvivir" }
  ] });

/* ---------- d / z at the end ---------- */
const DZ = `pared|paredes|🧱 red|redes ciudad|ciudades|🏙️ verdad|verdades amistad|amistades libertad|libertades bondad|bondades edad|edades
  mitad|mitades césped|céspedes usted|ustedes universidad|universidades enfermedad|enfermedades actividad|actividades
  lápiz|lápices|✏️ luz|luces|💡 pez|peces|🐟 nariz|narices|👃 nuez|nueces|🌰 cruz|cruces voz|voces feliz|felices raíz|raíces
  disfraz|disfraces arroz|arroces|🍚 perdiz|perdices actriz|actrices avestruz|avestruces maíz|maíces|🌽 antifaz|antifaces
  lombriz|lombrices|🪱 cicatriz|cicatrices veloz|veloces`.trim().split(/\s+/).map(s => { const [w, p, e] = s.split("|"); return { word:w, plural:p, emoji:e || "", end:w.slice(-1) }; });
const dzWhy = e => e.end === "d"
  ? `<b>${e.word}</b> acaba en <b>d</b>: lo sabes por el plural, <b>${e.plural}</b> (se añade -es).`
  : `<b>${e.word}</b> acaba en <b>z</b>: su plural es <b>${e.plural}</b> (la z cambia a c y se añade -es).`;
const dz = {
  id:"or-dz", name:"d / z al final", emoji:"🧱",
  desc:"¿Pared o parez? ¿Lápiz o lápid? El plural te lo dice.",
  rule:`Al final de palabra, la <b>d</b> y la <b>z</b> pueden sonar parecido. El truco es pensar en el <b>plural</b>:
    <ul><li>pare<b>d</b> → pare<b>des</b> (con d)</li><li>lápi<b>z</b> → lápi<b>ces</b> (con z, que cambia a c)</li></ul>`,
  levels:[
    { name:"Elige la letra", desc:"¿d o z al final?" },
    { name:"El plural", desc:"Escribe el plural: pez → peces" },
    { name:"El singular", desc:"Escribe el singular: paredes → pared" }
  ],
  entries:DZ,
  misspellings:e => [e.word.slice(0, -1) + (e.end === "d" ? "z" : "d")],
  make(level){
    const e = pick(DZ);
    if (level === 1) return { input:"gap", picture:e.emoji, text:"¿Acaba en d o en z?", gap:e.word.slice(0, -1) + "_", choices:["d", "z"], answer:e.end,
      explain:dzWhy(e), solution:e.word, key:"dz1" + e.word, wrongs:this.misspellings(e) };
    if (level === 2) return { input:"text", picture:e.emoji, text:`Escribe el plural de <b>${e.word}</b>:`, answer:e.plural, explain:dzWhy(e), key:"dz2" + e.word };
    return { input:"text", picture:e.emoji, text:`Escribe el singular de <b>${e.plural}</b>:`, answer:e.word, explain:dzWhy(e), key:"dz3" + e.word };
  }
};

/* ---------- capital letters ---------- */
const NAMES_F = ["Marta", "Lucía", "Elena", "Sofía", "Carmen", "Irene"], NAMES_M = ["Luis", "Pablo", "Hugo", "Daniel", "Javier", "Mario"];
const NAMES = [...NAMES_F, ...NAMES_M];
const PLACES = ["Madrid", "Sevilla", "Valencia", "Toledo", "Londres", "España", "Granada", "Bilbao", "Málaga", "Escocia"];
const DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const LANGS = ["inglés", "español", "francés", "italiano", "alemán"];
/* {N} a name ({NF} a girl's name, {NM} a boy's name), {C} a place, {D} a day, {DS} a day after "los" (lunes, sábados),
   {M} a month, {L} a language other than Spanish; "." starts a new sentence */
const CAP_T = [
  ["{N} vive en {C} .", "mi amiga {NF} tiene un perro .", "{N} y {N} van al parque .", "este verano iremos a {C} .", "el abuelo de {N} es de {C} .",
   "mañana viene mi tío {NM} .", "{C} es una ciudad muy bonita .", "mi prima {NF} estudia en {C} ."],
  ["el {D} {N} va a la piscina .", "en {M} viajamos a {C} .", "{N} habla {L} y español .", "mi cumpleaños es en {M} .",
   "los {DS} {N} tiene clase de {L} .", "en {C} hace frío en {M} ."],
  ["{N} vive en {C} . los {DS} juega al fútbol .", "hoy es {D} . mañana iremos a {C} con {N} .", "me llamo {N} . nací en {C} en {M} .",
   "{NF} es mi vecina . habla {L} muy bien .", "en {M} vamos a {C} . allí vive {N} ."]
];
const DAYS_AFTER_LOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
function capQuestion(level){
  const t = pick(CAP_T[level - 1]), usedNames = new Set();
  const name = list => { const n = pick(list.filter(x => !usedNames.has(x))); usedNames.add(n); return n; };
  const tokens = [], need = [], traps = [];
  let start = true;
  for (const part of t.split(" ")){
    if (part === "."){ tokens.push("."); start = true; continue; }
    let w = part, proper = false, trap = false;
    if (part === "{N}" || part === "{NF}" || part === "{NM}"){ w = name(part === "{NF}" ? NAMES_F : part === "{NM}" ? NAMES_M : NAMES); proper = true; }
    else if (part === "{C}"){ w = pick(PLACES); proper = true; }
    else if (part === "{D}"){ w = pick(DAYS); trap = true; }
    else if (part === "{DS}"){ w = pick(DAYS_AFTER_LOS); trap = true; }
    else if (part === "{M}"){ w = pick(MONTHS); trap = true; }
    else if (part === "{L}"){ w = pick(LANGS.filter(l => l !== "español")); trap = true; }
    if (proper || start) need.push(tokens.length);
    if (trap && !start) traps.push(w);
    tokens.push(w);
    start = false;
  }
  const right = need.map(i => tokens[i][0].toLocaleUpperCase("es") + tokens[i].slice(1));
  const fixed = tokens.map((w, i) => need.includes(i) ? w[0].toLocaleUpperCase("es") + w.slice(1) : w).join(" ").replace(/ \./g, ".");
  let why = `Llevan mayúscula: <b>${right.join(", ")}</b> (los nombres de personas y lugares, y la primera palabra después de un punto).`;
  if (traps.length) why += ` <b>${traps.join(", ")}</b> va${traps.length > 1 ? "n" : ""} con minúscula: los días, los meses y los idiomas no llevan mayúscula.`;
  return { input:"words", text:"Toca las palabras que deben llevar <b>mayúscula</b>:", words:tokens.map(w => w.toLocaleLowerCase("es")), answer:need,
    explain:why, solution:fixed, key:"may" + tokens.join(" ") };
}
const may = {
  id:"or-may", name:"Mayúsculas", emoji:"🔠",
  desc:"Nombres propios, después de punto, y lo que NO lleva mayúscula.",
  rule:`Se escriben con <b>mayúscula</b>:
    <ul><li>la primera palabra de un texto y la que va después de un <b>punto</b>;</li>
    <li>los <b>nombres propios</b> de personas, animales y lugares (Lucía, Madrid, España).</li></ul>
    En español <b>no</b> llevan mayúscula los días de la semana, los meses ni los idiomas: lunes, enero, inglés.`,
  levels:[
    { name:"Nombres y principio", desc:"Una oración con nombres de personas y lugares" },
    { name:"¡Cuidado con las trampas!", desc:"Días, meses e idiomas van con minúscula" },
    { name:"Después del punto", desc:"Dos oraciones: mayúscula después del punto" }
  ],
  names:[...NAMES, ...PLACES],
  make:capQuestion
};

/* ---------- Spanish vs English ---------- */
const ING_RULES = {
  cap:"En español los días de la semana, los meses, los idiomas y las nacionalidades se escriben con <b>minúscula</b>.",
  dbl:"En español casi nunca se repiten las consonantes. Solo se pueden repetir las de <b>Carolina</b>: <b>cc</b>, <b>rr</b>, <b>ll</b> y <b>nn</b>.",
  ph:"En español no existen <b>ph</b> ni <b>th</b>: se escribe <b>f</b> y <b>t</b>.",
  es:"En español ninguna palabra empieza por <b>s</b> + consonante: se pone una <b>e</b> delante (escuela, estudiante).",
  inm:"Delante de <b>m</b> se escribe <b>n</b> en las palabras que empiezan por <b>inm-</b>: inmediato, inmenso (nunca «imm»).",
  cua:"En español no se escribe <b>qua</b>, <b>quo</b> ni <b>que</b> con u que suena: se escribe <b>cua</b>, <b>cuo</b>, <b>cue</b> (cuarto, cuestión)."
};
/* english | spanish | wrong (English-style) spelling | rule | frame for capitals ("_" is the word) */
const ING = `Monday|lunes|Lunes|cap|Nos vemos el _ por la tarde.
  Tuesday|martes|Martes|cap|El _ tengo natación.
  Wednesday|miércoles|Miércoles|cap|Hoy es _.
  Thursday|jueves|Jueves|cap|El _ vamos al cine.
  Friday|viernes|Viernes|cap|Los _ cenamos pizza.
  Saturday|sábado|Sábado|cap|El _ no hay colegio.
  Sunday|domingo|Domingo|cap|El _ comemos con los abuelos.
  January|enero|Enero|cap|Mi cumpleaños es en _.
  February|febrero|Febrero|cap|En _ hace mucho frío.
  April|abril|Abril|cap|En _ llueve mucho.
  August|agosto|Agosto|cap|En _ vamos a la playa.
  September|septiembre|Septiembre|cap|El colegio empieza en _.
  December|diciembre|Diciembre|cap|La Navidad es en _.
  English|inglés|Inglés|cap|En el colegio hablo _.
  Spanish|español|Español|cap|En casa hablamos _.
  French|francés|Francés|cap|Mi tía estudia _.
  British|británico|Británico|cap|Mi vecino es _.
  class|clase|classe|dbl
  intelligent|inteligente|intelligente|dbl
  possible|posible|possible|dbl
  impossible|imposible|impossible|dbl
  different|diferente|differente|dbl
  professor|profesor|proffesor|dbl
  office|oficina|officina|dbl
  effect|efecto|effecto|dbl
  opportunity|oportunidad|opportunidad|dbl
  attention|atención|attención|dbl
  community|comunidad|communidad|dbl
  accept|aceptar|acceptar|dbl
  accident|accidente|acidente|dbl
  connect|conectar|connectar|dbl
  tennis|tenis|tennis|dbl
  grammar|gramática|grammática|dbl
  assistant|asistente|assistente|dbl
  photo|foto|photo|ph
  telephone|teléfono|teléphono|ph
  elephant|elefante|elephante|ph
  pharmacy|farmacia|pharmacia|ph
  alphabet|alfabeto|alphabeto|ph
  theatre|teatro|theatro|ph
  mathematics|matemáticas|mathemáticas|ph
  theme|tema|thema|ph
  thermometer|termómetro|thermómetro|ph
  geography|geografía|geographía|ph
  spelling|ortografía|orthographía|ph
  school|escuela|scuela|es
  student|estudiante|studiante|es
  special|especial|special|es
  station|estación|stación|es
  star|estrella|strella|es
  stomach|estómago|stómago|es
  statue|estatua|statua|es
  scene|escena|scena|es
  immediate|inmediato|immediato|inm
  immense|inmenso|immenso|inm
  immigrant|inmigrante|immigrante|inm
  quarter|cuarto|quarto|cua
  quantity|cantidad|quantidad|cua
  aquarium|acuario|aquario|cua
  question|cuestión|question|cua`.trim().split(/\n\s*/).map(l => { const [en, es, wrong, rule, frame] = l.split("|"); return { en, es, wrong, rule, frame }; });
const ingWhy = e => `Se escribe <b>${e.es}</b>. ${ING_RULES[e.rule]}`;
/* level 3: sentences with English-style mistakes. Slots: [right, wrong] */
const SLOT = {
  DAY:ING.filter(e => e.rule === "cap" && DAYS.includes(e.es)),
  MONTH:ING.filter(e => e.rule === "cap" && MONTHS.includes(e.es)),
  LANG:ING.filter(e => e.rule === "cap" && ["inglés", "español", "francés"].includes(e.es)),
  SUBJ:["matemáticas", "geografía", "ortografía", "teatro", "inglés"].map(w => ING.find(e => e.es === w)),
  PLACE_F:["escuela", "estación", "farmacia", "oficina"].map(w => ING.find(e => e.es === w)),
  THING_F:["foto"].map(w => ING.find(e => e.es === w)),
  ADJ:["inteligente", "diferente", "especial"].map(w => ING.find(e => e.es === w))
};
const ING_T = [
  "El {DAY} tengo clase de {SUBJ} .",
  "En {MONTH} fuimos a la {PLACE_F} con mi abuela .",
  "Mi profesor de {LANG} es muy {ADJ} .",
  "El {DAY} hicimos una {THING_F} en la {PLACE_F} .",
  "En {MONTH} empieza el curso de {SUBJ} .",
  "Mi prima habla {LANG} y es muy {ADJ} .",
  "Los {DAY} voy a la {PLACE_F} después de clase ."
];
function ingSentence(){
  const t = pick(ING_T).split(" "), slots = t.map((w, i) => /^\{/.test(w) ? i : -1).filter(i => i >= 0);
  const wrongAt = new Set(sample(slots, Math.min(2, slots.length)));
  const used = new Set(), tokens = [], answer = [], fixes = [];
  t.forEach((w, i) => {
    if (!/^\{/.test(w)){ tokens.push(w); return; }
    const cat = w.slice(1, -1);
    let e; do { e = pick(SLOT[cat]); } while (used.has(e.es) && SLOT[cat].length > 1);
    used.add(e.es);
    if (cat === "DAY" && tokens[tokens.length - 1] === "Los" && !e.es.endsWith("s")) e = SLOT.DAY.find(x => x.es === "viernes");   // "los sábado" doesn't work
    if (wrongAt.has(i)){ answer.push(tokens.length); tokens.push(e.wrong); fixes.push(e); }
    else tokens.push(e.es);
  });
  return { input:"words", text:"Hay palabras escritas <b>como en inglés</b>. Tócalas:", words:tokens, answer,
    explain:fixes.map(e => `<b>${e.wrong}</b> → <b>${e.es}</b>: ${ING_RULES[e.rule]}`).join("<br>"),
    solution:tokens.map((w, i) => answer.includes(i) ? fixes[answer.indexOf(i)].es : w).join(" ").replace(/ \./g, "."),
    key:"ing3" + tokens.join(" "), wrongs:fixes.filter(e => e.rule !== "cap").map(e => e.wrong) };
}
const ingles = {
  id:"or-ingles", name:"Español e inglés", emoji:"🇬🇧",
  desc:"Las trampas de escribir también en inglés: mayúsculas, letras dobles, ph, th…",
  rule:`Si escribes en inglés en el colegio, ¡cuidado con estas diferencias!
    <ul><li>Días, meses e idiomas con <b>minúscula</b>: lunes, enero, inglés.</li>
    <li>Casi nunca se repiten las consonantes: <b>clase</b>, <b>inteligente</b> (solo cc, rr, ll, nn: las letras de <b>Carolina</b>).</li>
    <li>No hay <b>ph</b> ni <b>th</b>: <b>foto</b>, <b>teatro</b>.</li>
    <li>Nada empieza por <b>s</b> + consonante: <b>escuela</b>, <b>estudiante</b>.</li>
    <li><b>inm-</b> y no imm-: <b>inmediato</b>. Y <b>cua</b>, no qua: <b>cuarto</b>.</li></ul>`,
  levels:[
    { name:"¿Cuál es la española?", desc:"Elige entre la forma española y la inglesa" },
    { name:"Escríbelo en español", desc:"Escribe la palabra en español: photo → foto" },
    { name:"Busca los errores", desc:"Toca las palabras escritas como en inglés" }
  ],
  entries:ING,
  make(level){
    if (level === 3) return ingSentence();
    const e = pick(ING);
    if (level === 1){
      if (e.rule === "cap"){
        const [a, b] = e.frame.split("_");
        return { input:"choice", text:`${esc(a)}<b>___</b>${esc(b)}`, choices:shuffle([e.es, e.wrong]), answer:e.es, explain:ingWhy(e), key:"ing1" + e.es };
      }
      return { input:"choice", text:"¿Cuál está bien escrita en español?", choices:shuffle([e.es, e.wrong]), answer:e.es, explain:ingWhy(e), key:"ing1" + e.es, wrongs:[e.wrong] };
    }
    if (e.rule === "cap"){
      const [a, b] = e.frame.split("_");
      return { input:"text", text:`Escribe <b>${e.en}</b> en español: <br>«${esc(a)}___${esc(b)}»`, answer:e.es, caseSensitive:true, explain:ingWhy(e), key:"ing2" + e.es };
    }
    return { input:"text", text:`¿Cómo se escribe en español? <b><i lang="en">${e.en}</i></b>`, answer:e.es, explain:ingWhy(e), key:"ing2" + e.es };
  }
};

/* ---------- the hyphen at the end of a line ---------- */
const GUION_WORDS = ("mariposa caballo ventana zapato bicicleta chocolate pelota tortuga montaña camiseta guitarra helado manzana naranja " +
  "zanahoria tomate ballena conejo gallina estrella mochila ordenador teléfono paraguas pájaro sombrero hormiga ardilla cocodrilo jirafa " +
  "abuela amigo oreja oveja aceite animal avión enano elefante escuela cuaderno pizarra calcetín bocadillo").split(" ");
const isVowel = c => "aeiouáéíóúü".includes(c);
/* the places a word can be split at the end of a line: between syllables, never leaving one vowel alone,
   and never between two vowels */
function guionCuts(word){
  const s = L4.silabas(word), cuts = [];
  let pos = 0;
  s.forEach((syl, k) => {
    pos += syl.length;
    if (k === s.length - 1) return;
    const lone = (k === 0 && s[0].length === 1 && isVowel(s[0])) || (k === s.length - 2 && s[k + 1].length === 1 && isVowel(s[k + 1]));
    const vv = isVowel(word[pos - 1]) && isVowel(word[pos]);
    cuts.push({ pos, ok:!lone && !vv, lone, vv });
  });
  return { s, cuts };
}
const split = (w, p) => w.slice(0, p) + "-" + w.slice(p);
function guionQuestion(level){
  if (level === 3){
    const w = pick(GUION_WORDS), s = L4.silabas(w).join("-");
    return { input:"text", keys:["-"], text:`Separa en sílabas con guiones: <b>${w}</b>`, answer:s, explain:`Las sílabas son <b>${s}</b>.`, key:"gu3" + w };
  }
  // level 2: words that start or end with a vowel on its own (a-bue-la): that split is a trap
  const pool = level === 2 ? GUION_WORDS.filter(w => guionCuts(w).cuts.some(c => c.lone)) : GUION_WORDS;
  for (let tries = 0; tries < 50; tries++){
    const w = pick(pool), { s, cuts } = guionCuts(w);
    const good = cuts.filter(c => c.ok);
    if (!good.length) continue;
    const syllableAt = new Set(cuts.map(c => c.pos));
    const inside = [];
    for (let p = 1; p < w.length; p++) if (!syllableAt.has(p)) inside.push(p);
    const right = pick(good);
    const wrong = level === 2 ? [cuts.find(c => c.lone).pos, pick(inside)] : sample(inside, 2);
    if (wrong.length < 2 || new Set(wrong).size < 2) continue;
    const choices = shuffle([split(w, right.pos), ...wrong.map(p => split(w, p))]);
    return { input:"choice", text:`Al final de una línea no cabe <b>${w}</b>. ¿Cómo se puede partir?`, choices, answer:split(w, right.pos),
      explain:`Se parte por sílabas: <b>${s.join("-")}</b>.` + (level === 2 ? " Y nunca se deja una vocal sola al principio o al final de la línea." : ""),
      key:"gu" + level + w };
  }
  throw new Error("no hyphen question");
}
const guion = {
  id:"or-guion", name:"El guion", emoji:"✂️",
  desc:"Partir una palabra al final de la línea.",
  rule:`Cuando una palabra no cabe al final de la línea, se parte con un <b>guion (-)</b>:
    <ul><li>Se parte <b>por sílabas</b>: mari-posa, mo-chila (nunca mar-iposa).</li>
    <li>No se deja <b>una vocal sola</b> al final o al principio de la línea: no a-buela, sino abue-la.</li></ul>`,
  levels:[
    { name:"Por sílabas", desc:"Elige dónde se puede partir la palabra" },
    { name:"Sin vocales solas", desc:"Cuidado: nunca una vocal sola" },
    { name:"Separa en sílabas", desc:"Escribe la palabra separada en sílabas" }
  ],
  words:GUION_WORDS,
  make:guionQuestion
};

/* ---------- dictado ---------- */
const RULE_SKILLS = [bv, gj, lly, rr, h, cz, sz, mn];
const DICT_WORDS = [...new Map(RULE_SKILLS.flatMap(s => s.entries).filter(e => e.word.length > 2).map(e => [e.word, e])).values()];
const DICT_PICS = DICT_WORDS.filter(e => e.emoji);
const ART = n => (n.g === "m" ? "el " : "la ") + n.w;
function dictado(level){
  const speak = L4.canSpeak();
  if (level === 3){
    const n = pick(L4.WORDS.nouns.filter(x => x.e && x.w !== "tijeras" && x.w !== "paraguas"));
    if (!speak) return { input:"text", picture:n.e, text:"Escribe el nombre <b>con su artículo</b> (el o la):", answer:ART(n),
      explain:`Es <b>${ART(n)}</b>.`, key:"dc3p" + n.w };
    const a = pick(L4.WORDS.adjectives), adj = n.g === "m" ? a.m : a.f, phrase = `${ART(n)} ${adj}`;
    return { input:"text", say:phrase, text:"Escucha y escribe:", answer:phrase, explain:`Se escribe <b>${phrase}</b>.`, key:"dc3s" + phrase };
  }
  const e = pick(level === 1 || !speak ? DICT_PICS : DICT_WORDS);
  const why = `Se escribe <b>${e.word}</b>.`;
  if (!speak) return { input:"text", picture:e.emoji, text:`Escribe el nombre: <b class="hint">${hint(e.word, e.at)}</b>`, answer:e.word, explain:why, key:"dcp" + e.word };
  return { input:"text", say:e.word, picture:level === 1 ? e.emoji : "", text:"Escucha y escribe la palabra:", answer:e.word, explain:why, key:"dcs" + e.word };
}
const dict = {
  id:"or-dictado", name:"Dictado", emoji:"🔊",
  desc:"Escucha y escribe: palabras de todas las reglas.",
  rule:`Toca 🔊 para oír la palabra otra vez. Piensa en la regla antes de escribir: ¿b o v? ¿lleva h? ¿ll o y?`,
  note:() => L4.canSpeak() ? "🔊 Este dispositivo puede leer en voz alta en español."
    : "🔇 Este dispositivo no tiene voz en español, así que el dictado usa dibujos. En la tablet se puede activar en Ajustes → Texto a voz → idioma español (España).",
  levels:[
    { name:"Palabras con dibujo", desc:"Oyes la palabra y ves su dibujo" },
    { name:"Palabras", desc:"Solo oyes la palabra" },
    { name:"Frases cortas", desc:"Un nombre con su artículo y un adjetivo" }
  ],
  make:dictado
};

L4.TOPICS.push({ id:"ortografia", title:"Ortografía", emoji:"✏️",
  skills:[bv, gj, lly, rr, h, cz, dz, sz, mn, may, ingles, guion, dict] });
})();
