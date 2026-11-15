/* Diccionario, Phase 6 of the roadmap.
   Alphabetical order uses the Spanish alphabet: ñ comes after n, and accents don't change the order (á = a, ü = u);
   since 2010 ch and ll are not separate letters. "La forma del diccionario" uses the plural maker and the verb
   conjugator of the Gramática topic (gramatica/skills.js must be loaded first). Dictionary entries are hand-written. */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, esc } = L4;

/* everyday words for ordering (all checked by the dictionary test) */
const POOL = ("abeja abrigo agua águila ala alumno amigo árbol arena arroz avión azul ballena balón banco barco bebé bicicleta boca bolsa bosque " +
  "botella brazo bruja burro caballo cabeza cabra cama camino camión campo canción cara carta casa castillo cebolla cena cereza cielo ciudad " +
  "coche cocina codo cohete columpio conejo corazón cuaderno cuchara cuento chocolate dado dedo delfín diente dinero dragón ducha elefante " +
  "escuela espejo estrella falda familia fiesta flor foca fresa fruta fuego galleta gallina gato gigante globo goma gorro guitarra helado " +
  "hermano hielo hoja hormiga huevo isla jabón jamón jardín jirafa juego juguete kilo lápiz leche león libro limón lobo luna llave lluvia " +
  "madre maleta mano manzana mapa mar mariposa mesa miel mochila mono montaña mosca muñeca música nariz naranja nido nieve niño noche nube " +
  "ñandú ñu oca oreja oso oveja padre pájaro pan papel parque pato pelota pera perro pez piano pie pizarra planta plátano playa pollo puerta " +
  "queso rana ratón regalo reloj río rosa rueda sal selva serpiente silla sol sopa taza teléfono tigre tijeras tomate tortuga tren uva " +
  "vaca vaso ventana verano viento violín yate yogur zanahoria zapato zorro").split(" ");
const coll = new Intl.Collator("es", { sensitivity:"base" });
const sortEs = ws => ws.slice().sort(coll.compare);
/* the position of the first letter where two words differ, ignoring accents */
const base = w => w.normalize("NFD").replace(/[́̈]/g, "").normalize("NFC");     // keeps ñ (n + ~)
const firstDiff = (a, b) => { a = base(a); b = base(b); let i = 0; while (i < a.length && a[i] === b[i]) i++; return i; };

/* 4 words that differ first at letter `pos` (0 = first letter) */
function groupAt(pos, n){
  for (let t = 0; t < 200; t++){
    const seed = pick(POOL), pre = base(seed).slice(0, pos);
    const cands = POOL.filter(w => base(w).startsWith(pre) && base(w).length > pos);
    const byLetter = new Map();
    for (const w of shuffle(cands.slice())) if (!byLetter.has(base(w)[pos])) byLetter.set(base(w)[pos], w);
    if (byLetter.size >= n) return sample([...byLetter.values()], n);
  }
  return null;
}
const ALPHABET = "a b c d e f g h i j k l m n ñ o p q r s t u v w x y z";
const alfabeto = {
  id:"di-alfabeto", name:"Orden alfabético", emoji:"🔤",
  desc:"Ordenar palabras como en el diccionario.",
  rule:`El abecedario español tiene 27 letras: <b>${ALPHABET}</b>.
    <ul><li>Se ordena por la <b>primera letra</b>; si es igual, por la <b>segunda</b>; si también es igual, por la <b>tercera</b>…</li>
    <li>La <b>ñ</b> va después de la <b>n</b>: nube, ñu.</li>
    <li>Las tildes no cuentan: <i>árbol</i> se ordena como <i>arbol</i>.</li>
    <li><b>ch</b> y <b>ll</b> no son letras aparte: <i>chocolate</i> va entre <i>casa</i> y <i>coche</i> (c + h).</li></ul>`,
  levels:[
    { name:"Primera letra", desc:"Las palabras empiezan por letras distintas" },
    { name:"Segunda letra", desc:"Empiezan por la misma letra" },
    { name:"Tercera letra", desc:"Las dos primeras letras son iguales" }
  ],
  pool:POOL,
  make(level){
    const ws = groupAt(level - 1, level === 3 ? 3 : 4) || groupAt(0, 4);
    const right = sortEs(ws), pos = firstDiff(right[0], right[1]);
    return { input:"order", text:"Ordena las palabras en <b>orden alfabético</b>:", items:right,
      explain:`<b>${right.join(", ")}</b>. Mira la ${["primera", "segunda", "tercera", "cuarta"][Math.min(pos, 3)]} letra: ${right.map(w => `<b>${esc(base(w)[pos] || "")}</b>`).join(", ")}.`, key:"al" + right.join(" ") };
  }
};

/* ---------- palabras guía ---------- */
const SORTED = sortEs(POOL);
const guia = {
  id:"di-guia", name:"Palabras guía", emoji:"📑",
  desc:"Las dos palabras de arriba de cada página del diccionario.",
  rule:`Arriba de cada página del diccionario hay dos <b>palabras guía</b>: la primera y la última de esa página.
    Una palabra está en esa página si va <b>después</b> de la primera y <b>antes</b> de la última en orden alfabético.`,
  levels:[
    { name:"¿Está en esta página?", desc:"Sí o no" },
    { name:"¿En qué página?", desc:"Elige la página" },
    { name:"Más difícil", desc:"Palabras que se parecen más" }
  ],
  make(level){
    if (level === 2){
      // three pages in a row; which one has the word?
      for (let t = 0; t < 100; t++){
        const i = Math.floor(Math.random() * (SORTED.length - 12)), pages = [[i, i + 3], [i + 4, i + 7], [i + 8, i + 11]];
        const k = Math.floor(Math.random() * 3), [a, b] = pages[k], w = SORTED[a + 1 + Math.floor(Math.random() * 2)];
        const label = ([x, y]) => `${SORTED[x]} — ${SORTED[y]}`;
        return { input:"choice", text:`¿En qué página está <b>${esc(w)}</b>?`, choices:pages.map(label), answer:label(pages[k]),
          explain:`<b>${w}</b> va entre <b>${SORTED[a]}</b> y <b>${SORTED[b]}</b>.`, key:"gu2" + w };
      }
    }
    // a page of words a..b; the word is either between them or outside
    const span = level === 1 ? 8 : 4;
    const i = Math.floor(Math.random() * (SORTED.length - span - 1)), a = SORTED[i], b = SORTED[i + span];
    const inside = Math.random() < .5;
    let w;
    if (inside) w = SORTED[i + 1 + Math.floor(Math.random() * (span - 1))];
    else {
      const far = level === 1 ? SORTED.filter((x, j) => (j < i - 8 || j > i + span + 8)) : SORTED.filter((x, j) => j === i - 1 || j === i - 2 || j === i + span + 1 || j === i + span + 2);
      w = pick(far.length ? far : SORTED.filter((x, j) => j < i || j > i + span));
    }
    return { input:"choice", text:`Las palabras guía de una página son <b>${esc(a)}</b> y <b>${esc(b)}</b>.<br>¿Está <b>${esc(w)}</b> en esa página?`,
      choices:["sí", "no"], answer:inside ? "sí" : "no",
      explain:inside ? `Sí: <b>${w}</b> va después de ${a} y antes de ${b}.` : `No: <b>${w}</b> va ${coll.compare(w, a) < 0 ? `antes de ${a}` : `después de ${b}`}.`, key:"gu" + level + a + w };
  }
};

/* ---------- la forma del diccionario ---------- */
const NOUNS = L4.WORDS.nouns.filter(n => !n.w.endsWith("s") && !["niño", "niña", "abuelo", "abuela"].includes(n.w)).map(n => n.w);
const ADJS = L4.WORDS.adjectives;
function formaQ(kind){
  const G = L4.TOPICS.find(t => t.id === "gramatica");
  if (kind === "n"){
    const w = pick(NOUNS), p = L4.plural(w);
    return { shown:p, lemma:w, why:`Los sustantivos aparecen en <b>singular</b>: ${p} → <b>${w}</b>.` };
  }
  if (kind === "a"){
    const a = pick(ADJS), forms = [...new Set([a.f, L4.plural(a.m), L4.plural(a.f)])].filter(x => x !== a.m);
    const shown = pick(forms);
    return { shown, lemma:a.m, why:`Los adjetivos aparecen en <b>masculino singular</b>: ${shown} → <b>${a.m}</b>.` };
  }
  const f = pick(G.skills.find(s => s.id === "gr-verbo").forms.filter(x => x.f !== x.inf));
  return { shown:f.f, lemma:f.inf, why:`Los verbos aparecen en <b>infinitivo</b>: ${f.f} → <b>${f.inf}</b>.` };
}
const forma = {
  id:"di-forma", name:"La forma del diccionario", emoji:"🔍",
  desc:"Cómo buscar una palabra: perros → perro, blancas → blanco, corrían → correr.",
  rule:`En el diccionario las palabras no aparecen de cualquier forma:
    <ul><li>Los <b>sustantivos</b>, en <b>singular</b>: <i>perros</i> → busca <b>perro</b>.</li>
    <li>Los <b>adjetivos</b>, en <b>masculino singular</b>: <i>blancas</i> → busca <b>blanco</b>.</li>
    <li>Los <b>verbos</b>, en <b>infinitivo</b>: <i>corrían</i> → busca <b>correr</b>.</li></ul>`,
  levels:[
    { name:"Sustantivos", desc:"¿Cómo se busca? perros → perro" },
    { name:"Adjetivos", desc:"blancas → blanco" },
    { name:"Verbos y mezcla", desc:"corrían → correr" }
  ],
  make(level){
    const kind = level === 1 ? "n" : level === 2 ? "a" : pick(["v", "v", "n", "a"]);
    const { shown, lemma, why } = formaQ(kind);
    return { input:"text", text:`Quieres buscar <b>${esc(shown)}</b> en el diccionario. ¿Qué palabra buscas?`, answer:lemma, explain:why, key:"fo" + shown };
  }
};

/* ---------- elegir la acepción ---------- */
/* word: [meanings], [[sentence, number of the meaning (1, 2, 3)]] — written by hand */
const ENTRIES = {
  hoja:[["Parte verde y plana de las plantas.", "Trozo de papel.", "Parte que corta de un cuchillo."],
    [["En otoño caen las hojas de los árboles.", 1], ["Dibuja un círculo en la hoja.", 2], ["La hoja de este cuchillo corta mucho.", 3]]],
  banco:[["Asiento largo para varias personas.", "Empresa que guarda y presta dinero.", "Grupo grande de peces que nadan juntos."],
    [["Nos sentamos en un banco del parque.", 1], ["Mi tía trabaja en un banco y cuenta billetes.", 2], ["Desde el barco vimos un banco de sardinas.", 3]]],
  planta:[["Ser vivo que crece en la tierra y no se mueve.", "Cada uno de los pisos de un edificio.", "Parte de abajo del pie."],
    [["Riego las plantas del balcón.", 1], ["La biblioteca está en la segunda planta.", 2], ["Me pica la planta del pie.", 3]]],
  cola:[["Parte final del cuerpo de algunos animales.", "Fila de personas que esperan.", "Pegamento."],
    [["El gato mueve la cola.", 1], ["Hicimos cola para comprar las entradas.", 2], ["Pegué el dibujo con cola.", 3]]],
  pico:[["Boca dura y puntiaguda de las aves.", "Parte más alta de una montaña.", "Herramienta para cavar."],
    [["El loro abre el pico.", 1], ["Subimos hasta el pico más alto.", 2], ["Los obreros cavan con un pico.", 3]]],
  sierra:[["Herramienta con dientes para cortar madera.", "Grupo de montañas."],
    [["Mi abuelo corta la madera con una sierra.", 1], ["Este verano vamos de excursión a la sierra.", 2]]],
  gato:[["Animal doméstico de cuatro patas que maúlla.", "Herramienta para levantar un coche."],
    [["El gato duerme en el sofá.", 1], ["Para cambiar la rueda necesitamos un gato.", 2]]],
  ratón:[["Animal pequeño de cola larga.", "Aparato que se mueve con la mano para manejar el ordenador."],
    [["El ratón se comió el queso.", 1], ["Haz clic con el ratón.", 2]]],
  muñeca:[["Juguete con forma de persona.", "Parte del cuerpo que une la mano con el brazo."],
    [["Mi prima juega con su muñeca.", 1], ["Llevo el reloj en la muñeca.", 2]]],
  lengua:[["Parte de la boca que sirve para saborear y hablar.", "Idioma."],
    [["El perro saca la lengua.", 1], ["El español es la lengua de muchos países.", 2]]]
};
const entryHtml = (w, means) => `<div class="entry"><b>${esc(w)}</b> ${means.map((m, i) => `<span><b>${i + 1}.</b> ${esc(m)}</span>`).join(" ")}</div>`;
const acepcion = {
  id:"di-acepcion", name:"Elige el significado", emoji:"📚",
  desc:"Una palabra puede tener varios significados (acepciones): elige el que va en la oración.",
  rule:`Muchas palabras tienen varios significados. En el diccionario aparecen <b>numerados</b>: son las <b>acepciones</b>.
    Para saber cuál es, lee la oración y prueba cada significado en su lugar.`,
  levels:[
    { name:"Dos significados", desc:"Entradas con dos acepciones" },
    { name:"Tres significados", desc:"Entradas con tres acepciones" },
    { name:"El número", desc:"Di el número de la acepción" }
  ],
  entries:ENTRIES,
  make(level){
    const words = Object.keys(ENTRIES).filter(w => level === 1 ? ENTRIES[w][0].length === 2 : level === 2 ? ENTRIES[w][0].length === 3 : true);
    const w = pick(words), [means, sents] = ENTRIES[w], [s, n] = pick(sents);
    const q = { picture:entryHtml(w, means), text:`«${esc(s)}»<br>¿Qué significa aquí <b>${esc(w)}</b>?`, explain:`Aquí es la acepción <b>${n}</b>: ${esc(means[n - 1])}`, key:"ac" + s };
    if (level < 3) return Object.assign(q, { input:"choice", choices:means.slice(), answer:means[n - 1] });
    return Object.assign(q, { input:"choice", text:`«${esc(s)}»<br>¿Qué número de acepción es?`, choices:means.map((m, i) => String(i + 1)), answer:String(n) });
  }
};

L4.TOPICS.push({ id:"diccionario", title:"Diccionario", emoji:"📖", skills:[alfabeto, guia, forma, acepcion] });
})();
