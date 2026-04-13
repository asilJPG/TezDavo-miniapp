import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, useCacheStore } from "../store";
import { medicinesApi, pharmaciesApi } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { Icon } from "../components/ui/Icon";
import type { Medicine, Pharmacy } from "../types";
import styles from "./Home.module.css";

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const {
    medicines: cachedMeds,
    pharmacies: cachedPharms,
    setMedicines,
    setPharmacies,
  } = useCacheStore();
  const [loading, setLoading] = useState(cachedMeds.length === 0);

  useEffect(() => {
    if (cachedMeds.length > 0 && cachedPharms.length > 0) return;

    Promise.all([
      medicinesApi.search().catch(() => []),
      pharmaciesApi.list().catch(() => []),
    ]).then(([meds, pharms]) => {
      setMedicines((meds as Medicine[]).slice(0, 8));
      setPharmacies((pharms as Pharmacy[]).slice(0, 5));
      setLoading(false);
    });
  }, [cachedMeds.length]);

  const medicines = cachedMeds as Medicine[];
  const pharmacies = cachedPharms as Pharmacy[];

  return (
    <div className="scroll-area" style={{ flex: 1 }}>
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>
            Привет, {user?.first_name || "Гость"} 👋
          </p>
          <h1 className={styles.title}>
            Найдите нужные
            <br />
            лекарства
          </h1>
        </div>
        <Link to="/profile" className={styles.avatar}>
          {user?.first_name?.[0] || "?"}
        </Link>
      </div>

      <div className={styles.searchBar} onClick={() => navigate("/search")}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16.5 16.5L21 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Поиск лекарств или аптек...</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{pharmacies.length}+</span>
          <span className={styles.statLabel}>Аптек</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNum}>30 мин</span>
          <span className={styles.statLabel}>Доставка</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNum}>24/7</span>
          <span className={styles.statLabel}>Работаем</span>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title">Популярные лекарства</h2>
          <Link to="/search" className={styles.seeAll}>
            Все
          </Link>
        </div>

        {loading ? (
          <div className={styles.medicineGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`skeleton ${styles.medicineCardSkeleton}`}
              />
            ))}
          </div>
        ) : (
          <div className={styles.medicineGrid}>
            {medicines.map((med) => (
              <Link
                key={med.id}
                to={`/medicine/${med.id}`}
                className={`card ${styles.medicineCard} fade-in`}
              >
                <Icon name="pill" size={36} />
                <p className={styles.medicineName}>{med.name}</p>
                {med.requires_prescription && (
                  <span className="badge badge-yellow" style={{ fontSize: 10 }}>
                    Рецепт
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section} style={{ paddingBottom: 24 }}>
        <div className={styles.sectionHeader}>
          <h2 className="section-title">Ближайшие аптеки</h2>
          <Link to="/pharmacies" className={styles.seeAll}>
            Карта
          </Link>
        </div>

        <div className={styles.pharmacyList}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`skeleton ${styles.pharmacyCardSkeleton}`}
                />
              ))
            : pharmacies.map((ph) => (
                <Link
                  key={ph.id}
                  to={`/pharmacy/${ph.id}`}
                  className={`card ${styles.pharmacyCard} fade-in`}
                >
                  <div className={styles.pharmacyLogo}>
                    {ph.logo_url ? (
                      <img src={ph.logo_url} alt={ph.name} />
                    ) : (
                      <Icon name="pharmacy" size={28} />
                    )}
                  </div>
                  <div className={styles.pharmacyInfo}>
                    <p className={styles.pharmacyName}>{ph.name}</p>
                    <p className={styles.pharmacyAddress}>{ph.address}</p>
                    {ph.working_hours && (
                      <p className={styles.pharmacyHours}>
                        {typeof ph.working_hours === "object"
                          ? `Пн-Пт: ${(ph.working_hours as any).mon_fri} / Сб-Вс: ${(ph.working_hours as any).sat_sun}`
                          : ph.working_hours}
                      </p>
                    )}
                  </div>
                  <span
                    className={`badge ${ph.is_active || ph.is_verified ? "badge-green" : "badge-gray"}`}
                  >
                    {ph.is_active || ph.is_verified ? "Открыта" : "Закрыта"}
                  </span>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}
