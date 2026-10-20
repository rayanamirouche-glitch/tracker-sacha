#!/usr/bin/env python3
"""Génère les motifs de tapis d'Orient en SVG (visuels de secours du site).

Usage : python3 outils/motifs.py   (depuis le dossier tapis-orient-06)
Produit img/motif-*.svg : médaillon central, écoinçons, bordures, franges.
"""
import math
import os
import random

PALETTES = {
    "rouge":    dict(fond="#7a1f2b", champ="#8f2634", bord="#1f2a44", ivoire="#efe3c8", or_="#c9a24a", accent="#355a7a"),
    "indigo":   dict(fond="#1b2a46", champ="#22365a", bord="#7a1f2b", ivoire="#efe3c8", or_="#c9a24a", accent="#8f2634"),
    "ivoire":   dict(fond="#e9dcc0", champ="#efe4cb", bord="#7a1f2b", ivoire="#1f2a44", or_="#b4852f", accent="#2f5f6b"),
    "terre":    dict(fond="#9a4a2a", champ="#ad5a33", bord="#2e3b2a", ivoire="#f0e4c9", or_="#d8b45a", accent="#1f2a44"),
}


def boteh(cx, cy, s, col):
    """Petite palme (boteh / cachemire)."""
    return (f'<path d="M{cx} {cy - s} c {s*0.9} {s*0.3} {s*0.9} {s*1.3} 0 {s*1.9} '
            f'c {-s*0.9} {-s*0.6} {-s*0.9} {-s*1.6} 0 {-s*1.9} z" fill="{col}" opacity=".9"/>')


def rosace(cx, cy, r, c1, c2, n=8):
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r*0.28}" fill="{c2}"/>']
    for i in range(n):
        a = 2 * math.pi * i / n
        x = cx + math.cos(a) * r * 0.62
        y = cy + math.sin(a) * r * 0.62
        out.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r*0.2:.1f}" ry="{r*0.36:.1f}" '
                   f'transform="rotate({math.degrees(a)+90:.1f} {x:.1f} {y:.1f})" fill="{c1}" opacity=".95"/>')
    return "".join(out)


def losange(cx, cy, w, h, col, sw=0):
    return (f'<path d="M{cx} {cy-h} L{cx+w} {cy} L{cx} {cy+h} L{cx-w} {cy} Z" fill="{col}"'
            + (f' stroke="{sw}" stroke-width="2"' if sw else "") + "/>")


def frise(x, y, w, h, c1, c2, pas=28):
    """Bordure à motifs répétés (crochets / losanges)."""
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    n = int(w // pas)
    for i in range(n):
        cx = x + pas / 2 + i * pas
        cy = y + h / 2
        out.append(losange(cx, cy, pas * 0.32, h * 0.32, c2))
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{h*0.09}" fill="{c1}"/>')
    return "".join(out)


def frise_v(x, y, w, h, c1, c2, pas=28):
    out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c1}"/>']
    n = int(h // pas)
    for i in range(n):
        cy = y + pas / 2 + i * pas
        cx = x + w / 2
        out.append(losange(cx, cy, w * 0.32, pas * 0.32, c2))
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{w*0.09}" fill="{c1}"/>')
    return "".join(out)


def tapis(nom, pal, W=1600, H=1000, seed=1):
    random.seed(seed)
    P = pal
    g = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    g.append(f'<rect width="{W}" height="{H}" fill="{P["fond"]}"/>')
    # bordure extérieure
    m = 36
    g.append(f'<rect x="{m}" y="{m}" width="{W-2*m}" height="{H-2*m}" fill="{P["bord"]}"/>')
    b = 70  # largeur de la frise
    g.append(frise(m + 18, m + 18, W - 2 * (m + 18), b, P["bord"], P["or_"]))
    g.append(frise(m + 18, H - m - 18 - b, W - 2 * (m + 18), b, P["bord"], P["or_"]))
    g.append(frise_v(m + 18, m + 18, b, H - 2 * (m + 18), P["bord"], P["or_"]))
    g.append(frise_v(W - m - 18 - b, m + 18, b, H - 2 * (m + 18), P["bord"], P["or_"]))
    # filet ivoire
    f = m + 18 + b + 10
    g.append(f'<rect x="{f}" y="{f}" width="{W-2*f}" height="{H-2*f}" fill="none" stroke="{P["ivoire"]}" stroke-width="6"/>')
    # champ
    c = f + 16
    cw, ch = W - 2 * c, H - 2 * c
    g.append(f'<rect x="{c}" y="{c}" width="{cw}" height="{ch}" fill="{P["champ"]}"/>')
    # semis de boteh sur le champ
    pas = 92
    for ix in range(int(cw // pas) + 1):
        for iy in range(int(ch // pas) + 1):
            x = c + 46 + ix * pas
            y = c + 46 + iy * pas
            dcx, dcy = x - W / 2, y - H / 2
            if abs(dcx) < cw * 0.26 and abs(dcy) < ch * 0.36:
                continue  # réservé au médaillon
            col = P["or_"] if (ix + iy) % 2 else P["ivoire"]
            g.append(boteh(x, y, 16, col))
    # écoinçons (quarts de médaillon aux angles)
    for (ex, ey) in [(c, c), (W - c, c), (c, H - c), (W - c, H - c)]:
        g.append(f'<circle cx="{ex}" cy="{ey}" r="{ch*0.26:.0f}" fill="{P["bord"]}"/>')
        g.append(f'<circle cx="{ex}" cy="{ey}" r="{ch*0.22:.0f}" fill="none" stroke="{P["or_"]}" stroke-width="4"/>')
        g.append(f'<circle cx="{ex}" cy="{ey}" r="{ch*0.12:.0f}" fill="{P["accent"]}"/>')
    # médaillon central
    cx, cy = W / 2, H / 2
    rw, rh = cw * 0.24, ch * 0.34
    g.append(losange(cx, cy, rw * 1.08, rh * 1.08, P["or_"]))
    g.append(losange(cx, cy, rw, rh, P["bord"]))
    g.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rw*0.78:.0f}" ry="{rh*0.78:.0f}" fill="{P["accent"]}"/>')
    g.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rw*0.7:.0f}" ry="{rh*0.7:.0f}" fill="none" stroke="{P["ivoire"]}" stroke-width="4"/>')
    g.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rw*0.5:.0f}" ry="{rh*0.5:.0f}" fill="{P["champ"]}"/>')
    g.append(rosace(cx, cy, rh * 0.42, P["or_"], P["ivoire"], 10))
    # pendentifs
    for sgn in (-1, 1):
        px = cx + sgn * rw * 1.22
        g.append(losange(px, cy, rw * 0.18, rh * 0.3, P["or_"]))
        g.append(losange(px, cy, rw * 0.12, rh * 0.2, P["accent"]))
    # texture (usure fine, trame)
    g.append(f'<rect width="{W}" height="{H}" fill="url(#trame)" opacity=".08"/>')
    g.insert(1, '<defs><pattern id="trame" width="4" height="4" patternUnits="userSpaceOnUse">'
                '<path d="M0 0h4v1H0z M0 2h4v1H0z" fill="#000"/></pattern></defs>')
    # franges
    for x in range(m + 4, W - m, 9):
        g.append(f'<rect x="{x}" y="{4}" width="3" height="{m-8}" fill="{P["ivoire"]}" opacity=".85"/>')
        g.append(f'<rect x="{x}" y="{H-m+4}" width="3" height="{m-8}" fill="{P["ivoire"]}" opacity=".85"/>')
    g.append("</svg>")
    return "".join(g)


if __name__ == "__main__":
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img")
    os.makedirs(base, exist_ok=True)
    for i, (nom, pal) in enumerate(PALETTES.items(), 1):
        chemin = os.path.join(base, f"motif-{nom}.svg")
        with open(chemin, "w") as fh:
            fh.write(tapis(nom, pal, seed=i))
        print("ok", chemin)
