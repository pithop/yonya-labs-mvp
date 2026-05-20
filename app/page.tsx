import Link from 'next/link';

export const metadata = {
  title: 'Yonya Labs — Libérez votre restaurant des commissions abusives',
  description: 'Commandes en direct à 0% de commission avec impression thermique IoT automatique en cuisine.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans text-white overflow-hidden relative">
      {/* Fond avec effets de lumière diffus */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 py-6 flex items-center justify-between border-b border-gray-800/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/25">
            <span className="text-lg font-black text-white">Y</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Yonya Labs</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-gray-800/50"
          >
            Espace Restaurateur
          </Link>
          <Link
            href="/brasserie-du-coin"
            className="text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all"
          >
            Démo Vitrine Client
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-24 text-center lg:pt-32">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 text-sm font-semibold text-orange-400 mb-8 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            Révolution FoodTech B2B
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
            Libérez votre restaurant des <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">commissions abusives</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Permettez à vos clients de commander en direct (Click & Collect & Livraison) à <strong className="text-white">0% de commission</strong>. Vos tickets s'impriment instantanément en cuisine grâce à notre imprimante autonome IoT.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              href="/brasserie-du-coin"
              className="w-full sm:w-auto text-center rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Tester la Vitrine Client (Démo)
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-center rounded-2xl bg-gray-800 hover:bg-gray-700/80 border border-gray-700 px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105"
            >
              Accéder au Dashboard
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="rounded-3xl border border-gray-800/80 bg-gray-900/40 p-8 text-left backdrop-blur-xl hover:border-orange-500/30 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">0% Commission</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Gardez 100% du fruit de votre travail. Aucun frais caché sur les ventes. Un abonnement fixe unique et transparent à 79€/mois.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-gray-800/80 bg-gray-900/40 p-8 text-left backdrop-blur-xl hover:border-orange-500/30 transition-all group">
            <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Impression Magique IoT</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Dès que la commande est payée, l'imprimante autonome en cuisine sort le ticket instantanément sans tablette intermédiaire.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-gray-800/80 bg-gray-900/40 p-8 text-left backdrop-blur-xl hover:border-orange-500/30 transition-all group sm:col-span-2 lg:col-span-1">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Stripe Connect Standard</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              L'argent arrive directement sur votre compte bancaire en temps réel. Liaison sécurisée et simplifiée pour votre comptabilité.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900/60 bg-gray-950/40 py-12 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Yonya Labs — Tous droits réservés.</p>
        <p className="mt-2 text-xs">Propulsé par une imprimante thermique autonome pour une efficacité maximale.</p>
      </footer>
    </div>
  );
}
