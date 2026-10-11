import test from "node:test";
import assert from "node:assert/strict";
import {launchItems,launchActionEnabled} from "./launch-actions.ts";
test("Launchpad offers actual connected entry points without duplicates",()=>{
 assert.equal(launchItems.length,6);
 assert.equal(new Set(launchItems.map(x=>x.id)).size,6);
 assert.ok(launchItems.every(x=>x.titleEn&&x.titleAr&&x.descriptionAr&&x.descriptionEn));
 assert.equal(launchActionEnabled("memory",false),false);
 assert.equal(launchActionEnabled("projects",false),false);
 assert.equal(launchActionEnabled("study",true),true);
});
