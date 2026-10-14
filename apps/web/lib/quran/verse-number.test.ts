import test from "node:test";
import assert from "node:assert/strict";
import { toArabicIndicVerseNumber } from "./verse-number.ts";

test("Quran verse seals consistently use Eastern Arabic digits in every locale", () => {
  const fixtures:Record<number,string>={
    1:"١",2:"٢",5:"٥",10:"١٠",20:"٢٠",99:"٩٩",100:"١٠٠",255:"٢٥٥",286:"٢٨٦",
  };
  for(const [number,expected] of Object.entries(fixtures)){
    assert.equal(toArabicIndicVerseNumber(Number(number)),expected);
  }
});
test("Quran verse markers never contain Latin digits or ornamental text glyphs", () => {
  for(let number=1;number<=286;number++){
    const rendered=toArabicIndicVerseNumber(number);
    assert.match(rendered,/^[٠-٩]+$/u);
    assert.equal(rendered.length,String(number).length);
    assert.equal(/[۞*0-9]/u.test(rendered),false);
  }
});
test("invalid verse numbers are rejected instead of rendering misleading labels",()=>{
  for(const value of [-1,0,1.5,NaN,Infinity,287]){
    assert.throws(()=>toArabicIndicVerseNumber(value),RangeError);
  }
});
