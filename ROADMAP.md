# Lengua 4.º de Primaria – Roadmap

Goal: an app like the maths trainer (`~/math`) that covers everything in
[curriculo_lengua_4_primaria.md](curriculo_lengua_4_primaria.md) that an app can practise well.
Every exercise is **generated** from word lists and sentence templates, so it never runs out. The app
**remembers how the child is doing** and gives them more of what they find hard. Everything the child sees is in Spanish.

### Who it's for
The child lives in the UK and speaks Spanish at home, but doesn't go to school in Spain. That changes three things:
- **What to practise:** spoken Spanish is already strong, so the focus is written Spanish: spelling, accents,
  punctuation, grammar and vocabulary.
- **Explaining the rules:** there's no teacher, so every skill starts with a short rule card (*Recuerda…*),
  and every mistake explains the rule again.
- **English habits:** writing in English at school causes typical mistakes in Spanish, so there's a skill
  just for those (see Phase 1).

### Which book it follows
There's no school textbook to follow, so the app follows a typical Madrid 4.º book: **Santillana's 4.º Lengua**.
- A Madrid school (CEIP Dionisio Ridruejo) uses Santillana's current series, *Construyendo mundos*. Its teaching plan only lists the unit titles, though.
- So the topic list comes from the table of contents of Santillana's previous 4.º book, *Saber Hacer Contigo*, which is public.

The book teaches **more than the official Madrid list suggests**:
- **Accents:** accent rules are taught from the first unit (*agudas, llanas, esdrújulas, diptongos e hiatos*).
- **Grammar:** sujeto y predicado (subject and predicate), demonstratives, possessives, numerals, adverbs, prepositions, and verbs in number, person and tense.
- **Vocabulary:** compound words, homophones and set phrases.

The app includes all of these.

| Unit | Vocabulario | Gramática | Ortografía | Literatura |
|---|---|---|---|---|
| 1 | Palabras primitivas y derivadas | La oración: sujeto y predicado | Tilde en agudas | |
| 2 | Simples y compuestas | Clases de oraciones | Tilde en llanas | Textos literarios |
| 3 | – | El grupo nominal | Tilde en esdrújulas | |
| 4 | Prefijos y sufijos | Pronombres personales | Diptongos e hiatos | Obras narrativas |
| 5 | Prefijos de negación y lugar | Demostrativos | Uso de la h | |
| 6 | Otros prefijos | Posesivos | El guion | Obras líricas |
| 7 | – | Numerales e indefinidos | Uso de la b | |
| 8 | Frases hechas | El verbo | Coma y punto y coma | Medida de los versos, rima |
| 9 | Homófonas | Número, persona y tiempo | Uso de la g | |
| 10 | – | El adverbio | Punto y puntos suspensivos | Obras teatrales |
| 11 | Campo léxico | Preposiciones y conjunciones | Uso de la j | |
| 12 | – | Repaso de clases de palabras | Uso de la v | Recursos literarios |
| Extra | Diccionarios | Conjugaciones verbales | | |

---

## 1. How the app is organised

It works like the maths app: **one main page, plus a separate page (URL) for each topic**, sharing the
same engine.

```
lengua/
├── index.html              ← Main page: topic tiles, Mezcla del día, racha 🔥, mapa del currículo, zona de mayores, copia de seguridad
├── sw.js                   ← Offline support for the whole app
├── manifest.webmanifest
├── shared/
│   ├── engine.js           ← from ~/math: question loop, sound, confetti, results; new Spanish keyboard and word inputs
│   ├── progress.js         ← from ~/math: saving, mastery, next question, backup (new storage key)
│   ├── topic.js            ← from ~/math: skill tabs, 3 levels, stars
│   ├── curriculum.js       ← every line of the curriculum file and the skills that practise it
│   ├── words.js            ← shared word bank (nouns with gender, adjectives, verbs, families…), checked against a dictionary
│   ├── draw.js             ← small pictures (emoji/SVG) for words, e.g. a 🐝 for "abeja"
│   └── style.css
├── ortografia/             ← spelling: b/v, g/j, ll/y, r/rr, h, c/qu, z/c, d/z, s/z, capitals, Spanish vs English
├── tildes/                 ← syllables, stressed syllable, agudas/llanas/esdrújulas, diptongos e hiatos
├── gramatica/              ← word classes, agreement, sujeto y predicado, the verb
├── vocabulario/            ← derived and compound words, synonyms, antonyms, polysemy, homophones, prefixes, suffixes, set phrases
├── oraciones/              ← punctuation and types of sentence
├── diccionario/            ← alphabetical order, guide words, dictionary form, choosing the right meaning
├── lectura/                ← short reading comprehension, text types, parts of a story
└── literatura/             ← authors and works, rhyme and similes, languages of Spain
```

The UI is translated: *Inicio*, *Comprobar*, *¡Muy bien!*, *Nivel 1–3*, *Mezcla del día*…

### Sharing the address with the maths app
Both apps will probably live under `jmg2014.github.io`, which means **they share browser storage**:
- **Progress:** the app saves progress under its own key (`lengua4-v1`, not `y4-v1`), so maths progress
  is never touched.
- **Offline copies:** the maths service worker currently deletes *every* offline cache that isn't its own,
  so it would delete this app's cache, and this app's would delete the maths one.
  - Fix: each app deletes only caches that start with its own name.
  - That needs a one-line change in `~/math/sw.js` as well. I'll ask before touching the maths app.

---

## 2. How every exercise works

As in the maths app, each skill is a **generator** with 3 levels:

```js
{
  id: "or-bv",
  name: "b / v",
  levels: [ {name:"Elige la letra"}, {name:"Escribe la palabra"}, {name:"Dictado"} ],
  make(level) {
    return {
      text: "¿Con b o con v?  ca_allo 🐴",
      input: "choice", choices: ["b", "v"],
      answer: "b",
      explain: "<b>caballo</b>: se escribe con <b>b</b>. Truco: las palabras que acaban en <b>-aba</b>, <b>-abo</b> y <b>-ibir</b> suelen llevar b."
    };
  }
}
```

### Ways to answer
This app adds new ways to answer, because most answers are words rather than numbers:

| Input | What it does | Used for |
|---|---|---|
| `choice` (from the maths app) | 2–4 big buttons | b or v, which word class, which meaning |
| `gap` **(new)** | Letter buttons fill a gap in a word, e.g. `_ielo`: hielo / yelo | spelling level 1 |
| `text` **(new)** | On-screen Spanish keyboard (QWERTY with **ñ**, an **accent key ´** for á é í ó ú and **ü**, a capitals key, and ¿ ¡ when needed) | writing a word: spelling, plurals, opposites, diminutives |
| `words` **(new)** | Tap the right words in a sentence (one or several), then *Comprobar* | find the nouns, the verbs, the misspelled word |
| `order` **(new)** | Tap words or cards in the right order | build a sentence, alphabetical order, story order |
| `punct` **(new)** | Tap the spaces between words to add a punctuation mark | commas, full stops, ¿? ¡! |
| `listen` **(new)** | 🔊 The device reads a word or sentence aloud (Spanish voice, built into the tablet); the child writes it with the keyboard | dictado (dictation) |

**Accents:** the book teaches accent rules from Unit 1, so accents count.
- **Before the Tildes skills are mastered,** an answer whose only mistake is the accent gets a gentle
  "Casi: *árbol* lleva tilde" and comes back later.
- **Once they are mastered,** the accent counts like any other letter.

### Same rules as the maths app
- **Unlocking levels:** score 8 out of 10 to unlock the next level, and pass level 3 to earn a ⭐.
- **Mistakes:** a wrong answer shows the rule or the working (`explain`), and a similar question comes back later.
- **Mezcla del día (daily mix):** questions from every topic, favouring skills that are weak or haven't been practised for a while. It also unlocks levels and stars, so regular use covers everything.

### Making sure the Spanish is right
Unlike sums, a wrong word list can't be checked by working out the answer. So:
- **Spelling:** every word in the word bank is checked automatically against the Spanish (es_ES)
  dictionary installed on this computer (`hunspell`).
- **Hand-checked lists:** synonyms, antonyms, word families and genders are short lists written and
  reviewed by hand, with a test that every answer really is in its list.
- **Simple words:** words are chosen for a 9–10-year-old. No rare or regional words, and no
  ambiguous answers, e.g. no "¿b o v?" for *baca/vaca*.

---

## 3. Build order

Topics come in order of how much they help. Ortografía comes first: it's the topic that needs the new
keyboard and word inputs most.

### Phase 0 – Foundation ✅
- [x] Copy `shared/` from `~/math` and translate all the text into Spanish (namespace `L4`)
- [x] New storage key (`lengua4-v1`), own offline cache name, and safe cache clean-up in both apps (see section 1)
- [x] New inputs: `gap`, `text` (Spanish keyboard: ñ, ´ and ¨ keys that light up the vowels, ⇧, extra keys per question), `words`, `order`
- [x] Answer checking for words: ignore capitals and spaces at the ends, and the accent rule above (ñ and ü are letters, not accents)
- [x] Main page with topic tiles. Topics that aren't built yet show "Próximamente".
- [x] Word bank (`shared/words.js`) and a test that checks it against the es_ES dictionary (`tests/check.py`)
- [x] Rule card ("📘 Recuerda") on every skill, open until the skill has been played
- [x] Tests: 64 automated checks of the inputs and progress (`tests/engine.html`), and a demo page of every input (`tests/inputs.html`)

### Phase 1 – Ortografía
One skill per rule, each with 3 levels: **choose the letter → write the word → dictado / find the mistake in a sentence.**
- [ ] b/v (-aba, -bir, -ble, bl/br, after m; -ava/-ave/-eve/-ivo…)
- [ ] g/j (ge/gi, gue/gui, güe/güi; -aje, -eje, -jero)
- [ ] ll/y
- [ ] r/rr (r at the start and after n, l, s; rr between vowels)
- [ ] h (hie-, hue-, hum-; forms of *haber* and *hacer*)
- [ ] c/qu and z/c (ca co cu / que qui; za zo zu / ce ci; pez → peces)
- [ ] d/z at the end of words (pared → paredes, lápiz → lápices)
- [ ] s/z
- [ ] Repaso del 1.er ciclo: capital letters (names, after a full stop), mb/mp, nv
- [ ] **Español e inglés (Spanish vs English)**, for a child who also writes in English. It covers the typical mistakes:
  - lower-case days, months, languages and nationalities (*lunes*, *enero*, *inglés*)
  - no double consonants except cc, ll, rr and nn (*inteligente*, *clase*, *comisión*)
  - ph → f and th → t (*foto*, *teatro*)
  - inm-/imp- (*inmediato*, *imposible*)
  - "está" vs "esta"…
- [ ] El guion: splitting a word at the end of a line by syllables
- [ ] Dictado: `listen` input with the tablet's Spanish voice. If the tablet has no Spanish voice, the skill uses pictures instead.

### Phase 2 – Tildes (accents, Units 1–4 of the book)
- [ ] Sílabas: split a word into syllables (`order`/tap input)
- [ ] Sílaba tónica: tap the stressed syllable
- [ ] Agudas, llanas y esdrújulas: classify the word
- [ ] ¿Lleva tilde?: apply the rule, i.e. agudas ending in a vowel, -n or -s; llanas that don't; all esdrújulas
- [ ] Diptongos e hiatos: spot them (*cuento* / *día*), and the accent that breaks a diphthong (*María*, *río*)
- [ ] Tilde diacrítica, common cases only: tú/tu, él/el, sí/si, más/mas, and qué/cómo/dónde in questions

### Phase 3 – Gramática
- [ ] La oración: sujeto y predicado (subject and predicate). Tap the subject; find the verb that agrees with it.
- [ ] Clases de oraciones: enunciativa (positive or negative), interrogativa, exclamativa, imperativa, desiderativa
- [ ] El grupo nominal: determinante + sustantivo + adjetivo; find the noun at its centre (*núcleo*)
- [ ] Sustantivos: common or proper, singular or plural nouns (*individual* / *colectivo*), gender and number, plurals (-s / -es / -z → -ces)
- [ ] Determinantes: artículos, demostrativos (este/ese/aquel), posesivos (mi/tu/su…), numerales (cardinal and ordinal) and indefinidos
- [ ] Adjetivos calificativos and agreement (*la casa blanc_*); the sentence with the agreement mistake
- [ ] Pronombres personales: replace a noun with one
- [ ] El verbo: infinitive and conjugation (-ar/-er/-ir), number, person and tense (past, present or future)
- [ ] Conjugaciones verbales: complete a simple tense of a regular verb (presente, pretérito perfecto simple, futuro)
- [ ] El adverbio: place, time, manner, quantity, affirmation and negation
- [ ] Preposiciones y conjunciones: complete the sentence; know the list of prepositions (a, ante, bajo…)
- [ ] ¿Qué clase de palabra es?: tap the word class in a sentence (a mixed review of all of the above)

### Phase 4 – Vocabulario
- [ ] Palabras primitivas y derivadas, and familia de palabras (pan → panadero, panadería)
- [ ] Palabras simples y compuestas (*sacapuntas*, *paraguas*, *girasol*)
- [ ] Prefijos: of negation (des-, in-/im-), of place (sub-, sobre-, inter-…) and others (re-, pre-, super-…)
- [ ] Sufijos: aumentativos and diminutivos (-ito, -illo, -ín, -ón, -azo), plus jobs and places (-ero, -ería)
- [ ] Sinónimos and antónimos
- [ ] Polisemia (*banco*, *hoja*) and **homófonas** (*hola/ola*, *vaca/baca*, *hecho/echo*, *tubo/tuvo*)
- [ ] Frases hechas: match the phrase to its meaning (*estar en las nubes*, *costar un ojo de la cara*)
- [ ] Campo léxico / semántico: find the word that doesn't belong

### Phase 5 – Oraciones y puntuación
- [ ] ¿ ? and ¡ !, including the opening marks Spanish needs (English doesn't have them)
- [ ] El punto, the capital letter after it, and los puntos suspensivos (…)
- [ ] La coma (lists, addressing someone) and el punto y coma, kept simple (`punct` input)
- [ ] Dos puntos: before a list, and after the greeting in a letter (*Querida abuela:*)
- [ ] Ordenar palabras: build a correct sentence from shuffled words (`order` input)
- [ ] Avoiding repetition: choosing a synonym or a pronoun

### Phase 6 – Diccionario
- [ ] Alphabetical order by the 1st, 2nd and 3rd letters (`order` input)
- [ ] Palabras guía: "¿Está *gato* en la página que va de *galleta* a *gente*?"
- [ ] Dictionary form: *corrían* → correr, *blancas* → blanco
- [ ] Choosing the meaning that fits the sentence (a short dictionary entry with numbered meanings)

### Phase 7 – Lectura
- [ ] Comprensión: a short generated text (character + place + problem + ending, from templates) followed by
      questions on who, where and what happened, plus one inference ("¿Cómo se sentía…?")
- [ ] Parts of a story: inicio, nudo and desenlace (put them in order); tema, protagonista, personajes secundarios and espacio
- [ ] Text types: carta (letter), noticia (news item), invitación, receta (recipe), diario, cuento, poema. The child recognises each one and its parts (e.g. the parts of a letter).
- [ ] Reading aloud (*optional*): a sentence to read with the right tone of voice for its punctuation. Only the child can check this, so it doesn't count towards stars.

### Phase 8 – Literatura y lenguas
- [ ] Géneros: narrativa, lírica or teatro? Prose or verse?
- [ ] Medida de los versos: count the syllables in a line of poetry (simple cases)
- [ ] Rima: consonante or asonante? Do these words rhyme? Finish the line of the poem
- [ ] Recursos literarios: comparación (simile) and personificación
- [ ] Autores y obras: Cervantes, Lope de Vega, Lorca, Machado, Juan Ramón Jiménez, Gloria Fuertes, Bécquer, Rosalía de Castro… (match author ↔ work)
- [ ] Lenguas de España: castellano, catalán, gallego, euskera, valenciano and where they are spoken, plus Spanish as a world language

### Phase 9 – Main page extras
- [ ] Curriculum map: every line of `curriculo_lengua_4_primaria.md`, coloured by progress. Lines that are class work (speaking, whole books) are marked "en clase".
- [ ] Mezcla del día and racha 🔥 (the daily mix and the daily streak)
- [ ] Zona de mayores (the grown-ups' view): time spent, weakest skills, progress over the weeks
- [ ] Backup and restore

### Phase 10 – Check that regular use covers everything
- [ ] Go through the curriculum file and the book's table of contents line by line, and fill any gaps
- [ ] Simulate daily use, as for the maths app: how long until every skill has been met and every ⭐ earned

### Ideas for later
- [ ] Optional English hints for the rule cards, for a child who reads more English than Spanish
- [ ] A printable progress report for school
- [ ] Words the child gets wrong often are collected into a personal list, "Mis palabras difíciles"

---

## 4. Testing (every phase)
- **Answers:** generate hundreds of questions per skill and level, and check every answer separately
  (spelling against the es_ES dictionary, agreement against the word bank's gender and number).
- **No duplicate answers:** check that no choice question has two right answers.
- **Screenshots:** take screenshots of every new screen and input, in portrait and landscape on a tablet-sized screen, in light and dark mode.
- **Errors:** check every page for console errors, and check that it works offline.

## 5. Decisions for you
*All settled:*
- The app follows Santillana's 4.º book.
- Accents count (see section 2).
- Dictado uses the device's Spanish voice.
- The one-line change in `~/math/sw.js` is made, so the two apps never delete each other's offline copy.
