import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { subscribeToOrder, request } from "../lib/api";
import {
  formatPrice,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_STEPS,
} from "../lib/utils";
import type { Order, OrderStatus } from "../types";
import { Icon } from "../components/ui/Icon";
import styles from "./OrderDetail.module.css";

const STATUS_ICON_NAMES: Record<
  OrderStatus,
  | "pending"
  | "confirmed"
  | "collecting"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled"
> = {
  pending: "pending",
  confirmed: "confirmed",
  collecting: "collecting",
  ready: "ready",
  delivering: "delivering",
  delivered: "delivered",
  cancelled: "cancelled",
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Загружаем конкретный заказ по ID
    request<any>(`/api/orders/${id}`)
      .then((res: any) => {
        setOrder(res.order || res);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Realtime subscription
    const unsub = subscribeToOrder(id, (updated) => {
      setOrder((prev) => (prev ? { ...prev, ...updated } : null));
    });

    return () => {
      unsub();
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className="btn btn-icon" onClick={() => navigate(-1)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            className={`skeleton`}
            style={{ height: 180, borderRadius: 16 }}
          />
          <div
            className={`skeleton`}
            style={{ height: 120, borderRadius: 16 }}
          />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className="btn btn-icon" onClick={() => navigate(-1)}>
            ←
          </button>
        </div>
        <div className="empty-state">
          <h3>Заказ не найден</h3>
        </div>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);
  const isActive = !["delivered", "cancelled"].includes(order.status);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-icon" onClick={() => navigate("/orders")}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className={styles.headerTitle}>
          Заказ #{order.id.slice(-6).toUpperCase()}
        </span>
        <div style={{ width: 40 }} />
      </div>

      <div className={`scroll-area ${styles.content}`}>
        {/* Status hero */}
        <div className={`card ${styles.statusCard}`}>
          <div className={styles.statusIcon}>
            <Icon name={STATUS_ICON_NAMES[order.status]} size={48} />
          </div>
          <h2 className={styles.statusLabel}>
            {ORDER_STATUS_LABELS[order.status]}
          </h2>
          {isActive && (
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} />
              Обновляется в реальном времени
            </div>
          )}

          {/* Progress bar */}
          {order.status !== "cancelled" && (
            <div className={styles.progress}>
              {ORDER_STATUS_STEPS.map((step, idx) => (
                <div key={step} className={styles.progressStep}>
                  <div
                    className={`${styles.progressDot} ${idx <= currentStep ? styles.activeDot : ""}`}
                  >
                    {idx < currentStep ? "✓" : idx === currentStep ? "●" : ""}
                  </div>
                  {idx < ORDER_STATUS_STEPS.length - 1 && (
                    <div
                      className={`${styles.progressLine} ${idx < currentStep ? styles.activeLine : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <p className={styles.statusDate}>
            {formatDate(order.updated_at || order.created_at)}
          </p>
        </div>

        {/* Delivery address */}
        <div className={`card ${styles.section}`}>
          <h3 className={styles.sectionTitle}>Адрес доставки</h3>
          <p className={styles.address}>{order.delivery_address}</p>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className={`card ${styles.section}`}>
            <h3 className={styles.sectionTitle}>Состав заказа</h3>
            <div className={styles.itemList}>
              {order.items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <span className={styles.itemIcon}>💊</span>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>
                      {item.medicine?.name || "Лекарство"}
                    </p>
                    <p className={styles.itemQty}>
                      {item.quantity} шт × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className={styles.itemTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className={`card ${styles.section}`}>
          <div className={styles.totalRow}>
            <span>Итого</span>
            <span className={styles.totalAmount}>
              {formatPrice(order.total_amount)}
            </span>
          </div>
          {order.notes && <p className={styles.notes}>💬 {order.notes}</p>}
        </div>

        {/* Pharmacy */}
        {order.pharmacy && (
          <div className={`card ${styles.section}`}>
            <h3 className={styles.sectionTitle}>Аптека</h3>
            <p className={styles.pharmName}>{order.pharmacy.name}</p>
            <p className={styles.pharmAddr}>{order.pharmacy.address}</p>
            {order.pharmacy.phone && (
              <a
                href={`tel:${order.pharmacy.phone}`}
                className={styles.pharmPhone}
              >
                📞 {order.pharmacy.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
