import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete evaluations first
    await db.evaluation.deleteMany({
      where: { studentId: id },
    });

    await db.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الطالب' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const student = await db.student.update({
      where: { id },
      data: {
        isArchived: body.isArchived,
        isActive: body.isActive ?? !body.isArchived,
      },
      include: {
        level: true,
        group: {
          include: { location: true },
        },
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الطالب' },
      { status: 500 }
    );
  }
}
