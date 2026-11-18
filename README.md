# Présidentielle 2027 — site

Tableau de bord indépendant de suivi des candidatures, positions, sondages, programmes et événements de la présidentielle française de 2027.

## Données

- `presidentielle2027.json` contient la copie publique de la base de données réutilisée sous Licence Ouverte / Open Licence 2.0 (Etalab).
- `app.js` charge ce fichier et construit les statistiques, filtres, tableaux, sondages, listes de mesures et chronologie à partir de son contenu.
- `reports/index.json` alimente la section France 2040 et ses archives.

Lorsqu’une nouvelle version de la base est publiée dans le dépôt de données, copier le fichier `presidentielle2027.json` à la racine de ce dépôt, puis publier la mise à jour du site. Le dépôt source de données étant privé, GitHub Pages lit la copie incluse ici. La date de mise à jour affichée provient du champ `updatedAt` du fichier.

Les textes de navigation, les libellés et l’identité visuelle restent définis dans la page. Les données factuelles affichées sont chargées depuis les fichiers de données ci-dessus.

## GitHub Pages

Dans Settings → Pages, choisir `Deploy from a branch`, `main` et `/(root)`. Le site est publié sur `https://laurentfp.github.io/presidentielle2027-site/`.
