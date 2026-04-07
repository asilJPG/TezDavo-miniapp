import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Главная',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/search',
    label: 'Поиск',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/cart',
    label: 'Корзина',
    badge: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} />
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} />
      </svg>
    ),
  },
  {
    path: '/orders',
    label: 'Заказы',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
        <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Профиль',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Layout() {
  const location = useLocation();
  const cartCount = useCartStore((s) => s.count());
  const isTopLevel = NAV_ITEMS.some((n) => location.pathname === n.path);

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
              <Link key={item.path} to={item.path} className={`${styles.navItem} ${active ? styles.active : ''}`}>
                <div className={styles.iconWrap}>
                  {item.icon(active)}
                  {item.badge && cartCount > 0 && (
                    <span className={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </div>
                <span className={styles.label}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
