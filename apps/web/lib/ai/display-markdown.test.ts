import test from "node:test";
import assert from "node:assert/strict";
import {displayMarkdown} from "./display-markdown.ts";
test("provider poetry line breaks become readable while code remains literal",()=>{
 assert.equal(displayMarkdown("Introduction <br> <br/>Poem"),"Introduction \n\n \n\nPoem");
 assert.equal(displayMarkdown("`<br>`\n```html\n<br>\n```"),"`<br>`\n```html\n<br>\n```");
 assert.equal(displayMarkdown("| First<br>Second | Answer |"),"| First · Second | Answer |");
 assert.equal(displayMarkdown('<img src="https://example.com">'),'<img src="https://example.com">');
});
