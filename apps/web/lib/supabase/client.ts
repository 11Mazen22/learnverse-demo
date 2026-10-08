import {createBrowserClient} from "@supabase/ssr";
import type {Database} from "./database.types";
import {SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL} from "./config";

export function createClient(){
  return createBrowserClient<Database>(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
    global:{fetch:async(input,init)=>{
      const url=String(input instanceof Request?input.url:input);
      const isRead=(!init?.method||init.method.toUpperCase()==="GET") && (url.includes("/rest/v1/") || url.includes("/auth/v1/user"));
      return fetch(input,isRead?{...init,signal:AbortSignal.any([...(init?.signal?[init.signal]:[]),AbortSignal.timeout(10000)])}:init);
    }}
  });
}
