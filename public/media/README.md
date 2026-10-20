# Médias SKINCLEAN

| Dossier | Contenu | Format conseillé |
|---|---|---|
| `brand/` | Logo (symbole S, wordmark) | PNG transparent / SVG |
| `packshots/` | Photo principale de chaque produit, fond clair uni ou détouré | PNG transparent 1200 px de haut, ou WebP |
| `lifestyle/` | Photos d'ambiance, mains, visages | WebP 1600 px |
| `textures/` | Gros plans de textures (gouttes, crème, mousse) | WebP 1200 px |
| `videos/` | Hero, vidéos d'application au survol, tutoriels, reels | MP4 H.264 + WebM, < 4 Mo, sans son |
| `before-after/` | Vraies photos avant/après (avec consentement des personnes) | WebP, même cadrage avant/après |
| `icons/` | Pictogrammes et illustrations | SVG |

Détourer un packshot sur fond clair : `node scripts/remove-bg.mjs entree.jpg public/media/packshots/nom.png`
