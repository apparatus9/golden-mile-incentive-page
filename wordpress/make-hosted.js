/**
 * Turn a self-contained paste block into a thin one that loads its stylesheet
 * and script from GitHub Pages.
 *
 * Why: the self-contained block carries its CSS and JS inline, so every styling
 * or behaviour fix means pasting the whole thing into WordPress again. The
 * hosted variant keeps only the markup and points at two files in this repo,
 * which Pages serves from main. After one paste, a push is enough.
 *
 * The trade, which the README also records: the page then depends on GitHub
 * Pages being reachable. Markup still lives in the block, so the offers are in
 * the page source for search engines and are still there if Pages is down —
 * only the styling and the behaviour would be missing. Changing the offers
 * themselves is a markup change, so that still needs a fresh paste.
 */
const fs = require('fs');
const path = require('path');

const PAGES = 'https://apparatus9.github.io/golden-mile-incentive-page';

/**
 * @param {string} html  the finished self-contained block
 * @param {string} name  base name, e.g. 'one-page'
 * @param {string} outDir  where the hosted assets are written
 * @returns {string} the block with <style>/<script> replaced by links
 */
function makeHosted(html, name, outDir) {
  const styles = [];
  const scripts = [];

  let out = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, body) => {
    styles.push(body.trim());
    return '';
  });
  out = out.replace(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (m, body) => {
    if (body.trim()) scripts.push(body.trim());
    return '';
  });

  fs.mkdirSync(outDir, { recursive: true });
  const cssName = `gm-${name}.css`;
  const jsName = `gm-${name}.js`;
  fs.writeFileSync(path.join(outDir, cssName), styles.join('\n\n') + '\n');
  fs.writeFileSync(path.join(outDir, jsName), scripts.join('\n\n') + '\n');

  const relDir = path.basename(outDir);
  const link = `<link rel="stylesheet" href="${PAGES}/wordpress/${relDir}/${cssName}">`;
  const tag = `<script src="${PAGES}/wordpress/${relDir}/${jsName}"></script>`;

  // Stylesheet goes where the first <style> was: right after the fonts link.
  out = out.replace(/(<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>)/i,
    `$1\n${link}`);
  if (!out.includes(link)) out = link + '\n' + out;   // no fonts link: put it first

  // Script goes last, where the inline one was.
  out = out.replace(/\s*$/, '\n') + tag + '\n';

  // Tidy the blank gaps the removals left behind.
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

module.exports = { makeHosted, PAGES };
