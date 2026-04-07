import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { medicinesApi, pharmaciesApi } from "../lib/api";
import type { Medicine, Pharmacy } from "../types";
import { Icon } from "../components/ui/Icon";
import styles from "./Search.module.css";

type Tab = "medicines" | "pharmacies";

export function SearchPage() {
  const [tab, setTab] = useState<Tab>("medicines");
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length === 0) {
      loadAll();
      return;
    }
    timerRef.current = setTimeout(() => {
      if (tab === "medicines") searchMedicines(query);
      else searchPharmacies(query);
    }, 300);
  }, [query, tab]);

  async function loadAll() {
    setLoading(true);
    const [meds, pharms] = await Promise.all([
      medicinesApi.search().catch(() => []),
      pharmaciesApi.list().catch(() => []),
    ]);
    setMedicines(meds as Medicine[]);
    setPharmacies(pharms as Pharmacy[]);
    setLoading(false);
  }

  async function searchMedicines(q: string) {
    setLoading(true);
    const res = await medicinesApi.search(q).catch(() => []);
    setMedicines(res as Medicine[]);
    setLoading(false);
  }

  async function searchPharmacies(q: string) {
    setLoading(true);
    const all = (await pharmaciesApi.list().catch(() => [])) as Pharmacy[];
    const filtered = all.filter(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.address.toLowerCase().includes(q.toLowerCase()),
    );
    setPharmacies(filtered);
    setLoading(false);
  }

  const displayList = tab === "medicines" ? medicines : pharmacies;

  return (
    <div className={styles.page}>
      {/* Search input */}
      <div className={styles.inputWrap}>
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          className={styles.searchIcon}
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16.5 16.5L21 21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "medicines"
              ? "Название, производитель..."
              : "Название аптеки, адрес..."
          }
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery("")}>
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "medicines" ? styles.activeTab : ""}`}
          onClick={() => setTab("medicines")}
        >
          💊 Лекарства
        </button>
        <button
          className={`${styles.tab} ${tab === "pharmacies" ? styles.activeTab : ""}`}
          onClick={() => setTab("pharmacies")}
        >
          🏥 Аптеки
        </button>
      </div>

      {/* Results */}
      <div className={`scroll-area ${styles.results}`}>
        {loading ? (
          <div className={styles.skeletonList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skeletonItem}`} />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте другой запрос</p>
          </div>
        ) : tab === "medicines" ? (
          <div className={styles.list}>
            {(medicines as Medicine[]).map((med) => (
              <Link
                key={med.id}
                to={`/medicine/${med.id}`}
                className={`card ${styles.item} fade-in`}
              >
                <div className={styles.itemIcon}>
                  <Icon name="pill" size={24} />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{med.name}</p>
                  {med.manufacturer && (
                    <p className={styles.itemSub}>{med.manufacturer}</p>
                  )}
                </div>
                {med.requires_prescription && (
                  <span className="badge badge-yellow">Рецепт</span>
                )}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="var(--gray-400)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.list}>
            {(pharmacies as Pharmacy[]).map((ph) => (
              <Link
                key={ph.id}
                to={`/pharmacy/${ph.id}`}
                className={`card ${styles.item} fade-in`}
              >
                <div className={styles.itemIcon}>
                  <Icon name="pharmacy" size={24} />
                </div>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{ph.name}</p>
                  <p className={styles.itemSub}>{ph.address}</p>
                </div>
                <span
                  className={`badge ${ph.is_active ? "badge-green" : "badge-gray"}`}
                >
                  {ph.is_active ? "Открыта" : "Закрыта"}
                </span>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="var(--gray-400)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
