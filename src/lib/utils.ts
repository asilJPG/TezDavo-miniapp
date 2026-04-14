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

export function isPharmacyOpen(workingHours: any): boolean {
  if (!workingHours) return false;

  const now = new Date();
  // Ташкент UTC+5
  const tashkentOffset = 5 * 60;
  const localOffset = now.getTimezoneOffset();
  const tashkentTime = new Date(
    now.getTime() + (tashkentOffset + localOffset) * 60000,
  );

  const day = tashkentTime.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const hours = tashkentTime.getHours();
  const minutes = tashkentTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;
  const schedule =
    typeof workingHours === "object"
      ? isWeekend
        ? workingHours.sat_sun
        : workingHours.mon_fri
      : workingHours;

  if (!schedule) return false;

  const [openStr, closeStr] = schedule.split("-");
  if (!openStr || !closeStr) return false;

  const [openH, openM] = openStr.trim().split(":").map(Number);
  const [closeH, closeM] = closeStr.trim().split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

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
