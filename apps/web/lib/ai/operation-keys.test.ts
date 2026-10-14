import test from "node:test";
import assert from "node:assert/strict";
import { createOperationKeys } from "./operation-keys.ts";
test("ambiguous writes retain their transaction key, while a confirmed new purchase gets a new key", () => {
  let count = 0;
  const keys = createOperationKeys(() => `request-${++count}`);
  const original = keys.get("buy-avatar");
  assert.equal(keys.get("buy-avatar"), original);
  assert.notEqual(keys.get("other-item"), original);
  keys.confirmed("buy-avatar");
  assert.notEqual(keys.get("buy-avatar"), original);
  keys.clear();
  assert.equal(keys.get("other-item"), "request-4");
});
