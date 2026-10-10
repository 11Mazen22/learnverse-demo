import test from "node:test";import assert from "node:assert/strict";
import {isSameOriginMutation} from "./request-origin.ts";
test("mutation origin handles Next proxy normalization without allowing cross-site requests",()=>{
 const request=(origin:string)=>new Request("http://localhost:3000/api/documents",{headers:{origin,host:"127.0.0.1:3000"}});
 assert.equal(isSameOriginMutation(request("http://127.0.0.1:3000")),true);
 assert.equal(isSameOriginMutation(request("https://attacker.invalid")),false);
 assert.equal(isSameOriginMutation(request("http://127.0.0.1:3001")),false);
 assert.equal(isSameOriginMutation(request("")),false);
 assert.equal(isSameOriginMutation(new Request("http://localhost/api/documents",{headers:{host:"staging.vercel.app",origin:"https://staging.vercel.app","x-forwarded-proto":"https"}})),true);
});
