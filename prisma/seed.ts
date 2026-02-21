import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const levelNames = [
  'المستوى الأول',
  'المستوى الثاني',
  'المستوى الثالث',
  'المستوى الرابع',
  'المستوى الخامس',
  'المستوى السادس',
  'المستوى السابع',
  'المستوى الثامن',
  'المستوى التاسع',
  'المستوى العاشر',
];

async function main() {
  console.log('🌱 بدء زرع البيانات...');

  // إنشاء المستويات
  for (let i = 0; i < levelNames.length; i++) {
    const existingLevel = await prisma.level.findUnique({
      where: { number: i + 1 },
    });

    if (!existingLevel) {
      await prisma.level.create({
        data: {
          number: i + 1,
          name: levelNames[i],
          monthsCount: 3,
        },
      });
      console.log(`✅ تم إنشاء ${levelNames[i]}`);
    } else {
      console.log(`⏭️ ${levelNames[i]} موجود بالفعل`);
    }
  }

  console.log('🎉 تم الانتهاء من زرع البيانات!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
