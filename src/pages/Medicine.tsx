import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medicinesApi } from '../lib/api';
import { useCartStore } from '../store';
import { formatPrice } from '../lib/utils';
import type { MedicineWithPrices, PharmacyInventory, Pharmacy } from '../types';
import styles from './Medicine.module.css';
import toast from 'react-hot-toast';

type Inventory = PharmacyInventory & { pharmacy: Pharmacy };

export function MedicinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<MedicineWithPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, items, pharmacyId } = useCartStore();

  useEffect(() => {
    if (!id) return;
    medicinesApi.getById(id).then((data) => {
      setMedicine(data as MedicineWithPrices);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  function handleAddToCart(inv: Inventory) {
    const cartPharmacy = pharmacyId();
    if (cartPharmacy && cartPharmacy !== inv.pharmacy_id) {
      const ok = confirm('В корзине есть товары из другой аптеки. Очистить корзину?');
      if (!ok) return;
      useCartStore.getState().clear();
    }
    if (!medicine) return;
    addItem(medicine, inv);
    toast.success(`${medicine.name} добавлен в корзину`, {
      style: { borderRadius: '12px', fontFamily: 'Onest, sans-serif' },
    });
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
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
          <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
        </div>
        <div className="empty-state"><h3>Лекарство не найдено</h3></div>
      </div>
    );
  }

  const inventory: Inventory[] = (medicine.inventory || []).filter((i) => i.in_stock);
  const minPrice = inventory.length > 0 ? Math.min(...inventory.map((i) => i.price)) : null;

  return (
    <div className={styles.page}>
      {/* Back button */}
      <div className={styles.header}>
        <button className="btn btn-icon" onClick={() => navigate(-1)}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className={styles.headerTitle}>Лекарство</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={`scroll-area ${styles.content}`}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>💊</div>
          <h1 className={styles.name}>{medicine.name}</h1>
          {medicine.manufacturer && (
            <p className={styles.manufacturer}>{medicine.manufacturer}</p>
          )}
          <div className={styles.tags}>
            {medicine.category && (
              <span className="badge badge-blue">{medicine.category}</span>
            )}
            {medicine.prescription_required && (
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

        {/* Availability */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Наличие в аптеках
            <span className={styles.count}>{inventory.length}</span>
          </h3>

          {inventory.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <h3>Нет в наличии</h3>
              <p>Лекарство временно отсутствует</p>
            </div>
          ) : (
            <div className={styles.pharmacyList}>
              {inventory.map((inv) => (
                <div key={inv.id} className={`card ${styles.pharmacyRow}`}>
                  <div className={styles.pharmInfo}>
                    <p className={styles.pharmName}>{inv.pharmacy?.name}</p>
                    <p className={styles.pharmAddress}>{inv.pharmacy?.address}</p>
                  </div>
                  <div className={styles.pharmRight}>
                    <p className={styles.pharmPrice}>{formatPrice(inv.price)}</p>
                    <button
                      className={`btn ${styles.addBtn}`}
                      onClick={() => handleAddToCart(inv)}
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
