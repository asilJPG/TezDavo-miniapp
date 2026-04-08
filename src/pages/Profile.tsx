import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { authApi } from "../lib/api";
import { formatPhone } from "../lib/utils";
import { Icon } from "../components/ui/Icon";
import toast from "react-hot-toast";
import styles from "./Profile.module.css";

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = (await authApi.updateProfile(form)) as any;
      setUser(updated.user || updated);
      setEditing(false);
      toast.success("Профиль обновлён", {
        style: { borderRadius: "12px", fontFamily: "Onest" },
      });
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  const menuItems = [
    {
      icon: <Icon name="ready" size={24} />,
      label: "Мои заказы",
      path: "/orders",
    },
    {
      icon: <Icon name="pharmacy" size={24} />,
      label: "Аптеки",
      path: "/pharmacies",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Профиль</h2>
      </div>

      <div className={`scroll-area ${styles.content}`}>
        <div className={`card ${styles.profileCard}`}>
          <div className={styles.avatar}>{user?.first_name?.[0] || "?"}</div>
          {!editing ? (
            <>
              <h3 className={styles.name}>
                {user?.first_name} {user?.last_name}
              </h3>
              {user?.phone && (
                <p className={styles.phone}>{formatPhone(user.phone)}</p>
              )}
              <p className={styles.tgId}>Telegram ID: {user?.telegram_id}</p>
              <button
                className="btn btn-outline"
                style={{ marginTop: 12, padding: "10px 24px", width: "auto" }}
                onClick={() => setEditing(true)}
              >
                Редактировать
              </button>
            </>
          ) : (
            <div className={styles.editForm}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Имя</label>
                  <input
                    className="input"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Фамилия</label>
                  <input
                    className="input"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Телефон</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className={styles.editBtns}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setEditing(false)}
                >
                  Отмена
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
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
          )}
        </div>

        <div className={`card ${styles.menu}`}>
          {menuItems.map((item, i) => (
            <button
              key={item.path}
              className={styles.menuItem}
              onClick={() => navigate(item.path)}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              <span className={styles.menuLabel}>{item.label}</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="var(--gray-400)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {i < menuItems.length - 1 && (
                <hr
                  className="divider"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 54,
                    right: 0,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <div className={`card ${styles.infoCard}`}>
          <div className={styles.infoRow}>
            <span>Версия</span>
            <span className={styles.infoVal}>1.0.0</span>
          </div>
          <hr className="divider" />
          <div className={styles.infoRow}>
            <span>TezDavo</span>
            <span className={styles.infoVal}>Ташкент, Узбекистан</span>
          </div>
        </div>

        <p className={styles.footerNote}>
          Доставка лекарств по Ташкенту 24/7.
          <br />
          Работаем с проверенными аптеками.
        </p>
      </div>
    </div>
  );
}
