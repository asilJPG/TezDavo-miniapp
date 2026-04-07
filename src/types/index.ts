// ─── Database types (matches Supabase schema) ─────────────────────────────

export interface User {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  phone?: string;
  role: 'user' | 'pharmacy' | 'courier' | 'admin';
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  working_hours?: string;
  is_active: boolean;
  rating?: number;
  logo_url?: string;
}

export interface Medicine {
  id: string;
  name: string;
  description?: string;
  manufacturer?: string;
  category?: string;
  prescription_required: boolean;
  image_url?: string;
  created_at: string;
}

export interface PharmacyInventory {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  price: number;
  quantity: number;
  in_stock: boolean;
  pharmacy?: Pharmacy;
  medicine?: Medicine;
}

export interface MedicineWithPrices extends Medicine {
  inventory: (PharmacyInventory & { pharmacy: Pharmacy })[];
  min_price?: number;
  max_price?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  medicine_id: string;
  pharmacy_inventory_id: string;
  quantity: number;
  price: number;
  medicine?: Medicine;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'collecting'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  pharmacy_id: string;
  courier_id?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  prescription_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  pharmacy?: Pharmacy;
  items?: OrderItem[];
}

export interface MedicationSchedule {
  id: string;
  user_id: string;
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  times: string[]; // ["08:00", "14:00", "20:00"]
  days_of_week: number[]; // [1,2,3,4,5,6,7] (1=Mon)
  start_date: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
  medicine?: Medicine;
}

export interface ScheduleLog {
  id: string;
  schedule_id: string;
  taken_at: string;
  scheduled_time: string;
  was_taken: boolean;
}

// ─── Cart types ────────────────────────────────────────────────────────────

export interface CartItem {
  medicine: Medicine;
  inventory: PharmacyInventory & { pharmacy: Pharmacy };
  quantity: number;
}

// ─── API response types ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}
