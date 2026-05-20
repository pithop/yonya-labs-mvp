'use client';

import { useCartStore } from '@/lib/cart-store';
import { useState } from 'react';

export default function CartDrawer() {
  const { items, getSubtotal, getItemCount, updateQuantity, removeItem, clearCart } = useCartStore();
  const isOpen = useCartStore((s) => s.isDrawerOpen);
  const setIsOpen = useCartStore((s) => s.setDrawerOpen);
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryType, setDeliveryType] = useState<'CLICK_COLLECT' | 'DELIVERY'>('CLICK_COLLECT');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const subtotal = getSubtotal();
  const deliveryFee = deliveryType === 'DELIVERY' ? 600 : 0;
  const total = subtotal + deliveryFee;
  const itemCount = getItemCount();

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) return;

    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: useCartStore.getState().restaurantId,
          cartItems: items,
          customerDetails: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
          },
          deliveryType,
          deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : null,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Erreur checkout:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Overlay sombre avec flou */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-all duration-500 ease-out"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Tiroir latéral Midnight Glass */}
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-[#030712]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header du tiroir */}
        <div className="flex items-center justify-between border-b border-white/10 p-6 bg-white/5">
          <h2 className="text-2xl font-bold tracking-tight text-white">Votre commande</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-white hover:rotate-90 active:scale-90"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
              <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p>Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel flex items-center justify-between rounded-2xl p-4 transition-all duration-300 hover:border-orange-500/30"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-zinc-100">{item.name}</p>
                    <p className="text-sm font-medium text-orange-400">{(item.price / 100).toFixed(2)}€</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-white/5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
                    >
                      −
                    </button>
                    <span className="w-4 text-center font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire client */}
          {items.length > 0 && (
            <div className="mt-10 space-y-5 animate-fade-in-up">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Informations de livraison</h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom complet *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3.5 text-white placeholder-zinc-500 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Téléphone *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3.5 text-white placeholder-zinc-500 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email (optionnel pour reçu)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3.5 text-white placeholder-zinc-500 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeliveryType('CLICK_COLLECT')}
                  className={`flex-1 rounded-xl border px-4 py-4 font-semibold text-sm transition-all duration-300 ${
                    deliveryType === 'CLICK_COLLECT'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-xl mb-1">🏪</span>
                  Click & Collect
                </button>
                <button
                  onClick={() => setDeliveryType('DELIVERY')}
                  className={`flex-1 rounded-xl border px-4 py-4 font-semibold text-sm transition-all duration-300 ${
                    deliveryType === 'DELIVERY'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-xl mb-1">🛵</span>
                  Livraison (+6€)
                </button>
              </div>

              {deliveryType === 'DELIVERY' && (
                <div className="animate-fade-in-up">
                  <input
                    type="text"
                    placeholder="Adresse complète, code postal, ville *"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-4 py-3.5 text-white placeholder-zinc-500 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer avec Total */}
        {items.length > 0 && (
          <div className="border-t border-white/10 bg-[#030712] p-6 pb-8">
            <div className="mb-2 flex justify-between text-sm text-zinc-400">
              <span>Sous-total</span>
              <span className="text-zinc-200">{(subtotal / 100).toFixed(2)}€</span>
            </div>
            {deliveryFee > 0 && (
              <div className="mb-4 flex justify-between text-sm text-orange-400">
                <span>Frais de livraison</span>
                <span>{(deliveryFee / 100).toFixed(2)}€</span>
              </div>
            )}
            <div className="mb-6 flex justify-between items-end">
              <span className="text-sm uppercase tracking-widest text-zinc-500 font-bold">Total</span>
              <span className="text-3xl font-extrabold text-white">{(total / 100).toFixed(2)}€</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || !customerName || !customerPhone || (deliveryType === 'DELIVERY' && !deliveryAddress)}
              className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 font-bold text-white shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
              
              {isCheckingOut ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion sécurisée...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Payer {(total / 100).toFixed(2)}€
                </span>
              )}
            </button>
            
            <button
              onClick={clearCart}
              className="mt-4 w-full text-center text-sm font-medium text-zinc-500 transition-colors hover:text-red-400"
            >
              Vider le panier
            </button>
          </div>
        )}
      </div>
    </>
  );
}
