# TezDavo Mini App 💊

Telegram Mini App для покупателей аптечного маркетплейса TezDavo (Ташкент).

## Стек

- **React 18** + **Vite** + **TypeScript**
- **@telegram-apps/sdk** — интеграция с Telegram WebApp
- **Supabase** — realtime подписки на статус заказа + хранилище рецептов
- **Zustand** — стейт (авторизация + корзина)
- **react-router-dom v6** — навигация
- **react-hot-toast** — уведомления

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Настроить переменные окружения
cp .env.example .env.local
# Заполни VITE_SUPABASE_ANON_KEY из Supabase Dashboard → Settings → API

# 3. Запустить dev-сервер (HTTPS нужен для Telegram)
npm run dev

# 4. Собрать для продакшна
npm run build
```

## Деплой

### Vercel (рекомендуется)
```bash
npm i -g vercel
vercel --prod
```

### Netlify / GitHub Pages
```bash
npm run build
# Залить папку dist/
```

## Настройка Telegram бота

1. Открой [@BotFather](https://t.me/BotFather)
2. `/newbot` → создай бота
3. `/newapp` → укажи URL задеплоенного Mini App
4. Скопируй токен бота в переменные Next.js бэкенда

## Структура проекта

```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       # Основной layout с нижней навигацией
│   │   └── Layout.module.css
│   └── ui/
│       ├── Splash.tsx       # Экран загрузки
│       └── Splash.module.css
├── hooks/
│   └── useTelegramInit.ts   # Инициализация Telegram WebApp + авторизация
├── lib/
│   ├── api.ts               # Все API вызовы (Next.js + Supabase)
│   └── utils.ts             # Форматирование цен, дат, утилиты
├── pages/
│   ├── Home.tsx             # Главная страница
│   ├── Search.tsx           # Поиск лекарств и аптек
│   ├── Medicine.tsx         # Страница лекарства + цены в аптеках
│   ├── Pharmacies.tsx       # Список аптек (список / карта)
│   ├── PharmacyDetail.tsx   # Страница аптеки + ассортимент
│   ├── Cart.tsx             # Корзина + оформление заказа
│   ├── Orders.tsx           # История заказов
│   ├── OrderDetail.tsx      # Детали заказа + realtime отслеживание
│   ├── Schedule.tsx         # График приёма лекарств
│   └── Profile.tsx          # Профиль пользователя
├── store/
│   └── index.ts             # Zustand: auth store + cart store
├── types/
│   └── index.ts             # TypeScript типы (User, Order, Medicine, ...)
├── App.tsx                  # Роутер
├── main.tsx                 # Точка входа
└── index.css                # Глобальные стили + дизайн-система
```

## Авторизация

Mini App использует `initData` от Telegram для авторизации:

```
Telegram → initData → POST /api/auth/register → Supabase user
```

Бэкенд должен верифицировать `initData` через HMAC-SHA256 с токеном бота.

### Пример верификации на Next.js бэкенде

```typescript
import crypto from 'crypto';

export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  return hash === expectedHash;
}
```

## Realtime отслеживание заказов

Используется Supabase Realtime (postgres_changes) — бесплатно, без дополнительных сервисов:

```typescript
// Подписка на изменения статуса заказа
const channel = supabase
  .channel(`order:${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    setOrder(prev => ({ ...prev, ...payload.new }));
  })
  .subscribe();
```

## Push-уведомления через Telegram бота

Вместо Firebase используем Telegram Bot API (бесплатно):

```typescript
// На бэкенде (Next.js) при смене статуса заказа:
await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: user.telegram_id,  // из таблицы users
    text: `✅ Ваш заказ #${orderId.slice(-6)} подтверждён!\nАптека собирает заказ...`,
    parse_mode: 'HTML',
  }),
});
```

## Карта аптек

Для подключения реальной карты в `src/pages/Pharmacies.tsx`:

```bash
# Вариант 1: Yandex Maps (рекомендуется для Узбекистана)
npm install @yandex/ymaps3-types

# Вариант 2: Leaflet (бесплатно, OpenStreetMap)
npm install react-leaflet leaflet
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_SUPABASE_ANON_KEY` | Anon ключ из Supabase Dashboard |
| `VITE_API_URL` | URL Next.js бэкенда (по умолчанию tez-davo.vercel.app) |
