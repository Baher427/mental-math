import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if location has groups
    const groupsCount = await db.group.count({
      where: { locationId: id },
    });

    if (groupsCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف المكان لأنه يحتوي على مجموعات' },
        { status: 400 }
      );
    }

    await db.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المكان' },
      { status: 500 }
    );
  }
}
