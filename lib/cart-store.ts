import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number; // centimes
  quantity: number;
  options: Record<string, any>;
}

interface CartStore {
  items: CartItem[];
  restaurantId: string | null;
  restaurantSlug: string | null;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, restaurantId: string, restaurantSlug: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantSlug: null,

      addItem: (item, restaurantId, restaurantSlug) => {
        const state = get();

        // Si le panier contient des articles d'un autre restaurant, on le vide
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({ items: [], restaurantId, restaurantSlug });
        }

        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            restaurantId,
            restaurantSlug,
          });
        } else {
          set({
            items: [...state.items, { ...item, quantity: 1 }],
            restaurantId,
            restaurantSlug,
          });
        }
      },

      removeItem: (itemId) => {
        const newItems = get().items.filter((i) => i.id !== itemId);
        if (newItems.length === 0) {
          set({ items: [], restaurantId: null, restaurantSlug: null });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantSlug: null }),

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: 'yonya-cart', // clé localStorage
    }
  )
);
