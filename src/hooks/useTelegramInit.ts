import { useEffect } from "react";
import { useAuthStore } from "../store";
import { loginWithTelegram, hasToken, authApi } from "../lib/api";

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
