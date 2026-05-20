'use client';

import { useCartStore } from '@/lib/cart-store';
import CartDrawer from '@/components/CartDrawer';
import { useState, useEffect } from 'react';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_url: string | null;
}

interface Props {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
}

export default function MenuClient({ restaurant, categories, menuItems }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.getTotal());
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  // Observer pour mettre à jour la catégorie active au scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(cat => document.getElementById(`cat-${cat.id}`));
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const handleAddItem = (item: MenuItem) => {
    // Haptic feedback si supporté (Mobile)
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    addItem(
      { id: item.id, name: item.name, price: item.price, options: {} },
      restaurant.id,
      restaurant.slug
    );
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 800);
  };

  const groupedItems = categories.map((cat) => ({
    ...cat,
    items: menuItems.filter((item) => item.category_id === cat.id),
  }));

  return (
    <div className="min-h-screen pb-32">
      {/* Header du restaurant (Hero) */}
      <header className="relative pt-24 pb-16 overflow-hidden">
        {/* Lueur de fond dynamique */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative mx-auto max-w-5xl px-6 text-center animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400 tracking-wide uppercase shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            Commandes Ouvertes
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter text-white md:text-7xl mb-4">
            {restaurant.name}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto font-medium">
            Click & Collect • Livraison Locale • Qualité Premium
          </p>
        </div>
      </header>

      {/* Navigation collante (Sticky Backdrop Blur) */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-40 w-full bg-[#030712]/70 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/50">
          <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-6 py-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = document.getElementById(`cat-${cat.id}`);
                  if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-105'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Grille des plats */}
      <main className="mx-auto max-w-5xl px-6 py-12 relative z-10">
        {groupedItems.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="mb-16 scroll-mt-28">
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-white flex items-center gap-4">
              {category.name}
              <div className="h-px bg-white/10 flex-1"></div>
            </h2>
            
            {category.items.length === 0 ? (
              <p className="text-zinc-500 italic">Aucun plat disponible.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 hover:border-orange-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1"
                  >
                    {/* Glow au survol */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>

                    <div className="flex items-start justify-between gap-4 z-10">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-orange-400 transition-colors duration-300">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm leading-relaxed text-zinc-400 line-clamp-3 mb-4">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xl font-extrabold text-white">
                          {(item.price / 100).toFixed(2)}€
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleAddItem(item)}
                        disabled={!item.is_available}
                        className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden ${
                          !item.is_available 
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : addedItemId === item.id
                              ? 'bg-green-500 text-white scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                              : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-orange-500 hover:text-white hover:border-orange-400 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95'
                        }`}
                      >
                        {addedItemId === item.id ? (
                          <svg className="h-6 w-6 animate-fade-in-up" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {groupedItems.length === 0 && (
          <div className="py-32 text-center glass-panel rounded-3xl">
            <p className="text-xl text-zinc-500">Le menu n'est pas encore disponible.</p>
          </div>
        )}
      </main>

      {/* Floating Action Button pour le Panier (Style UberEats Mobile) */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50 animate-fade-in-up">
          <button
            onClick={toggleDrawer}
            className="w-full flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl font-bold shadow-[0_10px_40px_rgba(249,115,22,0.4)] transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center bg-white/20 rounded-xl h-10 w-10 text-sm">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </div>
            <span className="text-lg">Voir le panier</span>
            <span className="text-lg">{(cartTotal / 100).toFixed(2)}€</span>
          </button>
        </div>
      )}

      <CartDrawer />
    </div>
  );
}
