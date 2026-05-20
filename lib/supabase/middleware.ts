import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rafraîchit les cookies de session et sécurise les accès aux routes privées /dashboard
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Élimine les assets statiques et les routes d'API du processus d'authentification
  const path = request.nextUrl.pathname;
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path === '/favicon.ico' ||
    path.includes('.')
  ) {
    return supabaseResponse;
  }

  // Récupère de manière sécurisée l'utilisateur connecté via JWT
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // SECURISE L'ACCÈS AU BACK-OFFICE RESTAURATEUR
  if (path.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Extraction du claim restaurant_id cryptographiquement injecté par le déclencheur
    const restaurantId = user.app_metadata?.restaurant_id;
    if (!restaurantId) {
      // L'utilisateur n'est rattaché à aucun restaurant
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized_staff');
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}
