import { useEffect } from "react";
import { useAuthStore } from "../store";
import {
  loginWithTelegram,
  hasToken,
  authApi,
  medicinesApi,
  pharmaciesApi,
} from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "https://tez-davo.vercel.app";

// Пингуем бэкенд каждые 8 минут чтобы не засыпал
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
    async function init() {
      try {
        const tg = (window as any).Telegram?.WebApp;

        if (tg) {
          tg.ready();
          tg.expand();
          tg.setHeaderColor("#FFFFFF");
          tg.setBackgroundColor("#F9FAFB");

          const initData: string = tg.initData || "";

          if (initData) {
            // Логинимся и сразу параллельно прогреваем данные главной
            const [_, medicines, pharmacies] = await Promise.allSettled([
              loginWithTelegram(initData),
              medicinesApi.search(),
              pharmaciesApi.list(),
            ]);

            // Загружаем профиль после логина
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
        setLoading(false);
        startKeepalive();
      }
    }

    init();
  }, []);
}

export function useTelegramInit() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function init() {
      try {
        const tg = (window as any).Telegram?.WebApp;

        if (tg) {
          // Инициализируем Telegram WebApp
          tg.ready();
          tg.expand();
          tg.setHeaderColor("#FFFFFF");
          tg.setBackgroundColor("#F9FAFB");

          const initData: string = tg.initData || "";

          if (initData) {
            // Логинимся через /api/auth/telegram — получаем JWT токены
            await loginWithTelegram(initData);

            // Загружаем полный профиль с phone и другими полями
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
              // Если профиль не загрузился — используем данные из telegram
              const { user } = await loginWithTelegram(initData);
              setUser({
                id: user.id,
                telegram_id: Number(user.telegram_id),
                first_name: user.full_name.split(" ")[0],
                last_name:
                  user.full_name.split(" ").slice(1).join(" ") || undefined,
                role: "user",
                created_at: new Date().toISOString(),
              });
            }
          }
        } else {
          // Dev режим — без Telegram
          if (import.meta.env.DEV) {
            if (hasToken()) {
              // Есть сохранённый токен — пробуем загрузить профиль
              try {
                const profile = (await authApi.getProfile()) as any;
                const u = profile.user || profile;
                setUser({
                  id: u.id || "dev-1",
                  telegram_id: Number(u.telegram_id) || 123456789,
                  first_name: (u.full_name || "Асил").split(" ")[0],
                  role: "user",
                  created_at: new Date().toISOString(),
                });
              } catch {
                setDevUser();
              }
            } else {
              setDevUser();
            }

            function setDevUser() {
              setUser({
                id: "dev-user-1",
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
        // Даже при ошибке показываем приложение
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);
}
