import test from "node:test";
import assert from "node:assert/strict";
import {resolveAppearance,safeAppearance,getPaletteModeConstraint,isThemeModeAllowed} from "./mode.ts";

test("Midnight is always dark, despite light preference or OS mode",()=>{
  for(const preference of ["light","dark","system"] as const) {
    assert.equal(resolveAppearance(preference,"midnight",false),"dark");
    assert.equal(resolveAppearance(preference,"midnight",true),"dark");
  }
});

test("Midnight strictly locks out light and system modes",()=>{
  assert.equal(getPaletteModeConstraint("midnight"),"dark-only");
  assert.equal(isThemeModeAllowed("dark","midnight"),true);
  assert.equal(isThemeModeAllowed("light","midnight"),false);
  assert.equal(isThemeModeAllowed("system","midnight"),false);
});

test("Custom AI designs with dark-only or light-only constraints",()=>{
  assert.equal(getPaletteModeConstraint("custom","dark-only"),"dark-only");
  assert.equal(isThemeModeAllowed("dark","custom","dark-only"),true);
  assert.equal(isThemeModeAllowed("light","custom","dark-only"),false);
  assert.equal(resolveAppearance("light","custom",false,"dark-only"),"dark");

  assert.equal(getPaletteModeConstraint("custom","light-only"),"light-only");
  assert.equal(isThemeModeAllowed("light","custom","light-only"),true);
  assert.equal(isThemeModeAllowed("dark","custom","light-only"),false);
  assert.equal(resolveAppearance("dark","custom",true,"light-only"),"light");

  assert.equal(getPaletteModeConstraint("custom","both"),"both");
  assert.equal(isThemeModeAllowed("light","custom","both"),true);
  assert.equal(isThemeModeAllowed("dark","custom","both"),true);
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
