import test from "node:test";import assert from "node:assert/strict";
import {initialImageEdit as defaults,imageGeometry,adjustImagePixels,safeImageEdit} from "./image-edit.ts";
test("Rotation, crop positioning and size limits preserve source bounds",()=>{
 assert.deepEqual(imageGeometry(800,400,defaults),{rotatedWidth:800,rotatedHeight:400,x:0,y:0,width:800,height:400,scale:1});
 const square=imageGeometry(800,400,{...defaults,crop:"square",cropX:100});assert.equal(square.width,400);assert.equal(square.x,400);
 const turn=imageGeometry(800,400,{...defaults,rotation:90});assert.equal(turn.width,400);assert.equal(turn.height,800);
 assert.equal(imageGeometry(8000,3000,defaults).width,4096);assert.throws(()=>imageGeometry(20000,100,defaults));assert.throws(()=>imageGeometry(0,100,defaults));
});
test("Pixel adjustments preserve transparency and the identity edit; grayscale really removes color",()=>{
 const original=new Uint8ClampedArray([255,0,0,71,20,40,60,255]),identity=original.slice();adjustImagePixels(identity,defaults);assert.deepEqual(identity,original);
 const gray=original.slice();adjustImagePixels(gray,{...defaults,saturation:0});assert.equal(gray[0],gray[1]);assert.equal(gray[1],gray[2]);assert.equal(gray[3],71);assert.equal(gray[7],255);
 const brighter=new Uint8ClampedArray([40,40,40,255]);adjustImagePixels(brighter,{...defaults,brightness:1.5});assert.equal(brighter[0],60);
 assert.equal(original[0],255);
});
test("Image controls reject invalid numbers, arbitrary font code and CSS colors",()=>{
 const safe=safeImageEdit({...defaults,brightness:NaN,font:"url(https://bad)" as never,captionColor:"red; background:url(bad)",caption:"Hi\u0000"});
 assert.equal(safe.brightness,0.5);assert.equal(safe.font,"noata");assert.equal(safe.captionColor,"#ffffff");assert.equal(safe.caption,"Hi");
});
