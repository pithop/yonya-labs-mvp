'use client';

import { useCartStore } from '@/lib/cart-store';
import { useState } from 'react';

export default function CartDrawer() {
  const { items, getSubtotal, getItemCount, updateQuantity, removeItem, clearCart } =
    useCartStore();
  const [isOpen, setIsOpen] = useState(false);
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

  if (itemCount === 0 && !isOpen) return null;

  return (
    <>
      {/* Bouton flottant du panier */}
      {!isOpen && itemCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white shadow-2xl transition-all hover:scale-105 hover:shadow-orange-500/25 active:scale-95"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <span className="font-bold">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
            {(total / 100).toFixed(2)}€
          </span>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Tiroir latéral */}
      <div
        className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h2 className="text-xl font-bold text-gray-900">Votre commande</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <p className="text-center text-gray-400">Votre panier est vide</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-all hover:border-orange-200 hover:shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{(item.price / 100).toFixed(2)}€ / unité</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-orange-300 hover:text-orange-500"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-orange-300 hover:text-orange-500"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 text-red-400 transition-colors hover:text-red-600"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire client */}
          {items.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="font-bold text-gray-900">Vos informations</h3>
              <input
                type="text"
                placeholder="Nom complet *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              <input
                type="tel"
                placeholder="Téléphone *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
              <input
                type="email"
                placeholder="Email (optionnel)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setDeliveryType('CLICK_COLLECT')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 font-semibold transition-all ${
                    deliveryType === 'CLICK_COLLECT'
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  🏪 Click & Collect
                </button>
                <button
                  onClick={() => setDeliveryType('DELIVERY')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 font-semibold transition-all ${
                    deliveryType === 'DELIVERY'
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  🛵 Livraison (+6€)
                </button>
              </div>

              {deliveryType === 'DELIVERY' && (
                <input
                  type="text"
                  placeholder="Adresse de livraison complète *"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer avec Total */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5">
            <div className="mb-2 flex justify-between text-sm text-gray-500">
              <span>Sous-total</span>
              <span>{(subtotal / 100).toFixed(2)}€</span>
            </div>
            {deliveryFee > 0 && (
              <div className="mb-2 flex justify-between text-sm text-gray-500">
                <span>Livraison (Stuart)</span>
                <span>{(deliveryFee / 100).toFixed(2)}€</span>
              </div>
            )}
            <div className="mb-4 flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{(total / 100).toFixed(2)}€</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || !customerName || !customerPhone}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 font-bold text-white shadow-lg transition-all hover:shadow-orange-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCheckingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirection...
                </span>
              ) : (
                `Payer ${(total / 100).toFixed(2)}€`
              )}
            </button>
            <button
              onClick={clearCart}
              className="mt-2 w-full text-center text-sm text-gray-400 transition-colors hover:text-red-400"
            >
              Vider le panier
            </button>
          </div>
        )}
      </div>
    </>
  );
}
