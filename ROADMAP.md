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

### Phase 1 – Ortografía ✅
13 skills, most with 3 levels: **choose the letter → pick the right spelling from 3 → write it** (dictation if the device
has a Spanish voice, writing the word for a picture, or tapping the misspelled word). Every skill has a rule card,
and every mistake shows the rule again.
- [x] b/v (bl/br, mb, -aba, -bir, -ble, bu-/bus-/bur-, bi-/bis-/biz-; nv, ll- + v, -avo/-ave/-evo/-eve/-ivo/-iva; words with no rule)
- [x] g/j/gu/gü (-ger/-gir, -gen/-gía/-gio/-gión; -aje/-eje, -jero/-jera, family with j; gue/gui; güe/güi)
- [x] ll/y (-illo/-illa; y at the end and its plural; verb forms like leyendo, oyó, construyó)
- [x] r/rr (r at the start and after n, l, s; rr / r between vowels; pelirrojo)
- [x] h (hie-, hue-, hum-; haber, hacer, hablar; h in the middle; words that must NOT get an h, with a "sin h" choice)
- [x] c/qu/z (ca co cu / que qui; za zo zu / ce ci; pez → peces)
- [x] d/z at the end of words: choose the letter, write the plural, write the singular
- [x] s/z/c (with a note on seseo)
- [x] m/n before p, b and v
- [x] Mayúsculas: names, places, after a full stop, and the traps (days, months, languages)
- [x] **Español e inglés**: lower-case days, months and languages; no double consonants (only cc, rr, ll, nn); no ph/th;
      no s + consonant at the start; inm-; cua- not qua-. Choose, write the Spanish for an English word, and find the
      English-style mistakes in a sentence. (*está / esta* is an accent question: it's in Phase 2, tilde diacrítica.)
- [x] El guion: split by syllables, never leave a vowel alone, write the syllables with hyphens (`shared/silabas.js`, tested on 119 words)
- [x] Dictado with the device's Spanish voice (🔊 button to hear it again); without a Spanish voice it uses pictures,
      and the skill page says how to turn the voice on
- **Checks:** every word is in the es_ES dictionary, and none of the 621 possible misspellings is a real word.
  The check removed 15 words whose misspelling is a real word, e.g. *vela* (*bela*), *hierba* (*hierva*), *horno* (*orno*).

### Phase 2 – Tildes (accents, Units 1–4 of the book) ✅
- [x] Sílabas: count them (monosílaba… polisílaba), choose the right split, write it with hyphens
- [x] Sílaba tónica: tap the stressed syllable (the device says the word, if it can)
- [x] Agudas, llanas y esdrújulas: classify the word, first with the accent as a clue, then without
- [x] ¿Lleva tilde?: agudas, then llanas, then all words typed with the accent counting. **Its ⭐ makes accents count in the whole app.**
- [x] Diptongos e hiatos: which is it, find the hiatus, and the accent that breaks a diphthong (día, país, baúl)
- [x] Tilde diacrítica: tú/tu, él/el, mí/mi; sí/si, té/te, está/esta; qué, cómo, dónde, cuándo (in hand-written sentences)
- **Checks:**
  - Stress finder (`L4.tonica`, `L4.tipoAcento` in `shared/silabas.js`): tested on hand-labelled words.
  - Word lists: every hand-sorted list is checked against the accent rules.
  - "¿Lleva tilde?": leaves out words where a wrong way of writing them is a real word (caminó, libró, lampara, futbol…).

### Phase 3 – Gramática ✅
12 skills. A sentence maker builds sentences with every word labelled (determinante, sustantivo, adjetivo, verbo,
preposición, adverbio) and with correct agreement; most skills ask about those sentences.
- [x] Sujeto y predicado: tap the subject, tap the verb, and the subject at the end (*En el parque juegan los niños*)
- [x] Clases de oraciones: enunciativa (afirmativa / negativa), interrogativa, exclamativa, imperativa, desiderativa (hand-written)
- [x] El grupo nominal: the núcleo, the determiner and the adjective, and the núcleo of the subject in a sentence
- [x] Sustantivos: find them; común / propio, gender and number, individual / colectivo; write the plural (with accent changes: camión → camiones, joven → jóvenes)
- [x] Determinantes: the article that agrees; artículo, demostrativo, posesivo, numeral or indefinido; the form that agrees
- [x] Adjetivos y concordancia: find them, choose -o/-a/-os/-as, and tap the word that doesn't agree
- [x] Pronombres personales: which one replaces a group (Pablo y Marta → ellos), find it, person and number
- [x] El verbo: find it, its conjugation (-ar, -er, -ir), the infinitive of a form, its tense, person and number
- [x] Conjugar: regular verbs in presente, pretérito perfecto simple, pretérito imperfecto and futuro
- [x] Adverbios: find them, their type (lugar, tiempo, modo, cantidad, afirmación, negación), two in a sentence
- [x] Preposiciones y conjunciones: complete the sentence (hand-written), find them, and y → e, o → u
- [x] ¿Qué clase de palabra es?: a mixed review
- **Checks:**
  - Agreement: every generated sentence is re-checked with separate tables. On a deliberately broken copy, the check flagged it 62 times.
  - Plurals and verb forms: tested against hand-made lists.
  - Questions: forms that could be two tenses or two persons (*cantamos*, *cantaba*) are never asked about.

### Phase 4 – Vocabulario ✅
8 skills, all from hand-written lists.
- [x] Familias de palabras: the primitive word, the look-alike that isn't in the family (pan / pantalón), write the derived word from a clue
- [x] Simples y compuestas: which is which, join two words (gira + sol), and split them
- [x] Prefijos: des- / in- / im- for the opposite, what re-, pre-, sub-, sobre-, super-, inter- mean, write the word
- [x] Sufijos: diminutivo, aumentativo, oficio (-ero) or tienda (-ería); which word it comes from; write the diminutive
- [x] Sinónimos y antónimos: choose them, and write the antonym (several answers count: frío → caliente or cálido)
- [x] Polisemia (banco, hoja, planta, cola…) and homófonas (hola/ola, vaca/baca, tubo/tuvo, hay/ahí/ay, valla/vaya…)
- [x] Frases hechas: what they mean, and which one fits a situation
- [x] Campo semántico: the intruder, name the theme, tap all the words of a theme
- **Checks:**
  - Spelling: every word goes through the spelling check.
  - Lists: no word is in two synonym pairs or two themes, and compound and prefixed words really are the two parts joined (or say what changes).
  - Hand-checked list: diminutives like *gatito*, which dictionaries don't list, are kept in `tests/extra_words.txt`.

### Phase 5 – Oraciones y puntuación ✅
6 skills, with hand-written sentences. A new `punct` input: choose a mark and tap the space where it goes
(closing marks stick to the word before, ¿ ¡ to the word after, so "Marta. ¿Cómo…" works).
- [x] ¿? y ¡!: choose the right one (not "Qué hora es?" like in English), place them, and two sentences where one asks or exclaims
- [x] El punto: place the full stops, capital letter after a full stop, and puntos suspensivos
- [x] La coma: in lists (not before *y*), when calling someone (*Lucía, ven aquí*), and a simple punto y coma
- [x] Los dos puntos: after a letter greeting (*Querida abuela:*, not a comma as in English) and before a list
- [x] Ordenar la oración: shuffled words from the Gramática sentence maker; the capital letter and the full stop are clues
      (*Mi perro corre lento…* is accepted as well as *Mi perro lento corre…*)
- [x] Sin repetir: choose the pronoun or synonym that avoids repeating a word (and agrees)
- (Sentence types were done in Phase 3, Gramática.)

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
