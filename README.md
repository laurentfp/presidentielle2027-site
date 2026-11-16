# Présidentielle 2027 — site

Maquette interactive du tableau de bord de suivi de la présidentielle française de 2027.

## Fichiers

- `index.html` : page publiée par GitHub Pages.
- `styles.css` : styles, palette bleu France / blanc / rouge Marianne.
- `app.js` : interactions du tableau de bord.

Les visualisations affichées sont une maquette statique basée sur un instantané du 15 novembre 2026. Le pied de page lit dynamiquement la date `updatedAt` du fichier de données original de PresiTracker2027 (requête HTTP partielle, limitée au début du fichier). Le site est indépendant et n'est pas un site officiel de l'État.

## GitHub Pages

Dans Settings → Pages, choisir `Deploy from a branch`, `main` et `/(root)`. Le déploiement publie cette page sur `https://laurentfp.github.io/presidentielle2027-site/`.
