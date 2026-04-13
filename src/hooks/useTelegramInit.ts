import { useEffect } from "react";
import { useAuthStore } from "../store";
import { loginWithTelegram, hasToken, authApi } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "https://tez-davo.vercel.app";

function startKeepalive() {
  setInterval(
    () => {
      fetch(`${API_BASE}/api/medicines?limit=1`).catch(() => {});
    },
    8 * 60 * 1000,
  );
}

export function useTelegramInit() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Максимум 1.5 сек сплеш — потом показываем приложение в любом случае
    const maxWait = setTimeout(() => setLoading(false), 1500);

    async function init() {
      try {
        const tg = (window as any).Telegram?.WebApp;

        if (tg) {
          tg.ready();
          tg.expand();

          // Применяем тему Telegram
          const isDark = tg.colorScheme === "dark";
          document.documentElement.setAttribute(
            "data-theme",
            isDark ? "dark" : "light",
          );
          tg.setHeaderColor(isDark ? "#1C1C1E" : "#FFFFFF");
          tg.setBackgroundColor(isDark ? "#111111" : "#F9FAFB");

          const initData: string = tg.initData || "";

          if (initData) {
            // Только логинимся — данные загрузятся на страницах
            await loginWithTelegram(initData);

            try {
              const profile = (await authApi.getProfile()) as any;
              const u = profile.user || profile;
              setUser({
                id: u.id,
                telegram_id: Number(u.telegram_id),
                first_name: (u.full_name || "").split(" ")[0] || "Гость",
                last_name:
                  (u.full_name || "").split(" ").slice(1).join(" ") ||
                  undefined,
                phone: u.phone || undefined,
                role: u.role || "user",
                created_at: u.created_at || new Date().toISOString(),
              });
            } catch {
              setUser({
                id: "unknown",
                telegram_id: tg.initDataUnsafe?.user?.id || 0,
                first_name: tg.initDataUnsafe?.user?.first_name || "Гость",
                role: "user",
                created_at: new Date().toISOString(),
              });
            }
          }
        } else {
          if (import.meta.env.DEV) {
            if (hasToken()) {
              try {
                const profile = (await authApi.getProfile()) as any;
                const u = profile.user || profile;
                setUser({
                  id: u.id || "dev-1",
                  telegram_id: Number(u.telegram_id) || 123456789,
                  first_name: (u.full_name || "Асил").split(" ")[0],
                  phone: u.phone || undefined,
                  role: "user",
                  created_at: new Date().toISOString(),
                });
              } catch {
                setUser({
                  id: "dev-1",
                  telegram_id: 123456789,
                  first_name: "Асил",
                  role: "user",
                  created_at: new Date().toISOString(),
                });
              }
            } else {
              setUser({
                id: "dev-1",
                telegram_id: 123456789,
                first_name: "Асил",
                role: "user",
                created_at: new Date().toISOString(),
              });
            }
          }
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        clearTimeout(maxWait);
        setLoading(false);
        startKeepalive();
      }
    }

    init();
  }, []);
}
