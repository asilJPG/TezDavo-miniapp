import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore, useAuthStore } from "../store";
import { ordersApi, uploadPrescription } from "../lib/api";
import { formatPrice } from "../lib/utils";
import toast from "react-hot-toast";
import { Icon } from "../components/ui/Icon";
import styles from "./Cart.module.css";

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clear, total, count } =
    useCartStore();
  const user = useAuthStore((s) => s.user);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsPrescription = items.some((i) => i.medicine.requires_prescription);
  const pharmacy = items[0]?.inventory.pharmacy;

  async function handleOrder() {
    if (!user) {
      toast.error("Войдите через Telegram");
      return;
    }
    if (!address.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }
    if (needsPrescription && !prescriptionFile) {
      toast.error("Прикрепите фото рецепта");
      return;
    }

    setLoading(true);
    try {
      let prescriptionUrl: string | undefined;
      if (prescriptionFile) {
        prescriptionUrl = await uploadPrescription(prescriptionFile);
      }

      const order = (await ordersApi.create({
        pharmacy_id: pharmacy!.id,
        items: items.map((i) => ({
          medicine_id: i.medicine.id,
          pharmacy_inventory_id: i.inventory.id,
          quantity: i.quantity,
          price: i.inventory.price,
        })),
        delivery_address: address,
        prescription_url: prescriptionUrl,
        notes: notes || undefined,
      })) as any;

      clear();
      toast.success("Заказ оформлен!", {
        style: { borderRadius: "12px", fontFamily: "Onest, sans-serif" },
      });
      navigate(`/orders/${order.id || order.order?.id}`);
    } catch (e: any) {
      toast.error(e.message || "Ошибка при оформлении");
    } finally {
      setLoading(false);
    }
  }

  if (count() === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Корзина</h2>
        </div>
        <div className="empty-state">
          <svg width="56" height="56" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M16 10a4 4 0 01-8 0"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <h3>Корзина пуста</h3>
          <p>Добавьте лекарства из поиска</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8, width: "auto", padding: "12px 24px" }}
            onClick={() => navigate("/search")}
          >
            Найти лекарства
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Корзина</h2>
        <button
          className="btn btn-ghost"
          style={{ color: "var(--red)", fontSize: 13 }}
          onClick={() => {
            if (confirm("Очистить корзину?")) clear();
          }}
        >
          Очистить
        </button>
      </div>

      <div className={`scroll-area ${styles.content}`}>
        {/* Pharmacy */}
        {pharmacy && (
          <div className={`card ${styles.pharmacyBanner}`}>
            <span>🏥</span>
            <div>
              <p className={styles.pharmName}>{pharmacy.name}</p>
              <p className={styles.pharmAddr}>{pharmacy.address}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.inventory.id} className={`card ${styles.cartItem}`}>
              <div className={styles.itemIcon}>💊</div>
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.medicine.name}</p>
                <p className={styles.itemPrice}>
                  {formatPrice(item.inventory.price)} / шт
                </p>
              </div>
              <div className={styles.quantityControl}>
                <button
                  className={styles.qBtn}
                  onClick={() =>
                    updateQuantity(item.inventory.id, item.quantity - 1)
                  }
                >
                  −
                </button>
                <span className={styles.qty}>{item.quantity}</span>
                <button
                  className={styles.qBtn}
                  onClick={() =>
                    updateQuantity(item.inventory.id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout form */}
        <div className={`card ${styles.form}`}>
          <h3 className={styles.formTitle}>Доставка</h3>

          <div className={styles.field}>
            <label className={styles.label}>Адрес доставки *</label>
            <textarea
              className={`input ${styles.textarea}`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ташкент, ул. Навои, д. 5, кв. 12..."
              rows={2}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Комментарий</label>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Позвоните за 10 минут..."
            />
          </div>

          {needsPrescription && (
            <div className={styles.field}>
              <label className={styles.label}>
                Фото рецепта *
                <span className="badge badge-yellow" style={{ marginLeft: 6 }}>
                  Обязательно
                </span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) =>
                  setPrescriptionFile(e.target.files?.[0] || null)
                }
              />
              <button
                className={`btn btn-outline ${styles.uploadBtn}`}
                onClick={() => fileRef.current?.click()}
              >
                {prescriptionFile ? (
                  <>
                    <span>✅</span> {prescriptionFile.name.slice(0, 25)}...
                  </>
                ) : (
                  <>
                    <Icon name="prescription" size={18} /> Прикрепить рецепт
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className={`card ${styles.summary}`}>
          <div className={styles.summaryRow}>
            <span>Товаров: {count()} шт</span>
            <span className={styles.summaryTotal}>{formatPrice(total())}</span>
          </div>
          <div
            className={styles.summaryRow}
            style={{ color: "var(--gray-500)", fontSize: 12 }}
          >
            <span>Доставка</span>
            <span>Бесплатно</span>
          </div>
        </div>

        <div style={{ paddingBottom: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleOrder}
            disabled={loading}
          >
            {loading ? (
              <span
                className="spinner"
                style={{ width: 18, height: 18, borderTopColor: "white" }}
              />
            ) : (
              `Заказать • ${formatPrice(total())}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
