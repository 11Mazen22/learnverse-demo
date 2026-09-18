import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHref, parseMarkdown, tokenize } from '../public/markdown.js';

// Collects every text value that will ever reach the DOM as a text node (the only place raw
// characters from the model's output can end up, per markdown.js's design — there is no "html" node
// type, so nothing here is ever interpreted as markup).
function collectText(nodes) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text' || node.type === 'code' || node.type === 'math') out += node.value ?? '';
    else if (node.children) out += collectText(node.children);
  }
  return out;
}

function collectBlockText(blocks) {
  let out = '';
  for (const block of blocks) {
    if (block.type === 'paragraph' || block.type === 'heading') out += collectText(block.children);
    else if (block.type === 'code-block') out += block.code;
    else if (block.type === 'blockquote') out += collectBlockText(block.children);
    else if (block.type === 'list') for (const item of block.items) out += collectText(item);
    else if (block.type === 'table') { for (const cell of block.header) out += collectText(cell); for (const row of block.rows) for (const cell of row) out += collectText(cell); }
  }
  return out;
}

test('a literal <script> tag never becomes anything but a plain-text node', () => {
  const ast = parseMarkdown('Here is some text <script>alert(1)</script> after it.');
  assert.ok(!JSON.stringify(ast).includes('"type":"html"'), 'there must be no html node type at all');
  const text = collectBlockText(ast);
  assert.ok(text.includes('<script>alert(1)</script>'), 'the raw text is preserved verbatim as inert text content');
});

test('an <img onerror=...> payload is inert text, never an element node', () => {
  const ast = parseMarkdown('<img src=x onerror="alert(1)">');
  assert.ok(!JSON.stringify(ast).includes('"type":"image"'));
  const text = collectBlockText(ast);
  assert.ok(text.includes('onerror'));
});

test('a javascript: link is rejected — parsed as unsafe and never rendered as a real link', () => {
  const ast = parseMarkdown('[click me](javascript:alert(1))');
  const paragraph = ast.find((b) => b.type === 'paragraph');
  const link = paragraph.children.find((n) => n.type === 'link');
  assert.equal(link.safe, false);
  assert.equal(isSafeHref('javascript:alert(1)'), false);
});

test('a data: URL link is rejected the same way', () => {
  assert.equal(isSafeHref('data:text/html,<script>alert(1)</script>'), false);
});

test('a vbscript: and a relative/malformed URL are all rejected; only http(s) is accepted', () => {
  assert.equal(isSafeHref('vbscript:msgbox(1)'), false);
  assert.equal(isSafeHref('/relative/path'), false);
  assert.equal(isSafeHref('not a url'), false);
  assert.equal(isSafeHref('https://example.com/page'), true);
  assert.equal(isSafeHref('http://example.com'), true);
});

test('a safe http(s) link parses with safe:true and preserves its text', () => {
  const ast = parseMarkdown('See [the docs](https://example.com/docs) for more.');
  const paragraph = ast.find((b) => b.type === 'paragraph');
  const link = paragraph.children.find((n) => n.type === 'link');
  assert.equal(link.safe, true);
  assert.equal(link.href, 'https://example.com/docs');
  assert.equal(collectText(link.children), 'the docs');
});

test('an unterminated fenced code block does not throw and does not lose the rest of the document', () => {
  assert.doesNotThrow(() => parseMarkdown('```js\nconst x = 1;\nfunction f() { return x; }'));
  const ast = parseMarkdown('```js\nconst x = 1;\nfunction f() { return x; }');
  assert.equal(ast[0].type, 'code-block');
  assert.ok(ast[0].code.includes('function f()'));
});

test('mismatched/nested brackets and stray markdown syntax do not throw', () => {
  assert.doesNotThrow(() => parseMarkdown('[[[nested [brackets](not-a-url without closing paren'));
  assert.doesNotThrow(() => parseMarkdown('**bold without close, *italic without close, `code without close'));
  assert.doesNotThrow(() => parseMarkdown('| a | b\n| - | -\nmissing pipe row'));
});

test('mixed RTL Arabic and LTR text inside inline formatting round-trips safely', () => {
  const ast = parseMarkdown('هذا **نص عريض بالعربية** and *English italic* together.');
  const text = collectBlockText(ast);
  assert.ok(text.includes('نص عريض بالعربية'));
  assert.ok(text.includes('English italic'));
});

test('a fenced code block\'s contents are never inline-parsed (backticks/asterisks inside stay literal)', () => {
  const ast = parseMarkdown('```\nconst s = "**not bold**" + `nested backtick`;\n```');
  assert.equal(ast[0].type, 'code-block');
  assert.ok(ast[0].code.includes('**not bold**'));
});

test('GFM table parsing produces header/row cells as inline node arrays, not raw HTML', () => {
  const ast = parseMarkdown('| Name | Danger |\n| --- | --- |\n| x | <script>1</script> |');
  const table = ast.find((b) => b.type === 'table');
  assert.ok(table);
  assert.equal(collectText(table.header[0]), 'Name');
  assert.ok(collectText(table.rows[0][1]).includes('<script>1</script>'));
});

test('headings, lists, and blockquotes parse into the expected node shapes', () => {
  const ast = parseMarkdown('# Title\n\n- one\n- two\n\n> a quote');
  assert.equal(ast[0].type, 'heading');
  assert.equal(ast[0].level, 1);
  assert.equal(ast[1].type, 'list');
  assert.equal(ast[1].items.length, 2);
  assert.equal(ast[2].type, 'blockquote');
});

test('tokenize() never emits a class for plain/unmatched text and handles an unknown language gracefully', () => {
  const spans = tokenize('some arbitrary text', 'made-up-language');
  assert.deepEqual(spans, [{ text: 'some arbitrary text', cls: null }]);
});

test('tokenize() highlights a JS keyword and a string literal distinctly', () => {
  const spans = tokenize('const x = "hi";', 'js');
  assert.ok(spans.some((s) => s.cls === 'tok-keyword' && s.text === 'const'));
  assert.ok(spans.some((s) => s.cls === 'tok-string' && s.text === '"hi"'));
});

test('tokenize() never introduces raw angle brackets into a cls-tagged span from untrusted code content', () => {
  const spans = tokenize('const html = "<script>x</script>";', 'js');
  const full = spans.map((s) => s.text).join('');
  assert.equal(full, 'const html = "<script>x</script>";', 'tokenizing must be lossless — every character is preserved as plain text, never dropped or executed');
});
