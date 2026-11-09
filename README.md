# Site BAAM

Site vitrine et configurateur de caissons BAAM, déployé sur Netlify.

## Contenu

- `src/pages/` : les pages, au format des maquettes du canvas (accueil, grille tarifaire, qui sommes-nous, configurateur).
- `src/ds/` : le design system BAAM (couleurs, typographie, composants).
- `src/assets/` : images (dressing, décors Egger).
- `src/runtime.js` : affiche les pages dans le navigateur.
- `build.mjs` : construit le site dans `dist/`.

## Construire en local

```
npm install
npm run build
```

Le site est dans `dist/`.

## Demandes de BAT

Le formulaire du configurateur (étape Récapitulatif) est géré par Netlify Forms, sous le nom `bat`.
Chaque demande contient les coordonnées, le message, jusqu'à 3 photos, la configuration détaillée, le prix HT et TTC,
et `config_json` qui permet de reconstruire la configuration.

Les demandes sont visibles dans Netlify : Site > Forms > bat. Pour les recevoir par e-mail :
Site configuration > Notifications > Emails and webhooks > Form submission notifications > Add notification > Email notification.
