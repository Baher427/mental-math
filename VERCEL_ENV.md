# ⚠️ مهم: Environment Variables في Vercel

## استخدم هذه القيم بالضبط:

### DATABASE_URL (للاتصال العادي):
```
postgresql://postgres.hdvyddfgaswqbksjbyfo:Baher_-_200@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&prepare_statements=false
```

### DIRECT_DATABASE_URL (للمهاجرات):
```
postgresql://postgres.hdvyddfgaswqbksjbyfo:Baher_-_200@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

## ⚠️ لاحظ:
- `DATABASE_URL` ينتهي بـ `?pgbouncer=true&prepare_statements=false`
- هذا ضروري لحل مشكلة "prepared statement already exists" في Vercel
