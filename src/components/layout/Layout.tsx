import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useCartStore } from "../../store";
import styles from "./Layout.module.css";

const NAV_ITEMS = [
  {
    path: "/",
    label: "Главная",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity={active ? 0.15 : 0}
        />
      </svg>
    ),
  },
  {
    path: "/search",
    label: "Поиск",
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M16.5 16.5L21 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    path: "/cart",
    label: "Корзина",
    badge: true,
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1="3"
          y1="6"
          x2="21"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    path: "/orders",
    label: "Заказы",
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3.5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 9h8M8 12.5h5M8 16h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    path: "/profile",
    label: "Профиль",
    icon: (_active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path
          d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Layout() {
  const location = useLocation();
  const cartCount = useCartStore((s) => s.count());
  const [showLabels, setShowLabels] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTopLevel = NAV_ITEMS.some((n) => location.pathname === n.path);

  function handleNavClick() {
    setShowLabels(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowLabels(false), 2000);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>

      {isTopLevel && (
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
                onClick={handleNavClick}
              >
                <div className={styles.iconWrap}>
                  {item.icon(active)}
                  {item.badge && cartCount > 0 && (
                    <span className={styles.badge}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span
                  className={`${styles.label} ${
                    showLabels ? styles.labelVisible : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
