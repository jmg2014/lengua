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
})();
