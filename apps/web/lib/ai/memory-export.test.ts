import test from "node:test";
import assert from "node:assert/strict";
import {serializeMemoryExport} from "./memory-export.ts";

test("memory export is portable JSON, preserves Arabic text and exports only user-facing fields",()=>{
 const json=serializeMemoryExport([{
  content:"أفضل شرح الرياضيات باللغة العربية",
  created_at:"2026-10-01T12:00:00.000Z",
  updated_at:"2026-10-04T12:00:00.000Z",
 }],true,"2026-10-15T12:30:00.000Z");
 const parsed=JSON.parse(json);
 assert.deepEqual(parsed,{
  format:"noata.ai.memory-export",
  version:1,
  exportedAt:"2026-10-15T12:30:00.000Z",
  consent:{enabled:true},
  memories:[{
   content:"أفضل شرح الرياضيات باللغة العربية",
   createdAt:"2026-10-01T12:00:00.000Z",
   updatedAt:"2026-10-04T12:00:00.000Z",
  }],
 });
 assert.equal(json.endsWith("\n"),true);
 assert.equal(json.includes("user_id"),false);
 assert.equal(json.includes("memory id"),false);
});

test("memory export represents disabled consent and an empty library without inventing memories",()=>{
 const parsed=JSON.parse(serializeMemoryExport([],false,"2026-10-15T00:00:00.000Z"));
 assert.equal(parsed.consent.enabled,false);
 assert.deepEqual(parsed.memories,[]);
});

test("memory export rejects invalid timestamps, unsafe record lengths and oversized libraries",()=>{
 assert.throws(()=>serializeMemoryExport([] ,true,"not-a-date"),/memory_export_date_invalid/);
 assert.throws(()=>serializeMemoryExport([{content:"short"}],true,"2026-10-15T00:00:00.000Z"),/memory_export_item_invalid/);
 assert.throws(()=>serializeMemoryExport(Array.from({length:51},()=>({content:"memory record content"})),true,"2026-10-15T00:00:00.000Z"),/memory_export_limit/);
});
