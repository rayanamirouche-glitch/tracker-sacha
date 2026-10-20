#!/usr/bin/env python3
"""Génère les 6 photos du site avec Nano Banana Pro (Gemini image) et les dépose dans img/.

Prérequis : une clé API Google AI Studio dans la variable GEMINI_API_KEY.
    export GEMINI_API_KEY=...
    python3 outils/generer-images.py            # tout
    python3 outils/generer-images.py atelier    # une seule image

Le site charge automatiquement img/<nom>.jpg dès que le fichier existe
(sinon il affiche le motif SVG de secours), il n'y a rien d'autre à changer.
"""
import base64
import json
import os
import sys
import urllib.request

MODELE = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3-pro-image-preview")  # Nano Banana Pro
CLE = os.environ.get("GEMINI_API_KEY")
DOSSIER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img")

STYLE = ("Photographie éditoriale ultra réaliste, lumière naturelle chaude, rendu argentique Kodak Portra, "
         "détails des fibres nets, sans texte, sans logo, sans filigrane. ")

IMAGES = {
    "atelier": ("16:9", STYLE + "Atelier de restauration de tapis d'Orient dans le sud de la France : un artisan aux mains marquées, "
                "agenouillé sur un grand Tabriz persan ancien à médaillon rouge profond et indigo, répare le velours usé avec une aiguille courbe "
                "et du fil de laine. Grandes fenêtres, tapis roulés empilés en arrière-plan, établi en bois, écheveaux de laine teinte à la main. "
                "Faible profondeur de champ, cadrage cinéma."),
    "lavage": ("4:3", STYLE + "Gros plan sur le lavage traditionnel à la main d'un tapis persan ancien : brosse en bois et eau claire sur le tapis "
               "posé à plat sur un sol en pierre, l'eau ruisselle sur des motifs floraux cramoisi, ivoire et bleu, un peu de mousse de savon, "
               "cour extérieure en plein jour. Style documentaire."),
    "franges": ("4:3", STYLE + "Macro sur la restauration des franges d'un tapis d'Orient ancien : des mains expertes nouent de nouvelles franges "
                "en coton ivoire au bord d'un tapis caucasien noué main à motifs géométriques rouge et marine, aiguille et fil, table en bois, "
                "lumière douce de fenêtre, texture textile très détaillée."),
    "retissage": ("3:4", STYLE + "Macro sur le retissage d'un trou dans un tapis d'Orient ancien noué main : les mains d'une artisane renouent "
                  "des nœuds de laine neuve sur un petit cadre en bois, la zone restaurée se fond dans le motif floral Ispahan d'origine en bordeaux, "
                  "or et ivoire, écheveaux de laine teinte naturellement à côté, éclairage chaud d'atelier."),
    "avant-apres": ("3:2", STYLE + "Image comparative photoréaliste d'un même tapis persan ancien, même angle, posé à plat sur un parquet : "
                    "la moitié gauche est délavée, poussiéreuse, velours usé et fond ivoire taché ; la moitié droite, après restauration et lavage "
                    "professionnels, montre des rouges, bleus et ors éclatants, un velours propre et des franges parfaites. Séparation nette au centre, "
                    "sans texte ni étiquette."),
    "villa": ("16:9", STYLE + "Photographie de décoration intérieure d'un salon de villa luxueuse sur la Côte d'Azur près de Nice : un grand tapis "
              "Heriz persan restauré en rouille, marine et crème sur un sol en pierre calcaire claire, canapé en lin blanc, portes-fenêtres ouvertes "
              "sur une terrasse avec oliviers, pins parasols et la Méditerranée au loin, lumière dorée de fin de journée. Style Architectural Digest."),
}


def generer(nom, ratio, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELE}:generateContent"
    corps = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": ratio, "imageSize": "2K"},
        },
    }
    req = urllib.request.Request(url, data=json.dumps(corps).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": CLE})
    with urllib.request.urlopen(req, timeout=300) as r:
        rep = json.load(r)
    for part in rep["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            data = base64.b64decode(part["inlineData"]["data"])
            mime = part["inlineData"].get("mimeType", "image/png")
            ext = "png" if "png" in mime else "jpg"
            chemin = os.path.join(DOSSIER, f"{nom}.{ext}")
            with open(chemin, "wb") as fh:
                fh.write(data)
            if ext == "png":  # le site attend des .jpg
                try:
                    from PIL import Image
                    Image.open(chemin).convert("RGB").save(os.path.join(DOSSIER, f"{nom}.jpg"), quality=88, optimize=True)
                    os.remove(chemin)
                    chemin = os.path.join(DOSSIER, f"{nom}.jpg")
                except ImportError:
                    print("  (pip install pillow pour convertir en .jpg automatiquement)")
            return chemin
    raise RuntimeError(f"pas d'image dans la réponse : {json.dumps(rep)[:400]}")


if __name__ == "__main__":
    if not CLE:
        sys.exit("GEMINI_API_KEY manquante (clé Google AI Studio : https://aistudio.google.com/apikey)")
    os.makedirs(DOSSIER, exist_ok=True)
    voulus = sys.argv[1:] or list(IMAGES)
    for nom in voulus:
        ratio, prompt = IMAGES[nom]
        print(f"→ {nom} ({ratio})…", flush=True)
        try:
            print("  ok", generer(nom, ratio, prompt))
        except Exception as e:
            print("  ERREUR", e)
