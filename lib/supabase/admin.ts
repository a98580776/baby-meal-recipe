import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Server-only: never import this from client components
 * or any code path that can execute in the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
