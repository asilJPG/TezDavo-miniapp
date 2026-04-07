import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { scheduleApi } from '../lib/api';
import type { MedicationSchedule } from '../types';
import styles from './Schedule.module.css';
import toast from 'react-hot-toast';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function SchedulePage() {
  const user = useAuthStore((s) => s.user);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    medicine_name: '',
    dosage: '',
    times: '08:00',
    start_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    const { data } = await scheduleApi.list(user.id);
    setSchedules((data || []) as MedicationSchedule[]);
    setLoading(false);
  }

  async function handleAdd() {
    if (!user) return;
    if (!form.medicine_name || !form.dosage) {
      toast.error('Заполните все поля');
      return;
    }
    const { error } = await scheduleApi.create({
      user_id: user.id,
      medicine_name: form.medicine_name,
      dosage: form.dosage,
      times: form.times.split(',').map((t) => t.trim()),
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      start_date: form.start_date,
      notes: form.notes || null,
      is_active: true,
    });

    if (error) { toast.error('Ошибка при добавлении'); return; }
    toast.success('Добавлено!', { style: { borderRadius: '12px', fontFamily: 'Onest' } });
    setShowAdd(false);
    setForm({ medicine_name: '', dosage: '', times: '08:00', start_date: new Date().toISOString().slice(0, 10), notes: '' });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить из расписания?')) return;
    await scheduleApi.delete(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success('Удалено');
  }

  async function markTaken(schedule: MedicationSchedule, time: string) {
    await scheduleApi.logTaken({
      schedule_id: schedule.id,
      scheduled_time: time,
      was_taken: true,
    });
    toast.success('Отмечено ✓', { style: { borderRadius: '12px', fontFamily: 'Onest' } });
  }

  const now = new Date();
  const todayDay = now.getDay() || 7; // 1=Mon

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>График приёма</h2>
          <p className={styles.subtitle}>
            {now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Добавить</button>
      </div>

      <div className={`scroll-area ${styles.content}`}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skel}`} />
          ))
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>💊</span>
            <h3>Расписание пустое</h3>
            <p>Добавьте лекарства для напоминаний</p>
          </div>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className={`card ${styles.scheduleCard} fade-in`}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.medName}>{s.medicine_name}</p>
                  <p className={styles.dosage}>{s.dosage}</p>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>✕</button>
              </div>

              {/* Days */}
              <div className={styles.days}>
                {DAYS.map((day, idx) => (
                  <span
                    key={day}
                    className={`${styles.day} ${s.days_of_week.includes(idx + 1) ? styles.activeDay : ''} ${idx + 1 === todayDay ? styles.todayDay : ''}`}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Times */}
              <div className={styles.times}>
                {s.times.map((time) => (
                  <button key={time} className={styles.timeBtn} onClick={() => markTaken(s, time)}>
                    ⏰ {time}
                  </button>
                ))}
              </div>

              {s.notes && <p className={styles.notes}>💬 {s.notes}</p>}
            </div>
          ))
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Добавить лекарство</h3>
              <button className="btn btn-icon" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.label}>Название лекарства *</label>
                <input className="input" value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} placeholder="Парацетамол, Аспирин..." />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Дозировка *</label>
                <input className="input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="1 таблетка, 5 мл..." />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Время приёма (через запятую)</label>
                <input className="input" value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} placeholder="08:00, 14:00, 20:00" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Дата начала</label>
                <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Заметка</label>
                <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="До еды, после еды..." />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className="btn btn-primary" onClick={handleAdd}>Добавить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
