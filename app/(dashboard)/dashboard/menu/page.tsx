'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category_id: '' });

  const supabase = createClient();

  useEffect(() => {
    fetchData();

    // Realtime pour les updates des coéquipiers
    const channel = supabase
      .channel('menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const [catRes, itemsRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('name'),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (itemsRes.data) setMenuItems(itemsRes.data);
  };

  const toggleAvailability = async (item: MenuItem) => {
    // Update optimiste
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
    );
    await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    await supabase.from('categories').insert({
      name: newCategoryName,
      sort_order: categories.length,
    });
    setNewCategoryName('');
    setIsAddingCategory(false);
    fetchData();
  };

  const addItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) return;
    await supabase.from('menu_items').insert({
      name: newItem.name,
      description: newItem.description || null,
      price: Math.round(parseFloat(newItem.price) * 100), // conversion en centimes
      category_id: newItem.category_id,
    });
    setNewItem({ name: '', description: '', price: '', category_id: '' });
    setIsAddingItem(false);
    fetchData();
  };

  const deleteItem = async (id: string) => {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from('menu_items').delete().eq('id', id);
  };

  const groupedItems = categories.map((cat) => ({
    ...cat,
    items: menuItems.filter((item) => item.category_id === cat.id),
  }));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Gestion de la Carte</h1>
          <p className="mt-1 text-gray-500">
            {menuItems.length} plat{menuItems.length > 1 ? 's' : ''} • {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddingCategory(true)}
            className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-gray-700 hover:text-white"
          >
            + Catégorie
          </button>
          <button
            onClick={() => setIsAddingItem(true)}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-orange-500/25"
          >
            + Nouveau plat
          </button>
        </div>
      </div>

      {/* Modal d'ajout de catégorie */}
      {isAddingCategory && (
        <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Nouvelle catégorie</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nom de la catégorie (ex: Entrées, Plats, Desserts)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <button onClick={addCategory} className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition-all hover:bg-orange-600">
              Ajouter
            </button>
            <button onClick={() => setIsAddingCategory(false)} className="rounded-xl bg-gray-700 px-6 py-3 text-gray-300 hover:bg-gray-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal d'ajout de plat */}
      {isAddingItem && (
        <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-800/50 p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Nouveau plat</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nom du plat *"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Prix en € (ex: 12.50) *"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <textarea
              placeholder="Description (optionnel)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
            <select
              value={newItem.category_id}
              onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
              className="rounded-xl border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">Choisir une catégorie *</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={addItem} className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition-all hover:bg-orange-600">
              Ajouter au menu
            </button>
            <button onClick={() => setIsAddingItem(false)} className="rounded-xl bg-gray-700 px-6 py-3 text-gray-300 hover:bg-gray-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des plats par catégorie */}
      {groupedItems.map((category) => (
        <section key={category.id} className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-200">{category.name}</h2>
          {category.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-700 py-6 text-center text-sm text-gray-500">
              Aucun plat dans cette catégorie
            </p>
          ) : (
            <div className="space-y-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                    item.is_available
                      ? 'border-gray-700 bg-gray-800/50'
                      : 'border-red-900/30 bg-red-950/20 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-white">{item.name}</p>
                      {!item.is_available && (
                        <span className="rounded-full bg-red-500/10 px-3 py-0.5 text-xs font-medium text-red-400">
                          Rupture
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold text-orange-400">
                      {(item.price / 100).toFixed(2)}€
                    </span>

                    {/* Toggle de disponibilité */}
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.is_available ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                          item.is_available ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-500 transition-colors hover:text-red-400"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 py-20">
          <p className="text-xl text-gray-500">Créez votre première catégorie</p>
          <p className="mt-2 text-sm text-gray-600">
            Puis ajoutez des plats pour construire votre carte en ligne
          </p>
        </div>
      )}
    </div>
  );
}
