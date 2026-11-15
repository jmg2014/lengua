/* Splitting Spanish words into syllables (used by "El guion" now, and by the Tildes topic later).
   L4.silabas("mariposa") → ["ma", "ri", "po", "sa"]

   The usual school rules:
   - ch, ll, rr, and qu / gu before e, i, count as one consonant (the u is silent); gü is g + the vowel ü.
   - Vowels together stay in one syllable (diphthong: ai, ue, iu…) unless they make a hiatus:
     two strong vowels (a, e, o: le-ón, po-e-ta), or an accented í / ú (dí-a, ba-úl).
   - One consonant between vowels goes with the next vowel (ca-sa).
   - Two consonants are split (can-to), except the pairs pl pr bl br fl fr gl gr cl cr dr tr (ha-bla, o-tro).
   - Three or four: the last two go together if they are one of those pairs (ins-tru-men-to, in-glés), otherwise only the last one (obs-tá-cu-lo).
   - y is a vowel at the end of a word after a vowel (rey, muy), and a consonant before a vowel (ma-yo, re-yes).
   Words whose split depends on a prefix (sub-ra-yar, bi-sa-bue-lo) don't follow these rules, so the skills avoid them. */
(function(){
"use strict";
const L4 = window.L4 = window.L4 || {};
const VOWEL = "aeiouáéíóúü", STRONG = "aeoáéó", ACCENTED_WEAK = "íú";
const PAIRS = ["pl", "pr", "bl", "br", "fl", "fr", "gl", "gr", "cl", "cr", "dr", "tr", "kl", "kr"];

function units(word){
  const w = word.toLowerCase(), out = [];             // { s: original letters, v: is it a vowel }
  for (let i = 0; i < w.length;){
    const two = w.slice(i, i + 2);
    let len = 1, v = false;
    if (two === "ch" || two === "ll" || two === "rr") len = 2;
    else if (two === "qu") len = 2;
    else if (two === "gu" && "eéií".includes(w[i + 2] || "")) len = 2;
    else if (VOWEL.includes(w[i])) v = true;
    else if (w[i] === "y"){                            // vowel at the end of a word (rey, hoy) or with no vowel next to it
      const next = w[i + 1];
      v = next === undefined ? i > 0 : !VOWEL.includes(next);
      if (i === 0 && w.length === 1) v = true;          // "y" on its own
    }
    out.push({ s:word.slice(i, i + len), l:w.slice(i, i + len), v });
    i += len;
  }
  return out;
}
const hiatus = (a, b) => (STRONG.includes(a) && STRONG.includes(b)) || ACCENTED_WEAK.includes(a) || ACCENTED_WEAK.includes(b);

L4.silabas = function(word){
  const u = units(word);
  // syllable boundaries are placed before unit index b
  const cuts = [];
  // 1. inside groups of vowels: hiatus
  for (let i = 1; i < u.length; i++){
    if (u[i].v && u[i - 1].v && hiatus(u[i - 1].l, u[i].l)) cuts.push(i);
  }
  // 2. consonants between two vowels
  let i = 0;
  while (i < u.length && !u[i].v) i++;                  // skip the consonants at the start
  while (i < u.length){
    while (i < u.length && u[i].v) i++;                 // end of a vowel group
    const start = i;
    while (i < u.length && !u[i].v) i++;
    if (i >= u.length) break;                           // consonants at the end stay with the last syllable
    const n = i - start;                                // n consonants between two vowels
    const pair = n >= 2 && PAIRS.includes(u[i - 2].l + u[i - 1].l);
    if (n === 1) cuts.push(start);
    else if (n === 2) cuts.push(pair ? start : start + 1);
    else if (n === 3) cuts.push(pair ? start + 1 : start + 2);
    else cuts.push(i - 2);
  }
  cuts.sort((a, b) => a - b);
  const out = []; let from = 0;
  for (const c of cuts){ out.push(u.slice(from, c).map(x => x.s).join("")); from = c; }
  out.push(u.slice(from).map(x => x.s).join(""));
  return out.filter(Boolean);
};

/* The stressed syllable (sílaba tónica) of a correctly written word, counted from 0.
   - A written accent marks it.
   - Without one, the accent rules say where it is: words ending in a vowel, n or s stress the next-to-last syllable
     (casa, joven, martes); words ending in any other letter stress the last one (reloj, papel, estoy). */
const ACCENTED = "áéíóú";
L4.tonica = function(word){
  const s = L4.silabas(word);
  const marked = s.findIndex(x => [...x.toLowerCase()].some(c => ACCENTED.includes(c)));
  if (marked >= 0) return marked;
  if (s.length === 1) return 0;
  const last = word.toLowerCase().slice(-1);
  return "aeiouns".includes(last) ? s.length - 2 : s.length - 1;
};
/* "aguda", "llana", "esdrújula" or "sobresdrújula" (by where the stress falls, counted from the end) */
L4.tipoAcento = function(word){
  const n = L4.silabas(word).length, t = L4.tonica(word), fromEnd = n - 1 - t;
  return ["aguda", "llana", "esdrújula", "sobresdrújula"][Math.min(fromEnd, 3)];
};
/* Does the general rule give this word a written accent? (hiatus words like día, país follow their own rule) */
L4.reglaTilde = function(tipo, word){
  const last = word.toLowerCase().slice(-1), vns = "aeiouáéíóúns".includes(last);
  return tipo === "aguda" ? vns : tipo === "llana" ? !vns : true;
};
/* the vowel of a syllable that carries the accent: the strong vowel (a, e, o) of a diphthong, otherwise the last vowel */
L4.vocalTonica = function(syl){
  const l = syl.toLowerCase();
  let at = -1;
  for (let i = 0; i < l.length; i++) if ("aeoáéó".includes(l[i])) at = i;
  if (at < 0) for (let i = 0; i < l.length; i++) if ("iuíú".includes(l[i]) && !(l[i] === "u" && i > 0 && "qg".includes(l[i - 1]))) at = i;
  return at;
};
const ADD = { a:"á", e:"é", i:"í", o:"ó", u:"ú", A:"Á", E:"É", I:"Í", O:"Ó", U:"Ú" };
const REMOVE = { á:"a", é:"e", í:"i", ó:"o", ú:"u", Á:"A", É:"E", Í:"I", Ó:"O", Ú:"U" };
L4.sinTilde = w => w.replace(/[áéíóúÁÉÍÓÚ]/g, c => REMOVE[c]);
/* the word with a written accent on syllable k (and no other accent) */
L4.conTildeEn = function(word, k){
  const s = L4.silabas(L4.sinTilde(word));
  const v = L4.vocalTonica(s[k]);
  if (v < 0) return null;
  s[k] = s[k].slice(0, v) + (ADD[s[k][v]] || s[k][v]) + s[k].slice(v + 1);
  return s.join("");
};
})();
