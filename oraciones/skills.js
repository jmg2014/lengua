/* Oraciones y puntuación, Phase 5 of the roadmap.
   Sentences are written by hand. For "place the marks" questions, the sentence is written normally and
   L4.punctFrom() takes the marks out; the child puts them back. For "which is right?" questions, each item is
   [right, wrong, wrong]: the wrong ones break a rule the skill teaches, so only one can be right.
   "Ordenar" uses the sentence maker of the Gramática topic (gramatica/skills.js must be loaded first). */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, esc } = L4;

const punctQ = (s, marks, text, why, key) => Object.assign(L4.punctFrom(s), { input:"punct", marks, text, explain:`${esc(s)}<br>${why}`, key });
const versions = (item, text, why, key) => ({ input:"choice", text, choices:shuffle(item.slice()), answer:item[0], explain:`<b>${esc(item[0])}</b><br>${why}`, key, wrongs:item.slice(1) });

/* ---------- 1. ¿? ¡! ---------- */
const QS = ["¿Qué hora es?", "¿Dónde vives?", "¿Quieres jugar conmigo?", "¿Cómo se llama tu perro?", "¿Vienes al parque?", "¿Cuántos años tienes?",
  "¿Te gusta el chocolate?", "¿Por qué llueve?"];
const EX = ["¡Qué frío hace!", "¡Cuánto has crecido!", "¡Qué bonito es tu dibujo!", "¡Hemos ganado!", "¡Feliz cumpleaños!", "¡Qué rico está el pastel!",
  "¡Cuidado con el perro!", "¡Qué sorpresa!"];
/* two sentences: one says something, the other asks or exclaims */
const MIX = ["Hola, Marta. ¿Cómo estás?", "Mañana es sábado. ¿Vamos al cine?", "He sacado un diez. ¡Qué alegría!", "Está lloviendo. ¿Dónde está mi paraguas?",
  "Mira el cielo. ¡Qué estrellas tan bonitas!", "Ya es tarde. ¿Has hecho los deberes?", "Tengo hambre. ¿Qué hay para cenar?", "Me he caído. ¡Qué daño!",
  "Hoy es tu cumpleaños. ¡Felicidades!", "Hace sol. ¿Vamos a la piscina?"];
const SIGNOS_WHY = "En español las preguntas y las exclamaciones llevan signo al <b>principio</b> y al <b>final</b>: ¿…? ¡…!";
function badSignos(s){
  const open = s[0], close = s[s.length - 1], body = s.slice(1, -1);
  return [body + close, close + body + open];          // "Qué hora es?" (like English) and "?Qué hora es¿" (upside down)
}
const signos = {
  id:"pu-signos", name:"¿? y ¡!", emoji:"❓",
  desc:"Los signos de interrogación y exclamación: ¡en español se abren y se cierran!",
  rule:`<ul><li>Las <b>preguntas</b> van entre <b>¿</b> y <b>?</b>: ¿Qué hora es?</li>
    <li>Las <b>exclamaciones</b> van entre <b>¡</b> y <b>!</b>: ¡Qué frío!</li>
    <li>En inglés solo se pone el del final; en español hay que poner <b>los dos</b>. El de abrir va donde empieza la pregunta.</li>
    <li>Después de ? o ! no se pone punto.</li></ul>`,
  levels:[
    { name:"¿Cuál está bien?", desc:"Elige la que lleva bien los signos" },
    { name:"Ponlos tú", desc:"Pon los signos de abrir y cerrar" },
    { name:"Dos oraciones", desc:"Una cuenta algo y la otra pregunta o exclama" }
  ],
  sentences:[...QS, ...EX, ...MIX],
  make(level){
    if (level === 1){ const s = pick([...QS, ...EX]); return versions([s, ...badSignos(s)], "¿Cuál está bien escrita?", SIGNOS_WHY, "si1" + s); }
    if (level === 2){ const s = pick([...QS, ...EX]); return punctQ(s, ["¿", "?", "¡", "!"], "Pon los signos de interrogación o exclamación:", SIGNOS_WHY, "si2" + s); }
    const s = pick(MIX);
    return punctQ(s, [".", ",", "¿", "?", "¡", "!"], "Pon todos los signos:", SIGNOS_WHY + " La primera oración acaba en punto.", "si3" + s);
  }
};

/* ---------- 2. el punto y los puntos suspensivos ---------- */
const PUNTO = ["Hoy hace sol. Vamos a la playa.", "Me llamo Lucía. Tengo nueve años.", "Mi perro es blanco. Se llama Nube.", "Ayer llovió mucho. No salimos de casa.",
  "El tren llegó tarde. Esperamos una hora.", "Mi abuela hace pasteles. Están riquísimos.", "Es domingo. No hay colegio.", "Pablo tiene un gato. Es muy juguetón."];
const PUNTO3 = ["Me levanté pronto. Desayuné tostadas. Después fui al colegio.", "Es invierno. Hace mucho frío. Nieva en la montaña."];
function badCaps(s){
  const parts = s.split(". ");
  const lowAfter = parts.map((p, i) => i === 0 ? p : p[0].toLowerCase() + p.slice(1)).join(". ");
  const lowFirst = s[0].toLowerCase() + s.slice(1);
  return [lowAfter, lowFirst];
}
/* puntos suspensivos: [right, wrong, wrong] */
const SUSP = [
  ["En la tienda había de todo: pan, leche, fruta…", "En la tienda había… de todo: pan, leche, fruta.", "En la tienda… había de todo: pan, leche, fruta."],
  ["Me gustan muchos animales: perros, gatos, caballos…", "Me gustan… muchos animales: perros, gatos, caballos.", "Me gustan muchos… animales: perros, gatos, caballos."],
  ["Érase una vez…", "Érase… una vez.", "Érase una… vez."],
  ["Uno, dos, tres… ¡ya!", "Uno… dos, tres, ¡ya!", "Uno, dos… tres, ¡ya!"],
  ["En mi mochila llevo libros, cuadernos, lápices…", "En mi mochila… llevo libros, cuadernos, lápices.", "En mi… mochila llevo libros, cuadernos, lápices."],
  ["Había una vez un dragón que…", "Había una… vez un dragón que.", "Había… una vez un dragón que."],
  ["Me encantan los colores: rojo, verde, azul…", "Me encantan… los colores: rojo, verde, azul.", "Me… encantan los colores: rojo, verde, azul."],
  ["En verano voy a la playa, a la piscina, al campo…", "En verano… voy a la playa, a la piscina, al campo.", "En… verano voy a la playa, a la piscina, al campo."],
  ["Tenía tanto miedo que…", "Tenía tanto… miedo que.", "Tenía… tanto miedo que."]
];
const punto = {
  id:"pu-punto", name:"El punto y los puntos suspensivos", emoji:"⏺️",
  desc:"El punto separa oraciones; después, mayúscula. Los puntos suspensivos dejan algo sin terminar.",
  rule:`<ul><li>El <b>punto</b> (.) se pone al final de una oración. Después del punto se escribe con <b>mayúscula</b>.</li>
    <li>Los <b>puntos suspensivos</b> (…) son siempre tres. Se ponen cuando una enumeración podría seguir (perros, gatos, caballos…)
      o cuando dejamos algo sin terminar o con intriga (Érase una vez…).</li></ul>`,
  levels:[
    { name:"Pon el punto", desc:"¿Dónde acaba cada oración?" },
    { name:"Punto y mayúscula", desc:"Después del punto, mayúscula" },
    { name:"Puntos suspensivos", desc:"¿Dónde van los tres puntos?" }
  ],
  sentences:[...PUNTO, ...PUNTO3], susp:SUSP,
  make(level){
    if (level === 1){
      const s = pick(Math.random() < .3 ? PUNTO3 : PUNTO);
      return punctQ(s, ["."], "Pon los <b>puntos</b> donde acaba cada oración:", "Cada oración acaba en punto, y la siguiente empieza con mayúscula.", "pt1" + s);
    }
    if (level === 2){ const s = pick(PUNTO); return versions([s, ...badCaps(s)], "¿Cuál está bien escrita?", "Se empieza con mayúscula, y después de cada punto también.", "pt2" + s); }
    const it = pick(SUSP);
    return versions(it, "¿En cuál están bien los puntos suspensivos?", "Los puntos suspensivos van al final de una enumeración que podría seguir, o de algo que dejamos sin terminar.", "pt3" + it[0]);
  }
};

/* ---------- 3. la coma y el punto y coma ---------- */
const LISTAS = ["Compré pan, leche, huevos y fruta.", "En mi mochila llevo libros, lápices y una goma.", "Me gustan los perros, los gatos y los caballos.",
  "Lucía, Pablo y Marta son mis amigos.", "En el zoo vimos leones, jirafas, monos y elefantes.", "Tengo un perro, un gato y un pez.",
  "Mis colores favoritos son el azul, el verde y el amarillo.", "En verano voy a la playa, a la piscina y al campo.", "Para la tarta necesito harina, huevos, azúcar y leche."];
const VOCATIVOS = ["Lucía, ven aquí.", "Ven aquí, Lucía.", "Mamá, tengo hambre.", "Gracias, abuela.", "Pablo, recoge tu cuarto.", "Hola, Marta.", "Niños, a cenar.", "Escucha, Hugo."];
/* punto y coma: [right, wrong, wrong] */
const PYC = [
  ["Hacía mucho frío; nos quedamos en casa.", "Hacía mucho; frío nos quedamos en casa.", "Hacía; mucho frío nos quedamos en casa."],
  ["Llovía sin parar; el partido se suspendió.", "Llovía sin; parar el partido se suspendió.", "Llovía; sin parar el partido se suspendió."],
  ["Unos niños jugaban; otros leían.", "Unos; niños jugaban otros leían.", "Unos niños; jugaban otros leían."],
  ["Estudié mucho; aprobé el examen.", "Estudié; mucho aprobé el examen.", "Estudié mucho aprobé; el examen."]
];
const coma = {
  id:"pu-coma", name:"La coma y el punto y coma", emoji:"✒️",
  desc:"Comas en las enumeraciones y para llamar a alguien.",
  rule:`La <b>coma</b> (,) es una pausa corta. Se pone:
    <ul><li>Para separar los elementos de una <b>enumeración</b>: pan, leche, huevos y fruta. ¡Delante de <b>y</b> no se pone coma!</li>
    <li>Para separar el nombre de la persona a la que <b>llamamos</b>: <b>Lucía,</b> ven aquí. / Ven aquí<b>, Lucía</b>.</li></ul>
    El <b>punto y coma</b> (;) es una pausa más larga que la coma: separa dos oraciones muy relacionadas: Hacía frío; nos quedamos en casa.`,
  levels:[
    { name:"Enumeraciones", desc:"Pon las comas de una lista" },
    { name:"Llamar a alguien", desc:"La coma con el nombre de la persona" },
    { name:"Punto y coma", desc:"¿Dónde está bien el punto y coma? Y todas las comas" }
  ],
  sentences:[...LISTAS, ...VOCATIVOS], pyc:PYC,
  make(level){
    if (level === 1){ const s = pick(LISTAS); return punctQ(s, [",", "."], "Pon las <b>comas</b> y el punto:", "En una enumeración se pone coma entre los elementos, menos delante de <b>y</b>.", "co1" + s); }
    if (level === 2){ const s = pick(VOCATIVOS); return punctQ(s, [",", "."], "Pon la <b>coma</b> y el punto:", "El nombre de la persona a la que llamamos se separa con coma.", "co2" + s); }
    if (Math.random() < .5){ const it = pick(PYC); return versions(it, "¿En cuál está bien el <b>punto y coma</b>?", "El punto y coma separa dos oraciones relacionadas, cada una con su sentido completo.", "co3" + it[0]); }
    const s = pick([...LISTAS, ...VOCATIVOS]);
    return punctQ(s, [",", "."], "Pon las comas y el punto:", "Comas en las enumeraciones (menos delante de y) y para separar el nombre de la persona a la que llamamos.", "co3p" + s);
  }
};

/* ---------- 4. los dos puntos ---------- */
const LISTA_DP = ["En el zoo vimos tres animales: un león, una jirafa y un elefante.", "Necesito dos cosas: papel y tijeras.", "Las estaciones son cuatro: primavera, verano, otoño e invierno.",
  "En mi familia somos cuatro: mis padres, mi hermano y yo.", "Me gustan tres deportes: fútbol, natación y baloncesto.",
  "Hoy tengo tres clases: lengua, música e inglés.", "En el estuche llevo tres cosas: un lápiz, una goma y una regla.", "Las vocales son cinco: a, e, i, o, u.",
  "Mis animales favoritos son dos: los delfines y los pingüinos."];
/* letter greetings: [right, wrong, wrong]. In Spanish the greeting of a letter ends with a colon, not a comma (that's English). */
const SALUDOS = ["Querida abuela:", "Querido Pablo:", "Hola, Lucía:", "Estimada señora:", "Queridos tíos:", "Querida mamá:", "Querido profesor:", "Estimado señor:", "Hola, abuelo:"];
const salBad = s => [s.replace(/:$/, ","), s.replace(/:$/, ".")];
const dospuntos = {
  id:"pu-dospuntos", name:"Los dos puntos", emoji:"➗",
  desc:"Antes de una enumeración y después del saludo de una carta.",
  rule:`Los <b>dos puntos</b> (:) se ponen:
    <ul><li><b>Antes de una enumeración</b> que se anuncia: Necesito dos cosas<b>:</b> papel y tijeras.</li>
    <li><b>Después del saludo de una carta</b>: Querida abuela<b>:</b> — en español es con dos puntos, no con coma como en inglés.</li></ul>`,
  levels:[
    { name:"El saludo de una carta", desc:"Dos puntos, no coma" },
    { name:"Antes de una lista", desc:"Pon los dos puntos y las comas" },
    { name:"Mezcla", desc:"Las dos cosas" }
  ],
  sentences:LISTA_DP, saludos:SALUDOS,
  make(level){
    const kind = level === 1 ? "s" : level === 2 ? "l" : pick(["s", "l"]);
    if (kind === "s"){ const s = pick(SALUDOS); return versions([s, ...salBad(s)], "Empiezas una carta. ¿Cómo se escribe el saludo?", "En español, el saludo de una carta acaba en <b>dos puntos</b>.", "dp1" + s); }
    const s = pick(LISTA_DP);
    return punctQ(s, [":", ",", "."], "Pon los <b>dos puntos</b>, las comas y el punto:", "Los dos puntos anuncian la enumeración; luego, comas entre los elementos (menos delante de y o e).", "dp2" + s);
  }
};

/* ---------- 5. ordenar palabras ---------- */
const ordenar = {
  id:"pu-ordenar", name:"Ordena la oración", emoji:"🔀",
  desc:"Pon las palabras en orden para formar una oración.",
  rule:`Una oración tiene un orden: normalmente primero el <b>sujeto</b> y luego el <b>predicado</b> (el verbo y lo demás).
    La primera palabra lleva <b>mayúscula</b> y la última lleva el <b>punto</b>: ¡son dos pistas!`,
  levels:[
    { name:"Cortas", desc:"Oraciones de pocas palabras" },
    { name:"Más largas", desc:"Con un adjetivo" },
    { name:"Largas", desc:"Con adjetivo y más palabras" }
  ],
  make(level){
    const G = L4.TOPICS.find(t => t.id === "gramatica");
    for (let t = 0; t < 60; t++){
      const { toks } = G.sentence({ adj:level > 1, needP:level === 3 });
      const body = toks.filter(x => x.c !== ".");
      if (level === 1 && body.length > 5) continue;
      const ws = body.map(x => x.w);
      ws[ws.length - 1] += ".";
      // "Mi perro lento corre…" can also be "Mi perro corre lento…": the adjective right after the verb is right too
      const okOrders = [ws.join(" ")], a = body.findIndex(x => x.c === "ADJ"), v = body.findIndex(x => x.c === "V");
      if (a >= 0 && v === a + 1 && v < ws.length - 1){ const alt = ws.slice(); [alt[a], alt[v]] = [alt[v], alt[a]]; okOrders.push(alt.join(" ")); }
      return { input:"order", text:"Ordena las palabras para formar una oración:", items:ws, check:g => okOrders.includes(g.join(" ")),
        explain:`<b>${esc(ws.join(" "))}</b>`, key:"or" + ws.join(" ") };
    }
    throw new Error("no sentence");
  }
};

/* ---------- 6. no repetir ---------- */
/* text with "_" | right | the repeated word | a form that doesn't agree | the word that would be repeated */
const REP = [
  ["Mi abuela vive en el campo. _ tiene muchas gallinas.", "Ella", "Mi abuela", "Él", "mi abuela"],
  ["Los niños jugaban en el parque. Después, _ volvieron a casa.", "ellos", "los niños", "ellas", "los niños"],
  ["Lucía y Elena son mis amigas. _ viven en mi calle.", "Ellas", "Lucía y Elena", "Ellos", "Lucía y Elena"],
  ["Mi padre cocina muy bien. _ hace unas tortillas riquísimas.", "Él", "Mi padre", "Ella", "mi padre"],
  ["Marta está muy contenta. Su hermano también está _.", "alegre", "contento", "alegres", "contenta"],
  ["El examen fue muy fácil. Los deberes también fueron _.", "sencillos", "fáciles", "sencillo", "fácil"],
  ["La película era muy bonita. La música también era _.", "preciosa", "bonita", "precioso", "bonita"],
  ["Ayer empezó el curso. Mañana _ las clases de música.", "comienzan", "empiezan", "comienza", "empezó"],
  ["Mi tía tiene un coche nuevo. Su _ es rojo.", "automóvil", "coche", "automóviles", "coche"],
  ["Pablo y yo vamos al mismo colegio. _ estamos en la misma clase.", "Nosotros", "Pablo y yo", "Vosotros", "Pablo y yo"],
  ["Mi hermana estudia mucho. _ quiere ser médica.", "Ella", "Mi hermana", "Él", "mi hermana"],
  ["Los abuelos llegaron ayer. _ vienen todos los veranos.", "Ellos", "Los abuelos", "Ellas", "los abuelos"],
  ["Tú y Luis sois muy rápidos. _ ganaréis la carrera.", "Vosotros", "Tú y Luis", "Nosotros", "tú y Luis"],
  ["Mi casa es muy grande. El jardín también es _.", "enorme", "grande", "enormes", "grande"],
  ["Pablo es muy listo. Su prima también es muy _.", "inteligente", "lista", "inteligentes", "listo"],
  ["Ayer terminé el libro. Hoy _ el cuaderno de ejercicios.", "acabé", "terminé", "acabó", "terminé"]
];
const repetir = {
  id:"pu-repetir", name:"Sin repetir", emoji:"♻️",
  desc:"Usar un pronombre o un sinónimo para no repetir palabras.",
  rule:`Cuando escribimos, queda mejor <b>no repetir</b> las mismas palabras:
    <ul><li>Usa un <b>pronombre</b>: Mi abuela vive en el campo. <b>Ella</b> tiene gallinas.</li>
    <li>O un <b>sinónimo</b>: Marta está contenta. Su hermano también está <b>alegre</b>.</li>
    <li>¡Cuidado con la concordancia! Tiene que ir en el mismo género y número.</li></ul>`,
  levels:[
    { name:"Pronombres", desc:"Elige el pronombre que evita la repetición" },
    { name:"Sinónimos", desc:"Elige el sinónimo que evita la repetición" },
    { name:"Mezcla", desc:"Pronombres y sinónimos" }
  ],
  items:REP,
  make(level){
    const pron = REP.filter(r => /^(Ella|Ellos|ellos|Ellas|Él|Nosotros|Vosotros)$/.test(r[1])), syn = REP.filter(r => !pron.includes(r));
    const r = pick(level === 1 ? pron : level === 2 ? syn : REP), [s, right, rep, bad, word] = r, [a, b] = s.split("_");
    return { input:"choice", text:`${esc(a)}<b>___</b>${esc(b)}<br>¿Qué queda mejor?`, choices:shuffle([right, rep, bad]), answer:right,
      explain:`${esc(a)}<b>${right}</b>${esc(b)}<br>«${rep}» repetiría lo que ya se ha dicho, y «${bad}» no concuerda.`, solution:s.replace("_", right), key:"re" + s };
  }
};

L4.TOPICS.push({ id:"oraciones", title:"Oraciones y puntuación", emoji:"❓", skills:[signos, punto, coma, dospuntos, ordenar, repetir] });
})();
