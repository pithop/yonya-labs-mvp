import Link from 'next/link';

export default async function SuccessPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>, 
  searchParams: Promise<{ order_id?: string }> 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center relative z-10 animate-fade-in-up">
        <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)] mb-8 animate-bounce-subtle">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Commande validée !
        </h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Votre paiement a bien été reçu. La commande a été transmise instantanément en cuisine et est en cours de préparation.
        </p>
        
        {resolvedSearchParams.order_id && (
          <div className="bg-black/30 rounded-xl p-4 mb-8 border border-white/5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">N° de Commande</p>
            <p className="font-mono text-zinc-300 font-medium">{resolvedSearchParams.order_id.split('-')[0].toUpperCase()}</p>
          </div>
        )}

        <Link 
          href={`/${resolvedParams.slug}`}
          className="block w-full py-4 px-6 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl font-medium transition-all duration-300 active:scale-95"
        >
          Retourner au Menu
        </Link>
      </div>
    </div>
  );
}
