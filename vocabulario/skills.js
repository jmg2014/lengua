/* Vocabulario, Phase 4 of the roadmap.
   All lists here are written by hand (word knowledge can't be generated). tests/check.py checks every word against
   the dictionary, and tests/skills.html checks that no question has two right answers (an option from another
   list is never a synonym, a family member or a meaning of the asked word). */
(function(){
"use strict";
const L4 = window.L4, { pick, shuffle, sample, esc } = L4;
const cap = s => s[0].toLocaleUpperCase("es") + s.slice(1);

/* ---------- 1. familias de palabras ---------- */
/* primitive: derived words. look-alikes that are NOT in the family: */
const FAMILIES = [
  ["pan", ["panadero", "panadería", "panecillo", "empanada"], ["pantalón", "pantera"]],
  ["mar", ["marinero", "marino", "submarino", "marea"], ["mariposa", "marzo"]],
  ["flor", ["florero", "floristería", "florecer", "floral"], ["flotador", "flojo"]],
  ["zapato", ["zapatero", "zapatería", "zapatilla"], ["zanahoria"]],
  ["libro", ["librería", "librero", "libreta"], ["libre", "liebre"]],
  ["leche", ["lechero", "lechería"], ["lechuga", "lechuza"]],
  ["fruta", ["frutero", "frutería", "frutal"], ["frontera"]],
  ["jardín", ["jardinero", "jardinería"], ["jarra"]],
  ["papel", ["papelera", "papelería"], ["papá", "papaya"]],
  ["sal", ["salero", "salado", "salar"], ["salir", "saltar"]],
  ["nieve", ["nevar", "nevada", "nevera"], ["nieto"]],
  ["carne", ["carnicero", "carnicería"], ["carnaval", "carné"]],
  ["pescado", ["pescadero", "pescadería"], ["pestaña"]],
  ["reloj", ["relojero", "relojería"], ["relámpago"]],
  ["tierra", ["terreno", "enterrar", "terremoto", "terrestre"], ["tiempo", "tigre"]],
  ["sol", ["soleado", "solar"], ["soldado", "sólido"]]
];
/* clues to write a derived word */
const DERIVED_CLUES = [
  ["panadero", "Persona que hace pan"], ["panadería", "Tienda donde venden pan"], ["zapatero", "Persona que arregla zapatos"],
  ["zapatería", "Tienda donde venden zapatos"], ["librería", "Tienda donde venden libros"], ["florero", "Recipiente para poner flores"],
  ["frutería", "Tienda donde venden fruta"], ["jardinero", "Persona que cuida el jardín"], ["relojero", "Persona que arregla relojes"],
  ["carnicero", "Persona que vende carne"], ["pescadero", "Persona que vende pescado"], ["papelera", "Cubo para tirar los papeles"],
  ["salero", "Recipiente para la sal"], ["marinero", "Persona que trabaja en el mar"], ["nevar", "Caer nieve"], ["soleado", "Día con mucho sol"]
];
const familia = {
  id:"vo-familia", name:"Familias de palabras", emoji:"🌳",
  desc:"Palabras primitivas y derivadas que comparten una raíz.",
  rule:`<ul><li>Una palabra <b>primitiva</b> no viene de otra: <b>pan</b>.</li>
    <li>Las <b>derivadas</b> se forman a partir de ella: <b>pan</b>adero, <b>pan</b>adería, <b>pan</b>ecillo.</li>
    <li>Todas juntas forman una <b>familia de palabras</b>: comparten la raíz y tienen que ver con lo mismo.
      ¡Ojo! <i>pantalón</i> empieza igual, pero no tiene nada que ver con el pan.</li></ul>`,
  levels:[
    { name:"La primitiva", desc:"¿Cuál es la palabra primitiva?" },
    { name:"El intruso", desc:"Toca la palabra que no es de la familia" },
    { name:"Escríbela", desc:"Escribe la palabra derivada" }
  ],
  families:FAMILIES, clues:DERIVED_CLUES,
  make(level){
    if (level === 3){
      const [w, clue] = pick(DERIVED_CLUES), f = FAMILIES.find(x => x[1].includes(w));
      return { input:"text", text:`${clue}. <i>(familia de <b>${f[0]}</b>)</i>`, answer:w, explain:`Es <b>${w}</b>, de la familia de <b>${f[0]}</b>.`, key:"fa3" + w };
    }
    const [prim, der, fakes] = pick(FAMILIES.filter(f => f[1].length >= 2));
    if (level === 1){
      const words = shuffle([prim, ...sample(der, Math.min(3, der.length))]);
      return { input:"choice", text:"¿Cuál es la palabra <b>primitiva</b>?", choices:words, answer:prim,
        explain:`<b>${prim}</b> es la primitiva: las demás (${der.join(", ")}) se forman a partir de ella.`, key:"fa1" + prim };
    }
    const fake = pick(fakes), words = shuffle([...sample([prim, ...der], 3), fake]);
    return { input:"words", one:true, text:`Toca la palabra que <b>no</b> es de la familia:`, words, answer:[words.indexOf(fake)],
      explain:`<b>${fake}</b> se parece, pero no tiene nada que ver con <b>${prim}</b>. La familia es: ${[prim, ...der].join(", ")}.`, solution:fake, key:"fa2" + words.join(" ") };
  }
};

/* ---------- 2. palabras simples y compuestas ---------- */
/* compound: [first, second] joined by simply writing them together */
/* a 4th item says what changes when the two words join */
const COMPOUNDS = [["sacapuntas", "saca", "puntas"], ["paraguas", "para", "aguas", "las dos aes se juntan en una"], ["girasol", "gira", "sol"], ["abrelatas", "abre", "latas"],
  ["cumpleaños", "cumple", "años"], ["rompecabezas", "rompe", "cabezas"], ["pasatiempo", "pasa", "tiempo"], ["sacacorchos", "saca", "corchos"],
  ["lavaplatos", "lava", "platos"], ["mediodía", "medio", "día"], ["salvavidas", "salva", "vidas"], ["cortaúñas", "corta", "uñas"],
  ["guardarropa", "guarda", "ropa", "la r pasa a rr, porque queda entre vocales"], ["bienvenido", "bien", "venido"], ["parachoques", "para", "choques"], ["rascacielos", "rasca", "cielos"],
  ["lavavajillas", "lava", "vajillas"], ["matamoscas", "mata", "moscas"], ["quitamanchas", "quita", "manchas"], ["portaminas", "porta", "minas"]];
const SIMPLES = ["zapato", "ventana", "camino", "pelota", "mochila", "elefante", "tortuga", "escuela", "naranja", "guitarra", "pájaro", "bicicleta"];
const compuestas = {
  id:"vo-compuestas", name:"Simples y compuestas", emoji:"➕",
  desc:"Palabras formadas por dos palabras: saca + puntas = sacapuntas.",
  rule:`<ul><li>Una palabra <b>simple</b> está formada por una sola palabra: mesa, zapato.</li>
    <li>Una palabra <b>compuesta</b> se forma juntando dos palabras: <b>gira</b> + <b>sol</b> = <b>girasol</b>; <b>para</b> + <b>aguas</b> = <b>paraguas</b>.</li></ul>`,
  levels:[
    { name:"¿Simple o compuesta?", desc:"Mira si está formada por dos palabras" },
    { name:"Júntalas", desc:"Escribe la palabra compuesta" },
    { name:"Sepáralas", desc:"¿Qué dos palabras la forman?" }
  ],
  compounds:COMPOUNDS, simples:SIMPLES,
  make(level){
    if (level === 1){
      const comp = Math.random() < .5, w = comp ? pick(COMPOUNDS)[0] : pick(SIMPLES), c = COMPOUNDS.find(x => x[0] === w);
      return { input:"choice", text:`<b>${w}</b> es una palabra…`, choices:["simple", "compuesta"], answer:comp ? "compuesta" : "simple",
        explain:comp ? `<b>${w}</b> = ${c[1]} + ${c[2]}: es <b>compuesta</b>.` : `<b>${w}</b> no se puede partir en dos palabras: es <b>simple</b>.`, key:"cp1" + w };
    }
    const [w, a, b, note] = pick(COMPOUNDS);
    if (level === 2) return { input:"text", text:`Junta las dos palabras: <b>${a}</b> + <b>${b}</b>`, answer:w, explain:`${a} + ${b} = <b>${w}</b>${note ? ` (${note})` : ""}.`, key:"cp2" + w };
    const wrongs = [];
    // wrong splits; for words whose letters change when joined (para + aguas = paraguas), not right next to the real split,
    // where a piece could also read as a word ("par + aguas")
    for (let k = 2; k < w.length - 2; k++) if (Math.abs(k - a.length) > (note ? 1 : 0)) wrongs.push(`${w.slice(0, k)} + ${w.slice(k)}`);
    const right = `${a} + ${b}`;
    return { input:"choice", text:`¿Qué dos palabras forman <b>${w}</b>?`, choices:shuffle([right, ...sample(wrongs, 2)]), answer:right,
      explain:`<b>${w}</b> = <b>${a}</b> + <b>${b}</b>.`, key:"cp3" + w };
  }
};

/* ---------- 3. prefijos ---------- */
const OPPOSITE = [["hacer", "deshacer", "des"], ["atar", "desatar", "des"], ["ordenado", "desordenado", "des"], ["tapar", "destapar", "des"],
  ["abrochar", "desabrochar", "des"], ["conocido", "desconocido", "des"], ["obediente", "desobediente", "des"], ["colgar", "descolgar", "des"],
  ["feliz", "infeliz", "in"], ["útil", "inútil", "in"], ["visible", "invisible", "in"], ["correcto", "incorrecto", "in"], ["cómodo", "incómodo", "in"],
  ["capaz", "incapaz", "in"], ["posible", "imposible", "im"], ["paciente", "impaciente", "im"], ["perfecto", "imperfecto", "im"], ["puntual", "impuntual", "im"]];
const PREF_MEANING = {
  re:["otra vez", ["releer", "repasar", "rehacer", "recargar"], ["leer", "pasar", "hacer", "cargar"]],
  pre:["antes", ["prehistoria", "preescolar", "precalentar", "prever"], ["historia", "escolar", "calentar", "ver"]],
  sub:["debajo", ["subterráneo", "submarino", "subrayar"], ["terreno", "marino", "raya"]],
  sobre:["encima", ["sobrevolar", "sobremesa", "sobresalir"], ["volar", "mesa", "salir"]],
  super:["muy, más que", ["supermercado", "superhéroe", "superpoblado"], ["mercado", "héroe", "poblado"]],
  inter:["entre", ["internacional", "intercambio"], ["nacional", "cambio"]]
};
const PREF_CLUES = [["Leer otra vez", "releer"], ["Hacer otra vez", "rehacer"], ["Lo contrario de feliz", "infeliz"], ["Lo contrario de posible", "imposible"],
  ["Lo contrario de atar", "desatar"], ["Lo contrario de ordenado", "desordenado"], ["Que va por debajo del mar", "submarino"], ["Lo contrario de útil", "inútil"],
  ["Lo contrario de paciente", "impaciente"], ["Volar por encima", "sobrevolar"], ["Calentar antes", "precalentar"], ["Lo contrario de visible", "invisible"]];
const prefijos = {
  id:"vo-prefijos", name:"Prefijos", emoji:"⬅️",
  desc:"Lo que se pone delante: des-, in-, im-, re-, pre-, sub-…",
  rule:`Un <b>prefijo</b> se pone <b>delante</b> de una palabra y cambia su significado:
    <ul><li>Para decir lo contrario: <b>des-</b> (deshacer), <b>in-</b> (infeliz) e <b>im-</b> delante de p y b (imposible).</li>
    <li><b>re-</b>: otra vez (releer) · <b>pre-</b>: antes (prehistoria) · <b>sub-</b>: debajo (submarino)</li>
    <li><b>sobre-</b>: encima (sobrevolar) · <b>super-</b>: muy, más que (supermercado) · <b>inter-</b>: entre (internacional)</li></ul>`,
  levels:[
    { name:"Lo contrario", desc:"¿des-, in- o im-?" },
    { name:"¿Qué significa?", desc:"El significado del prefijo" },
    { name:"Escríbela", desc:"Escribe la palabra con prefijo" }
  ],
  opposite:OPPOSITE, meanings:PREF_MEANING, clues:PREF_CLUES,
  make(level){
    if (level === 1){
      const [base, w, p] = pick(OPPOSITE);
      return { input:"gap", text:`Lo contrario de <b>${base}</b>:`, gap:"_" + base, choices:["des", "in", "im"], answer:p, solution:w,
        explain:`Lo contrario de ${base} es <b>${w}</b>.${p === "im" ? " Delante de p y b se escribe im-." : ""}`, key:"pf1" + base };
    }
    if (level === 2){
      const p = pick(Object.keys(PREF_MEANING)), [mean, ws, bases] = PREF_MEANING[p], i = Math.floor(Math.random() * ws.length);
      const choices = Object.values(PREF_MEANING).map(m => m[0]);
      return { input:"choice", text:`En <b>${ws[i]}</b>, ¿qué significa <b>${p}-</b>?`, choices, answer:mean,
        explain:`<b>${p}-</b> significa «${mean}»: ${ws[i]} (${p}- + ${bases[i]}).`, key:"pf2" + ws[i] };
    }
    const [clue, w] = pick(PREF_CLUES);
    return { input:"text", text:`${clue}:`, answer:w, explain:`Es <b>${w}</b>.`, key:"pf3" + w };
  }
};

/* ---------- 4. sufijos ---------- */
/* word | from | type */
const SUFFIXED = [
  ["casita", "casa", "diminutivo"], ["perrito", "perro", "diminutivo"], ["gatito", "gato", "diminutivo"], ["mesita", "mesa", "diminutivo"],
  ["librito", "libro", "diminutivo"], ["pajarito", "pájaro", "diminutivo"], ["abuelita", "abuela", "diminutivo"], ["cajita", "caja", "diminutivo"],
  ["zapatito", "zapato", "diminutivo"], ["panecillo", "pan", "diminutivo"],
  ["manaza", "mano", "aumentativo"], ["casona", "casa", "aumentativo"], ["cucharón", "cuchara", "aumentativo"], ["cabezota", "cabeza", "aumentativo"],
  ["librote", "libro", "aumentativo"], ["narizota", "nariz", "aumentativo"], ["cabezón", "cabeza", "aumentativo"], ["grandote", "grande", "aumentativo"],
  ["zapatero", "zapato", "oficio"], ["panadero", "pan", "oficio"], ["jardinero", "jardín", "oficio"], ["cartero", "carta", "oficio"],
  ["carnicero", "carne", "oficio"], ["cocinero", "cocina", "oficio"], ["bombero", "bomba", "oficio"], ["frutero", "fruta", "oficio"],
  ["panadería", "pan", "tienda"], ["zapatería", "zapato", "tienda"], ["frutería", "fruta", "tienda"], ["librería", "libro", "tienda"],
  ["juguetería", "juguete", "tienda"], ["heladería", "helado", "tienda"], ["pescadería", "pescado", "tienda"]
];
const SUF_WHY = { diminutivo:"es un <b>diminutivo</b>: dice que algo es pequeño o con cariño (-ito, -ita, -illo, -ín).",
  aumentativo:"es un <b>aumentativo</b>: dice que algo es grande (-ón, -ona, -azo, -aza, -ote, -ota).",
  oficio:"nombra un <b>oficio</b>: la persona que trabaja con eso (-ero, -era).",
  tienda:"nombra una <b>tienda</b> o lugar donde se vende o se hace algo (-ería)." };
/* level 3: regular diminutives with -ito/-ita (ending o/a: take it off and add -ito/-ita) */
const DIM_REGULAR = [["casa", "casita"], ["perro", "perrito"], ["gato", "gatito"], ["mesa", "mesita"], ["libro", "librito"], ["caja", "cajita"],
  ["zapato", "zapatito"], ["abuela", "abuelita"], ["vaso", "vasito"], ["silla", "sillita"], ["pato", "patito"], ["plato", "platito"]];
const sufijos = {
  id:"vo-sufijos", name:"Sufijos", emoji:"➡️",
  desc:"Lo que se pone detrás: -ito, -ón, -azo, -ero, -ería…",
  rule:`Un <b>sufijo</b> se pone <b>detrás</b> de la raíz de una palabra:
    <ul><li><b>Diminutivos</b> (pequeño o con cariño): -ito, -ita, -illo, -ín: casita, panecillo, pequeñín.</li>
    <li><b>Aumentativos</b> (grande): -ón, -ona, -azo, -aza, -ote, -ota: cucharón, casona, manaza, grandote, narizota.</li>
    <li><b>Oficios</b>: -ero, -era: zapatero, cartera. · <b>Tiendas</b>: -ería: zapatería, frutería.</li></ul>`,
  levels:[
    { name:"¿Qué sufijo es?", desc:"Diminutivo, aumentativo, oficio o tienda" },
    { name:"¿De qué palabra viene?", desc:"Busca la palabra de la que sale" },
    { name:"El diminutivo", desc:"Escribe el diminutivo con -ito o -ita" }
  ],
  words:SUFFIXED, dims:DIM_REGULAR,
  make(level){
    if (level === 3){
      const [b, d] = pick(DIM_REGULAR);
      return { input:"text", text:`Escribe el diminutivo de <b>${b}</b> con <b>-${d.endsWith("a") ? "ita" : "ito"}</b>:`, answer:d,
        explain:`${b} → <b>${d}</b>: se quita la última vocal y se añade -${d.endsWith("a") ? "ita" : "ito"}.`, key:"sf3" + b };
    }
    const [w, from, type] = pick(SUFFIXED);
    if (level === 1) return { input:"choice", text:`<b>${w}</b>…`, choices:["diminutivo", "aumentativo", "oficio", "tienda"], answer:type,
      explain:`<b>${w}</b> (de ${from}) ${SUF_WHY[type]}`, key:"sf1" + w };
    const others = sample([...new Set(SUFFIXED.map(s => s[1]).filter(x => x !== from && !w.startsWith(x.slice(0, 3))))], 2);
    return { input:"choice", text:`¿De qué palabra viene <b>${w}</b>?`, choices:shuffle([from, ...others]), answer:from,
      explain:`<b>${w}</b> viene de <b>${from}</b>: ${SUF_WHY[type]}`, key:"sf2" + w };
  }
};

/* ---------- 5. sinónimos y antónimos ---------- */
const SYN = [["contento", "alegre"], ["empezar", "comenzar"], ["terminar", "acabar"], ["rápido", "veloz"], ["enfadado", "enojado"], ["miedo", "temor"],
  ["cara", "rostro"], ["regalo", "obsequio"], ["cansado", "agotado"], ["delgado", "flaco"], ["coche", "automóvil"], ["andar", "caminar"],
  ["tirar", "lanzar"], ["chillar", "gritar"], ["casa", "vivienda"], ["alumno", "estudiante"], ["profesor", "maestro"], ["barco", "navío"],
  ["delicioso", "sabroso"], ["listo", "inteligente"], ["hablar", "charlar"], ["mirar", "observar"], ["bonito", "precioso"], ["enorme", "gigante"]];
/* word | antonyms that count (the first is the usual one) */
const ANT = [["alto", ["bajo"]], ["grande", ["pequeño", "chico"]], ["rápido", ["lento"]], ["día", ["noche"]], ["frío", ["caliente", "cálido"]],
  ["abrir", ["cerrar"]], ["subir", ["bajar"]], ["entrar", ["salir"]], ["ganar", ["perder"]], ["limpio", ["sucio"]], ["lleno", ["vacío"]],
  ["nuevo", ["viejo", "antiguo"]], ["encender", ["apagar"]], ["dentro", ["fuera"]], ["mucho", ["poco"]], ["alegre", ["triste"]], ["ancho", ["estrecho"]],
  ["duro", ["blando"]], ["fácil", ["difícil"]], ["recordar", ["olvidar"]], ["comprar", ["vender"]], ["cerca", ["lejos"]], ["primero", ["último"]],
  ["valiente", ["cobarde"]], ["amigo", ["enemigo"]], ["mojado", ["seco"]], ["oscuro", ["claro"]], ["gordo", ["delgado", "flaco"]], ["arriba", ["abajo"]],
  ["empezar", ["terminar", "acabar"]], ["meter", ["sacar"]], ["siempre", ["nunca"]]];
const sinonimos = {
  id:"vo-sinonimos", name:"Sinónimos y antónimos", emoji:"↔️",
  desc:"Palabras que significan lo mismo, y palabras que significan lo contrario.",
  rule:`<ul><li><b>Sinónimos</b>: palabras que significan <b>lo mismo</b> o casi lo mismo: contento = alegre.</li>
    <li><b>Antónimos</b>: palabras que significan <b>lo contrario</b>: alto ≠ bajo.</li></ul>
    Los sinónimos sirven para no repetir palabras cuando escribes.`,
  levels:[
    { name:"Sinónimos", desc:"Elige el sinónimo" },
    { name:"Antónimos", desc:"Elige el antónimo" },
    { name:"Escríbelo", desc:"Escribe el antónimo" }
  ],
  syn:SYN, ant:ANT,
  make(level){
    if (level === 1){
      const [a, b] = pick(SYN), [w, s] = Math.random() < .5 ? [a, b] : [b, a];
      const others = sample(SYN.filter(p => p[0] !== a).map(p => pick(p)), 2);
      return { input:"choice", text:`¿Cuál es un <b>sinónimo</b> de <b>${w}</b>?`, choices:shuffle([s, ...others]), answer:s,
        explain:`<b>${w}</b> y <b>${s}</b> significan lo mismo: son sinónimos.`, key:"sy1" + w };
    }
    const [w, ants] = pick(ANT);
    if (level === 2){
      const others = sample(ANT.filter(p => p[0] !== w && !p[1].includes(w) && !ants.includes(p[0])).map(p => p[1][0]).filter(x => !ants.includes(x)), 2);
      return { input:"choice", text:`¿Cuál es el <b>antónimo</b> de <b>${w}</b>?`, choices:shuffle([ants[0], ...others]), answer:ants[0],
        explain:`Lo contrario de <b>${w}</b> es <b>${ants[0]}</b>: son antónimos.`, key:"an2" + w };
    }
    return { input:"text", text:`Escribe el <b>antónimo</b> de <b>${w}</b>:`, answer:ants, explain:`Lo contrario de <b>${w}</b> es <b>${ants.join("</b> o <b>")}</b>.`, key:"an3" + w };
  }
};

/* ---------- 6. polisemia y homófonas ---------- */
/* sentence | right meaning | other meaning of the same word */
const POLI = [
  ["Me senté en un <b>banco</b> del parque.", "un asiento largo", "un lugar donde se guarda el dinero"],
  ["Mi madre fue al <b>banco</b> a sacar dinero.", "un lugar donde se guarda el dinero", "un asiento largo"],
  ["El viento movía las <b>hojas</b> del árbol.", "parte verde de una planta", "trozo de papel"],
  ["Escribe tu nombre en la <b>hoja</b>.", "trozo de papel", "parte verde de una planta"],
  ["Riego la <b>planta</b> todos los días.", "un ser vivo con raíz, tallo y hojas", "un piso de un edificio"],
  ["Vivo en la tercera <b>planta</b>.", "un piso de un edificio", "un ser vivo con raíz, tallo y hojas"],
  ["El perro mueve la <b>cola</b> cuando está contento.", "parte del cuerpo de un animal", "fila de personas que esperan"],
  ["Había mucha <b>cola</b> para entrar al cine.", "fila de personas que esperan", "parte del cuerpo de un animal"],
  ["Mueve el <b>ratón</b> para encender el ordenador.", "aparato para mover la flecha en la pantalla", "animal pequeño de cola larga"],
  ["La <b>llama</b> de la vela es amarilla.", "fuego", "animal de los Andes parecido a un camello pequeño"],
  ["El pájaro lleva una ramita en el <b>pico</b>.", "boca dura de las aves", "parte más alta de una montaña"],
  ["Subimos hasta el <b>pico</b> de la montaña.", "parte más alta de una montaña", "boca dura de las aves"],
  ["Me duele la <b>muñeca</b> de tanto escribir.", "parte del cuerpo entre la mano y el brazo", "juguete con forma de niña"],
  ["En el colegio estudio <b>lengua</b> y matemáticas.", "idioma", "parte de la boca"]
];
/* homophones: sentence with "_" | right | wrong */
const HOMO = [
  ["¡_, Marta! ¿Qué tal estás?", "Hola", "Ola"], ["Una _ enorme llegó a la playa.", "ola", "hola"],
  ["La _ da leche.", "vaca", "baca"], ["Pusimos las maletas en la _ del coche.", "baca", "vaca"],
  ["El agua pasa por un _.", "tubo", "tuvo"], ["Ayer Pablo _ fiebre.", "tuvo", "tubo"],
  ["El niño hace _ la pelota.", "botar", "votar"], ["Los mayores van a _ en las elecciones.", "votar", "botar"],
  ["Vivimos en una _ con jardín.", "casa", "caza"], ["El león sale de _ por la noche.", "caza", "casa"],
  ["No he _ los deberes.", "hecho", "echo"], ["Siempre le _ azúcar a la leche.", "echo", "hecho"],
  ["_ muchos niños en el parque.", "Hay", "Ahí"], ["Deja la mochila _, en la silla.", "ahí", "hay"], ["¡_, qué daño me he hecho!", "Ay", "Hay"],
  ["Saltó la _ del jardín.", "valla", "vaya"], ["¡_ sorpresa!", "Vaya", "Valla"],
  ["Mi abuelo va a _ el queso.", "rallar", "rayar"], ["No debes _ la mesa con el lápiz.", "rayar", "rallar"]
];
const polisemia = {
  id:"vo-polisemia", name:"Polisemia y homófonas", emoji:"🔀",
  desc:"Palabras con varios significados, y palabras que suenan igual pero se escriben distinto.",
  rule:`<ul><li><b>Palabras polisémicas</b>: una misma palabra con <b>varios significados</b>: <i>banco</i> (asiento / lugar del dinero), <i>hoja</i> (de árbol / de papel).
      La oración te dice cuál es.</li>
    <li><b>Palabras homófonas</b>: <b>suenan igual</b> pero se escriben distinto y significan cosas distintas: <i>hola</i> (saludo) / <i>ola</i> (del mar), <i>vaca</i> / <i>baca</i>, <i>tubo</i> / <i>tuvo</i>.</li></ul>`,
  levels:[
    { name:"Varios significados", desc:"¿Qué significa en esta oración?" },
    { name:"Homófonas", desc:"Elige la que va en la oración" },
    { name:"Mezcla", desc:"Las dos cosas" }
  ],
  poli:POLI, homo:HOMO,
  make(level){
    const kind = level === 1 ? "p" : level === 2 ? "h" : pick(["p", "h"]);
    if (kind === "p"){
      const [s, right, other] = pick(POLI);
      return { input:"choice", text:`${s}<br>Aquí significa…`, choices:shuffle([right, other]), answer:right, explain:`En esta oración significa <b>${right}</b>.`, key:"po" + s };
    }
    const [s, right, wrong] = pick(HOMO), [a, b] = s.split("_");
    return { input:"choice", text:`${esc(a)}<b>___</b>${esc(b)}`, choices:shuffle([right, wrong]), answer:right,
      explain:`${esc(a)}<b>${right}</b>${esc(b)}`, solution:s.replace("_", right), key:"ho" + s };
  }
};

/* ---------- 7. frases hechas ---------- */
/* phrase | meaning | a situation where you'd say it */
const FRASES = [
  ["estar en las nubes", "estar distraído", "Marta no se entera de nada en clase. Está…"],
  ["costar un ojo de la cara", "ser muy caro", "Esa bicicleta es carísima. Cuesta…"],
  ["ser pan comido", "ser muy fácil", "El examen fue facilísimo. Fue…"],
  ["tomar el pelo", "burlarse de alguien o engañarle en broma", "Mi hermano me dijo que había un dinosaurio en el jardín. Me estaba…"],
  ["meter la pata", "equivocarse", "Le conté a Luis la sorpresa de su cumpleaños. ¡Metí…"],
  ["dormir como un tronco", "dormir muy profundamente", "Estaba tan cansado que no oí nada en toda la noche. Dormí…"],
  ["llover a cántaros", "llover muchísimo", "Las calles están inundadas. Está lloviendo…"],
  ["echar una mano", "ayudar", "¿Me ayudas a llevar las bolsas? ¿Me echas…"],
  ["estar hecho polvo", "estar muy cansado", "Después del partido no podía ni andar. Estaba…"],
  ["quedarse en blanco", "no recordar nada en un momento", "En el examen no me acordaba de nada. Me quedé…"],
  ["ser uña y carne", "ser muy amigos", "Lucía y Elena siempre están juntas. Son…"],
  ["hablar por los codos", "hablar muchísimo", "Mi tía no para de hablar. Habla…"],
  ["ponerse rojo como un tomate", "sentir mucha vergüenza", "Cuando me cantaron en clase, me puse…"],
  ["no tener pelos en la lengua", "decir lo que se piensa sin miedo", "Mi abuela siempre dice lo que piensa. No tiene…"]
];
const frases = {
  id:"vo-frases", name:"Frases hechas", emoji:"💭",
  desc:"Expresiones que no significan lo que dicen sus palabras.",
  rule:`Una <b>frase hecha</b> es una expresión que no se entiende palabra por palabra: <i>estar en las nubes</i> no quiere decir
    estar en el cielo, sino <b>estar distraído</b>. Se usan mucho al hablar.`,
  levels:[
    { name:"¿Qué significa?", desc:"Elige el significado" },
    { name:"¿Cuál le va?", desc:"Elige la frase hecha para cada situación" },
    { name:"Mezcla", desc:"Las dos cosas" }
  ],
  frases:FRASES,
  make(level){
    const f = pick(FRASES), kind = level === 1 ? 1 : level === 2 ? 2 : pick([1, 2]);
    if (kind === 1){
      const others = sample(FRASES.filter(x => x !== f), 2).map(x => x[1]);
      return { input:"choice", text:`¿Qué significa <b>«${f[0]}»</b>?`, choices:shuffle([f[1], ...others]), answer:f[1], explain:`<b>${cap(f[0])}</b> significa <b>${f[1]}</b>.`, key:"fr1" + f[0] };
    }
    const others = sample(FRASES.filter(x => x !== f), 2);
    const situation = f[2].replace(/\s*[^.?!]*…$/, "");      // the situation without the start of the phrase
    return { input:"choice", text:`${esc(situation)}<br>¿Qué frase hecha le va?`, choices:shuffle([f[0], ...others.map(x => x[0])]), answer:f[0],
      explain:`<b>${cap(f[0])}</b>: ${f[1]}.`, key:"fr2" + f[0] };
  }
};

/* ---------- 8. campo semántico ---------- */
const CAMPOS = {
  "el colegio":["lápiz", "pizarra", "cuaderno", "mochila", "goma", "regla", "estuche"],
  "la cocina":["sartén", "olla", "cuchara", "tenedor", "plato", "horno", "cazo"],
  "la playa":["arena", "toalla", "sombrilla", "bañador", "cubo", "pala", "concha"],
  "el cuerpo":["brazo", "pierna", "cabeza", "rodilla", "codo", "hombro", "tobillo"],
  "la fruta":["manzana", "pera", "plátano", "uva", "naranja", "fresa", "cereza"],
  "la granja":["vaca", "oveja", "gallina", "cerdo", "caballo", "cabra", "pato"],
  "el tiempo (clima)":["lluvia", "nieve", "viento", "nube", "tormenta", "granizo", "niebla"],
  "la ropa":["camiseta", "pantalón", "falda", "abrigo", "calcetín", "bufanda", "jersey"],
  "los transportes":["coche", "tren", "avión", "barco", "autobús", "bicicleta", "moto"],
  "la música":["guitarra", "piano", "tambor", "violín", "flauta", "trompeta", "canción"]
};
const de = c => c.startsWith("el ") ? "del " + c.slice(3) : "de " + c;       // de + el = del
const deB = c => de(c).replace(/^(del?) /, "$1 <b>") + "</b>";               // "del <b>cuerpo</b>"
const campo = {
  id:"vo-campo", name:"Campo semántico", emoji:"🗂️",
  desc:"Palabras que tienen que ver con un mismo tema.",
  rule:`Un <b>campo semántico</b> es un grupo de palabras que tienen que ver con un mismo tema:
    <i>sartén, olla, cuchara, horno</i> son del campo semántico de <b>la cocina</b>.
    No es lo mismo que una familia de palabras: no comparten la raíz.`,
  levels:[
    { name:"El intruso", desc:"Toca la palabra que no es del grupo" },
    { name:"¿De qué tema?", desc:"Di de qué tema son las palabras" },
    { name:"Busca las del tema", desc:"Toca todas las palabras de un tema" }
  ],
  campos:CAMPOS,
  make(level){
    const names = Object.keys(CAMPOS), c = pick(names), ws = CAMPOS[c];
    if (level === 1){
      const other = pick(names.filter(n => n !== c)), intruso = pick(CAMPOS[other]), words = shuffle([...sample(ws, 4), intruso]);
      return { input:"words", one:true, text:"Toca la palabra que <b>no</b> es del grupo:", words, answer:[words.indexOf(intruso)],
        explain:`Las demás son ${deB(c)}; <b>${intruso}</b> es ${deB(other)}.`, solution:intruso, key:"ca1" + words.join(" ") };
    }
    if (level === 2){
      const shown = sample(ws, 4);
      return { input:"choice", text:`<b>${shown.join(", ")}</b><br>¿De qué tema son?`, choices:shuffle([c, ...sample(names.filter(n => n !== c), 2)]), answer:c,
        explain:`Son palabras del campo semántico de <b>${c}</b>.`, key:"ca2" + shown.join(" ") };
    }
    const mine = sample(ws, 3), others = sample(names.filter(n => n !== c), 3).map(n => pick(CAMPOS[n])), words = shuffle([...mine, ...others]);
    return { input:"words", text:`Toca todas las palabras ${deB(c)}:`, words, answer:mine.map(w => words.indexOf(w)),
      explain:`${cap(de(c))}: <b>${mine.join(", ")}</b>.`, solution:mine.join(", "), key:"ca3" + words.join(" ") };
  }
};

L4.TOPICS.push({ id:"vocabulario", title:"Vocabulario", emoji:"🔤",
  skills:[familia, compuestas, prefijos, sufijos, sinonimos, polisemia, frases, campo] });
})();
