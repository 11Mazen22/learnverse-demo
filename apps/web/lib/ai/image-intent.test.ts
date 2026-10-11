import test from "node:test";
import assert from "node:assert/strict";
import {imageGenerationIntent} from "./image-intent.ts";
test("Real provider routes only explicit single-image creation",()=>{
 assert.equal(imageGenerationIntent("Generate a beautiful image of a cat"),"image");
 assert.equal(imageGenerationIntent("ارسم صورة لقطة في الحديقة"),"image");
 assert.equal(imageGenerationIntent("Draw a horse"),"image");
 assert.equal(imageGenerationIntent("How can I generate an image?"),null);
 assert.equal(imageGenerationIntent("إزاي ارسم صورة؟"),null);
 assert.equal(imageGenerationIntent("Make this image's background transparent"),null);
 assert.equal(imageGenerationIntent("Create a white SVG icon"),null);
 assert.equal(imageGenerationIntent("Create five icons for my app"),null);
 assert.equal(imageGenerationIntent("Describe this image"),null);
 assert.equal(imageGenerationIntent("What is an image?"),null);
});
