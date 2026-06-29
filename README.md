# TryVice — SaaS платформа виртуальной примерки

ТрайВайс позволяет интернет-магазинам внедрить виджет AI-примерки одежды. Проект построен на Next.js 14, Supabase и NanoBanana API.

## 🚀 Быстрый старт (Локально)

### 1. Требования
- Node.js 18.x или выше
- Аккаунт в Supabase
- API ключ NanoBanana (через kodikrouter.ru)

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка окружения
Создайте файл `.env.local` в корне проекта и заполните его:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NanoBanana (KodikRouter)
NANOBANANA_API_KEY=your-api-key
NANOBANANA_API_URL=https://kodikrouter.ru/api/v1

# CloudPayments
CLOUDPAYMENTS_PUBLIC_ID=your-public-id
CLOUDPAYMENTS_API_SECRET=your-secret-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Подготовка базы данных
Выполните SQL-миграции из папки `/supabase/migrations` в SQL Editor вашего проекта Supabase в следующем порядке:
1. `20240628000000_init.sql` — Базовая схема
2. `20240628000001_functions.sql` — RPC функции для баланса
3. `20240628000002_superadmin.sql` — Настройки супер-админа
4. `20240628000003_storage.sql` — Настройка бакетов

### 5. Запуск
```bash
npm run dev
```
Приложение будет доступно по адресу `http://localhost:3000`.

---

## 🌐 Развертывание (Production)

### Хостинг (Timeweb Cloud / Vercel)
1. Подключите ваш репозиторий к платформе.
2. Укажите переменные окружения из `.env.local` в панели управления хостингом.
3. Команда сборки: `npm run build`.
4. Команда запуска: `npm run start`.

### Настройка Storage
В Supabase Storage убедитесь, что созданы бакеты:
- `user-photos` (приватный)
- `generated-results` (публичный)

### Настройка Cron (Парсинг фидов)
Для автоматического обновления товаров настройте вызов эндпоинта раз в 6 часов:
`POST https://your-domain.com/api/admin/products/sync` с телом `{ "shop_id": "UUID" }`.

### Интеграция виджета на сайт клиента
```html
<script 
  src="https://your-domain.com/widget.js" 
  data-shop-id="YOUR_SHOP_UUID" 
  data-product-id="PRODUCT_ID"
  data-button-selector=".my-custom-button-class"
></script>
```

## 🛠 Технологии
- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase
- **AI Models:** Gemini 3.1 Flash (Try-On), Gemini 2.0 Flash (Analysis)
- **Payments:** CloudPayments
- **Styling:** Tailwind CSS
