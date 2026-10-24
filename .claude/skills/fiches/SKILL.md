---
name: fiches
description: Ajouter, retirer, modifier ou vérifier des fiches dans netlify/functions/fiches.json (le parc de fiches suivies par le tracker). À utiliser dès que Rayan parle d'ajouter une fiche, retirer une fiche, remettre une fiche, changer un mot-clé ou un objectif, faire le ménage, ou envoie une liste de fiches Maps à intégrer.
---

# Fiches du tracker

`netlify/functions/fiches.json` est la liste des fiches suivies. Toute modification passe par `scripts/fiches.js`, jamais par une édition à la main : le script garde le format du fichier, refuse les doublons et lance `scripts/verif-fiches.js` à la fin.

## Commandes

```
node scripts/fiches.js lister [--region "Liège"]
node scripts/fiches.js trier
node scripts/fiches.js ajouter --name "Nom exact de la fiche Google" --city "Wavre" --link "https://maps.app.goo.gl/xxx" --ll "50.717,4.611" [--kw "couvreur wavre"] [--region "Brabant/Bxl"] [--target "nom court"] [--obj 20]
node scripts/fiches.js retirer --name "Nom exact"
node scripts/fiches.js modifier --name "Nom exact" [--kw "..."] [--obj 40] [--obj aucun] [--city ...] [--link ...] [--ll ...] [--region ...]
node scripts/verif-fiches.js [--strict]
```

## Comment remplir chaque champ

- **name** : le nom affiché sur la fiche Google, tel quel. C'est la clé partout (blobs `ids`, `obj`, `kw`, `base`…). **Ne jamais le changer sur une fiche existante**, même pour un espace en trop : ça casserait son historique. Renommer = retirer puis ajouter, avec l'accord de Rayan, en lui disant que l'historique repart de zéro.
- **link** : lien de partage court `https://maps.app.goo.gl/…` (menu Partager de la fiche). Pas de lien `place_id`.
- **city** : la ville de la fiche, avec accents et tirets (« Braine-l'Alleud », « Woluwe-Saint-Pierre »).
- **ll** : « lat,lon » du centre de la ville, trois décimales. Le classement est mesuré dans un rayon de 2 km autour. Prendre les coordonnées de la ville, pas de l'adresse exacte.
- **kw** : mot-clé de classement. Règle : **« couvreur » + ville normalisée** (minuscules, sans accents ni tirets ni apostrophes : « couvreur braine l alleud »). Le script le déduit tout seul si on ne le donne pas. Autre métier → même logique (« terrassement meaux »). Jamais « toiturier ». Plusieurs mots-clés : « kw1 | kw2 », trois maximum, le premier est le principal.
- **region** : `Bruxelles`, `Brabant wallon`, `Brabant flamand`, `Liège`, `France`, `Suisse`. Le script la déduit de la ville ; ville inconnue → il refuse et demande `--region`. Sert au pays de recherche (DataForSEO) et au libellé. Le fichier est trié par région (dans cet ordre), puis ville, puis nom : `ajouter` et `modifier` retrient tout seuls.
- **target** : nom court normalisé servant au matching avec Google Places. Par défaut le nom complet en minuscules. À raccourcir si le nom Google contient des mots qui varient (« Père et fils », slogans).
- **obj** : objectif d'avis. Sacha a 20 sur presque toutes ses fiches. Une commande passée depuis le tracker augmente l'objectif toute seule, dans le blob `obj`, qui prime sur ce champ.
- **base** : à ne poser que si Rayan le demande (total d'avis avant commande). Sinon la base vient du blob et de `setbase`.

## Quand Rayan envoie une liste

Une liste de fiches (texte, capture, export Maps) : pour chaque fiche, trouver le nom exact, le lien court, la ville, les coordonnées de la ville, puis un `ajouter` par fiche. Donner un résumé à la fin : combien ajoutées, lesquelles refusées (doublon) et pourquoi. Ne pas inventer un lien : si le lien manque, le demander.

## Retrait et remise

Une fiche retirée garde son historique dans les blobs mais n'est plus lue (`allData` l'écarte). La remettre plus tard avec le même `name` retrouve cet historique. Les retraits à la demande du client se commitent avec son nom et la date : `Sacha : Masterpro Renovation Woluwe remise (demande Rayan 03/10)`.

## Ménage

Passer `node scripts/verif-fiches.js` et traiter chaque avertissement : espace en trop dans un nom, target qui ne matche plus, mot-clé qui ne contient pas la ville, région inconnue. Commit au format `ménage : N retirées, N modifiées, N créées`.

## Commit

Après toute modification : `node scripts/verif-fiches.js` doit sortir sans erreur, puis commit au format du dépôt (voir CLAUDE.md). Une fiche ajoutée n'est liée à Google (place_id) qu'au premier relevé ou via `run?type=relink` : le dire à Rayan si la fiche doit apparaître tout de suite.
