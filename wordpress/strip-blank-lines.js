/**
 * Remove blank lines from inside <script> and <style> blocks.
 *
 * WordPress runs wpautop over post content, which turns a blank line into a
 * <p> or <br>. Inside an inline <script> that injects a literal '<' into the
 * JavaScript, and the console reports:
 *
 *     Uncaught SyntaxError: Unexpected token '<'
 *
 * which killed the offer selection, the claim form's prefill and the motion on
 * the live page. The markup is unaffected either way, so the cheapest durable
 * fix is to ship no blank lines inside script or style at all.
 *
 * Only blank lines go. Indentation, comments and line breaks are kept, so the
 * block stays readable.
 */
function stripBlankLines(html) {
  return html.replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi,
    (all, open, tag, body, close) => open + body.replace(/^[ \t]*\r?\n/gm, '') + close);
}

module.exports = { stripBlankLines };
