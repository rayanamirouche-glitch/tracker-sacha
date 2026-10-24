# Tracker Sacha — notes pour Claude

Lis ce fichier avant toute modification. Il contient ce que Rayan ne veut plus réexpliquer à chaque session.

## Le projet en deux phrases

Tracker d'avis Google et de classement local pour le client **Sacha** (artisans toiture, Brabant / Bruxelles, quelques fiches à Liège et en France). Page unique « Tracker — R.Consulting » avec un portail client et un formulaire de commande d'avis. Hébergé sur Netlify, déployé automatiquement à chaque push sur `main`.

Rayan est le propriétaire (R.Consulting). Sacha est le client qui consulte le tracker et clique lui-même sur les boutons.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'interface : barre latérale, tuiles, tableau, panneau de détail par fiche (Aperçu · Avis · Positions · Réglages), modales. Contient le JS de la page. |
| `portal.js`, `portal.css` | Onglet « Commandes » du portail client. |
| `netlify/functions/core.js` | Le cœur : chargement des fiches, Google Places, DataForSEO, lecture et écriture des blobs. |
| `netlify/functions/run.js` | Endpoint principal appelé par la page via `?type=…` (avis, avis1, rank, rankselect, rankfetch, addfiche, delfiche, setkw, setobj, setliv, lookup, relink, rankdiag, diag, purge…). |
| `netlify/functions/fiches.json` | Liste des fiches suivies : source de vérité, complétée par le blob `ajouts`. Champs : name, q, target, ll, kw, city, link, region, et parfois obj / base. |
| `netlify/functions/count3j.js` | Compteur J-2 / J-1 / J des avis publiés, lu chez DataForSEO (asynchrone). |
| `netlify/functions/data.js` | Rend toutes les données (`core.allData`) à la page. |
| `netlify/functions/setbase.js` | Recale la base objectif d'une fiche (avis déjà postés à la main). |
| `netlify/functions/commande.js` | Commande d'avis passée par le client → Firebase `commandes_v1` + WhatsApp à Rayan + objectif de la fiche augmenté. |
| `netlify/functions/orders.js` | Demandes du portail (fiche ou avis) stockées dans le blob `orders/…`. |
| `netlify/functions/snapshot_*.js` | Anciens points d'entrée de relevé planifié. **Plus aucune planification** (voir règles). |
| `netlify/functions/places.js`, `rank.js` | Anciens proxys Places et SerpAPI, quasi inutilisés. Ne pas s'appuyer dessus. |

Pas de build, pas de framework, pas de tests automatisés. Seule dépendance : `@netlify/blobs`.

## Données : où elles vivent

**Netlify Blobs**, store `tracker`, en cohérence forte :

| Clé | Contenu |
|---|---|
| `avis` | Relevés d'avis par jour et par fiche |
| `base` | Base objectif par fiche (total au moment de la commande) |
| `obj` | Objectifs manuels (priment sur `fiches.json`) |
| `livres` | Avis livrés saisis à la main |
| `kw` | Mots-clés choisis dans le tableau, « kw1 \| kw2 », trois max (priment sur `fiches.json`) |
| `ids` | place_id résolu par fiche |
| `ajouts` | Fiches ajoutées depuis le tracker (bouton + Fiche) |
| `rank`, `rankMeta`, `rankbatch/<jour>/<clé>`, `rankkw/<jour>/<clé>` | Classements et leur historique |
| `orders/…` | Demandes du portail |

Règle générale : **ce qui est dans un blob prime sur `fiches.json`** tant que le blob existe.

**Firebase RTDB** (`avis-tracker-default-rtdb`, europe-west1) : commandes (`commandes_v1`) et config (`config_v1/tranche`, taille de tranche de paiement, 20 par défaut).

## API externes et variables d'environnement

Uniquement les noms. Les valeurs sont dans Netlify, jamais dans le repo.

- `PLACES_API_KEY` : Google Places (API New). **Chaque appel est facturé en SKU Enterprise (~0,02 $)**, d'où l'interdiction de relevés automatiques.
- `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` : DataForSEO, utilisé depuis le 30/09/2026 pour les classements et le compteur 3 jours (~0,0012 $ la recherche).
- `SERPAPI_KEY` : SerpAPI, **quota mensuel épuisé, ne plus l'utiliser**.
- `URL` : fournie par Netlify, base des appels internes.

Stripe Checkout (`/paiement`) et la notification WhatsApp (`/notif`) passent par un relais sur un autre site de Rayan, `menageinformatique.netlify.app`. Les clés n'existent que là-bas.

## Règles métier à ne jamais casser

1. **Aucune planification automatique** des relevés d'avis ni des classements (décision client du 02/09/2026). Le client clique « Actualiser AVIS » ou « Classements » lui-même. Ne pas réactiver de cron, même « pour tester ».
2. **Classement = Google Recherche mobile, bloc local, vu depuis la ville de la fiche** (rayon 2 km). Pas Google Maps (abandonné le 12/09/2026). Si la page mobile n'a pas de bloc local (Google y met parfois des hôtels), on resoumet la même recherche en desktop, une seule fois.
3. **Mot-clé = « couvreur » + ville de la fiche**, pas « toiturier », pas la commune.
4. **Les avis postés saisis à la main comptent toujours** dans l'objectif. La base déclarée dans `fiches.json` prime sur le blob.
5. **Tarifs des commandes** (13/09/2026) : 4 € l'avis, 8 € l'avis avec photo, 10 € à partir de 3 photos. Paiement par tranches (20 par défaut). Une commande sur une fiche suivie augmente son objectif d'autant.
6. **Pas de requête gaspillée** : vagues de 5 fiches, paquets, reprises limitées, cooldown de 48 h sur le classement complet. Les fiches cochées (`rankselect`) ne touchent pas au cooldown.
7. **Une fiche retirée de `fiches.json` garde son historique** dans les blobs mais est écartée à la lecture.

## Pièges connus (appris le 14/09/2026, ne pas y retomber)

- Les fonctions Netlify ont **10 s** de budget. Toute recherche longue est **asynchrone** : on soumet (`task_post`), la page relit toutes les 4 à 5 s (`task_get`). Au plus 60 lectures par appel.
- La **file des recherches voyage entre la page et la fonction**, pas dans un blob : une file écrite par une fonction était relue vide par la suivante.
- Jamais de relecture-fusion sur un blob partagé par deux relevés simultanés : chaque vague écrit sa propre clé.
- Le cache SerpAPI resservait les échecs pendant une heure. Avec DataForSEO, ce point n'existe plus, mais garder le réflexe « un échec n'est pas un résultat ».

## Comment travailler sur ce repo

- **Tout en français** : code, commentaires, commits, messages à l'utilisateur.
- **Commits** au format « Zone : ce qui change », par exemple `Classement : mot-clé couvreur + ville`. Quand c'est une demande de Sacha ou de Rayan, le dire : `Sacha : Masterpro Renovation Woluwe remise (demande Rayan 03/10)`.
- **Pas de pull request** sauf demande explicite. Push direct sur la branche indiquée.
- **Pas de nouvelle dépendance, pas de framework, pas de build** sans accord.
- Pas de tests automatisés : vérifier en relisant le diff et, si possible, en appelant la fonction concernée.
- Une modification de `fiches.json` : vérifier qu'aucun lien Maps n'est en double et que `ll`, `city`, `kw` sont renseignés.
- Dater les décisions dans les commentaires (« depuis le 30/09/2026 : … ») comme c'est déjà fait dans le code.

## Glossaire

- **Fiche** : une fiche Google Business Profile suivie (un artisan).
- **Base** : nombre d'avis au moment de la commande ; la jauge compte à partir de là.
- **Objectif** : nombre d'avis à atteindre (commande + éventuel objectif manuel).
- **Postés / livrés** : avis publiés depuis la base, mesurés par Google ou saisis à la main.
- **Perdus** : avis disparus (supprimés par Google).
- **Tranche** : lot de paiement d'une commande, 20 avis par défaut.
- **3 jours** : compteur J-2 / J-1 / J des avis publiés.
- **Vague** : groupe de fiches traitées en un appel (12 pour les avis, 5 à 10 pour le classement).
- **rankdiag / diag** : endpoints de diagnostic, pas pour le client.
- **Ménage** : nettoyage périodique de `fiches.json` (retraits, corrections). Aussi le nom du site relais de Rayan.
- **Relink** : résolution des place_id manquants, séparée du relevé.
