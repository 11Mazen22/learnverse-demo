import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
        return fetch(
          input,
          boundedService
            ? {
                ...init,
                signal: AbortSignal.any([
                  ...(init?.signal ? [init.signal] : []),
                  AbortSignal.timeout(timeout),
                ]),
              }
            : init,
        );
      },
    },
  });
}
