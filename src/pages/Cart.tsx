import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore, useAuthStore } from "../store";
import { ordersApi, uploadPrescription } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { MapPicker } from "../components/ui/MapPicker";
import { Icon } from "../components/ui/Icon";
import toast from "react-hot-toast";
import styles from "./Cart.module.css";

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clear, total, count } =
    useCartStore();
  const user = useAuthStore((s) => s.user);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geoPrompt, setGeoPrompt] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsPrescription = items.some((i) => i.medicine.requires_prescription);
  const pharmacy = items[0]?.inventory.pharmacy;

  // При открытии корзины — определяем геолокацию
  useEffect(() => {
    if (!navigator.geolocation || address) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Геокодируем координаты в адрес
        fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&language=ru`,
        )
          .then((r) => r.json())
          .then((data) => {
            const results = data.results || [];
            // Ищем нормальный адрес — street_address или route, не plus_code
            const best =
              results.find(
                (r: any) =>
                  r.types.includes("street_address") ||
                  r.types.includes("premise") ||
                  r.types.includes("subpremise"),
              ) ||
              results.find((r: any) => !r.types.includes("plus_code")) ||
              results[0];

            const addr = best?.formatted_address;
            if (addr) {
              setGeoPrompt({ address: addr, lat: latitude, lng: longitude });
            }
          })
          .catch(() => {});
      },
      () => {}, // геолокация недоступна — молча игнорируем
    );
  }, []);

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

      const res = (await ordersApi.create({
        pharmacy_id: pharmacy!.id,
        items: items.map((i) => ({
          medicine_id: i.medicine.id,
          pharmacy_inventory_id: i.inventory.id,
          quantity: i.quantity,
          price: i.inventory.price,
        })),
        delivery_address: address,
        delivery_lat: lat,
        delivery_lng: lng,
        prescription_url: prescriptionUrl,
        notes: notes || undefined,
      })) as any;

      const orderId = res?.order?.id || res?.id;
      clear();
      toast.success("Заказ оформлен!", {
        style: { borderRadius: "12px", fontFamily: "Onest, sans-serif" },
      });
      if (orderId) {
        navigate(`/orders/${orderId}`);
      } else {
        navigate("/orders");
      }
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
          <Icon name="ready" size={56} />
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
            <Icon name="pharmacy" size={24} />
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
              <div className={styles.itemIcon}>
                <Icon name="pill" size={24} />
              </div>
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
            <div className={styles.addressRow}>
              <textarea
                className={`input ${styles.textarea}`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ташкент, ул. Навои, д. 5, кв. 12..."
                rows={2}
              />
              <button
                className={styles.mapBtn}
                onClick={() => setShowMap(true)}
                type="button"
              >
                <Icon name="map" size={22} />
              </button>
            </div>
            {lat && lng && (
              <p className={styles.coordsHint}>
                📍 Координаты выбраны на карте
              </p>
            )}
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
                    <Icon name="confirmed" size={18} />{" "}
                    {prescriptionFile.name.slice(0, 20)}...
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

      {/* Map picker modal */}
      {showMap && (
        <MapPicker
          onSelect={(addr: string, lt: number, ln: number) => {
            setAddress(addr);
            setLat(lt);
            setLng(ln);
          }}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* Geo prompt */}
      {geoPrompt && !address && (
        <div className={styles.geoOverlay}>
          <div className={styles.geoModal}>
            <p className={styles.geoTitle}>📍 Доставить сюда?</p>
            <p className={styles.geoAddress}>{geoPrompt.address}</p>
            <div className={styles.geoBtns}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setGeoPrompt(null)}
              >
                Нет
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                onClick={() => {
                  setAddress(geoPrompt.address);
                  setLat(geoPrompt.lat);
                  setLng(geoPrompt.lng);
                  setGeoPrompt(null);
                }}
              >
                Да, доставить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
