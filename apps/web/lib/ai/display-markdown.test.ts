import test from "node:test";
import assert from "node:assert/strict";
import {displayMarkdown} from "./display-markdown.ts";
test("provider poetry line breaks become readable while code remains literal",()=>{
 assert.equal(displayMarkdown("Introduction <br> <br/>Poem"),"Introduction \n\n \n\nPoem");
 assert.equal(displayMarkdown("`<br>`\n```html\n<br>\n```"),"`<br>`\n```html\n<br>\n```");
 assert.equal(displayMarkdown("| First<br>Second | Answer |"),"| First · Second | Answer |");
 assert.equal(displayMarkdown('<img src="https://example.com">'),'<img src="https://example.com">');
});

test("provider LaTeX delimiters render as math without changing code samples",()=>{
 assert.equal(displayMarkdown("Roots: \\(x = 1\\)."),"Roots: $x = 1$.");
 assert.equal(displayMarkdown("\\[b^2-4ac\\]"),"\n\n$$\nb^2-4ac\n$$\n\n");
 const code="\x60\\(x\\)\x60\n\x60\x60\x60tex\n\\[x\\]\n\x60\x60\x60";assert.equal(displayMarkdown(code),code);
});
