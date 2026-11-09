/* @ds-bundle: {"format":4,"namespace":"BAAM","components":[{"name":"Button"},{"name":"Eyebrow"},{"name":"Heading"},{"name":"Price"},{"name":"Dimensions"},{"name":"Reference"},{"name":"KeyFigures"},{"name":"SpecTable"},{"name":"DecorSwatch"},{"name":"ModulePicto"},{"name":"StatusBadge"},{"name":"Pillar"},{"name":"ComparisonTable"},{"name":"Field"}]} */
(function () {
  var R = window.React, h = R.createElement;
  var NNBSP = " ";

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function omit(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }
  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP); }

  /* Actions */
  function Button(p) {
    var v = p.variant || "primary";
    var rest = omit(p, ["variant", "className", "children"]);
    return h("button", Object.assign({ type: "button" }, rest, { className: cx("bm-btn", "bm-btn-" + v, p.className) }),
      p.children, v === "link" ? h("span", { className: "bm-arrow", "aria-hidden": "true" }, "→") : null);
  }

  /* Typographie */
  function Eyebrow(p) {
    return h("div", { className: cx("bm-eyebrow", p.className) },
      p.number != null ? h("span", { className: "bm-eyebrow-num" }, p.number) : null,
      h("span", null, p.children));
  }
  function Heading(p) {
    var lvl = p.level || 2, tag = "h" + Math.min(6, Math.max(1, lvl));
    var cls = p.size || (lvl === 1 ? "h1" : lvl === 2 ? "h2" : "h3");
    return h("div", { className: cx("bm-heading", p.className) },
      h(tag, { className: "bm-title " + cls }, p.children),
      p.rule === false ? null : h("span", { className: "bm-rule", "aria-hidden": "true" }));
  }

  /* Données */
  function Price(p) {
    var size = p.size || "md";
    return h("div", { className: cx("bm-price", "bm-price-" + size, p.className) },
      p.label ? h("div", { className: "bm-price-label" }, p.label) : null,
      h("div", { className: "bm-price-row" },
        h("span", { className: "bm-price-amount" }, fmtInt(p.amount) + NNBSP + "€"),
        p.tax === null ? null : h("span", { className: "bm-price-tax" }, p.tax || "HT")));
  }
  function Dimensions(p) {
    var vals = p.values || [];
    var txt = vals.map(function (x) { return String(x); }).join(" × ");
    return h("span", { className: cx("bm-dim", p.className) }, txt,
      p.unit === null ? null : h("span", { className: "bm-dim-unit" }, " " + (p.unit || "mm")));
  }
  function Reference(p) {
    return h("div", { className: cx("bm-ref", p.className) },
      h("div", { className: "bm-ref-label" }, p.label || "Référence"),
      h("div", { className: "bm-ref-code" }, p.code));
  }
  function KeyFigures(p) {
    return h("dl", { className: cx("bm-figures", p.className) }, (p.items || []).map(function (it, i) {
      return h("div", { key: i, className: "bm-figure" },
        h("dt", { className: "bm-figure-label" }, it.label),
        h("dd", { className: cx("bm-figure-value", it.accent && "is-accent") }, it.value));
    }));
  }
  function SpecTable(p) {
    return h("div", { className: cx("bm-spec", p.className) },
      p.title ? h("div", { className: "bm-spec-title" }, p.title) : null,
      h("table", null, h("tbody", null, (p.rows || []).map(function (r, i) {
        return h("tr", { key: i }, h("th", { scope: "row" }, r.label), h("td", null, r.value));
      }))));
  }

  /* Produit */
  var DECORS = [
    { code: "BLC", name: "Blanc W980", token: "decor-blanc-w980" },
    { code: "CAR", name: "Beige Carat", token: "decor-beige-carat" },
    { code: "ANG", name: "Gris Angora", token: "decor-gris-angora" },
    { code: "KEN", name: "Chêne Kendal", token: "decor-chene-kendal" },
    { code: "CRN", name: "Noyer Carini", token: "decor-noyer-carini" }
  ];
  function DecorSwatch(p) {
    var list = p.decors || DECORS;
    var st = R.useState(p.value != null ? p.value : p.defaultValue != null ? p.defaultValue : list[0].code);
    var cur = p.value != null ? p.value : st[0];
    var sel = list.filter(function (d) { return d.code === cur; })[0] || list[0];
    return h("div", { className: cx("bm-decors", p.className) },
      h("div", { className: "bm-decors-row", role: "radiogroup", "aria-label": p.label || "Décor" }, list.map(function (d) {
        var on = d.code === cur;
        return h("button", {
          key: d.code, type: "button", role: "radio", "aria-checked": on, title: d.name,
          className: cx("bm-decor", on && "is-on"),
          style: { background: "var(--" + d.token + ")" },
          onClick: function () { st[1](d.code); if (p.onChange) p.onChange(d.code); }
        });
      })),
      h("div", { className: "bm-decors-caption" }, sel.code + " · " + sel.name + " · Egger"));
  }
  function ModulePicto(p) {
    var n = Math.max(1, Math.min(8, p.modules || 2)), sur = !!p.sur, w = 22, gap = 4, ch = 40, sh = 9, sg = 3;
    var top = sur ? sh + sg : 0, W = n * w + (n - 1) * gap, H = top + ch;
    var shapes = [];
    for (var i = 0; i < n; i++) {
      var x = i * (w + gap);
      if (sur) shapes.push(h("rect", { key: "s" + i, x: x + 1, y: 1, width: w - 2, height: sh - 2, className: i === 0 ? "bm-mod-sig" : "bm-mod" }));
      shapes.push(h("rect", { key: "c" + i, x: x + 1, y: top + 1, width: w - 2, height: ch - 2, className: "bm-mod" }));
    }
    var label = p.label != null ? p.label : (new Array(n + 1).join("A") + " — " + n + " module" + (n > 1 ? "s" : "") + (sur ? " + sur-caisson" : ""));
    return h("figure", { className: cx("bm-picto", p.className) },
      h("svg", { viewBox: "0 0 " + W + " " + H, width: W * (p.scale || 1.6), height: H * (p.scale || 1.6), role: "img", "aria-label": label }, shapes),
      label ? h("figcaption", null, label) : null);
  }

  /* Statut */
  var STATUS = { stock: "En stock", bat: "BAT validé", fabrication: "En fabrication", expedie: "Expédié" };
  function StatusBadge(p) {
    var s = STATUS[p.status] ? p.status : "stock";
    return h("span", { className: cx("bm-status", "bm-status-" + s, p.className) },
      h("span", { className: "bm-status-mark", "aria-hidden": "true" }), p.children || STATUS[s]);
  }

  /* Contenu */
  function Pillar(p) {
    return h("article", { className: cx("bm-pillar", p.accent && "is-accent", p.className) },
      h("div", { className: "bm-pillar-num" }, p.number),
      h("h3", { className: "bm-pillar-title" }, p.title),
      h("p", { className: "bm-pillar-text" }, p.text),
      p.proof ? h("div", { className: "bm-pillar-proof" }, h("div", { className: "bm-pillar-label" }, "Preuve"), h("p", null, p.proof)) : null);
  }
  function ComparisonTable(p) {
    var cols = p.columns || [], hi = p.highlight != null ? p.highlight : cols.length - 1;
    return h("div", { className: cx("bm-compare-wrap", p.className) },
      h("table", { className: "bm-compare" },
        h("thead", null, h("tr", null, h("th", { scope: "col" }, ""), cols.map(function (c, i) {
          return h("th", { key: i, scope: "col", className: i === hi ? "is-hi" : null }, c);
        }))),
        h("tbody", null, (p.rows || []).map(function (r, ri) {
          return h("tr", { key: ri }, h("th", { scope: "row" }, r.label), (r.values || []).map(function (v, i) {
            return h("td", { key: i, className: i === hi ? "is-hi" : null }, v);
          }));
        }))));
  }

  /* Formulaires */
  function Field(p) {
    var id = p.id || "bm-f-" + String(p.label || "champ").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    var rest = omit(p, ["label", "unit", "hint", "className", "id", "error"]);
    return h("div", { className: cx("bm-field", p.error && "is-error", p.className) },
      h("label", { htmlFor: id, className: "bm-field-label" }, p.label),
      h("div", { className: "bm-field-box" },
        h("input", Object.assign({ id: id, type: "number", inputMode: "numeric" }, rest)),
        p.unit === null ? null : h("span", { className: "bm-field-unit" }, p.unit || "mm")),
      p.error ? h("div", { className: "bm-field-msg" }, p.error) : p.hint ? h("div", { className: "bm-field-hint" }, p.hint) : null);
  }

  var api = { Button: Button, Eyebrow: Eyebrow, Heading: Heading, Price: Price, Dimensions: Dimensions, Reference: Reference,
    KeyFigures: KeyFigures, SpecTable: SpecTable, DecorSwatch: DecorSwatch, ModulePicto: ModulePicto, StatusBadge: StatusBadge,
    Pillar: Pillar, ComparisonTable: ComparisonTable, Field: Field, DECORS: DECORS, formatPrice: function (n) { return fmtInt(n) + NNBSP + "€"; } };
  window.BAAM = Object.assign(window.BAAM || {}, api);
})();
