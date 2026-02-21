import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if group has students
    const studentsCount = await db.student.count({
      where: { groupId: id },
    });

    if (studentsCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف المجموعة لأنها تحتوي على طلاب' },
        { status: 400 }
      );
    }

    await db.group.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المجموعة' },
      { status: 500 }
    );
  }
}
