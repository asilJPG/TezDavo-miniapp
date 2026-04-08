import { useEffect, useRef, useState } from "react";
import styles from "./MapPicker.module.css";

interface MapPickerProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export function MapPicker({ onSelect, onClose }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [lat, setLat] = useState(41.2995);
  const [lng, setLng] = useState(69.2401);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  function loadGoogleMaps() {
    if (window.google?.maps) {
      initMap();
      return;
    }

    window.initGoogleMaps = () => initMap();

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&callback=initGoogleMaps&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  function initMap() {
    if (!mapRef.current) return;

    // Центр — Ташкент
    const center = { lat: 41.2995, lng: 69.2401 };

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });

    mapInstanceRef.current = map;

    // Маркер
    const marker = new window.google.maps.Marker({
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = marker;

    // Попробуем получить геолокацию
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          map.setCenter(userPos);
          map.setZoom(16);
          marker.setPosition(userPos);
          setLat(userPos.lat);
          setLng(userPos.lng);
          reverseGeocode(userPos.lat, userPos.lng);
        },
        () => {
          // Геолокация недоступна — используем центр Ташкента
          marker.setPosition(center);
          reverseGeocode(center.lat, center.lng);
        },
      );
    } else {
      marker.setPosition(center);
      reverseGeocode(center.lat, center.lng);
    }

    // Клик по карте
    map.addListener("click", (e: any) => {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      marker.setPosition(e.latLng);
      setLat(clickedLat);
      setLng(clickedLng);
      reverseGeocode(clickedLat, clickedLng);
    });

    // Перетаскивание маркера
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      const newLat = pos.lat();
      const newLng = pos.lng();
      setLat(newLat);
      setLng(newLng);
      reverseGeocode(newLat, newLng);
    });

    setLoading(false);
  }

  function reverseGeocode(lat: number, lng: number) {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          setAddress(results[0].formatted_address);
        }
      },
    );
  }

  function handleConfirm() {
    if (address) {
      onSelect(address, lat, lng);
      onClose();
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Выберите адрес доставки</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.mapWrap}>
          {loading && (
            <div className={styles.mapLoading}>
              <div className="spinner" />
              <p>Загрузка карты...</p>
            </div>
          )}
          <div ref={mapRef} className={styles.map} />
        </div>

        <div className={styles.footer}>
          <div className={styles.addressWrap}>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0, color: "var(--blue)" }}
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="9"
                r="2.5"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <p className={styles.address}>
              {address || "Нажмите на карту чтобы выбрать адрес"}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!address}
          >
            Подтвердить адрес
          </button>
        </div>
      </div>
    </div>
  );
}
