import { db } from './db';
import { randomBytes, createHash } from 'crypto';

// تشفير كلمة المرور
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// التحقق من كلمة المرور
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// إنشاء توكن الجلسة
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// تسجيل مستخدم جديد
export async function registerUser(email: string, password: string, name: string) {
  const hashedPassword = hashPassword(password);
  
  const existingUser = await db.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error('البريد الإلكتروني مستخدم بالفعل');
  }
  
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    }
  });
  
  return user;
}

// تسجيل الدخول
export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('البريد الإلكتروني غير موجود');
  }
  
  if (!verifyPassword(password, user.password)) {
    throw new Error('كلمة المرور غير صحيحة');
  }
  
  return user;
}

// الحصول على المستخدم بواسطة المعرف
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}
