import Link from 'next/link';

export default async function CancelPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = await params;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center relative z-10 animate-fade-in-up">
        <div className="w-20 h-20 bg-zinc-800/80 border border-zinc-700 rounded-full mx-auto flex items-center justify-center mb-8">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
          Paiement annulé
        </h1>
        <p className="text-zinc-400 mb-8 leading-relaxed text-sm">
          Vous n'avez pas été débité. Votre panier a été conservé, vous pouvez finaliser votre commande quand vous le souhaitez.
        </p>

        <Link 
          href={`/${resolvedParams.slug}`}
          className="block w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg shadow-orange-500/20 active:scale-95"
        >
          Reprendre ma commande
        </Link>
      </div>
    </div>
  );
}
