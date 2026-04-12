import { OrderStatus } from "../types";

// ─── Currency ──────────────────────────────────────────────────────────────

export function formatPrice(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "0 сум";
  return `${amount.toLocaleString("ru-RU")} сум`;
}

// ─── Order status ──────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: "⏳ Ожидает подтверждения",
  confirmed: "✅ Аптека подтвердила",
  courier_assigned: "🛵 Курьер назначен",
  courier_picked: "📦 Курьер забрал",
  delivering: "🛵 Едет к вам",
  delivered: "🎉 Доставлен",
  cancelled: "❌ Отменён",
  // алиасы
  pending: "⏳ Ожидает",
  collecting: "🔍 Собирается",
  ready: "📦 Готов к выдаче",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  created: "badge-yellow",
  pending: "badge-yellow",
  confirmed: "badge-blue",
  collecting: "badge-blue",
  courier_assigned: "badge-blue",
  courier_picked: "badge-blue",
  ready: "badge-blue",
  delivering: "badge-blue",
  delivered: "badge-green",
  cancelled: "badge-red",
};

export const ORDER_STATUS_STEPS: string[] = [
  "created",
  "confirmed",
  "courier_assigned",
  "courier_picked",
  "delivered",
];

// ─── Date ──────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Telegram ──────────────────────────────────────────────────────────────

export function isTelegramEnv(): boolean {
  return (
    typeof window !== "undefined" &&
    "Telegram" in window &&
    !!(window as any).Telegram?.WebApp
  );
}

export function getTelegramWebApp() {
  if (!isTelegramEnv()) return null;
  return (window as any).Telegram.WebApp;
}

// ─── Phone validation (Uzbekistan) ────────────────────────────────────────

export function formatPhone(phone: string): string {
  // +998 XX XXX-XX-XX
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
  }
  return phone;
}

export function isValidUzPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("998");
}

// ─── clsx-lite ────────────────────────────────────────────────────────────

export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
