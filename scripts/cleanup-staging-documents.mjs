// Opt-in staging maintenance. Do not run against the production project.
import {createRequire} from "node:module";
const require=createRequire(new URL("../apps/web/package.json",import.meta.url));
const {createClient}=require("@supabase/supabase-js");
const ref=process.env.AURA_STAGING_DB_REF,url=process.env.AURA_STAGING_SUPABASE_URL,key=process.env.AURA_STAGING_SERVICE_ROLE_KEY;
if(process.env.AURA_ALLOW_QA_RUN!=="YES" || !ref || ref==="jdkfqdzgphzqbbzmerzr" || !/^[a-z0-9]{20}$/.test(ref) || url!==`https://${ref}.supabase.co` || !key){
 console.error("Not executed: explicit opt-in and isolated staging maintenance credentials are required.");process.exit(2);
}
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
let deleted=0;
// Bounded batches. Storage API deletes bytes; direct SQL deletion of objects does not.
for(let batch=0;batch<20;batch++){
 const result=await db.from("ai_document_files").select("id,storage_path").or(`expires_at.lte.${new Date().toISOString()},conversation_id.is.null`).limit(50);
 if(result.error)throw Error("Staging cleanup could not read expiration records");
 if(!result.data.length)break;
 const removal=await db.storage.from("noata-documents").remove(result.data.map(x=>x.storage_path));
 if(removal.error)throw Error("Staging cleanup failed to remove objects; records retained for retry");
 const records=await db.from("ai_document_files").delete().in("id",result.data.map(x=>x.id));
 if(records.error)throw Error("Staging cleanup could not remove metadata");
 deleted+=result.data.length;
}
// Account deletion cascades metadata. Sweep valid owner paths with no record too.
// The service client is used only after the isolated-project guard above.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let visited=0,orphans=0;
async function sweep(prefix='',depth=0){
 for(let offset=0;offset<1000&&visited<2000;offset+=100){
  const listing=await db.storage.from('noata-documents').list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
  if(listing.error)throw Error('Staging orphan inventory failed');
  const paths=[];
  for(const object of listing.data){
   if(visited>=2000)break;
   visited++;
   const path=prefix?prefix+'/'+object.name:object.name;
   if(!object.id&&depth<2&&uuid.test(object.name))await sweep(path,depth+1);
   else if(object.id&&depth===2&&/^[0-9a-f-]{36}\.(pdf|docx|txt|md|csv|json)$/i.test(object.name))paths.push(path);
  }
  if(paths.length){
   const rows=await db.from('ai_document_files').select('storage_path').in('storage_path',paths);
   if(rows.error)throw Error('Staging orphan ownership check failed');
   const present=new Set(rows.data.map(x=>x.storage_path)),missing=paths.filter(path=>!present.has(path));
   if(missing.length){
    const removal=await db.storage.from('noata-documents').remove(missing);
    if(removal.error)throw Error('Staging orphan byte cleanup failed');
    orphans+=missing.length;
   }
  }
  if(listing.data.length<100)break;
 }
}
await sweep();
console.log(`Staging document cleanup: ${deleted} expired/orphaned records, ${orphans} orphan objects; ${visited} inventory entries checked (bounded run).`);
