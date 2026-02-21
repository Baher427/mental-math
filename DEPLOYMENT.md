# 🚀 دليل النشر على Vercel + Supabase

---

## 📋 ما ستحتاجه:

1. ✅ حساب على [Vercel](https://vercel.com) - لديك بالفعل
2. ✅ حساب على [Supabase](https://supabase.com) - لديك بالفعل
3. ✅ حساب على [GitHub](https://github.com) - (اختياري لكن يُنصح به)

---

## 🔥 الطريقة الأسهل (مُوصى بها):

### الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وسجل دخولك
2. انقر **New Project**
3. املأ البيانات:
   - **Name:** `mental-math` (أو أي اسم تريده)
   - **Database Password:** اختر كلمة مرور قوية واحفظها!
   - **Region:** اختر أقرب منطقة (مثل Frankfurt)
4. انقر **Create new project**
5. انتظر حوالي دقيقة حتى يكتمل الإعداد

### الخطوة 2: الحصول على Connection String

1. في Supabase، اذهب إلى:
   - **Project Settings** (أيقونة الترس ⚙️)
   - **Database**
   - ابحث عن **Connection string**
   - اختر **Nodejs** من التبويبات
   - انسخ الرابط

2. سيكون بهذا الشكل:
   ```
   postgresql://postgres.abcdefghijk:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

3. **مهم:** استبدل `[YOUR-PASSWORD]` بكلمة المرور التي اخترتها!

4. للحصول على `DIRECT_DATABASE_URL`:
   - نفس الرابط لكن غيّر المنفذ من `6543` إلى `5432`

### الخطوة 3: رفع المشروع على GitHub

1. أنشئ repository جديد على GitHub
2. من جهازك، شغّل:

```bash
cd /home/z/my-project

# تهيئة Git
git init

# إضافة جميع الملفات
git add .

# إنشاء commit
git commit -m "Initial commit - Mental Math Platform"

# ربط بـ GitHub (استبدل USERNAME باسمك)
git remote add origin https://github.com/USERNAME/mental-math.git

# رفع المشروع
git branch -M main
git push -u origin main
```

### الخطوة 4: نشر على Vercel

1. اذهب إلى [vercel.com](https://vercel.com) وسجل دخولك
2. انقر **Add New** > **Project**
3. اختر repository من GitHub
4. في قسم **Environment Variables**، أضف:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres` |
| `DIRECT_DATABASE_URL` | `postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres` |

5. انقر **Deploy**
6. انتظر 2-3 دقائق حتى يكتمل النشر

### الخطوة 5: تهيئة قاعدة البيانات

بعد النشر:

1. اذهب إلى موقعك (مثلاً: `your-app.vercel.app`)
2. أضف `/api/init` في نهاية الرابط:
   ```
   https://your-app.vercel.app/api/init
   ```
3. ستظهر رسالة: "تم إنشاء المستويات بنجاح"

### الخطوة 6: إنشاء حسابك الأول

1. اذهب إلى موقعك:
   ```
   https://your-app.vercel.app/login
   ```
2. أنشئ حساب جديد
3. ابدأ باستخدام المنصة!

---

## 🎉 مبروك! المنصة تعمل الآن!

---

## 📱 الروابط المهمة:

| الرابط | الوصف |
|--------|-------|
| `https://your-app.vercel.app` | الصفحة الرئيسية |
| `https://your-app.vercel.app/login` | تسجيل الدخول |
| `https://your-app.vercel.app/locations` | إدارة الأماكن |
| `https://your-app.vercel.app/groups` | إدارة المجموعات |
| `https://your-app.vercel.app/students` | إدارة الطلاب |
| `https://your-app.vercel.app/sessions` | التقييم الأسبوعي |
| `https://your-app.vercel.app/analytics` | التحليلات |
| `https://your-app.vercel.app/ai` | الذكاء الاصطناعي |
| `https://your-app.vercel.app/archive` | الأرشيف |

---

## ⚠️ ملاحظات مهمة:

1. **احتفظ بكلمة مرور Supabase** في مكان آمن
2. **لا تشارك** روابط قاعدة البيانات مع أحد
3. **الباقة المجانية** في Supabase تشمل:
   - 500MB قاعدة بيانات
   - 1GB تخزين ملفات
   - كافية لآلاف الطلاب!

4. إذا واجهت أي مشكلة، تحقق من:
   - Vercel Dashboard > Logs
   - Supabase Dashboard > Logs

---

## 🔄 تحديث المشروع:

عندما تعدل الكود:

```bash
git add .
git commit -m "تحديث جديد"
git push
```

Vercel سيقوم بتحديث الموقع تلقائياً!

---

**هل تحتاج مساعدة؟ أخبرني! 🚀**
