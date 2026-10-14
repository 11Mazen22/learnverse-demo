import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import type {Database} from "./database.types";
import {supabaseSdkConfiguration,supabaseFetch} from "./config";

export async function createClient(){
  const cookieStore=await cookies();
  return createServerClient<Database>(
    supabaseSdkConfiguration.url,
    supabaseSdkConfiguration.key,
    {
      global: { fetch: supabaseFetch },
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
