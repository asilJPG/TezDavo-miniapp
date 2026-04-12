import { useState } from "react";
import { authApi } from "../../lib/api";
import { useAuthStore } from "../../store";
import toast from "react-hot-toast";
import styles from "./PhoneRequest.module.css";

export function PhoneRequest() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  function requestPhone() {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    setLoading(true);
    tg.requestContact((success: boolean, contact: any) => {
      if (success && contact?.phoneNumber) {
        const phone = contact.phoneNumber;
        authApi
          .updateProfile({ phone } as any)
          .then(() => {
            setUser({ ...user!, phone });
            toast.success("Телефон сохранён!", {
              style: { borderRadius: "12px", fontFamily: "Onest" },
            });
          })
          .catch(() => toast.error("Не удалось сохранить"))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }

  if (user?.phone) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.text}>
        <p className={styles.title}>Добавьте номер телефона</p>
        <p className={styles.sub}>Для связи при доставке заказа</p>
      </div>
      <button className={styles.btn} onClick={requestPhone} disabled={loading}>
        {loading ? (
          <span
            className="spinner"
            style={{ width: 16, height: 16, borderTopColor: "white" }}
          />
        ) : (
          "📱 Добавить"
        )}
      </button>
    </div>
  );
}
