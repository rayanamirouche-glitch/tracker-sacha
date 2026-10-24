#!/usr/bin/env node
// Ajoute, retire ou modifie une fiche dans netlify/functions/fiches.json, puis lance la vérification.
// Le fichier est réécrit avec l'indentation d'origine (1 espace), rien d'autre ne change.
//
//   node scripts/fiches.js ajouter --name "Nom exact Google" --city "Wavre" --link "https://maps.app.goo.gl/xxx" \
//        --ll "50.717,4.611" [--kw "couvreur wavre"] [--region "Brabant/Bxl"] [--target "nom court"] [--obj 20]
//   node scripts/fiches.js retirer --name "Nom exact Google"
//   node scripts/fiches.js modifier --name "Nom exact Google" --kw "couvreur wavre | couvreur ottignies" [--obj 40] [--city ...]
//   node scripts/fiches.js lister [--region "Liège"]
//
// Règles appliquées : kw par défaut = "couvreur " + ville normalisée ; région par défaut déduite de la ville ;
// q = name ; target = name normalisé (ou --target) ; refus si le nom ou le lien existe déjà.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const FICHIER = path.join(__dirname, '..', 'netlify', 'functions', 'fiches.json');

const norm = s => String(s || '').toLowerCase()
  .replace(/[‘’ʼ`´']/g, ' ')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[.\-]/g, ' ').replace(/\bsaint\b/g, 'st').replace(/\s+/g, ' ').trim();
const cleLien = l => { const m = /goo\.gl\/([A-Za-z0-9]+)/.exec(l || '') || /place_id[:=]([A-Za-z0-9_\-]+)/.exec(l || ''); return m ? m[1] : (l || ''); };
const LIEGE = /li[eè]ge|herstal|seraing|verviers|waremme|flemalle|fl[ée]ron|chaudfontaine|oupeye|vis[ée]|ans|huy|soumagne|herve|esneux|sprimont|spa/i;

const args = process.argv.slice(2);
const cmd = args.shift();
const opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) { opt[args[i].slice(2)] = args[i + 1]; i++; }

const stop = m => { console.error('✗ ' + m); process.exit(1); };
const lire = () => JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
const ecrire = f => fs.writeFileSync(FICHIER, JSON.stringify(f, null, 1));
const verifier = () => { try { execFileSync(process.execPath, [path.join(__dirname, 'verif-fiches.js')], { stdio: 'inherit' }); } catch (e) { process.exit(1); } };
const trouver = (fiches, name) => { const n = norm(name); const i = fiches.findIndex(f => norm(f.name) === n); return i; };

const fiches = lire();

if (cmd === 'lister') {
  fiches.filter(f => !opt.region || f.region === opt.region)
    .forEach((f, i) => console.log(`${String(i + 1).padStart(2)}. ${f.name}  ·  ${f.city} (${f.region})  ·  kw: ${f.kw}${f.obj ? '  ·  obj ' + f.obj : ''}`));
  console.log(`${fiches.length} fiches au total`);
  process.exit(0);
}

if (cmd === 'ajouter') {
  for (const k of ['name', 'city', 'link', 'll']) if (!opt[k]) stop(`--${k} requis`);
  const name = opt.name.trim();
  if (trouver(fiches, name) >= 0) stop(`"${name}" existe déjà`);
  const k = cleLien(opt.link); const dup = fiches.find(f => cleLien(f.link) === k);
  if (dup) stop(`ce lien est déjà celui de "${dup.name}"`);
  const city = opt.city.trim();
  const region = opt.region || (LIEGE.test(city) ? 'Liège' : 'Brabant/Bxl');
  const f = {
    name, q: name,
    target: (opt.target || name).trim().toLowerCase(),
    ll: opt.ll.replace(/\s/g, ''),
    kw: (opt.kw || ('couvreur ' + norm(city))).trim(),
    city, link: opt.link.trim(), region
  };
  if (opt.obj) f.obj = parseInt(opt.obj, 10);
  fiches.push(f);
  ecrire(fiches);
  console.log('✓ ajoutée :', JSON.stringify(f, null, 1));
  verifier();
  process.exit(0);
}

if (cmd === 'retirer') {
  if (!opt.name) stop('--name requis');
  const i = trouver(fiches, opt.name);
  if (i < 0) stop(`"${opt.name}" introuvable`);
  const [f] = fiches.splice(i, 1);
  ecrire(fiches);
  console.log(`✓ retirée : ${f.name} (${f.city}). Son historique reste dans les blobs mais n'est plus lu.`);
  verifier();
  process.exit(0);
}

if (cmd === 'modifier') {
  if (!opt.name) stop('--name requis');
  const i = trouver(fiches, opt.name);
  if (i < 0) stop(`"${opt.name}" introuvable`);
  const f = fiches[i]; const avant = JSON.stringify(f);
  for (const k of ['kw', 'city', 'link', 'll', 'region', 'target', 'q']) if (opt[k] !== undefined) f[k] = opt[k].trim();
  for (const k of ['obj', 'base', 'livres']) if (opt[k] !== undefined) { if (opt[k] === '' || opt[k] === 'aucun') delete f[k]; else f[k] = parseInt(opt[k], 10); }
  if (JSON.stringify(f) === avant) stop('rien à modifier (options : --kw --city --link --ll --region --target --obj --base --livres)');
  ecrire(fiches);
  console.log('✓ modifiée :', JSON.stringify(f, null, 1));
  verifier();
  process.exit(0);
}

stop('commande attendue : ajouter | retirer | modifier | lister');
