# 🧮 منصة تقييم الحساب الذهني

نظام متكامل لتقييم ومتابعة طلاب الحساب الذهني مع تحليل ذكي بالذكاء الاصطناعي.

## 🚀 النشر على Vercel + Supabase

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. انتظر حتى يكتمل الإعداد (دقيقة تقريباً)

### الخطوة 2: الحصول على رابط قاعدة البيانات

1. في Supabase، اذهب إلى **Project Settings** > **Database**
2. انسخ **Connection string** (اختر Nodejs)
3. سيكون بهذا الشكل:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

4. للحصول على Direct URL، غيّر المنفذ من `6543` إلى `5432`

### الخطوة 3: رفع المشروع على Vercel

#### الطريقة 1: عبر GitHub (الأفضل)

1. ارفع المشروع على GitHub
2. اذهب إلى [vercel.com](https://vercel.com)
3. انقر **New Project**
4. اختر المستودع من GitHub
5. أضف متغيرات البيئة:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | رابط Supabase مع منفذ 6543 |
| `DIRECT_DATABASE_URL` | رابط Supabase مع منفذ 5432 |

6. انقر **Deploy**

#### الطريقة 2: عبر Vercel CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# نشر المشروع
vercel

# إضافة متغيرات البيئة
vercel env add DATABASE_URL
vercel env add DIRECT_DATABASE_URL
```

### الخطوة 4: تشغيل الهجرات

بعد النشر، شغّل الهجرات من خلال:

```bash
# محلياً
bun run db:migrate:deploy

# أو عبر Vercel CLI
vercel env pull .env.local
bun run db:migrate:deploy
```

### الخطوة 5: زرع البيانات الأولية

```bash
bun run db:seed
```

## 📱 المميزات

- ✅ إدارة الطلاب والمجموعات
- ✅ تقييم أسبوعي شامل
- ✅ تحليلات ورسوم بيانية
- ✅ ذكاء اصطناعي للتحليل
- ✅ أرشيف الطلاب
- ✅ واجهة عربية كاملة

## 🛠️ التطوير المحلي

```bash
# تثبيت المتطلبات
bun install

# إعداد قاعدة البيانات
cp .env.example .env.local
# عدّل .env.local برابط Supabase

# تشغيل الهجرات
bun run db:migrate

# زرع البيانات
bun run db:seed

# تشغيل الخادم
bun run dev
```

## 📂 هيكل المشروع

```
src/
├── app/
│   ├── page.tsx          # لوحة التحكم
│   ├── login/            # تسجيل الدخول
│   ├── locations/        # الأماكن
│   ├── groups/           # المجموعات
│   ├── students/         # الطلاب
│   ├── sessions/         # التقييم
│   ├── analytics/        # التحليلات
│   ├── ai/               # الذكاء الاصطناعي
│   └── api/              # APIs
├── components/           # المكونات
└── lib/                  # المكتبات
```

## 🔐 الأمان

- كلمات المرور مشفرة (SHA-256)
- حماية الصفحات بالمصادقة
- قاعدة بيانات PostgreSQL آمنة

---

صُنع بـ ❤️ للحساب الذهني
