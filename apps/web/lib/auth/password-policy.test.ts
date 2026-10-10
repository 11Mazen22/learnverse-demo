import test from "node:test";
import assert from "node:assert/strict";
import {newPasswordProblem,MIN_NEW_PASSWORD_LENGTH} from "./password-policy.ts";
test("new password forms raise minimum strength without blocking existing sign-in",()=>{
 assert.equal(MIN_NEW_PASSWORD_LENGTH,12);
 assert.match(newPasswordProblem("short3!")??"",/12/);
 assert.match(newPasswordProblem("a".repeat(16))??"",/متكرر/);
 assert.match(newPasswordProblem("password123456789")??"",/سهلة/);
 assert.equal(newPasswordProblem("A long & unique passphrase 2026!"),null);
 assert.equal(newPasswordProblem("عبارة عربية طويلة وفريدة ٢٠٢٦"),null);
});
