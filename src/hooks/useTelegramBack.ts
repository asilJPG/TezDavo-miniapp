import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TOP_LEVEL = ["/", "/search", "/cart", "/orders", "/profile"];

export function useTelegramBack() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    const isTopLevel = TOP_LEVEL.includes(location.pathname);

    if (!isTopLevel) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => navigate(-1));
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(() => navigate(-1));
    };
  }, [location.pathname]);
}
