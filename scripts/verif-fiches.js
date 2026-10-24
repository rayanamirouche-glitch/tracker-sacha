#!/usr/bin/env node
// Vérifie netlify/functions/fiches.json avant commit : doublons, champs manquants, formats.
// Usage : node scripts/verif-fiches.js            (code de sortie 1 s'il y a une erreur)
//         node scripts/verif-fiches.js --strict   (les avertissements comptent comme des erreurs)
const path = require('path');
const FICHIER = path.join(__dirname, '..', 'netlify', 'functions', 'fiches.json');
const REGIONS = ['Brabant/Bxl', 'Brabant', 'Liège', 'France', 'Suisse'];
const LIEN = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl|www\.google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)\//;
const strict = process.argv.includes('--strict');

const norm = s => String(s || '').toLowerCase()
  .replace(/[‘’ʼ`´]/g, "'")
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[.\-]/g, ' ').replace(/\bsaint\b/g, 'st').replace(/\s+/g, ' ').trim();
const cleLien = l => { const m = /goo\.gl\/([A-Za-z0-9]+)/.exec(l || '') || /place_id[:=]([A-Za-z0-9_\-]+)/.exec(l || ''); return m ? m[1] : (l || ''); };

let fiches;
try { fiches = JSON.parse(require('fs').readFileSync(FICHIER, 'utf8')); }
catch (e) { console.error('fiches.json illisible :', e.message); process.exit(1); }
if (!Array.isArray(fiches)) { console.error('fiches.json doit être un tableau'); process.exit(1); }

const erreurs = [], avert = [];
const err = (f, m) => erreurs.push(`[${f.name || '?'}] ${m}`);
const warn = (f, m) => avert.push(`[${f.name || '?'}] ${m}`);
const noms = new Map(), liens = new Map();

fiches.forEach((f, i) => {
  for (const k of ['name', 'q', 'target', 'll', 'kw', 'city', 'link', 'region']) {
    if (!f[k] || !String(f[k]).trim()) err(f, `champ "${k}" manquant (fiche n°${i + 1})`);
  }
  if (f.name && f.name !== f.name.trim()) warn(f, 'espace en début ou fin de "name"');
  if (f.name) { const n = norm(f.name); if (noms.has(n)) err(f, `doublon de nom avec "${noms.get(n)}"`); else noms.set(n, f.name); }
  if (f.link) {
    if (!LIEN.test(f.link)) err(f, `lien non Google Maps : ${f.link}`);
    const k = cleLien(f.link); if (liens.has(k)) err(f, `doublon de lien avec "${liens.get(k)}"`); else liens.set(k, f.name);
    if (/place_id/.test(f.link)) warn(f, 'lien place_id : préférer un lien court maps.app.goo.gl');
  }
  if (f.ll) {
    const p = String(f.ll).split(',').map(Number);
    if (p.length !== 2 || p.some(isNaN)) err(f, `ll invalide : "${f.ll}" (attendu "lat,lon")`);
    else if (p[0] < 41 || p[0] > 52 || p[1] < -5 || p[1] > 11) warn(f, `ll hors France/Belgique/Suisse : ${f.ll}`);
  }
  if (f.region && !REGIONS.includes(f.region)) warn(f, `région inconnue "${f.region}" (connues : ${REGIONS.join(', ')})`);
  if (f.kw && f.city) {
    const sansApo = s => s.replace(/'/g, ' ').replace(/\s+/g, ' ').trim();
    const kw = sansApo(norm(f.kw)), city = sansApo(norm(f.city));
    if (kw !== kw.trim() || /\s{2,}/.test(f.kw)) warn(f, 'espaces en trop dans "kw"');
    if (!kw.includes(city)) warn(f, `kw "${f.kw}" ne contient pas la ville "${f.city}" (règle : métier + ville)`);
    if (/toiturier/.test(kw)) warn(f, 'kw contient "toiturier" : la règle est "couvreur"');
  }
  if (f.target && f.name && !norm(f.name).includes(norm(f.target))) warn(f, `target "${f.target}" absent du nom normalisé (le matching Places peut échouer)`);
  for (const k of ['obj', 'base', 'livres']) {
    if (f[k] !== undefined && !(Number.isInteger(f[k]) && f[k] >= 0)) err(f, `"${k}" doit être un entier positif (${JSON.stringify(f[k])})`);
  }
  const inconnus = Object.keys(f).filter(k => !['name', 'q', 'target', 'll', 'kw', 'city', 'link', 'region', 'obj', 'base', 'livres'].includes(k));
  if (inconnus.length) warn(f, `champs inconnus : ${inconnus.join(', ')}`);
});

const parRegion = fiches.reduce((a, f) => { a[f.region] = (a[f.region] || 0) + 1; return a; }, {});
console.log(`${fiches.length} fiches · ${Object.entries(parRegion).map(([r, n]) => `${r} ${n}`).join(' · ')}`);
if (avert.length) { console.log(`\n${avert.length} avertissement(s) :`); avert.forEach(a => console.log('  ~ ' + a)); }
if (erreurs.length) { console.log(`\n${erreurs.length} erreur(s) :`); erreurs.forEach(e => console.log('  ✗ ' + e)); }
if (!erreurs.length && !avert.length) console.log('OK, rien à signaler.');
process.exit(erreurs.length || (strict && avert.length) ? 1 : 0);
