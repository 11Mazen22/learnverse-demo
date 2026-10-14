import test from "node:test";
import assert from "node:assert/strict";
import {resolveAppearance,safeAppearance} from "./mode.ts";
test("Midnight is always dark, despite light preference or OS mode",()=>{
  for(const preference of ["light","dark","system"] as const) {
    assert.equal(resolveAppearance(preference,"midnight",false),"dark");
    assert.equal(resolveAppearance(preference,"midnight",true),"dark");
  }
});
test("Other worlds keep light, dark and operating system settings independent",()=>{
  for(const palette of ["classic","aura","ocean","forest","rose","sunset","custom",null]) {
    assert.equal(resolveAppearance("light",palette,true),"light");
    assert.equal(resolveAppearance("dark",palette,false),"dark");
    assert.equal(resolveAppearance("system",palette,false),"light");
    assert.equal(resolveAppearance("system",palette,true),"dark");
  }
});
test("Unknown appearance requests safely fall back to system",()=>{
 assert.equal(safeAppearance("light"),"light");
 assert.equal(safeAppearance("dark"),"dark");
 assert.equal(safeAppearance("whatever"),"system");
});
