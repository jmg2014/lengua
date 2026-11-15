/* Shared word bank: everyday words a 9–10-year-old knows, used by many skills.
   Every word here (and every answer the skills make from them) is checked against the Spanish (es_ES)
   dictionary by tests/check.py, so a spelling mistake in a list can't reach the child.
   Each topic can add its own short lists in its skills.js; these are the words shared by several topics. */
(function(){
"use strict";
const L4 = window.L4 = window.L4 || {};
const parse = (s, f) => s.trim().split(/\s*\n\s*/).filter(Boolean).map(line => f(line.split("|")));

L4.WORDS = {
  /* nouns: word | gender (m/f) | picture */
  nouns: parse(`
    perro|m|🐶
    gato|m|🐱
    caballo|m|🐴
    vaca|f|🐄
    oveja|f|🐑
    abeja|f|🐝
    ballena|f|🐋
    jirafa|f|🦒
    tortuga|f|🐢
    rana|f|🐸
    pájaro|m|🐦
    búho|m|🦉
    pez|m|🐟
    serpiente|f|🐍
    elefante|m|🐘
    ratón|m|🐭
    conejo|m|🐰
    león|m|🦁
    árbol|m|🌳
    flor|f|🌸
    hoja|f|🍃
    sol|m|☀️
    luna|f|🌙
    estrella|f|⭐
    nube|f|☁️
    lluvia|f|🌧️
    nieve|f|❄️
    montaña|f|⛰️
    playa|f|🏖️
    río|m|🏞️
    mar|m|🌊
    casa|f|🏠
    escuela|f|🏫
    puerta|f|🚪
    ventana|f|🪟
    mesa|f|🪑
    cama|f|🛏️
    libro|m|📕
    lápiz|m|✏️
    tijeras|f|✂️
    mochila|f|🎒
    reloj|m|⏰
    llave|f|🔑
    pelota|f|⚽
    bicicleta|f|🚲
    coche|m|🚗
    barco|m|⛵
    avión|m|✈️
    tren|m|🚆
    globo|m|🎈
    regalo|m|🎁
    corazón|m|❤️
    manzana|f|🍎
    plátano|m|🍌
    uva|f|🍇
    fresa|f|🍓
    naranja|f|🍊
    zanahoria|f|🥕
    pan|m|🍞
    queso|m|🧀
    huevo|m|🥚
    leche|f|🥛
    helado|m|🍦
    pastel|m|🎂
    zapato|m|👞
    camiseta|f|👕
    gorro|m|🧢
    paraguas|m|☂️
    guitarra|f|🎸
    tambor|m|🥁
    ojo|m|👁️
    mano|f|✋
    pie|m|🦶
    nariz|f|👃
    oreja|f|👂
    diente|m|🦷
    niño|m|👦
    niña|f|👧
    abuela|f|👵
    abuelo|m|👴
  `, ([w, g, e]) => ({ w, g, e })),

  /* adjectives: masculine | feminine (the same word when it doesn't change) */
  adjectives: parse(`
    alto|alta
    bajo|baja
    grande|grande
    pequeño|pequeña
    bonito|bonita
    feo|fea
    rápido|rápida
    lento|lenta
    nuevo|nueva
    viejo|vieja
    limpio|limpia
    sucio|sucia
    contento|contenta
    triste|triste
    simpático|simpática
    divertido|divertida
    rojo|roja
    blanco|blanca
    negro|negra
    amarillo|amarilla
    verde|verde
    azul|azul
    feliz|feliz
    fuerte|fuerte
    suave|suave
  `, ([m, f]) => ({ m, f })),

  /* verbs: infinitive | picture */
  verbs: parse(`
    cantar|🎤
    bailar|💃
    saltar|🤸
    nadar|🏊
    pintar|🎨
    jugar|🎲
    caminar|🚶
    dibujar|✏️
    escuchar|👂
    hablar|🗣️
    comer|🍽️
    beber|🥤
    correr|🏃
    leer|📖
    aprender|🧠
    barrer|🧹
    escribir|📝
    vivir|🏡
    subir|⬆️
    abrir|🔓
    dormir|😴
    reír|😂
  `, ([w, e]) => ({ w, e }))
};

/* every word in the bank, for the dictionary check */
L4.WORDS.all = () => [
  ...L4.WORDS.nouns.map(n => n.w),
  ...L4.WORDS.adjectives.flatMap(a => [a.m, a.f]),
  ...L4.WORDS.verbs.map(v => v.w)
];
})();
