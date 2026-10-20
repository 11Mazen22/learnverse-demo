import test from "node:test";
import assert from "node:assert/strict";
import {allowedProviderSecret,clearProviderSecretCache,readProviderSecret} from "../../../../supabase/functions/noata-ai/provider-secrets.ts";

test("provider secrets are allowlisted, cached and never cache an outage",async()=>{
 clearProviderSecretCache();
 let calls=0;
 const reader={rpc:async(name:string,args:Record<string,unknown>)=>{
  calls++;
  assert.equal(name,"noata_provider_secret");
  assert.deepEqual(args,{secret_name:"LANGSEARCH_API_KEY"});
  return {data:"  secret-value  ",error:null};
 }};
 assert.equal(allowedProviderSecret("SUPABASE_SERVICE_ROLE_KEY"),false);
 assert.equal(await readProviderSecret(reader,"SUPABASE_SERVICE_ROLE_KEY"),"");
 assert.equal(calls,0,"An unallowlisted name must not reach the database");
 assert.equal(await readProviderSecret(reader,"LANGSEARCH_API_KEY"),"secret-value");
 assert.equal(await readProviderSecret(reader,"LANGSEARCH_API_KEY"),"secret-value");
 assert.equal(calls,1,"A successful lookup is cached briefly");
 clearProviderSecretCache();
 let failedCalls=0;
 const failing={rpc:async()=>{failedCalls++;return {data:null,error:{message:"database unavailable"}};}};
 assert.equal(await readProviderSecret(failing,"LANGSEARCH_API_KEY"),"");
 assert.equal(await readProviderSecret(failing,"LANGSEARCH_API_KEY"),"");
 assert.equal(failedCalls,2,"A database outage is not cached as a missing credential");
 clearProviderSecretCache();
 const recovered={rpc:async()=>({data:"recovered",error:null})};
 assert.equal(await readProviderSecret(recovered,"LANGSEARCH_API_KEY"),"recovered");
});

test("an environment credential wins only for an allowlisted name",async()=>{
 clearProviderSecretCache();
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,"Deno");
 Object.defineProperty(globalThis,"Deno",{configurable:true,value:{env:{get:(key:string)=>key==="LANGSEARCH_API_KEY"?"env-key":key==="SUPABASE_SERVICE_ROLE_KEY"?"service-key":undefined}}});
 try{
  let calls=0;
  const reader={rpc:async()=>{calls++;return {data:"vault-key",error:null};}};
  assert.equal(await readProviderSecret(reader,"LANGSEARCH_API_KEY"),"env-key");
  assert.equal(calls,0);
  assert.equal(await readProviderSecret(reader,"SUPABASE_SERVICE_ROLE_KEY"),"");
  assert.equal(calls,0);
 }finally{
  clearProviderSecretCache();
  if(descriptor)Object.defineProperty(globalThis,"Deno",descriptor);
  else Reflect.deleteProperty(globalThis,"Deno");
 }
});
