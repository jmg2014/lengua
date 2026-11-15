/* Literatura y lenguas, Phase 8 of the roadmap.
   Every text here is written by hand for the app (no copied poems). Verse lengths are labelled by hand AND worked out
   by medida() (syllables + sinalefa + the last word); tests/skills.html makes sure both agree. Rhymes are worked out
   from the stressed vowel. */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, esc } = L4;
const cap = s => s[0].toLocaleUpperCase("es") + s.slice(1);

/* ---------- 1. géneros: narrativa, lírica, teatro; prosa o verso ---------- */
/* [genre, prose or verse, lines] */
const FRAGS = [
  ["narrativa", "prosa", ["Había una vez un niño que quería tocar las nubes. Cada mañana subía a la colina más alta del pueblo y estiraba los brazos todo lo que podía."]],
  ["narrativa", "prosa", ["Aquella noche, la gata Luna salió al tejado. Desde allí vio una luz extraña en el jardín del vecino y decidió ir a investigar."]],
  ["narrativa", "prosa", ["El tren llegó a la estación con dos horas de retraso. Marta bajó con su maleta y buscó a su abuela entre la gente."]],
  ["lírica", "verso", ["La lluvia canta en el tejado,", "la tarde se ha quedado gris,", "y en el cristal empañado", "dibujo un gato feliz."]],
  ["lírica", "verso", ["Mi mar azul, mi mar salado,", "te miro desde la arena;", "las olas vienen a mi lado", "y se llevan mi pena."]],
  ["lírica", "verso", ["Duerme la luna en el río,", "duerme el viento en el pinar,", "y yo, con mi gorro de frío,", "me quedo a verlas pasar."]],
  ["teatro", "prosa", ["LUCÍA. —¿Quién anda ahí?", "(Se acerca despacio a la puerta.)", "PABLO. —Soy yo. ¡No te asustes!"]],
  ["teatro", "prosa", ["ABUELO. —¿Habéis visto mis gafas?", "(Los niños se miran y se ríen.)", "NIETA. —¡Las llevas en la cabeza, abuelo!"]],
  ["teatro", "prosa", ["REY. —Que venga el cocinero ahora mismo.", "(Entra el cocinero con una tarta enorme.)", "COCINERO. —Majestad, aquí tiene su postre."]]
];
const GEN_WHY = { narrativa:"Es <b>narrativa</b>: cuenta una historia, con personajes y hechos.", lírica:"Es <b>lírica</b> (poesía): expresa sentimientos, en verso y con rima.",
  teatro:"Es <b>teatro</b>: los personajes hablan (diálogo) y entre paréntesis están las <b>acotaciones</b>, que explican lo que hacen." };
const FEATURES = [["¿Qué tiene una obra de teatro?", "diálogos y acotaciones", ["versos con rima", "un narrador que lo cuenta todo"]],
  ["¿Qué tiene un poema?", "versos, a menudo con rima", ["acotaciones entre paréntesis", "capítulos"]],
  ["¿Qué tiene un cuento o una novela?", "un narrador que cuenta una historia", ["acotaciones entre paréntesis", "versos con rima"]],
  ["¿Cómo se llaman los textos escritos en renglones seguidos, como los cuentos?", "prosa", ["verso", "estrofa"]],
  ["¿Cómo se llama cada línea de un poema?", "verso", ["párrafo", "acotación"]],
  ["¿Cómo se llama un grupo de versos?", "estrofa", ["capítulo", "acto"]],
  ["¿En qué partes se divide una obra de teatro?", "en actos", ["en estrofas", "en versos"]],
  ["¿Quién cuenta la historia en un cuento?", "el narrador", ["el actor", "el lector"]],
  ["¿Cómo se llaman las explicaciones entre paréntesis de una obra de teatro?", "acotaciones", ["estrofas", "rimas"]],
  ["¿Cómo se llama lo que se dicen los personajes en el teatro?", "diálogo", ["estrofa", "rima"]]];
const box = lines => `<div class="texto">${lines.map(l => `<p>${esc(l)}</p>`).join("")}</div>`;
const generos = {
  id:"li-generos", name:"Narrativa, lírica y teatro", emoji:"🎭",
  desc:"Los tres géneros literarios, y la diferencia entre prosa y verso.",
  rule:`<ul><li><b>Narrativa</b> (cuentos, novelas): un narrador cuenta una historia. Suele ir en <b>prosa</b> (renglones seguidos).</li>
    <li><b>Lírica</b> (poemas): expresa sentimientos. Va en <b>verso</b> (cada línea es un verso) y los versos se agrupan en <b>estrofas</b>.</li>
    <li><b>Teatro</b>: los personajes hablan entre ellos (<b>diálogo</b>) y las <b>acotaciones</b>, entre paréntesis, dicen lo que hacen.</li></ul>`,
  levels:[
    { name:"¿Qué género es?", desc:"Narrativa, lírica o teatro" },
    { name:"¿Prosa o verso?", desc:"Mira cómo está escrito" },
    { name:"Sus partes", desc:"Diálogo, acotación, verso, estrofa…" }
  ],
  frags:FRAGS, features:FEATURES,
  make(level){
    if (level === 3){
      const [q, a, wrong] = pick(FEATURES);
      return { input:"choice", text:q, choices:shuffle([a, ...wrong]), answer:a, explain:`<b>${cap(a)}</b>.`, key:"ge3" + q };
    }
    const [g, pv, lines] = pick(FRAGS);
    if (level === 1) return { input:"choice", picture:box(lines), text:"¿A qué género pertenece?", choices:["narrativa", "lírica", "teatro"], answer:g, explain:GEN_WHY[g], key:"ge1" + lines[0] };
    return { input:"choice", picture:box(lines), text:"¿Está escrito en prosa o en verso?", choices:["prosa", "verso"], answer:pv,
      explain:pv === "verso" ? "Está en <b>verso</b>: cada línea es un verso, y no llegan hasta el final del renglón." : "Está en <b>prosa</b>: las frases siguen en el renglón siguiente.", key:"ge2" + lines[0] };
  }
};

/* ---------- 2. medida de los versos ---------- */
const VOWEL = "aeiouáéíóúü";
const startsVowel = w => { const l = w.toLowerCase(); return VOWEL.includes(l[0]) || (l[0] === "h" && VOWEL.includes(l[1] || "")) || l === "y"; };
const endsVowel = w => { const l = w.toLowerCase(); return VOWEL.includes(l[l.length - 1]) || l === "y"; };
/* metric syllables: count syllables, join a word ending in a vowel with the next one starting with a vowel (sinalefa),
   then +1 if the last word is aguda, −1 if it is esdrújula */
function medida(verse){
  const ws = verse.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, "").split(/\s+/).filter(Boolean);
  let n = 0, sin = 0;
  ws.forEach((w, i) => { n += L4.silabas(w).length; if (i > 0 && endsVowel(ws[i - 1]) && startsVowel(w)) sin++; });
  const last = L4.tipoAcento(ws[ws.length - 1]), adj = last === "aguda" ? 1 : last === "esdrújula" ? -1 : 0;
  return { total:n - sin + adj, syll:n, sin, adj, last, ws };
}
L4.medida = medida;
/* [verse, metric syllables counted by hand]. Level 1: no sinalefa and the last word llana; level 2: with sinalefas; level 3: the last word aguda or esdrújula */
const VERSOS = {
  1:[["Mi gato duerme tranquilo", 8], ["La luna sale de noche", 8], ["Las flores son de colores", 8], ["El sol calienta la playa", 8],
     ["Mi perro tiene cien pulgas", 8], ["Los niños juegan contentos", 8], ["La nube pasa lenta", 7], ["El tren se va de viaje", 7]],
  2:[["Corre el río por el monte", 8], ["Tengo una casa en el campo", 8], ["La abuela cuenta un cuento", 7], ["Canta el agua en la fuente", 7],
     ["Sale el sol y se esconde", 7], ["Duerme el búho en el árbol", 7], ["Mira el cielo de la tarde", 8], ["Baila la niña en la plaza", 8], ["Pinto un árbol muy lejano", 8]],
  3:[["La luna brilla en el mar", 8], ["Mi perro come jamón", 8], ["Las olas del mar azul", 8], ["Mi casa tiene un jardín", 8],
     ["Vuela alto el pájaro", 5], ["Canta un pájaro", 4], ["El viento sopla veloz", 8], ["Mi abuela toca el tambor", 8]]
};
function explainMedida(v){
  const m = medida(v);
  const parts = m.ws.map(w => L4.silabas(w).join("-")).join(" ");
  let s = `${esc(parts)}: ${m.syll} sílabas`;
  if (m.sin) s += `, menos ${m.sin} por sinalefa${m.sin > 1 ? "s" : ""} (una vocal al final de una palabra se une con la vocal del principio de la siguiente)`;
  if (m.adj === 1) s += `, más 1 porque la última palabra es aguda`;
  if (m.adj === -1) s += `, menos 1 porque la última palabra es esdrújula`;
  return m.sin || m.adj ? s + ` = <b>${m.total}</b>.` : `${esc(parts)}: <b>${m.total}</b> sílabas.`;
}
const medidaSkill = {
  id:"li-medida", name:"Medida de los versos", emoji:"📏",
  desc:"Contar las sílabas de un verso.",
  rule:`Para medir un verso se cuentan sus sílabas, con tres reglas:
    <ul><li><b>Sinalefa</b>: si una palabra acaba en vocal y la siguiente empieza por vocal (o por h), se cuentan como una sola sílaba: <i>cor-re‿el</i>.</li>
    <li>Si la última palabra es <b>aguda</b>, se suma 1: <i>la-lu-na-bri-lla‿en-el-mar</i> = 7 + 1 = 8.</li>
    <li>Si la última palabra es <b>esdrújula</b>, se resta 1.</li></ul>`,
  levels:[
    { name:"Contar sílabas", desc:"Sin sinalefas y acabados en palabra llana" },
    { name:"Sinalefas", desc:"Vocales que se juntan entre palabras" },
    { name:"La última palabra", desc:"Acabados en aguda (+1) o esdrújula (−1)" }
  ],
  versos:VERSOS,
  make(level){
    const [v, n] = pick(VERSOS[level]), choices = [n - 1, n, n + 1].map(String);
    return { input:"choice", text:`«${esc(v)}»<br>¿Cuántas sílabas tiene este verso?`, choices, answer:String(n), explain:explainMedida(v), key:"me" + v };
  }
};

/* ---------- 3. la rima ---------- */
/* the rhyming part of a word: from its stressed vowel to the end (no accents) */
function rimaDe(w){
  const s = L4.silabas(w), k = L4.tonica(w), v = L4.vocalTonica(s[k]);
  const before = s.slice(0, k).join("").length;
  return L4.sinTilde(w.slice(before + v)).toLowerCase();
}
/* the vowels that count for asonante rhyme: leaving out the weak vowel of a diphthong (tierra → e, a),
   and in esdrújulas only the stressed and the last vowel */
function vocales(end){
  const out = [];
  for (let i = 0; i < end.length; i++){
    const c = end[i];
    if (!"aeiou".includes(c)) continue;
    const prev = end[i - 1], next = end[i + 1];
    if ("iu".includes(c) && ((next && "aeo".includes(next)) || (prev && "aeo".includes(prev)))) continue;   // weak vowel next to a strong one
    out.push(c);
  }
  return (out.length > 2 ? [out[0], out[out.length - 1]] : out).join("");   // in esdrújulas only the stressed and the last vowel count (pájaro: á-o)
}
function rima(a, b){
  const ra = rimaDe(a), rb = rimaDe(b);
  if (ra === rb) return "consonante";
  if (vocales(ra) === vocales(rb)) return "asonante";
  return "no riman";
}
L4.rima = rima;
const RIMA_WORDS = ["ventana", "campana", "manzana", "semana", "ratón", "balón", "camión", "corazón", "canción", "cielo", "pelo", "suelo", "hielo", "abuelo",
  "gato", "pato", "plato", "zapato", "luna", "cuna", "laguna", "flor", "color", "calor", "tambor", "estrella", "botella", "huella",
  "casa", "playa", "rana", "mapa", "perro", "puerta", "tierra", "fiesta", "libro", "niño", "árbol", "jardín", "mar", "sol", "camino", "pájaro", "mesa", "nube"];
/* couplets: the last word is missing. right, then two words that make sense but don't rhyme */
const PAREADOS = [
  ["Por la noche sale la luna,", "y el bebé duerme en su ___.", "cuna", "cama", "casa"],
  ["Mi gato se llama Rayo,", "y nació en el mes de ___.", "mayo", "enero", "junio"],
  ["En el jardín hay una flor", "de un precioso ___.", "color", "tamaño", "perfume"],
  ["Me gusta mucho el verano,", "ir a la playa con mi ___.", "hermano", "padre", "amiga"],
  ["Las olas del mar", "no paran de ___.", "bailar", "subir", "moverse"],
  ["Una estrella en el cielo", "brilla sobre el ___.", "suelo", "mar", "tejado"],
  ["Mi amigo es un ratón", "que vive en un ___.", "cajón", "armario", "jardín"],
  ["La nieve cae despacio", "sobre el viejo ___.", "palacio", "camino", "puente"],
  ["En la cocina hay un plato", "y debajo duerme el ___.", "gato", "perro", "niño"],
  ["Mi abuelo tiene un tambor", "que suena con mucho ___.", "calor", "ruido", "fuerza"]
];
const RIMA_WHY = { consonante:"riman en <b>consonante</b>: desde la vocal que suena más fuerte, todas las letras son iguales",
  asonante:"riman en <b>asonante</b>: desde la vocal que suena más fuerte, solo coinciden las vocales", "no riman":"<b>no riman</b>: desde la vocal que suena más fuerte, no coinciden" };
const rimaSkill = {
  id:"li-rima", name:"La rima", emoji:"🎶",
  desc:"Rima consonante y asonante, y completar un poema.",
  rule:`Dos versos <b>riman</b> cuando sus últimas palabras suenan igual desde la vocal que suena más fuerte:
    <ul><li><b>Rima consonante</b>: son iguales todas las letras: ventana / mañana, ratón / canción.</li>
    <li><b>Rima asonante</b>: solo son iguales las vocales: casa / playa (a-a), perro / cielo (e-o).</li></ul>`,
  levels:[
    { name:"¿Riman?", desc:"¿Riman estas dos palabras?" },
    { name:"¿Consonante o asonante?", desc:"¿Cómo riman?" },
    { name:"Completa el poema", desc:"Elige la palabra que rima" }
  ],
  words:RIMA_WORDS, pareados:PAREADOS,
  make(level){
    if (level === 3){
      const [l1, l2, right, ...bad] = pick(PAREADOS), last = l1.split(" ").pop().replace(/[,.]/g, "");
      return { input:"choice", picture:box([l1, l2]), text:"¿Qué palabra completa el poema con rima?", choices:shuffle([right, ...bad]), answer:right,
        explain:`<b>${right}</b> rima con <i>${last}</i>.`, key:"ri3" + l1 };
    }
    // pick a pair: about half of them rhyme
    for (let t = 0; t < 200; t++){
      const a = pick(RIMA_WORDS), b = pick(RIMA_WORDS.filter(x => x !== a)), r = rima(a, b);
      if (level === 2 && r === "no riman") continue;
      if (level === 1 && r === "no riman" && Math.random() < .5) continue;
      const why = `<b>${a}</b> y <b>${b}</b> ${RIMA_WHY[r]} (-${rimaDe(a)} / -${rimaDe(b)}).`;
      if (level === 1) return { input:"choice", text:`¿Riman <b>${a}</b> y <b>${b}</b>?`, choices:["sí", "no"], answer:r === "no riman" ? "no" : "sí", explain:why, key:"ri1" + a + b };
      return { input:"choice", text:`<b>${a}</b> y <b>${b}</b> riman en…`, choices:["consonante", "asonante"], answer:r, explain:why, key:"ri2" + a + b };
    }
    throw new Error("no pair");
  }
};

/* ---------- 4. recursos literarios ---------- */
/* [sentence, device, the two things compared or the human action] */
const RECURSOS = [
  ["Tus ojos son azules como el mar.", "comparación", "los ojos", "el mar"],
  ["Mi hermano corre como un guepardo.", "comparación", "mi hermano", "un guepardo"],
  ["La nieve era blanca como el azúcar.", "comparación", "la nieve", "el azúcar"],
  ["Su pelo brilla como el oro.", "comparación", "su pelo", "el oro"],
  ["Las nubes parecían algodón.", "comparación", "las nubes", "algodón"],
  ["El bebé duerme como un angelito.", "comparación", "el bebé", "un angelito"],
  ["La luna sonríe desde el cielo.", "personificación", "la luna", "sonríe"],
  ["El viento canta entre los árboles.", "personificación", "el viento", "canta"],
  ["Las flores bailan con la brisa.", "personificación", "las flores", "bailan"],
  ["El sol se despertó muy temprano.", "personificación", "el sol", "se despertó"],
  ["La tormenta gritaba en la noche.", "personificación", "la tormenta", "gritaba"],
  ["Las estrellas nos guiñan un ojo.", "personificación", "las estrellas", "nos guiñan un ojo"],
  ["Mi perro come pienso todos los días.", "ninguno", "", ""],
  ["Mañana iremos al cine con mis primos.", "ninguno", "", ""],
  ["La casa de mi abuela tiene un jardín.", "ninguno", "", ""]
];
const REC_WHY = { comparación:"Es una <b>comparación</b>: compara dos cosas con <i>como</i> o <i>parece</i>.",
  personificación:"Es una <b>personificación</b>: algo que no es una persona hace algo que solo hacen las personas.", ninguno:"<b>No hay</b> ningún recurso: dice las cosas tal como son." };
const recursos = {
  id:"li-recursos", name:"Comparación y personificación", emoji:"✨",
  desc:"Dos recursos literarios para que lo que escribimos sea más bonito.",
  rule:`<ul><li><b>Comparación</b>: se dice que algo se parece a otra cosa, con <i>como</i>, <i>parece</i>…: <i>Tus ojos son azules <b>como</b> el mar</i>.</li>
    <li><b>Personificación</b>: algo que no es una persona hace cosas de personas: <i>La luna <b>sonríe</b></i>, <i>el viento <b>canta</b></i>.</li></ul>`,
  levels:[
    { name:"¿Cuál es?", desc:"¿Comparación o personificación?" },
    { name:"¿Hay alguno?", desc:"Comparación, personificación o ninguno" },
    { name:"Míralo de cerca", desc:"¿Qué se compara? ¿Qué hace como una persona?" }
  ],
  recursos:RECURSOS,
  make(level){
    const pool = level === 1 ? RECURSOS.filter(r => r[1] !== "ninguno") : level === 2 ? RECURSOS : RECURSOS.filter(r => r[1] !== "ninguno");
    const [s, d, a, b] = pick(pool);
    if (level < 3){
      const choices = level === 1 ? ["comparación", "personificación"] : ["comparación", "personificación", "ninguno"];
      return { input:"choice", text:`«${esc(s)}»`, choices, answer:d, explain:REC_WHY[d], key:"re" + level + s };
    }
    const others = RECURSOS.filter(r => r[1] === d && r[0] !== s).map(r => r[3]);
    const n = /^(los|las) /.test(a) ? "n" : "";                    // "se comparan los ojos"
    if (d === "comparación") return { input:"choice", text:`«${esc(s)}»<br>¿Con qué se compara${n} <b>${a}</b>?`, choices:shuffle([b, ...sample(others, 2)]), answer:b,
      explain:`Se compara${n} <b>${a}</b> con <b>${b}</b>.`, key:"re3" + s };
    return { input:"choice", text:`«${esc(s)}»<br>¿Qué hace <b>${a}</b> como si fuera una persona?`, choices:shuffle([b, ...sample(others, 2)]), answer:b,
      explain:`<b>${cap(a)}</b> ${b}: eso lo hacen las personas.`, key:"re3" + s };
  }
};

/* ---------- 5. autores y obras ---------- */
/* author, work, genre (for level 3; "" when it doesn't fit one word), a fact */
const AUTORES = [
  ["Miguel de Cervantes", "Don Quijote de la Mancha", "novela", ["¿Cómo se llama el escudero de don Quijote?", "Sancho Panza", "Platero", "Rocinante"]],
  ["Juan Ramón Jiménez", "Platero y yo", "", ["¿Qué animal es Platero?", "un burro", "un caballo", "un perro"]],
  ["Lope de Vega", "Fuenteovejuna", "teatro", null],
  ["Calderón de la Barca", "La vida es sueño", "teatro", null],
  ["Federico García Lorca", "Romancero gitano", "", ["¿De qué región de España era Federico García Lorca?", "Andalucía", "Galicia", "Cataluña"]],
  ["Antonio Machado", "Campos de Castilla", "poesía", null],
  ["Gustavo Adolfo Bécquer", "Rimas y leyendas", "poesía", null],
  ["Rosalía de Castro", "Cantares gallegos", "poesía", ["¿En qué lengua escribió Rosalía de Castro sus «Cantares gallegos»?", "gallego", "catalán", "euskera"]],
  ["Gloria Fuertes", "Doña Pito Piturra", "poesía", ["¿Para quién escribió muchos de sus poemas Gloria Fuertes?", "para niños", "para reyes", "para soldados"]]
];
const autores = {
  id:"li-autores", name:"Autores y obras", emoji:"🖋️",
  desc:"Grandes escritores de la literatura española y sus obras.",
  rule:`Algunos de los escritores más importantes en español:
    <ul><li><b>Miguel de Cervantes</b>: <i>Don Quijote de la Mancha</i>, la novela más famosa en español.</li>
    <li><b>Lope de Vega</b> y <b>Calderón de la Barca</b>: teatro (<i>Fuenteovejuna</i>, <i>La vida es sueño</i>).</li>
    <li><b>Bécquer</b> (<i>Rimas y leyendas</i>), <b>Rosalía de Castro</b> (<i>Cantares gallegos</i>), <b>Antonio Machado</b> (<i>Campos de Castilla</i>) y <b>Federico García Lorca</b> (<i>Romancero gitano</i>): poesía.</li>
    <li><b>Juan Ramón Jiménez</b>: <i>Platero y yo</i>, la historia de un burrito. · <b>Gloria Fuertes</b>: poemas para niños.</li></ul>`,
  levels:[
    { name:"¿Quién la escribió?", desc:"De la obra al autor" },
    { name:"¿Qué escribió?", desc:"Del autor a la obra" },
    { name:"Más cosas", desc:"Novela, poesía o teatro, y algunos detalles" }
  ],
  autores:AUTORES,
  make(level){
    if (level === 3){
      const withFact = AUTORES.filter(a => a[3]), withGenre = AUTORES.filter(a => a[2]);
      if (Math.random() < .5){
        const [au, work, , [q, right, ...bad]] = pick(withFact);
        return { input:"choice", text:q, choices:shuffle([right, ...bad]), answer:right, explain:`<b>${cap(right)}</b>.`, key:"au3f" + q };
      }
      const [au, work, genre] = pick(withGenre);
      return { input:"choice", text:`¿Qué escribió sobre todo <b>${au}</b>?`, choices:["novela", "poesía", "teatro"], answer:genre,
        explain:`${au} escribió sobre todo <b>${genre}</b>, como <i>${work}</i>.`, key:"au3g" + au };
    }
    const [au, work] = pick(AUTORES), others = sample(AUTORES.filter(a => a[0] !== au), 2);
    if (level === 1) return { input:"choice", text:`¿Quién escribió <i>${work}</i>?`, choices:shuffle([au, ...others.map(a => a[0])]), answer:au, explain:`<i>${work}</i> es de <b>${au}</b>.`, key:"au1" + au };
    return { input:"choice", text:`¿Qué obra escribió <b>${au}</b>?`, choices:shuffle([work, ...others.map(a => a[1])]), answer:work, explain:`<b>${au}</b> escribió <i>${work}</i>.`, key:"au2" + au };
  }
};

/* ---------- 6. lenguas de España y el español en el mundo ---------- */
const REGIONS = [["Galicia", "gallego"], ["Cataluña", "catalán"], ["las Islas Baleares", "catalán"], ["la Comunidad Valenciana", "valenciano"],
  ["el País Vasco", "euskera"], ["Navarra", "euskera"]];
const LANGS = ["gallego", "catalán", "valenciano", "euskera"];
/* how to say "good morning" and "thank you" */
const GREET = [["Bon dia", "catalán"], ["Gràcies", "catalán"], ["Bos días", "gallego"], ["Grazas", "gallego"], ["Egun on", "euskera"], ["Eskerrik asko", "euskera"],
  ["Buenos días", "castellano"], ["Gracias", "castellano"]];
const SPANISH_COUNTRIES = ["México", "Argentina", "Colombia", "Perú", "Chile", "Cuba", "Uruguay", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Guatemala", "Costa Rica", "Panamá"];
const OTHER_COUNTRIES = ["Brasil", "Francia", "Italia", "Portugal", "Alemania", "Japón"];
const MUNDO = [
  ["¿De qué lengua viene el español?", "del latín", ["del inglés", "del árabe"], "El español viene del <b>latín</b>, la lengua de los romanos."],
  ["¿Dónde nació el español (o castellano)?", "en Castilla, en la Edad Media", ["en México, hace cien años", "en Roma"], "Nació en <b>Castilla</b>, en la Edad Media; por eso también se llama <i>castellano</i>."],
  ["¿Cómo se llaman los textos donde aparecen escritas algunas de las primeras palabras en castellano?", "las Glosas Emilianenses", ["el Quijote", "las Rimas"],
    "En las <b>Glosas Emilianenses</b>, escritas por monjes en San Millán de la Cogolla (La Rioja), aparecen algunas de las primeras palabras escritas en castellano."],
  ["¿Más o menos cuántas personas tienen el español como lengua materna?", "unos 500 millones", ["unos 50 millones", "unos 5000 millones"],
    "Unos <b>500 millones</b> de personas: es la segunda lengua materna más hablada del mundo."],
  ["¿En qué país de América NO se habla español?", "Brasil", ["México", "Argentina"], "En <b>Brasil</b> se habla portugués."],
  ["Guinea Ecuatorial es un país donde también se habla español. ¿En qué continente está?", "África", ["Europa", "Asia"], "Guinea Ecuatorial está en <b>África</b>."]
];
const lenguas = {
  id:"li-lenguas", name:"Lenguas de España", emoji:"🗺️",
  desc:"Las lenguas que se hablan en España y el español en el mundo.",
  rule:`En España se hablan varias lenguas, y todas merecen respeto:
    <ul><li>El <b>castellano</b> o <b>español</b>, en toda España.</li>
    <li>El <b>catalán</b> (en Cataluña y las Islas Baleares; en la Comunidad Valenciana se llama <b>valenciano</b>), el <b>gallego</b> (en Galicia)
      y el <b>euskera</b> o vasco (en el País Vasco y en parte de Navarra).</li></ul>
    El español viene del <b>latín</b>, nació en <b>Castilla</b> en la Edad Media y hoy lo hablan unos 500 millones de personas como lengua materna,
    en España, en casi toda América y en Guinea Ecuatorial.`,
  levels:[
    { name:"¿Dónde se habla?", desc:"Las lenguas de España y sus comunidades" },
    { name:"¿En qué lengua?", desc:"«Bon dia», «Bos días», «Egun on»…" },
    { name:"El español en el mundo", desc:"Su historia y dónde se habla" }
  ],
  regions:REGIONS, mundo:MUNDO, countries:[...SPANISH_COUNTRIES, ...OTHER_COUNTRIES],
  make(level){
    if (level === 1 && Math.random() < .4){
      // the other way round: where is this language spoken?
      const lang = pick(["gallego", "euskera", "valenciano"]), reg = REGIONS.find(r => r[1] === lang)[0];
      const choices = shuffle([reg, ...sample(REGIONS.filter(r => r[1] !== lang && !(lang === "valenciano" && r[1] === "catalán")).map(r => r[0]), 2)]);
      return { input:"choice", text:`¿Dónde se habla <b>${lang}</b>?`, choices:choices.map(cap), answer:cap(reg),
        explain:`El ${lang} se habla en <b>${reg}</b>.`, key:"le1r" + lang + choices.join() };
    }
    if (level === 1){
      const [reg, lang] = pick(REGIONS);
      const choices = shuffle([lang, ...sample(LANGS.filter(l => l !== lang && !(lang === "valenciano" && l === "catalán") && !(lang === "catalán" && l === "valenciano")), 2)]);
      return { input:"choice", text:`Además del castellano, ¿qué lengua se habla en <b>${reg}</b>?`, choices, answer:lang,
        explain:`En ${reg} se habla <b>${lang}</b>, además del castellano.${lang === "valenciano" ? " El valenciano es el nombre que recibe allí el catalán." : ""}`, key:"le1" + reg };
    }
    if (level === 2){
      const [w, lang] = pick(GREET);
      return { input:"choice", text:`¿En qué lengua se dice <b>«${esc(w)}»</b>?`, choices:["castellano", "catalán", "gallego", "euskera"], answer:lang,
        explain:`«${esc(w)}» es <b>${lang}</b>.`, key:"le2" + w };
    }
    if (Math.random() < .35){
      const yes = pick(SPANISH_COUNTRIES), nos = sample(OTHER_COUNTRIES, 2);
      return { input:"choice", text:"¿En cuál de estos países se habla español?", choices:shuffle([yes, ...nos]), answer:yes,
        explain:`En <b>${yes}</b> se habla español. En ${nos.join(" y ")}, no.`, key:"le3c" + yes + nos.join() };
    }
    const [q, right, wrong, why] = pick(MUNDO);
    return { input:"choice", text:q, choices:shuffle([right, ...wrong]), answer:right, explain:why, key:"le3" + q };
  }
};

L4.TOPICS.push({ id:"literatura", title:"Literatura y lenguas", emoji:"🎭", skills:[generos, medidaSkill, rimaSkill, recursos, autores, lenguas] });
})();
