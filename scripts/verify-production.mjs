// Verify that the live production domain actually serves the expected commit.
//
// Vercel creates a production deployment for every push to the production
// branch, but the deployment only becomes the live one after it is promoted
// and the custom domain is assigned to it. A merge that is not promoted is
// invisible on the live site, so this check is the guard against that.
//
// Usage:
//   node scripts/verify-production.mjs [expected-sha]
// Environment:
//   NOATA_PRODUCTION_URL           live domain (default: the Noata production domain)
//   NOATA_PRODUCTION_TIMEOUT_MS    how long to wait for the deployment (default 10 min)
//   NOATA_PRODUCTION_POLL_MS       poll interval (default 15s)
import {setTimeout as sleep} from "node:timers/promises";

const url=(process.env.NOATA_PRODUCTION_URL??"https://noata.enterpriseworkhub.online").replace(/\/$/,"");
const expected=(process.argv[2]??process.env.GITHUB_SHA??"").trim();
const timeoutMs=Number(process.env.NOATA_PRODUCTION_TIMEOUT_MS??600000);
const pollMs=Number(process.env.NOATA_PRODUCTION_POLL_MS??15000);

if(!/^[0-9a-f]{40}$/i.test(expected)){
  console.error("verify-production: an expected commit SHA is required (40 hex characters).");
  process.exit(2);
}

async function revision(){
  const response=await fetch(url+"/health",{signal:AbortSignal.timeout(20000),cache:"no-store"});
  if(!response.ok)throw Error("health returned "+response.status);
  const body=await response.json();
  if(typeof body.revision!=="string")throw Error("health response has no revision");
  return body.revision;
}

const started=Date.now();
let last="";
let failure="";
for(;;){
  try{
    const current=await revision();
    last=current;
    if(current.toLowerCase()===expected.toLowerCase()){
      console.log(`verify-production: ${url} serves ${current} after ${Math.round((Date.now()-started)/1000)}s`);
      const worker=await fetch(url+"/pdf/pdf.worker.min.mjs",{method:"HEAD",signal:AbortSignal.timeout(20000),cache:"no-store"});
      if(!worker.ok||!/javascript/i.test(worker.headers.get("content-type")??"")){
        console.error("verify-production: the PDF preview worker is missing or has the wrong content type.");
        process.exit(1);
      }
      process.exit(0);
    }
  }catch(error){
    failure=error instanceof Error?error.message:String(error);
  }
  if(Date.now()-started>=timeoutMs)break;
  await sleep(pollMs);
}

console.error("verify-production: "+url+" did not serve "+expected+" within "+Math.round(timeoutMs/1000)+"s.");
console.error("  live revision: "+(last||"unknown")+(failure?" ("+failure+")":""));
console.error("  The Vercel production deployment exists but was not promoted, so the live domain still serves the previous build.");
console.error("  Promote it with: npx vercel promote <latest-production-deployment-url> --scope noata");
console.error("  Then re-run: node scripts/verify-production.mjs "+expected);
process.exit(1);
