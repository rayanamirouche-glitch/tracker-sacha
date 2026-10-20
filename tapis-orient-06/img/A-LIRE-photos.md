# Photos du site

Le site cherche ces fichiers et bascule dessus automatiquement s'ils existent
(sinon il affiche les motifs SVG `motif-*.svg`) :

| Fichier | Emplacement sur le site | Format conseillé |
|---|---|---|
| `atelier.jpg` | Héro plein écran | 16:9, ≥ 1920 px |
| `retissage.jpg` | Bloc « L'atelier » + carte Retissage | 3:4 ou 4:3 |
| `lavage.jpg` | Carte « Lavage à la main » | 4:3 |
| `franges.jpg` | Carte « Restauration des franges » | 4:3 |
| `avant-apres.jpg` | Curseur avant / après (le filtre « avant » est appliqué par CSS, une photo du tapis propre suffit) | 3:2 |
| `villa.jpg` | Libre (section ambiance à ajouter si besoin) | 16:9 |

## Option A : Nano Banana Pro (le top)

```bash
export GEMINI_API_KEY=...        # clé Google AI Studio
pip install pillow               # une fois
python3 outils/generer-images.py # depuis le dossier tapis-orient-06
```

Les prompts sont dans `outils/generer-images.py`, modifiables.

## Option B : les 4 images déjà générées (MiniMax, le 20/10/2026)

Liens valables jusqu'au 21/10/2026 vers 11 h. Ouvrir dans un navigateur, « Enregistrer sous »
dans ce dossier avec le nom indiqué. (Le conteneur de session ne pouvait pas télécharger
cet hébergeur, d'où le passage par toi.)

- `atelier.jpg` : https://hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com/image_inference_output%2Ftalkie%2Fprod%2Fimg%2F2026-10-20%2Fb4065c75-a879-4fb0-8014-b70afaddbdec_aigc.jpeg?Expires=1792575530&OSSAccessKeyId=LTAI5tRDTcyEYLLuBEpJRwCi&Signature=PBLk8%2B4fK4%2FwhKQB6Vc87n26vwM%3D
- `lavage.jpg` : https://hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com/image_inference_output%2Ftalkie%2Fprod%2Fimg%2F2026-10-20%2F0424d4f0-bf47-497a-8e97-db0f3aa8cdd6_aigc.jpeg?Expires=1792575535&OSSAccessKeyId=LTAI5tRDTcyEYLLuBEpJRwCi&Signature=uAccg1B7Ff%2FLaPzuTScnZA2B%2BBY%3D
- `franges.jpg` : https://hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com/image_inference_output%2Ftalkie%2Fprod%2Fimg%2F2026-10-20%2F0a5a7801-67a0-4e11-bb2a-b3b855faa35c_aigc.jpeg?Expires=1792575534&OSSAccessKeyId=LTAI5tRDTcyEYLLuBEpJRwCi&Signature=GOYZkptx%2F76idMtJvIE5QJuUZmo%3D
- `retissage.jpg` : https://hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com/image_inference_output%2Ftalkie%2Fprod%2Fimg%2F2026-10-20%2F05547277-3abe-4cfd-9fd6-1d47061c51c8_aigc.jpeg?Expires=1792575530&OSSAccessKeyId=LTAI5tRDTcyEYLLuBEpJRwCi&Signature=jtUGz82BYNfC2xunaEXEsMIPrKE%3D
