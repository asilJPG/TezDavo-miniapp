import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { pharmaciesApi } from "../lib/api";
import type { Pharmacy } from "../types";
import { Icon } from "../components/ui/Icon";
import styles from "./Pharmacies.module.css";

export function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    pharmaciesApi
      .list()
      .then((data) => setPharmacies(data as Pharmacy[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Аптеки</h2>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${view === "list" ? styles.active : ""}`}
            onClick={() => setView("list")}
          >
            Список
          </button>
          <button
            className={`${styles.toggleBtn} ${view === "map" ? styles.active : ""}`}
            onClick={() => setView("map")}
          >
            Карта
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className={styles.mapPlaceholder}>
          <div className={styles.mapInner}>
            <span style={{ fontSize: 48 }}>🗺️</span>
            <h3>Карта аптек</h3>
            <p>
              Подключите Yandex Maps или Google Maps API для отображения карты
            </p>
            <p style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 4 }}>
              Координаты хранятся в полях pharmacy.latitude / pharmacy.longitude
            </p>
          </div>
          {/* Pins overlay */}
          <div className={styles.pins}>
            {pharmacies
              .filter((p) => p.latitude)
              .map((p) => (
                <Link
                  key={p.id}
                  to={`/pharmacy/${p.id}`}
                  className={styles.pin}
                >
                  🏥 {p.name}
                </Link>
              ))}
          </div>
        </div>
      ) : (
        <div className={`scroll-area ${styles.content}`}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skel}`} />
            ))
          ) : pharmacies.length === 0 ? (
            <div className="empty-state">
              <h3>Аптеки не найдены</h3>
            </div>
          ) : (
            pharmacies.map((ph) => (
              <Link
                key={ph.id}
                to={`/pharmacy/${ph.id}`}
                className={`card ${styles.card} fade-in`}
              >
                <div className={styles.logo}>
                  <Icon name="pharmacy" size={28} />
                </div>
                <div className={styles.info}>
                  <p className={styles.name}>{ph.name}</p>
                  <p className={styles.address}>{ph.address}</p>
                  {ph.working_hours && (
                    <p className={styles.hours}>
                      {typeof ph.working_hours === "object"
                        ? `Пн-Пт: ${(ph.working_hours as any).mon_fri || ""} / Сб-Вс: ${(ph.working_hours as any).sat_sun || ""}`
                        : ph.working_hours}
                    </p>
                  )}
                </div>
                <div className={styles.right}>
                  <span
                    className={`badge ${ph.is_active ? "badge-green" : "badge-gray"}`}
                  >
                    {ph.is_active ? "Открыта" : "Закрыта"}
                  </span>
                  {ph.rating && (
                    <p className={styles.rating}>⭐ {ph.rating.toFixed(1)}</p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
