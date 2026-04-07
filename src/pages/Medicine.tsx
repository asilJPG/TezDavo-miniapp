import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { medicinesApi } from "../lib/api";
import { useCartStore } from "../store";
import { formatPrice } from "../lib/utils";
import type { Medicine, Pharmacy } from "../types";
import { Icon } from "../components/ui/Icon";
import styles from "./Medicine.module.css";
import toast from "react-hot-toast";

interface PriceItem {
  id: string;
  price: number;
  quantity: number;
  requires_prescription: boolean;
  pharmacy: Pharmacy;
}

export function MedicinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, pharmacyId } = useCartStore();

  useEffect(() => {
    if (!id) return;
    medicinesApi
      .getById(id)
      .then((data: any) => {
        // Бэкенд: { medicine: {}, prices: [] }
        setMedicine(data.medicine || data);
        setPrices(data.prices || data.inventory || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function handleAddToCart(priceItem: PriceItem) {
    if (!medicine) return;

    const cartPharmacy = pharmacyId();
    if (cartPharmacy && cartPharmacy !== priceItem.pharmacy.id) {
      const ok = confirm(
        "В корзине есть товары из другой аптеки. Очистить корзину?",
      );
      if (!ok) return;
      useCartStore.getState().clear();
    }

    // Адаптируем PriceItem под PharmacyInventory
    const inventory = {
      id: priceItem.id,
      pharmacy_id: priceItem.pharmacy.id,
      medicine_id: medicine.id,
      price: priceItem.price,
      quantity: priceItem.quantity,
      in_stock: priceItem.quantity > 0,
      pharmacy: priceItem.pharmacy,
    };

    addItem(medicine, inventory as any);
    toast.success(`${medicine.name} добавлен в корзину`, {
      style: { borderRadius: "12px", fontFamily: "Onest, sans-serif" },
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className="btn btn-icon" onClick={() => navigate(-1)}>
            ←
          </button>
        </div>
        <div className={styles.skeletonWrap}>
          <div className={`skeleton ${styles.skTop}`} />
          <div className={`skeleton ${styles.skMid}`} />
          <div className={`skeleton ${styles.skBottom}`} />
        </div>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className="btn btn-icon" onClick={() => navigate(-1)}>
            ←
          </button>
        </div>
        <div className="empty-state">
          <h3>Лекарство не найдено</h3>
        </div>
      </div>
    );
  }

  const available = prices.filter((p) => p.quantity > 0);
  const minPrice =
    available.length > 0 ? Math.min(...available.map((p) => p.price)) : null;

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
        <span className={styles.headerTitle}>Лекарство</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={`scroll-area ${styles.content}`}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Icon name="pill" size={56} />
          </div>
          <h1 className={styles.name}>{medicine.name}</h1>
          {medicine.manufacturer && (
            <p className={styles.manufacturer}>{medicine.manufacturer}</p>
          )}
          {medicine.dosage_strength && (
            <p className={styles.manufacturer}>
              {medicine.dosage_strength} мг · {medicine.dosage_form}
            </p>
          )}
          <div className={styles.tags}>
            {medicine.category && (
              <span className="badge badge-blue">{medicine.category}</span>
            )}
            {medicine.requires_prescription && (
              <span className="badge badge-yellow">Требуется рецепт</span>
            )}
          </div>
          {minPrice && (
            <p className={styles.priceFrom}>от {formatPrice(minPrice)}</p>
          )}
        </div>

        {/* Description */}
        {medicine.description && (
          <div className={`card ${styles.section}`}>
            <h3 className={styles.sectionTitle}>О препарате</h3>
            <p className={styles.description}>{medicine.description}</p>
          </div>
        )}

        {/* Prices */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Наличие в аптеках
            <span className={styles.count}>{available.length}</span>
          </h3>

          {available.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <h3>Нет в наличии</h3>
            </div>
          ) : (
            <div className={styles.pharmacyList}>
              {available.map((item) => (
                <div key={item.id} className={`card ${styles.pharmacyRow}`}>
                  <div className={styles.pharmInfo}>
                    <p className={styles.pharmName}>{item.pharmacy?.name}</p>
                    <p className={styles.pharmAddress}>
                      {item.pharmacy?.address}
                    </p>
                  </div>
                  <div className={styles.pharmRight}>
                    <p className={styles.pharmPrice}>
                      {formatPrice(item.price)}
                    </p>
                    <button
                      className={`btn ${styles.addBtn}`}
                      onClick={() => handleAddToCart(item)}
                    >
                      + В корзину
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
