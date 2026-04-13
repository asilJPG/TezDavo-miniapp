import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  CartItem,
  Medicine,
  PharmacyInventory,
  Pharmacy,
} from "../types";

// ─── Auth store ────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));

// ─── Theme store ───────────────────────────────────────────────────────────
interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () =>
        set((s) => {
          const next = !s.isDark;
          document.documentElement.setAttribute(
            "data-theme",
            next ? "dark" : "light",
          );
          return { isDark: next };
        }),
      setDark: (v) =>
        set(() => {
          document.documentElement.setAttribute(
            "data-theme",
            v ? "dark" : "light",
          );
          return { isDark: v };
        }),
    }),
    { name: "tezdavo-theme" },
  ),
);

// ─── Data cache store ──────────────────────────────────────────────────────
interface CacheState {
  medicines: any[];
  pharmacies: any[];
  setMedicines: (data: any[]) => void;
  setPharmacies: (data: any[]) => void;
}

export const useCacheStore = create<CacheState>()((set) => ({
  medicines: [],
  pharmacies: [],
  setMedicines: (medicines) => set({ medicines }),
  setPharmacies: (pharmacies) => set({ pharmacies }),
}));
interface CartState {
  items: CartItem[];
  addItem: (
    medicine: Medicine,
    inventory: PharmacyInventory & { pharmacy: Pharmacy },
    quantity?: number,
  ) => void;
  removeItem: (inventoryId: string) => void;
  updateQuantity: (inventoryId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
  pharmacyId: () => string | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (medicine, inventory, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.inventory.id === inventory.id,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.inventory.id === inventory.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { medicine, inventory, quantity }] };
        });
      },

      removeItem: (inventoryId) =>
        set((state) => ({
          items: state.items.filter((i) => i.inventory.id !== inventoryId),
        })),

      updateQuantity: (inventoryId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(inventoryId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.inventory.id === inventoryId ? { ...i, quantity } : i,
          ),
        }));
      },

      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.inventory.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      pharmacyId: () =>
        get().items.length > 0 ? get().items[0].inventory.pharmacy_id : null,
    }),
    { name: "tezdavo-cart" },
  ),
);
