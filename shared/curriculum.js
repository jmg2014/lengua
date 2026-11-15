/* Every line of curriculo_lengua_4_primaria.md, and the skills that practise it. Used by the curriculum map on the main page.
   [] means the line is class or home work that an app can't practise (speaking, reading whole books, research…): shown as "en clase".
   The last two sections are not in the decree: what Santillana's 4.º book adds, and the Spanish-vs-English skill. */
(function(){
"use strict";
const L4 = window.L4 = window.L4 || {};
L4.CURRICULUM = [
  { title:"1. Las lenguas y sus hablantes", lines:[
    ["Conocer la diversidad de lenguas del mundo y de España, y respetarlas", ["li-lenguas"]],
    ["Conocer la historia del español como lengua universal", ["li-lenguas"]],
    ["Identificar prejuicios sobre las lenguas y usar un lenguaje no discriminatorio", []]
  ]},
  { title:"2. Comunicación oral: escuchar y hablar", lines:[
    ["Comprender textos orales sencillos", []],
    ["Interpretar la comunicación no verbal (gestos, postura, expresión de la cara)", []],
    ["Hablar con orden: relatar, inventar historias, resumir, opinar, responder", []],
    ["Pausas, pronunciación y entonación adecuadas", []],
    ["Conversar con escucha activa y cortesía", []]
  ]},
  { title:"3. Lectura: comprensión lectora", lines:[
    ["Estrategias antes, durante y después de leer", ["le-comprension"]],
    ["Identificar las ideas importantes, resumir y hacer inferencias", ["le-comprension"]],
    ["Relacionar las ilustraciones con el texto y aprovechar los elementos gráficos", []],
    ["Reconocer el vocabulario del texto", ["di-acepcion", "vo-polisemia"]],
    ["Leer en voz alta con entonación, fluidez y ritmo", []],
    ["Empezar a valorar si un texto es fiable", []]
  ]},
  { title:"4. Escritura", lines:[
    ["Escribir textos con coherencia y cohesión", ["pu-ordenar", "pu-repetir"]],
    ["Ortografía reglada básica en copias, dictados y textos propios", ["or-dictado"]],
    ["Planificar, escribir, revisar y corregir los propios textos", []],
    ["Tipos de texto: narración, descripción, diálogo y exposición", ["le-cuento", "le-tipos", "li-generos"]],
    ["Textos de la vida diaria: cartas, noticias, invitaciones, recetas, diarios, cuentos", ["le-tipos", "pu-dospuntos"]],
    ["Escribir en soporte digital", []]
  ]},
  { title:"5. Educación literaria", lines:[
    ["Leer obras y fragmentos de literatura infantil", []],
    ["Reconocer tema, protagonistas, personajes secundarios, argumento y espacio", ["le-cuento"]],
    ["Reconocer recursos expresivos sencillos: la rima, las comparaciones", ["li-rima", "li-recursos"]],
    ["Leer de forma expresiva, dramatizar y recitar", []],
    ["Crear textos literarios propios (cuentos, poemas…)", []],
    ["Conocer los principales autores de la literatura española y sus obras", ["li-autores"]],
    ["Expresar gustos lectores y opinar sobre los libros", []]
  ]},
  { title:"6. Clases de palabras", lines:[
    ["Sustantivos, artículos y otros determinantes, pronombres personales, adjetivos y verbos", ["gr-sustantivo", "gr-determinantes", "gr-pronombres", "gr-adjetivo", "gr-verbo", "gr-clases"]],
    ["Concordancia de género y número entre sustantivos, adjetivos y verbos", ["gr-adjetivo", "gr-oracion"]],
    ["La lengua como sistema: sonidos y letras, palabras, oraciones y textos", ["ti-silabas", "gr-oracion"]]
  ]},
  { title:"6. Ortografía", lines:[
    ["b/v, g/j, ll/y, r/rr y h", ["or-bv", "or-gj", "or-lly", "or-rr", "or-h"]],
    ["c/qu, z/c, d/z y s/z", ["or-cz", "or-dz", "or-sz"]],
    ["Repaso del 1.er ciclo: mayúsculas, mb/mp, nv, bl/br", ["or-may", "or-mn", "or-bv"]]
  ]},
  { title:"6. Vocabulario", lines:[
    ["Sinónimos y antónimos", ["vo-sinonimos"]],
    ["Polisemia: palabras con varios significados", ["vo-polisemia", "di-acepcion"]],
    ["Prefijos y sufijos: aumentativos y diminutivos", ["vo-prefijos", "vo-sufijos"]],
    ["Familia de palabras y campo semántico", ["vo-familia", "vo-campo"]],
    ["Uso del diccionario: orden alfabético y buscar significados", ["di-alfabeto", "di-guia", "di-forma", "di-acepcion"]]
  ]},
  { title:"6. Oraciones y textos", lines:[
    ["Modalidad oracional: enunciativa, interrogativa, exclamativa…", ["gr-tipos", "pu-signos"]],
    ["Coherencia y cohesión: evitar repeticiones, ordenar oraciones", ["pu-repetir", "pu-ordenar"]],
    ["Signos de puntuación: punto, coma, punto y coma, dos puntos, ¿? y ¡!", ["pu-punto", "pu-coma", "pu-dospuntos", "pu-signos"]]
  ]},
  { title:"7. Búsqueda de información", lines:[
    ["Buscar información guiada en fuentes variadas y compararla", []],
    ["Citar la autoría y respetar el trabajo de otros", []],
    ["Usar la biblioteca y los recursos digitales", []],
    ["Hábitos seguros y críticos con las tecnologías", []]
  ]},
  { title:"Del libro de 4.º (Santillana)", lines:[
    ["Sílaba tónica; palabras agudas, llanas y esdrújulas; reglas de la tilde", ["ti-tonica", "ti-clase", "ti-regla"]],
    ["Diptongos e hiatos", ["ti-diptongo"]],
    ["Tilde diacrítica: tú/tu, él/el, qué/que…", ["ti-diacritica"]],
    ["Sujeto y predicado; el grupo nominal", ["gr-oracion", "gr-grupo"]],
    ["El verbo: conjugaciones, número, persona y tiempo", ["gr-verbo", "gr-conjugar"]],
    ["Adverbios, preposiciones y conjunciones", ["gr-adverbio", "gr-prepos"]],
    ["Palabras compuestas, homófonas y frases hechas", ["vo-compuestas", "vo-polisemia", "vo-frases"]],
    ["El guion y los puntos suspensivos", ["or-guion", "pu-punto"]],
    ["Géneros literarios y medida de los versos", ["li-generos", "li-medida"]]
  ]},
  { title:"Para quien también escribe en inglés", lines:[
    ["Las trampas del inglés: mayúsculas, letras dobles, ph, th, s + consonante…", ["or-ingles"]]
  ]}
];

/* status of one skill: "new", "learning" or "mastered" */
L4.skillStatus = function(id){
  const r = L4.prog.peek(id);
  if (!r || !r.seen) return r && r.star ? "mastered" : "new";
  return r.star ? "mastered" : "learning";
};
/* status of a curriculum line: "class" when no skill practises it; mastered when all its skills are; learning when any has been tried */
L4.lineStatus = function(ids){
  if (!ids.length) return "class";
  const st = ids.map(L4.skillStatus);
  if (st.every(s => s === "mastered")) return "mastered";
  return st.some(s => s !== "new") ? "learning" : "new";
};
})();
