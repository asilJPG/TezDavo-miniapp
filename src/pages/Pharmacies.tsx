import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { pharmaciesApi } from "../lib/api";
import { Icon } from "../components/ui/Icon";
import type { Pharmacy } from "../types";
import styles from "./Pharmacies.module.css";

declare const google: any;

function formatHours(wh: any): string {
  if (!wh) return "";
  if (typeof wh === "object")
    return `Пн-Пт: ${wh.mon_fri || ""} / Сб-Вс: ${wh.sat_sun || ""}`;
  return wh;
}

export function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    pharmaciesApi
      .list()
      .then((data) => setPharmacies(data as Pharmacy[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === "map" && pharmacies.length > 0) {
      initMap();
    }
  }, [view, pharmacies]);

  function loadGoogleMaps(callback: () => void) {
    if ((window as any).google?.maps) {
      callback();
      return;
    }
    (window as any).initPharmacyMap = callback;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&callback=initPharmacyMap`;
    script.async = true;
    document.head.appendChild(script);
  }

  function initMap() {
    if (!mapRef.current) return;
    loadGoogleMaps(() => {
      if (!mapRef.current) return;
      const center = { lat: 41.2995, lng: 69.2401 };
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapInstanceRef.current = map;

      pharmacies.forEach((ph: any) => {
        if (!ph.lat || !ph.lng) return;
        const marker = new google.maps.Marker({
          position: { lat: ph.lat, lng: ph.lng },
          map,
          title: ph.name,
          icon: {
            url: "/icons/pharmacy.png",
            scaledSize: new google.maps.Size(36, 36),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding:8px;font-family:sans-serif;min-width:160px">
              <p style="font-weight:700;margin:0 0 4px">${ph.name}</p>
              <p style="font-size:12px;color:#666;margin:0 0 8px">${ph.address}</p>
              <a href="/pharmacy/${ph.id}" style="color:#2563EB;font-size:13px;font-weight:600">Открыть →</a>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });
    });
  }

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
        <div className={styles.mapWrap}>
          <div ref={mapRef} className={styles.map} />
          {/* Список аптек поверх карты */}
          <div className={styles.mapList}>
            {pharmacies.map((ph: any) => (
              <Link
                key={ph.id}
                to={`/pharmacy/${ph.id}`}
                className={styles.mapCard}
              >
                <Icon name="pharmacy" size={20} />
                <div>
                  <p className={styles.mapCardName}>{ph.name}</p>
                  <p className={styles.mapCardAddr}>{ph.address}</p>
                </div>
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
            pharmacies.map((ph: any) => (
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
                      {formatHours(ph.working_hours)}
                    </p>
                  )}
                </div>
                <div className={styles.right}>
                  <span
                    className={`badge ${ph.is_active || ph.is_verified ? "badge-green" : "badge-gray"}`}
                  >
                    {ph.is_active || ph.is_verified ? "Открыта" : "Закрыта"}
                  </span>
                  {ph.rating && ph.rating > 0 && (
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
