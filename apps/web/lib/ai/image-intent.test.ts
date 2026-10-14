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

// Real Staging regression: drawing an XY graph previously invoked raster generation.
test("Graph requests never become raster images",()=>{for(const q of ["Draw a real interactive XY graph using points (0, 0), (1, 2), (10, 5). Make the line red and dashed.","Draw a graph showing x and y axis","ارسم رسمًا بيانيًا بمحور س وص","Plot y = x²","Draw y = 2x + 1","Create a scatter chart of these coordinates"])assert.equal(imageGenerationIntent(q),null,q);});
