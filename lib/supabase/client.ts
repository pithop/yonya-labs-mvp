import { createBrowserClient } from '@supabase/ssr';

/**
 * Crée un client Supabase destiné à être exécuté côté navigateur (Client Components)
 * pour des requêtes directes légères ou pour s'abonner aux canaux Realtime.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
