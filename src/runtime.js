/* BAAM · moteur de rendu des pages.
   Interprète le balisage des maquettes (trous {{...}}, sc-for, sc-if, x-import)
   et l'affiche avec React. L'arbre est préparé au build (build.mjs). */
(function () {
  var R = window.React, h = R.createElement;

  window.DCLogic = function DCLogic() {};

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g, ONE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  function lookup(scopes, path) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var ps = path.split('.');
    for (var i = scopes.length - 1; i >= 0; i--) {
      var sc = scopes[i];
      if (sc && Object.prototype.hasOwnProperty.call(sc, ps[0])) {
        var v = sc[ps[0]];
        for (var j = 1; j < ps.length; j++) v = v == null ? undefined : v[ps[j]];
        return v;
      }
    }
    return undefined;
  }
  function resolve(str, scopes) {
    var m = ONE.exec(str);
    if (m) return lookup(scopes, m[1]);
    if (str.indexOf('{{') < 0) return str;
    return str.replace(HOLE, function (_, p) { var v = lookup(scopes, p); return v == null ? '' : String(v); });
  }

  function camel(k) {
    if (k.indexOf('--') === 0) return k;
    if (k.indexOf('-ms-') === 0) k = k.slice(1);
    return k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }
  function styleObj(s) {
    var o = {}, depth = 0, cur = '', parts = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
    }
    parts.push(cur);
    parts.forEach(function (p) {
      var k = p.indexOf(':');
      if (k < 0) return;
      var name = p.slice(0, k).trim(), val = p.slice(k + 1).trim();
      if (name) o[camel(name)] = val;
    });
    return o;
  }

  var RENAME = { 'class': 'className', 'for': 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
    colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete', novalidate: 'noValidate', srcset: 'srcSet',
    crossorigin: 'crossOrigin', inputmode: 'inputMode', 'xlink:href': 'xlinkHref', autofocus: 'autoFocus', spellcheck: 'spellCheck' };
  var BOOL = { required: 1, disabled: 1, checked: 1, selected: 1, hidden: 1, readOnly: 1, multiple: 1, autoFocus: 1, noValidate: 1, open: 1 };
  var NOSPACE = { table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, ul: 1, ol: 1, dl: 1, select: 1, svg: 1, g: 1, defs: 1, pattern: 1, mask: 1, clipPath: 1, colgroup: 1 };

  function renderList(nodes, scopes, parentTag) {
    var out = [];
    nodes.forEach(function (n, i) {
      var r = render(n, scopes, parentTag, i);
      if (Array.isArray(r)) out.push.apply(out, r); else if (r != null) out.push(r);
    });
    return out.map(function (el, i) { return R.isValidElement(el) && el.key == null ? R.cloneElement(el, { key: i }) : el; });
  }

  function render(n, scopes, parentTag, idx) {
    if (typeof n === 'string') {
      if (/^\s*$/.test(n)) return NOSPACE[parentTag] ? null : (n.length ? ' ' : null);
      var v = resolve(n, scopes);
      return v == null ? null : (typeof v === 'object' ? null : String(v));
    }
    var tag = n.t, a = n.a || {}, kids = n.c || [];
    if (tag === 'sc-for') {
      var list = resolve(a.list || '', scopes) || [], as = a.as || 'item', out = [];
      (Array.isArray(list) ? list : []).forEach(function (item, k) {
        var sc = {}; sc[as] = item;
        out.push(h(R.Fragment, { key: k }, renderList(kids, scopes.concat([sc]), parentTag)));
      });
      return out;
    }
    if (tag === 'sc-if') return resolve(a.value || '', scopes) ? h(R.Fragment, { key: 'if' + idx }, renderList(kids, scopes, parentTag)) : null;
    if (tag === 'helmet' || tag === 'dc-import') return null;

    var props = {}, comp = tag;
    if (tag === 'x-import') {
      var path = (a['component-from-global-scope'] || '').split('.'), C = window;
      path.forEach(function (p) { C = C && C[p]; });
      if (typeof C !== 'function') return null;
      comp = C;
      Object.keys(a).forEach(function (k) {
        if (k === 'component-from-global-scope' || k.indexOf('hint-') === 0) return;
        props[k] = resolve(a[k], scopes);
      });
      return h(comp, props, kids.length ? renderList(kids, scopes, 'div') : undefined);
    }

    var isNumberInput = tag === 'input' && (a.type === 'number');
    Object.keys(a).forEach(function (k) {
      if (k.indexOf('hint-') === 0) return;
      var name = RENAME[k] || RENAME[k.toLowerCase()] || k, v = resolve(a[k], scopes);
      if (name === 'style') { if (typeof v === 'string') v = styleObj(v); }
      if (BOOL[name]) { v = v === '' ? true : (v === 'false' ? false : !!v); }
      props[name] = v;
    });
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      var hasChange = typeof props.onChange === 'function';
      if (isNumberInput && hasChange) {
        var fn = props.onChange, commit = function (e) { fn(e); };
        delete props.onChange;
        props.defaultValue = props.value; props.key = 'n' + props.name + ':' + props.value; delete props.value;
        props.onBlur = commit;
        props.onKeyDown = function (e) { if (e.key === 'Enter') { commit(e); } };
      } else if (!hasChange && 'value' in props && props.type !== 'range') {
        props.defaultValue = props.value; delete props.value;
      }
    }
    if (tag === 'textarea' && kids.length) { props.defaultValue = kids.map(function (k) { return typeof k === 'string' ? resolve(k, scopes) : ''; }).join(''); kids = []; }
    var children = kids.length ? renderList(kids, scopes, tag) : undefined;
    return h(comp, props, children);
  }

  window.BAAMPage = function (tree, Component, defaults) {
    function App() {
      var inst = R.useRef(null), force = R.useReducer(function (x) { return x + 1; }, 0)[1];
      if (!inst.current) {
        var c = new Component();
        c.props = defaults || {};
        c.state = {};
        c.setState = function (o) { c.state = Object.assign({}, c.state, typeof o === 'function' ? o(c.state) : o); force(); };
        inst.current = c;
      }
      var vals = inst.current.renderVals() || {};
      return h(R.Fragment, null, renderList(tree, [vals], 'div'));
    }
    var root = document.getElementById('root');
    window.ReactDOM.createRoot(root).render(h(App));
  };
})();
