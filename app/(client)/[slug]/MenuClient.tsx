'use client';

import { useCartStore } from '@/lib/cart-store';
import CartDrawer from '@/components/CartDrawer';
import { useState } from 'react';

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
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  const handleAddItem = (item: MenuItem) => {
    addItem(
      { id: item.id, name: item.name, price: item.price, options: {} },
      restaurant.id,
      restaurant.slug
    );
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 600);
  };

  const groupedItems = categories.map((cat) => ({
    ...cat,
    items: menuItems.filter((item) => item.category_id === cat.id),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header du restaurant */}
      <header className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-4xl px-6 py-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />
            Ouvert — Commandez en ligne
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {restaurant.name}
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Click & Collect • Livraison • 0% commission
          </p>
        </div>
      </header>

      {/* Navigation par catégorie */}
      {categories.length > 0 && (
        <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-6 py-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Grille des plats */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {groupedItems.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="mb-10">
            <h2 className="mb-5 text-2xl font-bold text-gray-900">{category.name}</h2>
            {category.items.length === 0 ? (
              <p className="text-gray-400">Aucun plat disponible dans cette catégorie.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-md ${
                      addedItemId === item.id ? 'scale-[0.97] border-green-400 ring-2 ring-green-200' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
                        )}
                        <p className="mt-3 text-lg font-extrabold text-orange-500">
                          {(item.price / 100).toFixed(2)}€
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddItem(item)}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-all hover:scale-110 hover:bg-orange-600 hover:shadow-orange-300/50 active:scale-90"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {addedItemId === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-50/80 transition-opacity">
                        <span className="text-2xl">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {groupedItems.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-xl text-gray-400">Le menu n'est pas encore disponible.</p>
          </div>
        )}
      </main>

      <CartDrawer />

      <footer className="border-t border-gray-100 bg-white py-8 text-center text-sm text-gray-400">
        Propulsé par <span className="font-semibold text-orange-500">Yonya Labs</span> — 0% de commission
      </footer>
    </div>
  );
}
