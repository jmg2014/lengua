/* Lectura, Phase 7 of the roadmap.
   Stories are built from hand-written scenes (place + problem + helper + ending that belong together), with a
   different child, time and order of details each time, so they always make sense. Text types are hand-written. */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, esc } = L4;
const cap = s => s[0].toLocaleUpperCase("es") + s.slice(1);

const KIDS = [["Lucía", "f"], ["Pablo", "m"], ["Marta", "f"], ["Hugo", "m"], ["Elena", "f"], ["Daniel", "m"], ["Irene", "f"], ["Mario", "m"]];
const g2 = (pair, g) => g === "f" ? pair[1] : pair[0];
/* {N} the child's name; [o/a] picks by the child's gender */
const fill = (s, n, g) => s.replace(/\{N\}/g, n).replace(/\[(\w*)\/(\w*)\]/g, (m, a, b) => g === "f" ? b : a);

/* A scene. feel: how the child feels when the problem happens (m/f). helper: [as a choice, as written in the story]. */
const SCENES = [
  { place:"en el parque", times:["Un sábado por la mañana", "Una tarde de viento", "El domingo"],
    start:"{N} fue al parque con su cometa nueva.", problem:"De repente, el viento llevó la cometa hasta un árbol y se quedó enganchada en las ramas.",
    feel:["triste", "triste"], helper:"su abuelo", solution:"Entonces llegó su abuelo con un palo muy largo y bajó la cometa.",
    end:"{N} siguió volando la cometa toda la tarde y le dio las gracias a su abuelo.",
    probShort:"Su cometa se quedó enganchada en un árbol.", solShort:"Su abuelo bajó la cometa con un palo.", endShort:"{N} siguió volando la cometa.",
    tema:"ayudar a los demás" },
  { place:"en la playa", times:["Una mañana de verano", "Un día de vacaciones", "El sábado"],
    start:"{N} estaba en la playa haciendo un castillo de arena.", problem:"De repente, una ola grande se llevó su cubo rojo mar adentro.",
    feel:["triste", "triste"], helper:"un niño que estaba nadando", solution:"Un niño que estaba nadando cogió el cubo y se lo devolvió.",
    end:"Terminaron el castillo juntos y se hicieron muy amigos.",
    probShort:"Una ola se llevó su cubo.", solShort:"Un niño le devolvió el cubo.", endShort:"Terminaron el castillo juntos.",
    tema:"la amistad" },
  { place:"en el colegio", times:["El lunes", "Un martes", "Un día de invierno"],
    start:"{N} llegó al colegio con su mochila nueva.", problem:"A la hora del recreo, se dio cuenta de que se había olvidado el bocadillo en casa.",
    feel:["preocupado", "preocupada"], helper:"su amiga Sara", solution:"Su amiga Sara partió su bocadillo por la mitad y le dio un trozo.",
    end:"Al día siguiente, {N} llevó galletas para compartirlas con Sara.",
    probShort:"Se había olvidado el bocadillo.", solShort:"Su amiga le dio la mitad de su bocadillo.", endShort:"{N} llevó galletas al día siguiente.",
    tema:"compartir" },
  { place:"en el bosque", times:["Un día de primavera", "El viernes", "Una mañana de otoño"],
    start:"{N} fue de excursión al bosque con su clase.", problem:"Se paró a mirar una ardilla y, cuando levantó la vista, ya no veía a nadie: se había perdido.",
    feel:["asustado", "asustada"], helper:"una guarda forestal", solution:"Por suerte, apareció una guarda forestal que conocía muy bien el bosque y [lo/la] acompañó hasta su grupo.",
    end:"Desde ese día, {N} siempre camina junto a sus compañeros.",
    probShort:"Se perdió en el bosque.", solShort:"Una guarda forestal le enseñó el camino.", endShort:"{N} ya no se separa de su grupo.",
    tema:"tener cuidado y no separarse del grupo" },
  { place:"en la biblioteca", times:["Una tarde", "El miércoles", "Un día de lluvia"],
    start:"{N} fue a la biblioteca a buscar un libro de dinosaurios.", problem:"Buscó en todas las estanterías, pero no lo encontraba por ningún lado.",
    feel:["preocupado", "preocupada"], helper:"el bibliotecario", solution:"El bibliotecario lo buscó en el ordenador y encontró el libro en una estantería muy alta.",
    end:"Esa noche, {N} leyó el libro entero antes de dormir.",
    probShort:"No encontraba un libro.", solShort:"El bibliotecario encontró el libro.", endShort:"{N} leyó el libro entero.",
    tema:"el gusto por la lectura" },
  { place:"en la piscina", times:["El jueves", "Una tarde de verano", "El sábado por la tarde"],
    start:"{N} fue a la piscina con su clase de natación.", problem:"Todos sus compañeros saltaban desde el trampolín, pero a {N} le daba mucho miedo.",
    feel:["asustado", "asustada"], helper:"su profesora de natación", solution:"Su profesora de natación le dio la mano y le dijo que no pasaba nada.",
    end:"{N} saltó, salió del agua riéndose y quiso saltar otra vez.",
    probShort:"Le daba miedo saltar del trampolín.", solShort:"Su profesora le dio la mano.", endShort:"{N} saltó y quiso repetir.",
    tema:"superar el miedo" },
  { place:"en el mercado", times:["Un sábado", "Una mañana", "El domingo por la mañana"],
    start:"{N} fue al mercado con unas monedas para comprar fresas.", problem:"Cuando contó las monedas, vio que no tenía suficiente dinero para un kilo entero.",
    feel:["triste", "triste"], helper:"la frutera", solution:"La frutera sonrió y le puso en la bolsa las fresas que faltaban.",
    end:"{N} llegó a casa con las fresas y su madre se puso muy contenta.",
    probShort:"No tenía suficiente dinero.", solShort:"La frutera le dio las fresas que faltaban.", endShort:"{N} llevó las fresas a casa.",
    tema:"la generosidad" },
  { place:"en su casa", times:["Una tarde", "El domingo", "Un día de verano"],
    start:"{N} estaba en casa jugando con su gato.", problem:"De repente, el gato saltó por la ventana, se subió al tejado y no podía bajar.",
    feel:["preocupado", "preocupada"], helper:"su vecino", solution:"Su vecino trajo una escalera muy alta, subió con cuidado y bajó al gato.",
    end:"{N} abrazó a su gato y le dio las gracias a su vecino.",
    probShort:"Su gato no podía bajar del tejado.", solShort:"Su vecino bajó al gato con una escalera.", endShort:"{N} abrazó a su gato.",
    tema:"ayudar a los demás" }
];
const CONTENTO = ["contento", "contenta"];
/* a story from a scene: inicio, nudo, desenlace. feelings: write how the child feels (levels 1–2), or leave it to infer (level 3) */
function story(sc, feelings){
  const [n, g] = pick(KIDS), time = pick(sc.times);
  const f = s => fill(s, n, g);
  const inicio = `${time}, ${f(sc.start)}`;           // every scene starts with the child's name, which keeps its capital
  const nudo = f(sc.problem) + (feelings ? ` ${n} estaba muy ${g2(sc.feel, g)}.` : "");
  const desenlace = f(sc.solution) + (feelings ? " Se sintió muy feliz." : "") + " " + f(sc.end);
  return { n, g, sc, inicio, nudo, desenlace, f };
}
const box = parts => `<div class="texto">${parts.map(p => `<p>${esc(p)}</p>`).join("")}</div>`;
const others = (key, sc, k) => sample(SCENES.filter(x => x !== sc && x[key] !== sc[key]).map(x => x[key]), k);

/* ---------- 1. comprensión ---------- */
const comprension = {
  id:"le-comprension", name:"Comprensión lectora", emoji:"👓",
  desc:"Lee una historia corta y contesta.",
  rule:`Lee la historia <b>con calma</b>, hasta el final. Luego lee la pregunta y vuelve al texto para buscar la respuesta.
    Algunas respuestas no están escritas: hay que <b>deducirlas</b> (por ejemplo, cómo se siente alguien por lo que le pasa).`,
  levels:[
    { name:"¿Quién? ¿Dónde?", desc:"Preguntas sobre lo que dice el texto" },
    { name:"¿Qué pasó?", desc:"El problema, cómo se resolvió y el orden" },
    { name:"Piensa", desc:"Respuestas que hay que deducir" }
  ],
  scenes:SCENES, story,
  make(level){
    const sc = pick(SCENES), st = story(sc, level < 3), { n, g, f } = st, pic = box([st.inicio, st.nudo, st.desenlace]);
    const el = g === "f" ? "la" : "el";
    const kind = pick({ 1:["who", "where", "helper"], 2:["problem", "solution", "order", "summary"], 3:["feelStart", "feelEnd", "why", "summary"] }[level]);
    const base = { picture:pic, key:`le${level}${kind}${st.inicio}` };
    if (kind === "who"){
      const names = shuffle([n, ...sample(KIDS.filter(k => k[0] !== n).map(k => k[0]), 2)]);
      return Object.assign(base, { input:"choice", text:`¿Quién es ${el} protagonista?`, choices:names, answer:n, explain:`La historia es sobre <b>${n}</b>.` });
    }
    if (kind === "where") return Object.assign(base, { input:"choice", text:"¿Dónde pasa la historia?", choices:shuffle([sc.place, ...others("place", sc, 2)]), answer:sc.place,
      explain:`Pasa <b>${sc.place}</b>.` });
    if (kind === "helper") return Object.assign(base, { input:"choice", text:`¿Quién ayudó a ${n}?`, choices:shuffle([sc.helper, ...others("helper", sc, 2)]), answer:sc.helper,
      explain:`Le ayudó <b>${sc.helper}</b>.` });
    if (kind === "problem") return Object.assign(base, { input:"choice", text:`¿Qué problema tenía ${n}?`, choices:shuffle([sc.probShort, ...others("probShort", sc, 2)]), answer:sc.probShort,
      explain:`<b>${sc.probShort}</b>` });
    if (kind === "solution") return Object.assign(base, { input:"choice", text:"¿Cómo se resolvió el problema?", choices:shuffle([sc.solShort, ...others("solShort", sc, 2)]), answer:sc.solShort,
      explain:`<b>${sc.solShort}</b>` });
    if (kind === "summary"){
      // the best summary: the right problem and solution; the wrong ones change the helper, or only tell the beginning
      const other = pick(SCENES.filter(x => x !== sc));
      const right = `${n}: ${sc.probShort.toLowerCase().replace(/\.$/, "")}, pero ${sc.solShort[0].toLowerCase()}${sc.solShort.slice(1)}`;
      const wrongHelper = `${n}: ${sc.probShort.toLowerCase().replace(/\.$/, "")}, pero ${other.solShort[0].toLowerCase()}${other.solShort.slice(1)}`;
      const onlyStart = f(sc.start);
      return Object.assign(base, { input:"choice", text:"¿Cuál es el mejor <b>resumen</b> de la historia?", choices:shuffle([right, wrongHelper, onlyStart]), answer:right,
        explain:`Un buen resumen cuenta lo más importante en pocas palabras: el problema y cómo se resolvió. <b>${esc(right)}</b>` });
    }
    if (kind === "order"){
      const items = [sc.probShort, sc.solShort, f(sc.endShort)];
      return Object.assign(base, { input:"order", text:"Ordena lo que pasó:", items, explain:items.map((x, i) => `${i + 1}. ${esc(x)}`).join("<br>") });
    }
    if (kind === "feelStart"){
      const right = g2(sc.feel, g), wrong = [g2(CONTENTO, g) === "contento" ? "muy contento" : "muy contenta", g === "f" ? "aburrida" : "aburrido"];
      return Object.assign(base, { input:"choice", text:`¿Cómo crees que se sintió ${n} cuando tuvo el problema?`, choices:shuffle([right, ...wrong]), answer:right,
        explain:`El texto no lo dice, pero lo podemos deducir: ${sc.probShort.toLowerCase().replace(/\.$/, "")}, así que estaba <b>${right}</b>.` });
    }
    if (kind === "feelEnd"){
      const right = g2(CONTENTO, g), wrong = [g2(["asustado", "asustada"], g), "triste"].filter(x => x !== g2(sc.feel, g)).concat(g === "f" ? "enfadada" : "enfadado").slice(0, 2);
      return Object.assign(base, { input:"choice", text:`¿Cómo crees que se sintió ${n} al final?`, choices:shuffle([right, ...wrong]), answer:right,
        explain:`El problema se resolvió, así que al final estaba <b>${right}</b>.` });
    }
    return Object.assign(base, { input:"choice", text:`¿Por qué ${n} estaba agradecid${g === "f" ? "a" : "o"} con ${sc.helper}?`,
      choices:shuffle([`Porque le ayudó: ${sc.solShort[0].toLowerCase()}${sc.solShort.slice(1)}`, ...others("solShort", sc, 2).map(s => `Porque le ayudó: ${s[0].toLowerCase()}${s.slice(1)}`)]),
      answer:`Porque le ayudó: ${sc.solShort[0].toLowerCase()}${sc.solShort.slice(1)}`, explain:`${sc.solShort}` });
  }
};

/* ---------- 2. las partes del cuento ---------- */
const PART_WHY = { inicio:"El <b>inicio</b> presenta al protagonista, dónde está y cuándo.", nudo:"El <b>nudo</b> cuenta el problema.", desenlace:"El <b>desenlace</b> cuenta cómo se resuelve y cómo acaba." };
const cuento = {
  id:"le-cuento", name:"Partes del cuento", emoji:"📗",
  desc:"Inicio, nudo y desenlace; protagonista, personajes y espacio; el tema.",
  rule:`<ul><li>Un cuento tiene tres partes: <b>inicio</b> (quién, dónde, cuándo), <b>nudo</b> (el problema) y <b>desenlace</b> (cómo se resuelve).</li>
    <li>El <b>protagonista</b> es el personaje principal; los <b>personajes secundarios</b> aparecen menos.</li>
    <li>El <b>espacio</b> es dónde pasa la historia. El <b>tema</b> es la idea principal: de qué trata en el fondo (la amistad, superar el miedo…).</li></ul>`,
  levels:[
    { name:"Inicio, nudo y desenlace", desc:"¿Qué parte es? Ponlas en orden" },
    { name:"Personajes y espacio", desc:"Protagonista, personaje secundario y espacio" },
    { name:"El tema", desc:"¿De qué trata la historia en el fondo?" }
  ],
  make(level){
    const sc = pick(SCENES), st = story(sc, true);
    if (level === 1){
      if (Math.random() < .5){
        const items = [st.inicio, st.nudo, st.desenlace];
        return { input:"order", text:"Ordena las partes del cuento: inicio, nudo y desenlace.", items, explain:"Primero el inicio, después el nudo (el problema) y al final el desenlace.", key:"cu1o" + st.inicio };
      }
      const part = pick(["inicio", "nudo", "desenlace"]);
      return { input:"choice", picture:box([st[part]]), text:"¿Qué parte del cuento es?", choices:["inicio", "nudo", "desenlace"], answer:part, explain:PART_WHY[part], key:"cu1p" + st[part] };
    }
    const pic = box([st.inicio, st.nudo, st.desenlace]);
    if (level === 2){
      const kind = pick(["prot", "sec", "esp"]);
      if (kind === "prot"){
        const ch = shuffle([st.n, sc.helper, pick(KIDS.filter(k => k[0] !== st.n))[0]]);
        return { input:"choice", picture:pic, text:`¿Quién es ${st.g === "f" ? "la" : "el"} protagonista?`, choices:ch, answer:st.n, explain:`<b>${st.n}</b> es el personaje principal; ${sc.helper} es un personaje secundario.`, key:"cu2p" + st.inicio };
      }
      if (kind === "sec") return { input:"choice", picture:pic, text:"¿Quién es un personaje secundario?", choices:shuffle([sc.helper, st.n, ...others("helper", sc, 1)]), answer:sc.helper,
        explain:`<b>${cap(sc.helper)}</b> aparece en la historia pero no es el protagonista (${st.n}).`, key:"cu2s" + st.inicio };
      return { input:"choice", picture:pic, text:"¿Cuál es el espacio de la historia?", choices:shuffle([sc.place, ...others("place", sc, 2)]), answer:sc.place,
        explain:`La historia pasa <b>${sc.place}</b>: ese es el espacio.`, key:"cu2e" + st.inicio };
    }
    const temas = [...new Set(SCENES.map(x => x.tema))].filter(t => t !== sc.tema);
    return { input:"choice", picture:pic, text:"¿Cuál es el <b>tema</b> de esta historia?", choices:shuffle([sc.tema, ...sample(temas, 2)]), answer:sc.tema,
      explain:`En el fondo, la historia trata de <b>${sc.tema}</b>.`, key:"cu3" + st.inicio };
  }
};

/* ---------- 3. tipos de texto ---------- */
/* each line: [text, part] */
const TEXTS = [
  ["carta", [["Madrid, 3 de mayo", "lugar y fecha"], ["Querida abuela:", "saludo"], ["Te escribo para contarte que ya sé nadar. ¡Te echo mucho de menos!", "cuerpo"], ["Un beso muy fuerte,", "despedida"], ["Lucía", "firma"]]],
  ["carta", [["Londres, 10 de enero", "lugar y fecha"], ["Querido primo:", "saludo"], ["¿Qué tal estás? Aquí hace mucho frío y ha nevado. ¿Cuándo vienes a verme?", "cuerpo"], ["Un abrazo,", "despedida"], ["Hugo", "firma"]]],
  ["noticia", [["Los alumnos de un colegio plantan cien árboles", "titular"], ["El pasado viernes, los alumnos de 4.º plantaron cien árboles en el parque del barrio para celebrar el Día del Árbol.", "cuerpo"]]],
  ["noticia", [["Una ballena visita el puerto de Málaga", "titular"], ["Ayer por la mañana, cientos de personas vieron una ballena muy cerca del puerto. Los expertos dicen que estaba de paso.", "cuerpo"]]],
  ["invitación", [["¡Te invito a mi cumpleaños!", "motivo"], ["Día: sábado, 12 de marzo", "día"], ["Hora: a las cinco de la tarde", "hora"], ["Lugar: mi casa, en la calle Mayor", "lugar"], ["¡Te espero! Pablo", "firma"]]],
  ["invitación", [["¡Ven a nuestra fiesta de fin de curso!", "motivo"], ["Día: viernes, 20 de junio", "día"], ["Hora: a las seis", "hora"], ["Lugar: el patio del colegio", "lugar"]]],
  ["receta", [["Batido de fresa", "título"], ["Ingredientes: diez fresas, un vaso de leche y una cucharada de azúcar.", "ingredientes"], ["Preparación: lava las fresas, ponlo todo en la batidora y bátelo durante un minuto.", "preparación"]]],
  ["receta", [["Tostadas con tomate", "título"], ["Ingredientes: pan, un tomate, aceite de oliva y sal.", "ingredientes"], ["Preparación: tuesta el pan, ralla el tomate y ponlo sobre el pan con un poco de aceite y sal.", "preparación"]]],
  ["diario", [["Querido diario:", "saludo"], ["Hoy ha sido un día genial. En el recreo he jugado al fútbol con mis amigos y hemos ganado. Mañana te cuento más.", "cuerpo"]]],
  ["diario", [["Querido diario:", "saludo"], ["Hoy me he caído de la bici y me he hecho una herida en la rodilla. Mi padre me la ha curado y ya estoy mejor.", "cuerpo"]]],
  ["cuento", [["Érase una vez un dragón que no sabía echar fuego. Un día, una niña le enseñó a soplar muy fuerte y, por fin, consiguió encender una vela.", "cuerpo"]]],
  ["cuento", [["Había una vez un ratón muy pequeño que vivía en una biblioteca. Por las noches, leía los cuentos que dejaban los niños.", "cuerpo"]]],
  ["poema", [["En la playa hay una ola", "verso"], ["que baila sola, sola.", "verso"], ["Viene y va, viene y va,", "verso"], ["¿hasta dónde llegará?", "verso"]]],
  ["poema", [["Mi gato gris", "verso"], ["duerme feliz,", "verso"], ["sueña con ratones", "verso"], ["y con melocotones.", "verso"]]],
  ["biografía", [["Gloria Fuertes nació en Madrid en 1917. De pequeña ya escribía poemas y cuentos. Fue una poeta muy conocida por sus libros para niños y por sus programas de televisión. Murió en 1998.", "cuerpo"]]],
  ["biografía", [["Miguel de Cervantes nació en Alcalá de Henares en 1547. Fue soldado y viajó por muchos países. Escribió «Don Quijote de la Mancha», la novela más famosa en español. Murió en Madrid en 1616.", "cuerpo"]]],
  ["anuncio", [["¡Nuevas zapatillas Saltarín!", "eslogan"], ["Son tan ligeras que parece que vuelas. ¡Corre más rápido que nadie!", "cuerpo"], ["Ya en tu tienda de deportes.", "cuerpo"]]],
  ["anuncio", [["¿Tienes sed? ¡Prueba el zumo Sol!", "eslogan"], ["Hecho con naranjas de verdad. ¡Te encantará!", "cuerpo"]]],
  ["formulario", [["Inscripción en la biblioteca", "título"], ["Nombre: ______", "dato"], ["Apellidos: ______", "dato"], ["Fecha de nacimiento: ______", "dato"], ["Firma: ______", "dato"]]],
  ["formulario", [["Campamento de verano: hoja de inscripción", "título"], ["Nombre y apellidos: ______", "dato"], ["Edad: ______", "dato"], ["Teléfono de la familia: ______", "dato"], ["¿Sabes nadar? Sí ☐ No ☐", "dato"]]],
  ["descripción", [["Mi abuela es bajita y tiene el pelo blanco y rizado. Sus ojos son pequeños y alegres, y siempre lleva unas gafas redondas. Es muy cariñosa y le encanta contar historias.", "cuerpo"]]],
  ["descripción", [["Mi habitación es pequeña pero muy luminosa. Tiene una ventana grande, una cama junto a la pared y una estantería llena de libros. Las paredes son de color verde claro.", "cuerpo"]]],
  ["texto informativo", [["Las abejas", "título"], ["Las abejas son insectos que viven en grupos muy grandes llamados colmenas. Recogen el néctar de las flores para fabricar miel. Además, ayudan a que las plantas den frutos.", "cuerpo"]]],
  ["texto informativo", [["El sistema solar", "título"], ["El sistema solar está formado por el Sol y los ocho planetas que giran a su alrededor. La Tierra es el tercer planeta más cercano al Sol.", "cuerpo"]]]
];
const TYPES = ["carta", "noticia", "invitación", "receta", "diario", "cuento", "poema", "biografía", "anuncio", "formulario", "descripción", "texto informativo"];
const PURPOSE = { carta:"contar algo a una persona que está lejos", noticia:"informar de algo que ha pasado de verdad", invitación:"pedir a alguien que venga a una celebración",
  receta:"explicar cómo se prepara una comida", diario:"escribir lo que nos pasa cada día y lo que sentimos", cuento:"contar una historia inventada",
  poema:"expresar sentimientos con versos y rima", biografía:"contar la vida de una persona real", anuncio:"convencer a la gente para que compre o haga algo",
  formulario:"recoger los datos de una persona", descripción:"decir cómo es una persona, un lugar o una cosa", "texto informativo":"explicar un tema con datos verdaderos" };
const ART = { carta:"una carta", noticia:"una noticia", invitación:"una invitación", receta:"una receta", diario:"un diario", cuento:"un cuento", poema:"un poema",
  biografía:"una biografía", anuncio:"un anuncio", formulario:"un formulario", descripción:"una descripción", "texto informativo":"un texto informativo" };
const PART_ART = { "lugar y fecha":"el lugar y la fecha", saludo:"el saludo", cuerpo:"el cuerpo", despedida:"la despedida", firma:"la firma", titular:"el titular",
  motivo:"el motivo", día:"el día", hora:"la hora", lugar:"el lugar", título:"el título", ingredientes:"los ingredientes", preparación:"la preparación" };
const textBox = (lines, hl) => `<div class="texto">${lines.map(([t, part], i) =>
  `<p class="${i === hl ? "hl" : ""} ${part === "titular" || part === "título" ? "tit" : ""}">${esc(t)}</p>`).join("")}</div>`;
const tipos = {
  id:"le-tipos", name:"Tipos de texto", emoji:"📰",
  desc:"Cartas, noticias, invitaciones, recetas, diarios, cuentos, poemas, biografías, anuncios, formularios, descripciones y textos informativos.",
  rule:`Cada tipo de texto sirve para algo y tiene sus partes:
    <ul><li><b>Carta</b>: lugar y fecha, saludo (Querida abuela:), cuerpo, despedida y firma.</li>
    <li><b>Noticia</b>: titular y cuerpo; cuenta algo real: qué, quién, cuándo y dónde.</li>
    <li><b>Invitación</b>: motivo, día, hora y lugar. · <b>Receta</b>: título, ingredientes y preparación.</li>
    <li><b>Diario</b>: lo que nos pasa cada día. · <b>Cuento</b>: una historia inventada. · <b>Poema</b>: versos, a menudo con rima.</li>
    <li><b>Biografía</b>: la vida de una persona real. · <b>Anuncio</b>: quiere convencernos, con un eslogan. · <b>Formulario</b>: huecos para rellenar datos.</li>
    <li><b>Descripción</b>: cómo es alguien o algo. · <b>Texto informativo</b>: explica un tema con datos.</li></ul>`,
  levels:[
    { name:"¿Qué texto es?", desc:"Reconoce el tipo de texto" },
    { name:"Sus partes", desc:"¿Cómo se llama esta parte?" },
    { name:"¿Para qué sirve?", desc:"Cada texto tiene una finalidad" }
  ],
  texts:TEXTS,
  make(level){
    if (level === 3){
      const t = pick(TYPES);
      if (Math.random() < .5) return { input:"choice", text:`¿Qué texto sirve para <b>${PURPOSE[t]}</b>?`, choices:shuffle([t, ...sample(TYPES.filter(x => x !== t), 3)]), answer:t,
        explain:`${cap(ART[t])} sirve para ${PURPOSE[t]}.`, key:"tt3" + t };
      const p = shuffle([t, ...sample(TYPES.filter(x => x !== t), 2)]).map(x => PURPOSE[x]);
      return { input:"choice", text:`¿Para qué sirve <b>${ART[t]}</b>?`, choices:p.map(cap), answer:cap(PURPOSE[t]), explain:`${cap(ART[t])} sirve para ${PURPOSE[t]}.`, key:"tt3r" + t };
    }
    if (level === 1){
      const [t, lines] = pick(TEXTS);
      return { input:"choice", picture:textBox(lines), text:"¿Qué tipo de texto es?", choices:shuffle([t, ...sample(TYPES.filter(x => x !== t), 3)]), answer:t,
        explain:`Es ${ART[t]}: sirve para ${PURPOSE[t]}.`, key:"tt1" + lines[0][0] };   // (the type names are the choices; the article shows in the explanation)
    }
    const [t, lines] = pick(TEXTS.filter(x => ["carta", "noticia", "invitación", "receta"].includes(x[0])));
    const i = Math.floor(Math.random() * lines.length), parts = [...new Set(lines.map(l => l[1]))];
    return { input:"choice", picture:textBox(lines, i), text:`En esta ${t}, ¿cómo se llama la parte marcada?`, choices:shuffle(parts), answer:lines[i][1],
      explain:`Es <b>${PART_ART[lines[i][1]]}</b> de la ${t}.`, key:"tt2" + lines[i][0] };
  }
};

L4.TOPICS.push({ id:"lectura", title:"Lectura", emoji:"👓", skills:[comprension, cuento, tipos] });
})();
