import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../lib/api';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../lib/utils';
import type { Order } from '../types';
import styles from './Orders.module.css';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list()
      .then((data) => setOrders(data as Order[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Мои заказы</h2>
      </div>

      <div className={`scroll-area ${styles.content}`}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeleton}`} />
          ))
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>Заказов пока нет</h3>
            <p>Оформите первый заказ</p>
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className={`card ${styles.orderCard} fade-in`}>
              <div className={styles.orderTop}>
                <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
                <span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              {order.pharmacy && (
                <p className={styles.pharmacyName}>{order.pharmacy.name}</p>
              )}
              <div className={styles.orderBottom}>
                <span className={styles.date}>{formatDate(order.created_at)}</span>
                <span className={styles.amount}>{formatPrice(order.total_amount)}</span>
              </div>
              {(order.status === 'delivering' || order.status === 'collecting' || order.status === 'confirmed') && (
                <div className={styles.liveTag}>
                  <span className={styles.liveDot} />
                  Отслеживать
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
