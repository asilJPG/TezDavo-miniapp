import { useState } from "react";
import { authApi } from "../../lib/api";
import { useAuthStore } from "../../store";
import toast from "react-hot-toast";
import styles from "./PhoneRequest.module.css";

export function PhoneRequest() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(false);
  const [phone, setPhone] = useState("");

  async function savePhone(phoneNumber: string) {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 9) {
      toast.error("Введите правильный номер");
      return;
    }
    const formatted = cleaned.startsWith("998")
      ? `+${cleaned}`
      : `+998${cleaned}`;
    setLoading(true);
    try {
      await authApi.updateProfile({ phone: formatted });
      setUser({ ...user!, phone: formatted });
      toast.success("Телефон сохранён!", {
        style: { borderRadius: "12px", fontFamily: "Onest" },
      });
    } catch {
      toast.error("Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  }

  function requestViaТelegram() {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      setManual(true);
      return;
    }

    // Показываем кнопку запроса контакта через Telegram MainButton
    tg.MainButton.setText("Поделиться номером");
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      tg.MainButton.hide();
      setManual(true);
    });
    setManual(true);
  }

  if (user?.phone) return null;

  if (manual) {
    return (
      <div className={styles.banner}>
        <p className={styles.title}>Номер телефона</p>
        <div className={styles.inputRow}>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            type="tel"
          />
          <button
            className={styles.btn}
            onClick={() => savePhone(phone)}
            disabled={loading}
          >
            {loading ? (
              <span
                className="spinner"
                style={{ width: 16, height: 16, borderTopColor: "white" }}
              />
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.text}>
        <p className={styles.title}>Добавьте номер телефона</p>
        <p className={styles.sub}>Для связи при доставке заказа</p>
      </div>
      <button className={styles.btn} onClick={requestViaТelegram}>
        📱 Добавить
      </button>
    </div>
  );
}
