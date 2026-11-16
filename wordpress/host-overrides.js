/**
 * Build a host-override block by reading real rules out of a stylesheet.
 *
 * The paste blocks live inside someone else's page. A theme that styles
 * `.entry-content h1` or `.entry-content p` beats a single class of ours on
 * specificity, which is how the hero heading came back at body size, the legal
 * block at reading size and the card headings in the theme's own face.
 *
 * Every declaration this emits is copied out of the stylesheet, never retyped:
 * an earlier hand-written version of the block set `text-transform:none` on the
 * card headings and lost their capitals, and left out `font-family` so the
 * theme's face took them over. Reading the rules removes that whole class of
 * mistake.
 */

/* Comments have to go before matching. A flat matcher takes everything between
   the previous '}' and the next '{' as the selector, so a comment above a rule
   gets glued to it and the rule never matches. */
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '');

/* @media blocks go too: they keep their own breakpoints, and a nested '{'
   breaks a flat match so whole rules after one would go missing. */
function withoutMedia(src) {
  let out = '', i = 0;
  while (i < src.length) {
    const at = src.indexOf('@media', i);
    if (at < 0) { out += src.slice(i); break; }
    out += src.slice(i, at);
    let k = src.indexOf('{', at);
    if (k < 0) break;
    let d = 1; k++;
    while (k < src.length && d > 0) { if (src[k] === '{') d++; else if (src[k] === '}') d--; k++; }
    i = k;
  }
  return out;
}

/* Split a selector list on top-level commas only, so `:is(input,select,textarea)`
   and `:not(.gmi-wrap *)` survive intact. */
function splitSelectors(list) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

function makeDeclsFor(cssText) {
  const flat = withoutMedia(stripComments(cssText));
  return function declsFor(sel) {
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(flat))) {
      if (!splitSelectors(m[1]).includes(sel)) continue;
      out.push(m[2].trim().replace(/\s*\n\s*/g, ''));
    }
    return out.join(';').replace(/;;+/g, ';').replace(/;$/, '');
  };
}

/* property -> value; later wins, as the cascade would */
function force(sources) {
  const merged = new Map();
  for (const src of sources) {
    for (const d of src.split(';')) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      merged.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
  }
  return [...merged].map(([p, v]) => `${p}:${v} !important`).join(';');
}

/**
 * @param {string} cssText  stylesheet to read the real values from
 * @param {string[]} want   selectors to restate one level deeper
 * @param {Array<{sel:string, from:string[]}>} forced
 *        selectors to restate with !important, each merging the listed sources
 * @returns {{css:string, missing:string[]}}
 */
function buildOverrides(cssText, want, forced = []) {
  const declsFor = makeDeclsFor(cssText);
  const missing = [];
  const lines = want.map(sel => {
    const d = declsFor(sel);
    if (!d) { missing.push(sel); return `/* ${sel}: no rule found */`; }
    return `.gmi ${sel}{${d}}`;
  });
  const forcedLines = forced.map(({ sel, from }) => {
    const decls = force(from.map(declsFor));
    if (!decls) { missing.push(sel); return `/* ${sel}: no rule found */`; }
    return `${sel}{${decls}}`;
  });
  return { css: lines.concat(forcedLines).join('\n'), missing };
}

/**
 * Find modifiers and states of a covered selector that are not themselves
 * covered.
 *
 * Restating `.gmi-btn` as `.gmi .gmi-btn` raises it from one class to two, so
 * it starts beating `.gmi-btn-ghost` — and every outline button turns solid
 * red. The same trap waits for any `-modifier`, `:state` or `.combo` of
 * anything in the list. Covering them too, after the base, fixes it; this finds
 * the ones that were missed.
 *
 * @returns {string[]} selectors that need adding, in stylesheet order
 */
function findUncoveredVariants(cssText, want, alsoCovered = []) {
  const flat = withoutMedia(stripComments(cssText));
  const declsFor = makeDeclsFor(cssText);
  const props = sel => new Set(declsFor(sel).split(';')
    .map(d => d.split(':')[0].trim()).filter(Boolean));

  const covered = new Set([...want, ...alsoCovered]);
  const baseProps = new Map(want.map(b => [b, props(b)]));
  const found = [];

  for (const m of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const sel of splitSelectors(m[1])) {
      if (covered.has(sel) || found.includes(sel)) continue;
      for (const base of want) {
        // a variant extends the base with -suffix, :state or .another-class
        if (!sel.startsWith(base) || !/^[-:.]/.test(sel.slice(base.length))) continue;
        // only a problem where they set the same property: the base override
        // cannot win a property the variant alone declares
        const mine = new Set(m[2].split(';').map(d => d.split(':')[0].trim()).filter(Boolean));
        if ([...mine].some(p => baseProps.get(base).has(p))) { found.push(sel); break; }
      }
    }
  }
  return found;
}

module.exports = { buildOverrides, findUncoveredVariants, splitSelectors, stripComments, withoutMedia };
