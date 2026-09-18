// Hand-written Markdown parser + renderer + syntax highlighter. No dependencies (CSP blocks external
// scripts; the project is zero-dependency by design). Split into two layers on purpose:
//
//   parseMarkdown(text)        -> AST            pure, environment-agnostic, unit-tested in Node
//   renderMarkdownToDOM(ast)   -> DocumentFragment  browser-only, builds real DOM nodes
//
// Safety model: renderMarkdownToDOM NEVER uses innerHTML/outerHTML/insertAdjacentHTML. Every leaf of
// text is written via `.textContent =`, and the only elements ever created come from a hardcoded
// allowlist below. Raw HTML in the input (e.g. a model echoing "<script>...") is never treated as
// markup at all — there is no "html" AST node type — so it only ever becomes literal, inert text.
// Link hrefs are validated against a strict http(s)-only pattern before being set via setAttribute;
// anything else renders as plain text instead of an anchor.

const BLOCK_ELEMENTS = new Set(['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'a', 'strong', 'em', 'br', 'input']);

export function isSafeHref(href) {
  return typeof href === 'string' && /^https?:\/\/\S+$/i.test(href.trim());
}

// ---------------------------------------------------------------------------
// Inline parsing: text, **bold**, *italic*, `code`, [text](url), $math$, line breaks.
// ---------------------------------------------------------------------------

function parseInline(raw) {
  const nodes = [];
  let text = String(raw ?? '');
  let plain = '';
  const flushPlain = () => { if (plain) { nodes.push({ type: 'text', value: plain }); plain = ''; } };

  while (text.length) {
    // hard line break: two-plus trailing spaces then a newline, or an explicit escaped newline
    if (text.startsWith('  \n') || text.startsWith('\\\n')) { flushPlain(); nodes.push({ type: 'break' }); text = text.slice(text.startsWith('  \n') ? 3 : 2); continue; }

    // inline code span: `...`
    if (text[0] === '`') {
      const end = text.indexOf('`', 1);
      if (end > 0) { flushPlain(); nodes.push({ type: 'code', value: text.slice(1, end) }); text = text.slice(end + 1); continue; }
    }

    // bold: **...** or __...__
    if (text.startsWith('**') || text.startsWith('__')) {
      const marker = text.slice(0, 2);
      const end = text.indexOf(marker, 2);
      if (end > 2) { flushPlain(); nodes.push({ type: 'strong', children: parseInline(text.slice(2, end)) }); text = text.slice(end + 2); continue; }
    }

    // italic: *...* or _..._  (single marker, must not be immediately followed by whitespace)
    if ((text[0] === '*' || text[0] === '_') && text[1] && !/\s/.test(text[1])) {
      const marker = text[0];
      let end = -1;
      for (let i = 1; i < text.length; i += 1) {
        if (text[i] === marker && !/\s/.test(text[i - 1])) { end = i; break; }
      }
      if (end > 0) { flushPlain(); nodes.push({ type: 'em', children: parseInline(text.slice(1, end)) }); text = text.slice(end + 1); continue; }
    }

    // link: [text](https://...)
    if (text[0] === '[') {
      const closeBracket = text.indexOf(']');
      if (closeBracket > 0 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen > 0) {
          const linkText = text.slice(1, closeBracket);
          const href = text.slice(closeBracket + 2, closeParen);
          flushPlain();
          nodes.push({ type: 'link', href, safe: isSafeHref(href), children: parseInline(linkText) });
          text = text.slice(closeParen + 1);
          continue;
        }
      }
    }

    // math: $$...$$ (block-style, kept inline here for simplicity) or $...$
    if (text.startsWith('$$')) {
      const end = text.indexOf('$$', 2);
      if (end > 2) { flushPlain(); nodes.push({ type: 'math', value: text.slice(2, end), block: true }); text = text.slice(end + 2); continue; }
    }
    if (text[0] === '$' && text[1] && !/\s/.test(text[1])) {
      let end = -1;
      for (let i = 1; i < text.length; i += 1) {
        if (text[i] === '$' && !/\s/.test(text[i - 1])) { end = i; break; }
        if (text[i] === '\n') break;
      }
      if (end > 0) { flushPlain(); nodes.push({ type: 'math', value: text.slice(1, end), block: false }); text = text.slice(end + 1); continue; }
    }

    plain += text[0];
    text = text.slice(1);
  }
  flushPlain();
  return nodes;
}

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

const HR_RE = /^ {0,3}([-*_])( *\1){2,} *$/;
const HEADING_RE = /^ {0,3}(#{1,6}) +(.*)$/;
const ORDERED_ITEM_RE = /^ {0,3}\d+[.)] +(.*)$/;
const UNORDERED_ITEM_RE = /^ {0,3}[-*+] +(.*)$/;
const BLOCKQUOTE_RE = /^ {0,3}> ?(.*)$/;
const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

export function parseMarkdown(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i += 1; continue; }

    // fenced code block
    const fenceMatch = line.match(/^ {0,3}(```+|~~~+)\s*([\w+-]*)\s*$/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const language = fenceMatch[2] || '';
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith(fence.slice(0, 3))) { codeLines.push(lines[i]); i += 1; }
      if (i < lines.length) i += 1; // consume closing fence; unterminated fences just run to EOF, still safe
      blocks.push({ type: 'code-block', lang: language, code: codeLines.join('\n') });
      continue;
    }

    if (HR_RE.test(line)) { blocks.push({ type: 'hr' }); i += 1; continue; }

    const heading = line.match(HEADING_RE);
    if (heading) { blocks.push({ type: 'heading', level: Math.min(heading[1].length, 3), children: parseInline(heading[2]) }); i += 1; continue; }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines = [];
      while (i < lines.length && (BLOCKQUOTE_RE.test(lines[i]) || (lines[i].trim() && quoteLines.length))) {
        const match = lines[i].match(BLOCKQUOTE_RE);
        quoteLines.push(match ? match[1] : lines[i]);
        i += 1;
      }
      const callout = quoteLines[0]?.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
      if (callout) {
        quoteLines[0] = callout[2] || '';
        blocks.push({ type: 'blockquote', callout: callout[1].toLowerCase(), children: parseMarkdown(quoteLines.join('\n')) });
      } else {
        blocks.push({ type: 'blockquote', children: parseMarkdown(quoteLines.join('\n')) });
      }
      continue;
    }

    // GFM table: a row containing '|' immediately followed by a separator row
    if (line.includes('|') && lines[i + 1] && TABLE_SEPARATOR_RE.test(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) { rows.push(splitTableRow(lines[i])); i += 1; }
      blocks.push({ type: 'table', header: header.map((cell) => parseInline(cell)), rows: rows.map((row) => row.map((cell) => parseInline(cell))) });
      continue;
    }

    if (ORDERED_ITEM_RE.test(line) || UNORDERED_ITEM_RE.test(line)) {
      const ordered = ORDERED_ITEM_RE.test(line);
      const itemRe = ordered ? ORDERED_ITEM_RE : UNORDERED_ITEM_RE;
      const items = [];
      while (i < lines.length) {
        const match = lines[i].match(itemRe);
        if (match) { items.push([match[1]]); i += 1; }
        else if (lines[i].trim() && items.length && /^ {2,}\S/.test(lines[i])) { items[items.length - 1].push(lines[i].trim()); i += 1; }
        else break;
      }
      blocks.push({ type: 'list', ordered, items: items.map((linesForItem) => {
        const checklist = linesForItem[0].match(/^\[([ xX])\]\s+(.*)$/);
        const nodes = parseInline(checklist ? [checklist[2], ...linesForItem.slice(1)].join(' ') : linesForItem.join(' '));
        if (checklist) nodes.checked = checklist[1].toLowerCase() === 'x';
        return nodes;
      }) });
      continue;
    }

    // paragraph: gather until a blank line or the start of another block type
    const paragraphLines = [];
    while (i < lines.length && lines[i].trim() && !HR_RE.test(lines[i]) && !HEADING_RE.test(lines[i]) && !BLOCKQUOTE_RE.test(lines[i])
      && !ORDERED_ITEM_RE.test(lines[i]) && !UNORDERED_ITEM_RE.test(lines[i]) && !/^ {0,3}(```+|~~~+)/.test(lines[i])) {
      paragraphLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'paragraph', children: parseInline(paragraphLines.join('\n')) });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// DOM rendering (browser only — never called from the Node test suite)
// ---------------------------------------------------------------------------

function el(tag, className) {
  if (!BLOCK_ELEMENTS.has(tag)) throw new Error(`markdown.js: refusing to create disallowed element "${tag}"`);
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function renderInlineNodes(nodes, onCopyRequest) {
  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    if (node.type === 'text') { fragment.append(document.createTextNode(node.value)); continue; }
    if (node.type === 'break') { fragment.append(el('br')); continue; }
    if (node.type === 'code') { const code = el('code'); code.textContent = node.value; fragment.append(code); continue; }
    if (node.type === 'strong') { const strong = el('strong'); strong.append(renderInlineNodes(node.children, onCopyRequest)); fragment.append(strong); continue; }
    if (node.type === 'em') { const em = el('em'); em.append(renderInlineNodes(node.children, onCopyRequest)); fragment.append(em); continue; }
    if (node.type === 'math') { const span = el('span', node.block ? 'md-math md-math-block' : 'md-math'); span.textContent = node.value; fragment.append(span); continue; }
    if (node.type === 'link') {
      if (node.safe) {
        const a = el('a');
        a.setAttribute('href', node.href.trim());
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        a.append(renderInlineNodes(node.children, onCopyRequest));
        fragment.append(a);
      } else {
        fragment.append(renderInlineNodes(node.children, onCopyRequest));
      }
      continue;
    }
  }
  return fragment;
}

function renderBlocks(blocks, onCopyRequest) {
  const fragment = document.createDocumentFragment();
  for (const block of blocks) {
    if (block.type === 'heading') { const h = el(`h${block.level}`); h.append(renderInlineNodes(block.children, onCopyRequest)); fragment.append(h); continue; }
    if (block.type === 'paragraph') { const p = el('p'); p.append(renderInlineNodes(block.children, onCopyRequest)); fragment.append(p); continue; }
    if (block.type === 'hr') { fragment.append(el('hr')); continue; }
    if (block.type === 'blockquote') {
      const bq = el('blockquote', block.callout ? `md-callout md-callout-${block.callout}` : '');
      if (block.callout) {
        const label = el('strong', 'md-callout-label');
        label.textContent = block.callout;
        bq.append(label);
      }
      bq.append(renderBlocks(block.children, onCopyRequest)); fragment.append(bq); continue;
    }
    if (block.type === 'list') {
      const list = el(block.ordered ? 'ol' : 'ul');
      for (const item of block.items) {
        const li = el('li', Object.hasOwn(item, 'checked') ? 'md-task-item' : '');
        if (Object.hasOwn(item, 'checked')) {
          const checkbox = el('input');
          checkbox.setAttribute('type', 'checkbox');
          checkbox.setAttribute('disabled', '');
          if (item.checked) checkbox.setAttribute('checked', '');
          checkbox.setAttribute('aria-label', item.checked ? 'Completed' : 'Not completed');
          li.append(checkbox);
        }
        li.append(renderInlineNodes(item, onCopyRequest)); list.append(li);
      }
      fragment.append(list);
      continue;
    }
    if (block.type === 'table') {
      const table = el('table');
      const thead = el('thead'); const headRow = el('tr');
      for (const cell of block.header) { const th = el('th'); th.append(renderInlineNodes(cell, onCopyRequest)); headRow.append(th); }
      thead.append(headRow); table.append(thead);
      const tbody = el('tbody');
      for (const row of block.rows) {
        const tr = el('tr');
        for (const cell of row) { const td = el('td'); td.append(renderInlineNodes(cell, onCopyRequest)); tr.append(td); }
        tbody.append(tr);
      }
      table.append(tbody);
      const wrap = el('div', 'md-table-wrap');
      wrap.append(table);
      fragment.append(wrap);
      continue;
    }
    if (block.type === 'code-block') {
      const isMermaid = String(block.lang).toLowerCase() === 'mermaid';
      const wrap = el('div', `md-code-block${isMermaid ? ' md-mermaid' : ''}`);
      const header = el('div', 'md-code-head');
      const label = el('span', 'md-code-lang');
      label.textContent = isMermaid ? 'Mermaid diagram' : (block.lang || 'text');
      const copyButton = el('a', 'md-code-copy');
      copyButton.setAttribute('href', '#');
      copyButton.dataset.mdCopy = '1';
      copyButton.textContent = 'Copy';
      header.append(label, copyButton);
      const pre = el('pre');
      const code = el('code');
      appendHighlighted(code, block.code, block.lang);
      pre.append(code);
      wrap.append(header, pre);
      fragment.append(wrap);
      continue;
    }
  }
  return fragment;
}

export function renderMarkdownToDOM(input) {
  const ast = Array.isArray(input) ? input : parseMarkdown(input);
  return renderBlocks(ast);
}

// ---------------------------------------------------------------------------
// Lightweight syntax highlighting: tokenize() is pure (testable); appendHighlighted() is the only
// DOM-touching part, and it only ever creates <span class="tok-*"> or text nodes — never innerHTML.
// ---------------------------------------------------------------------------

const KEYWORDS = {
  js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'new', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break', 'continue', 'typeof', 'instanceof', 'this', 'super', 'null', 'undefined', 'true', 'false', 'of', 'in', 'static', 'get', 'set', 'yield'],
  python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'None', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'pass', 'break', 'continue', 'yield', 'async', 'await', 'global', 'nonlocal'],
  bash: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'export', 'local', 'in', 'echo'],
};
KEYWORDS.ts = KEYWORDS.js;
KEYWORDS.jsx = KEYWORDS.js;
KEYWORDS.tsx = KEYWORDS.js;
KEYWORDS.sh = KEYWORDS.bash;
KEYWORDS.shell = KEYWORDS.bash;

function normalizeLang(lang) {
  const key = String(lang || '').toLowerCase().trim();
  if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(key)) return key === 'javascript' ? 'js' : key === 'typescript' ? 'ts' : key;
  if (['py', 'python'].includes(key)) return 'python';
  if (['sh', 'bash', 'shell', 'zsh'].includes(key)) return 'bash';
  if (key === 'json') return 'json';
  if (['html', 'xml', 'css'].includes(key)) return key;
  return 'text';
}

// Returns an array of {text, cls} spans for one language; cls is null for plain/untokenized text.
export function tokenize(code, lang) {
  const language = normalizeLang(lang);
  if (language === 'text') return [{ text: code, cls: null }];

  const spans = [];
  const keywords = new Set(KEYWORDS[language] || []);
  const patterns = [
    { cls: 'tok-comment', re: language === 'python' || language === 'bash' ? /^#.*/ : /^\/\/.*|^\/\*[\s\S]*?\*\// },
    { cls: 'tok-string', re: /^("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/ },
    { cls: 'tok-number', re: /^\b\d+(\.\d+)?\b/ },
    { cls: 'tok-function', re: /^[A-Za-z_$][\w$]*(?=\()/ },
    { cls: 'tok-keyword', re: /^[A-Za-z_$][\w$]*/, test: (word) => keywords.has(word) },
  ];

  let remaining = code;
  let plain = '';
  const flush = () => { if (plain) { spans.push({ text: plain, cls: null }); plain = ''; } };

  outer: while (remaining.length) {
    for (const pattern of patterns) {
      const match = remaining.match(pattern.re);
      if (match && match[0] && (!pattern.test || pattern.test(match[0]))) {
        flush();
        spans.push({ text: match[0], cls: pattern.cls });
        remaining = remaining.slice(match[0].length);
        continue outer;
      }
    }
    plain += remaining[0];
    remaining = remaining.slice(1);
  }
  flush();
  return spans;
}

function appendHighlighted(codeElement, code, lang) {
  for (const span of tokenize(code, lang)) {
    if (!span.cls) { codeElement.append(document.createTextNode(span.text)); continue; }
    const el2 = document.createElement('span');
    el2.className = span.cls;
    el2.textContent = span.text;
    codeElement.append(el2);
  }
}
