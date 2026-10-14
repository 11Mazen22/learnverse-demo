import test from "node:test";
import assert from "node:assert/strict";
import {tooltipPosition,tooltipPreferredSide} from "./tooltip-position.ts";

const viewport={width:1440,height:900};
const railAtRight={left:1350,right:1395,top:100,bottom:144,width:45,height:44};
const railAtLeft={left:16,right:60,top:100,bottom:144,width:44,height:44};
test("Arabic and English rail captions point into the chat content",()=>{
  assert.equal(tooltipPreferredSide(true,true),"left");
  assert.equal(tooltipPreferredSide(true,false),"right");
  assert.equal(tooltipPreferredSide(false,true),"top");
  assert.equal(tooltipPosition(railAtRight,{width:140,height:31},viewport,"left").side,"left");
  assert.equal(tooltipPosition(railAtLeft,{width:140,height:31},viewport,"right").side,"right");
});
test("top-edge tooltips automatically flip below focus controls",()=>{
  const rect={left:600,right:644,top:3,bottom:47,width:44,height:44};
  const result=tooltipPosition(rect,{width:105,height:40},viewport);
  assert.equal(result.side,"bottom");
  assert.ok(result.top>=rect.bottom);
});
test("long captions stay in very small viewport",()=>{
 const position=tooltipPosition({left:4,right:42,top:200,bottom:238,width:38,height:38},{width:280,height:44},{width:320,height:480},"left");
 assert.ok(position.left>=10&&position.left+280<=310);
 assert.ok(position.top>=10&&position.top+44<=470);
});
test("rail tip flips to opposite side when chat edge is blocked",()=>{
  const pos=tooltipPosition(railAtLeft,{width:150,height:30},viewport,"left");
  assert.equal(pos.side,"right");
});
