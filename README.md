# 📚 Lengua 4.º

Spanish-language games for a child at the level of **4.º de Primaria** (age 9–10), following the Comunidad de Madrid
curriculum ([curriculo_lengua_4_primaria.md](curriculo_lengua_4_primaria.md)) and the order of Santillana's 4.º Lengua book.
It's made for a child who lives in the UK and speaks Spanish at home, so it focuses on written Spanish.
Every exercise is generated, so it never runs out, and the app remembers what the child finds hard.
See [ROADMAP.md](ROADMAP.md) for what is built and what comes next.

It's built like the maths app (`~/math`, [jmg2014.github.io/math](https://jmg2014.github.io/math)) and reuses its design.

| Topic | Address | Status |
|---|---|---|
| ✏️ Ortografía | `ortografia/` | Coming soon |
| Á Tildes | `tildes/` | Coming soon |
| 🧩 Gramática | `gramatica/` | Coming soon |
| 🔤 Vocabulario | `vocabulario/` | Coming soon |
| ❓ Oraciones y puntuación | `oraciones/` | Coming soon |
| 📖 Diccionario | `diccionario/` | Coming soon |
| 👓 Lectura | `lectura/` | Coming soon |
| 🎭 Literatura y lenguas | `literatura/` | Coming soon |

---

## How to start it on the home network

### 1. Start it on this computer
```bash
cd ~/git/lengua
python3 -m http.server 8001
```
Leave this terminal open while the child plays. Port 8001 is used so it can run at the same time as the maths app (8000).

### 2. Open it on the tablet
On the same Wi-Fi, open the browser and go to **http://192.168.1.206:8001**.
Optional: choose **"Add to Home screen"** in the browser menu so it opens like an app.

If the tablet can't reach it, allow the port once in the firewall:
```bash
sudo ufw allow from 192.168.1.0/24 to any port 8001 proto tcp
```

### On GitHub Pages
Once published, it lives at **https://jmg2014.github.io/lengua/** and works offline after the first visit.
The maths app is on the same address, so the two apps share the browser's storage:
- **Progress:** this app saves under its own key (`lengua4-v1`), so the two apps' progress never mixes.
- **Offline copies:** each app's offline file (`sw.js`) only deletes its own old copies.

---

## How it's organised
```
index.html              main page: topic tiles, Mezcla del día, backup
sw.js                   offline support (add new files to FILES and change the number in CACHE)
shared/engine.js        question engine: inputs (choice, gap, text keyboard, words, order), feedback, results
shared/progress.js      saving, levels, stars, daily mix, backup
shared/topic.js         a topic page: skill tabs, rule card, 3 levels, stars
shared/words.js         shared word bank (checked against the Spanish dictionary)
shared/style.css        the look, light and dark mode
tests/                  automated checks and a demo of every input
```

### Ways to answer
| Input | What the child does |
|---|---|
| `choice` | taps one of 2–4 big buttons |
| `gap` | fills the gap in a word with a letter button (`ca_allo` → b / v) |
| `text` | types on the on-screen Spanish keyboard: ñ, **´** then a vowel for á é í ó ú, **¨** then u for ü, ⇧ for a capital |
| `words` | taps the right words in a sentence |
| `order` | taps cards in the right order (words, syllables, letters) |

**Accents:** while the Tildes skill *¿Lleva tilde?* hasn't been mastered, an answer whose only mistake is the
accent counts as right, with a "Casi" note, and comes back later. Once it's mastered, accents count.

## Tests
```bash
pip install spylls              # once: a Hunspell spell checker in Python
python3 tests/check.py          # runs tests/engine.html in headless Chrome and spell-checks every word
```
- **What it checks:** every input and the progress code (`tests/engine.html`), and every word in the word bank and in the generated answers.
- **Spelling:** words are checked against the es_ES dictionary (`/usr/share/hunspell/es_ES`) and `/usr/share/dict/spanish`. A correct word that both are missing goes in `tests/extra_words.txt`, after checking it on [dle.rae.es](https://dle.rae.es).
- **Demo:** open `tests/inputs.html` to try each input by hand.
