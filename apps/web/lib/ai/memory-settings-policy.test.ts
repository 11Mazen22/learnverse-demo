import test from "node:test";
import assert from "node:assert/strict";
import {canMutateSavedMemory} from "./memory-settings-policy.ts";

test("temporary chats cannot change persistent memory or consent settings",()=>{
 assert.equal(canMutateSavedMemory(true),false);
 assert.equal(canMutateSavedMemory(false),true);
});
