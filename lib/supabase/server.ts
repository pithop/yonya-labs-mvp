import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Crée un client Supabase destiné à être exécuté uniquement côté serveur
 * (dans des Server Components, des Server Actions ou des Route Handlers).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const store = await cookieStore;
          return store.getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const store = await cookieStore;
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // Le middleware gère le rafraîchissement global de la session.
            // Cette erreur est ignorée lorsqu'elle est levée depuis un Server Component.
          }
        },
      },
    }
  );
}
