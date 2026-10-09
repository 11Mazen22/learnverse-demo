import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseSdkConfiguration, supabaseFetch } from "./config";

export function createClient() {
  return createBrowserClient<Database>(supabaseSdkConfiguration.url, supabaseSdkConfiguration.key, {
    global: {
      fetch: async (input, init) => {
        const url = String(input instanceof Request ? input.url : input);
        const isRead =
          (!init?.method || init.method.toUpperCase() === "GET") &&
          (url.includes("/rest/v1/") || url.includes("/auth/v1/user"));
        const boundedService =
          isRead || /\/(rest|auth|storage)\/v1\//.test(url);
        const timeout = isRead
          ? 10000
          : url.includes("/storage/v1/")
            ? 60000
            : 45000;
        return supabaseFetch(
          input,
          boundedService
            ? {
                ...init,
                signal: AbortSignal.any([
                  ...(init?.signal ? [init.signal] : input instanceof Request ? [input.signal] : []),
                  AbortSignal.timeout(timeout),
                ]),
              }
            : init,
        );
      },
    },
  });
}
