export const metadata = {
  title: 'Paramètres — Yonya Labs',
};

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Paramètres</h1>
        <p className="mt-1 text-gray-500">Configuration de votre restaurant et des intégrations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Carte Stripe Connect */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Paiements Stripe</h2>
              <p className="text-sm text-gray-500">Recevez les paiements directement sur votre compte</p>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-gray-400">
            Connectez votre compte Stripe pour recevoir les paiements de vos clients en direct. 
            Les frais bancaires Stripe (1,5% + 0,25€) sont appliqués par Stripe directement, 
            et <strong className="text-orange-400">Yonya Labs ne prend 0% de commission</strong>.
          </p>
          <button className="w-full rounded-xl bg-purple-600 px-6 py-3 font-bold text-white transition-all hover:bg-purple-700">
            Connecter mon compte Stripe
          </button>
        </div>

        {/* Carte Imprimante IoT */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Imprimante IoT</h2>
              <p className="text-sm text-gray-500">Expedy Cloud Print — Impression automatique en cuisine</p>
            </div>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-gray-400">
            Entrez l'identifiant unique (UID) de votre imprimante Expedy. 
            Les tickets de préparation s'imprimeront <strong className="text-green-400">automatiquement</strong> dès le paiement validé.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="UID de l'imprimante Expedy (ex: EXP-XXXX-XXXX)"
              className="flex-1 rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
            />
            <button className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition-all hover:bg-green-700">
              Enregistrer
            </button>
          </div>
        </div>

        {/* Carte Abonnement SaaS */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Abonnement</h2>
              <p className="text-sm text-gray-500">Votre formule Yonya Labs</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">79€</span>
              <span className="text-gray-400">/mois HT</span>
            </div>
            <p className="mt-1 text-sm text-gray-400">Commandes illimitées • 0% de commission • Impression IoT incluse</p>
          </div>
        </div>

        {/* Carte informations du restaurant */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Informations</h2>
              <p className="text-sm text-gray-500">Détails de votre établissement</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Pour modifier le nom de votre restaurant ou votre slug d'URL, contactez l'équipe Yonya Labs.
          </p>
        </div>
      </div>
    </div>
  );
}
