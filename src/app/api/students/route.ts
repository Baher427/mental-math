import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const levelId = searchParams.get('levelId');
    const isArchived = searchParams.get('archived') === 'true';
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { isArchived };

    if (groupId) where.groupId = groupId;
    if (levelId) where.levelId = levelId;
    if (search) {
      where.name = { contains: search };
    }

    const students = await db.student.findMany({
      where,
      include: {
        level: true,
        group: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلاب' },
      { status: 500 }
    );
  }
}

// Create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, notes, groupId, levelId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم الطالب مطلوب' },
        { status: 400 }
      );
    }

    if (!groupId || !levelId) {
      return NextResponse.json(
        { error: 'المجموعة والمستوى مطلوبان' },
        { status: 400 }
      );
    }

    const student = await db.student.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        groupId,
        levelId,
      },
      include: {
        level: true,
        group: {
          include: {
            location: true,
          },
        },
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الطالب' },
      { status: 500 }
    );
  }
}
