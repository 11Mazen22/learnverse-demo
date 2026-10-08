import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import type {Database} from "./database.types";
import {SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL,stagingFetch} from "./config";

export async function createClient(){
  const cookieStore=await cookies();
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      global: { fetch: stagingFetch },
      cookies:{
        getAll(){return cookieStore.getAll();},
        setAll(cookiesToSet){
          try{cookiesToSet.forEach(({name,value,options})=>cookieStore.set(name,value,options));}
          catch{}
        }
      }
    }
  );
}
