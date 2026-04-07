import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { pharmaciesApi } from "../lib/api";
import { formatPrice } from "../lib/utils";
import type { Pharmacy, PharmacyInventory, Medicine } from "../types";
import { Icon } from "../components/ui/Icon";
import styles from "./PharmacyDetail.module.css";

type InventoryItem = PharmacyInventory & { medicine: Medicine };

export function PharmacyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    pharmaciesApi
      .getById(id)
      .then((data: any) => {
        setPharmacy(data.pharmacy || data);
        setInventory(data.inventory || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const filtered = inventory.filter(
    (i) =>
      i.medicine?.name?.toLowerCase().includes(search.toLowerCase()) &&
      (i.in_stock || i.quantity > 0),
  );

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
        <span className={styles.headerTitle}>Аптека</span>
        <div style={{ width: 40 }} />
      </div>

      {loading ? (
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      ) : !pharmacy ? (
        <div className="empty-state">
          <h3>Аптека не найдена</h3>
        </div>
      ) : (
        <div className={`scroll-area ${styles.content}`}>
          {/* Hero */}
          <div className={`card ${styles.hero}`}>
            <div className={styles.heroIcon}>
              <Icon name="pharmacy" size={48} />
            </div>
            <h1 className={styles.name}>{pharmacy.name}</h1>
            <p className={styles.address}>{pharmacy.address}</p>
            {pharmacy.working_hours && (
              <p className={styles.hours}>
                🕐{" "}
                {typeof pharmacy.working_hours === "object"
                  ? `Пн-Пт: ${(pharmacy.working_hours as any).mon_fri || ""} / Сб-Вс: ${(pharmacy.working_hours as any).sat_sun || ""}`
                  : pharmacy.working_hours}
              </p>
            )}
            <div className={styles.tags}>
              <span
                className={`badge ${pharmacy.is_active ? "badge-green" : "badge-gray"}`}
              >
                {pharmacy.is_active ? "Открыта" : "Закрыта"}
              </span>
              {pharmacy.phone && (
                <a href={`tel:${pharmacy.phone}`} className={styles.phone}>
                  📞 {pharmacy.phone}
                </a>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Лекарства в наличии
              <span className={styles.count}>{filtered.length}</span>
            </h3>

            <input
              className="input"
              style={{ marginBottom: 10 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ассортименту..."
            />

            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <h3>Ничего не найдено</h3>
              </div>
            ) : (
              <div className={styles.inventoryList}>
                {filtered.map((item) => (
                  <Link
                    key={item.id}
                    to={`/medicine/${item.medicine_id}`}
                    className={`card ${styles.invItem}`}
                  >
                    <div className={styles.invIcon}>
                      <Icon name="pill" size={22} />
                    </div>
                    <div className={styles.invInfo}>
                      <p className={styles.invName}>{item.medicine?.name}</p>
                      {item.medicine?.manufacturer && (
                        <p className={styles.invMfr}>
                          {item.medicine.manufacturer}
                        </p>
                      )}
                    </div>
                    <div className={styles.invRight}>
                      <p className={styles.invPrice}>
                        {formatPrice(item.price)}
                      </p>
                      {item.medicine?.prescription_required && (
                        <span
                          className="badge badge-yellow"
                          style={{ fontSize: 10 }}
                        >
                          Рецепт
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
