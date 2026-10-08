import {SUPABASE_URL} from "@/lib/supabase/config";
/** Test preflight only: no user secrets and no authentication bypass. */
export function GET(){
 const ref=process.env.AURA_STAGING_DB_REF;
 if(process.env.NOATA_STAGING_QA_ENABLED!=="true" || !ref || ref==="jdkfqdzgphzqbbzmerzr" || SUPABASE_URL!==`https://${ref}.supabase.co`)return Response.json({enabled:false},{status:404,headers:{"Cache-Control":"no-store"}});
 return Response.json({enabled:true,supabaseOrigin:SUPABASE_URL},{headers:{"Cache-Control":"no-store"}});
}
