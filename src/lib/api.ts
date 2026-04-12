import { createClient } from "@supabase/supabase-js";

// ─── Supabase client (для realtime + storage) ─────────────────────────────
export const supabase = createClient(
  "https://mamtqhqlhyhnchgsqboc.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "",
);

// ─── API base ──────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://tez-davo.vercel.app";

// ─── Auth tokens (в памяти + localStorage) ────────────────────────────────
let _accessToken = localStorage.getItem("tezdavo_access_token") || "";
let _refreshToken = localStorage.getItem("tezdavo_refresh_token") || "";

export function setTokens(access: string, refresh: string) {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem("tezdavo_access_token", access);
  localStorage.setItem("tezdavo_refresh_token", refresh);
}

export function clearTokens() {
  _accessToken = "";
  _refreshToken = "";
  localStorage.removeItem("tezdavo_access_token");
  localStorage.removeItem("tezdavo_refresh_token");
}

export function hasToken() {
  return !!_accessToken;
}

// ─── Base request ──────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Ошибка сервера" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth: логин через Telegram initData ──────────────────────────────────
// Вызывает твой /api/auth/telegram, получает access_token + refresh_token
export async function loginWithTelegram(initData: string): Promise<{
  user: { id: string; full_name: string; telegram_id: string };
  access_token: string;
  refresh_token: string;
}> {
  const res = await fetch(`${API_BASE}/api/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Ошибка авторизации");
  }

  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data;
}

// ─── Profile ───────────────────────────────────────────────────────────────
export const authApi = {
  getProfile: () => request<any>("/api/profile"),
  updateProfile: (data: Partial<{ full_name: string; phone: string }>) =>
    request("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
};

// ─── Medicines ─────────────────────────────────────────────────────────────
export const medicinesApi = {
  search: async (query?: string, category?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    const res = await request<any>(`/api/medicines?${params}`);
    // Бэкенд возвращает { medicines: [...] } или просто [...]
    return Array.isArray(res) ? res : res.medicines || res.data || [];
  },
  getById: (id: string) => request<any>(`/api/medicines/${id}`),
};

// ─── Pharmacies ────────────────────────────────────────────────────────────
export const pharmaciesApi = {
  list: async () => {
    const res = await request<any>("/api/pharmacies");
    // Бэкенд возвращает { pharmacies: [...] } или просто [...]
    return Array.isArray(res) ? res : res.pharmacies || res.data || [];
  },
  getById: (id: string) => request<any>(`/api/pharmacies/${id}`),
};

// ─── Orders ────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: async (data: {
    pharmacy_id: string;
    items: {
      medicine_id: string;
      pharmacy_inventory_id: string;
      quantity: number;
      price: number;
    }[];
    delivery_address: string;
    delivery_lat?: number;
    delivery_lng?: number;
    prescription_url?: string;
    notes?: string;
  }) => {
    // Бэкенд ожидает inventory_id, не pharmacy_inventory_id
    const payload = {
      ...data,
      items: data.items.map((i) => ({
        inventory_id: i.pharmacy_inventory_id,
        medicine_id: i.medicine_id,
        quantity: i.quantity,
      })),
    };
    return request("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  list: async () => {
    const res = await request<any>("/api/orders");
    return Array.isArray(res) ? res : res.orders || res.data || [];
  },

  updateStatus: (id: string, status: string) =>
    request(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ─── Realtime: следим за статусом заказа ──────────────────────────────────
export function subscribeToOrder(
  orderId: string,
  onUpdate: (order: any) => void,
) {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => onUpdate(payload.new),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// ─── File upload (prescription) ────────────────────────────────────────────
export async function uploadPrescription(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `prescriptions/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("prescriptions")
    .upload(path, file);
  if (error) throw new Error("Не удалось загрузить рецепт");

  const { data } = supabase.storage.from("prescriptions").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Medication schedule ───────────────────────────────────────────────────
export const scheduleApi = {
  list: (userId: string) =>
    supabase
      .from("medication_schedule")
      .select("*, medicine:medicines(*)")
      .eq("user_id", userId)
      .eq("is_active", true),

  create: (data: any) =>
    supabase.from("medication_schedule").insert(data).select().single(),

  delete: (id: string) =>
    supabase
      .from("medication_schedule")
      .update({ is_active: false })
      .eq("id", id),

  logTaken: (data: {
    schedule_id: string;
    scheduled_time: string;
    was_taken: boolean;
  }) =>
    supabase
      .from("schedule_log")
      .insert({ ...data, taken_at: new Date().toISOString() }),
};
