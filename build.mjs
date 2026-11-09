// Construit le site statique dans dist/ à partir des maquettes de src/pages.
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const PAGES = [
  { file: 'Main.dc.html', route: '', title: 'BAAM · Caissons sur mesure pour les pros', desc: 'Caissons de dressing et de placard sur mesure, fabriqués à Nanterre pour les professionnels du bâtiment. Prix publics, prêts 72 h après BAT.' },
  { file: 'GrilleTarifaire.dc.html', route: 'grille-tarifaire', title: 'Grille tarifaire · BAAM', desc: 'Tous les prix BAAM, caisson, vantaux, équipements : lisibles avant le devis.' },
  { file: 'QuiSommesNous.dc.html', route: 'qui-sommes-nous', title: 'Qui sommes-nous · BAAM', desc: 'Un atelier à Nanterre au service des professionnels du bâtiment.' },
  { file: 'Configurateur.dc.html', route: 'configurateur', title: 'Configurateur · BAAM', desc: 'Composez votre meuble, voyez le prix, demandez votre BAT.' },
];

const LINKS = {
  'Main.dc.html': '/', 'GrilleTarifaire.dc.html': '/grille-tarifaire/', 'QuiSommesNous.dc.html': '/qui-sommes-nous/', 'Configurateur.dc.html': '/configurateur/',
};
const BLOBS = {
  eec3c9b534f71f3bca8597181775ceb5: 'dressing.png',
  '661814100ee30784cedacc903f28458f': 'decors-sprite.jpg',
  c1953859763d6ff50c588126fae72f83: 'decors-textures.jpg',
  '80e7c401fc67823c3cc386cd2dd3e2d7': 'dressing-mask.png',
  '0e28e6284229e44e3dba29e73212ca2c': 'dressing-shade.jpg',
};

const BAT_FIELDS = ['prenom', 'nom', 'societe', 'email', 'telephone', 'message', 'total_ht', 'total_ttc', 'configuration', 'config_json', 'photo1', 'photo2', 'photo3'];

function rewrite(s) {
  s = s.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => {
    if (!BLOBS[id]) throw new Error('Image inconnue : ' + id);
    return '/assets/' + BLOBS[id];
  });
  for (const [from, to] of Object.entries(LINKS)) {
    s = s.split('"' + from + '#').join('"' + to + '#');
    s = s.split("'" + from + '#').join("'" + to + '#');
    s = s.split('"' + from + '"').join('"' + to + '"');
    s = s.split("'" + from + "'").join("'" + to + "'");
  }
  return s;
}

function toTree(node) {
  if (node.type === 'text') return node.data;
  if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
    const o = { t: node.name };
    if (Object.keys(node.attribs).length) o.a = node.attribs;
    const c = (node.children || []).map(toTree).filter((x) => x !== null);
    if (c.length) o.c = c;
    return o;
  }
  return null;
}

function between(s, a, b) {
  const i = s.indexOf(a);
  if (i < 0) return null;
  const j = s.indexOf(b, i + a.length);
  return s.slice(i + a.length, j);
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
fs.mkdirSync(path.join(DIST, 'vendor'), { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, 'assets'))) fs.copyFileSync(path.join(SRC, 'assets', f), path.join(DIST, 'assets', f));
for (const f of ['tokens.css', 'bundle.css', 'bundle.js']) fs.copyFileSync(path.join(SRC, 'ds', f), path.join(DIST, 'vendor', f));
fs.copyFileSync(path.join(SRC, 'runtime.js'), path.join(DIST, 'vendor', 'runtime.js'));
fs.copyFileSync(path.join(ROOT, 'node_modules/react/umd/react.production.min.js'), path.join(DIST, 'vendor', 'react.js'));
fs.copyFileSync(path.join(ROOT, 'node_modules/react-dom/umd/react-dom.production.min.js'), path.join(DIST, 'vendor', 'react-dom.js'));
// bundle.css importe les polices : on les charge déjà dans <head>
const bcss = path.join(DIST, 'vendor', 'bundle.css');
fs.writeFileSync(bcss, fs.readFileSync(bcss, 'utf8').replace(/@import[^;]+;\s*/, ''));

for (const p of PAGES) {
  const raw = rewrite(fs.readFileSync(path.join(SRC, 'pages', p.file), 'utf8'));
  let body = between(raw, '<x-dc>', '</x-dc>');
  const helmet = between(body, '<helmet>', '</helmet>') || '';
  body = body.replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const scriptTag = /<script type="text\/x-dc"([^>]*)>([\s\S]*?)<\/script>/.exec(raw);
  const logic = scriptTag[2];
  const propsAttr = /data-props='([^']*)'/.exec(scriptTag[1]);
  const defaults = {};
  if (propsAttr) {
    const spec = JSON.parse(propsAttr[1]);
    for (const [k, v] of Object.entries(spec)) if (k[0] !== '$' && v && 'default' in v) defaults[k] = v.default;
  }
  const doc = parseDocument(body, { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true, decodeEntities: true });
  const tree = doc.children.map(toTree).filter((x) => x !== null);

  const isCfg = p.file === 'Configurateur.dc.html';
  const netlifyForm = isCfg
    ? `<form name="bat" method="POST" enctype="multipart/form-data" data-netlify="true" netlify-honeypot="bot-field" hidden>${['bot-field', ...BAT_FIELDS]
        .map((f) => (f === 'message' || f === 'configuration' || f === 'config_json' ? `<textarea name="${f}"></textarea>` : `<input name="${f}"${/^photo/.test(f) ? ' type="file"' : ''}>`))
        .join('')}</form>\n`
    : '';

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/vendor/tokens.css">
<link rel="stylesheet" href="/vendor/bundle.css">
${helmet.replace(/<link[^>]*fonts\.googleapis[^>]*>\s*/g, '').trim()}
</head>
<body>
${netlifyForm}<div id="root"></div>
<noscript><p style="padding:24px;font-family:sans-serif">Ce site a besoin de JavaScript pour s'afficher.</p></noscript>
<script>window.BAAM_LIVE = true;</script>
<script src="/vendor/react.js"></script>
<script src="/vendor/react-dom.js"></script>
<script src="/vendor/bundle.js"></script>
<script src="/vendor/runtime.js"></script>
<script>
${logic.trim()}
BAAMPage(${JSON.stringify(tree).replace(/</g, '\\u003c')}, Component, ${JSON.stringify(defaults)});
</script>
</body>
</html>
`;
  const out = path.join(DIST, p.route, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('page', '/' + p.route, Math.round(html.length / 1024) + ' Ko');
}

fs.writeFileSync(path.join(DIST, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#14171a"/><rect x="7" y="7" width="8" height="18" fill="none" stroke="#fff" stroke-width="2"/><rect x="17" y="7" width="8" height="18" fill="none" stroke="#ff3b00" stroke-width="2"/></svg>');
fs.writeFileSync(path.join(DIST, '404.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page introuvable · BAAM</title><link rel="stylesheet" href="/vendor/tokens.css"><link rel="stylesheet" href="/vendor/bundle.css"></head><body><main style="max-width:640px;margin:15vh auto;padding:0 16px"><h1 class="h1">Page introuvable.</h1><p>Cette page n'existe pas ou plus.</p><p><a href="/">Retour à l'accueil</a></p></main></body></html>`);
console.log('ok');
