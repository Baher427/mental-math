import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');

    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    if (studentId) where.studentId = studentId;
    if (date) where.date = new Date(date);

    const attendances = await db.attendance.findMany({
      where,
      include: {
        student: true,
        group: {
          include: {
            location: true,
            level: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب سجل الحضور' },
      { status: 500 }
    );
  }
}

// Create or update attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      groupId, 
      studentId, 
      date, 
      startTime, 
      endTime, 
      sessionTime,
      isPresent, 
      notes, 
      weekNumber 
    } = body;

    if (!groupId || !studentId || !date) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);

    // Upsert attendance record
    const attendance = await db.attendance.upsert({
      where: {
        groupId_studentId_date: {
          groupId,
          studentId,
          date: attendanceDate,
        },
      },
      create: {
        groupId,
        studentId,
        date: attendanceDate,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        sessionTime,
        isPresent,
        notes,
        weekNumber,
      },
      update: {
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        sessionTime,
        isPresent,
        notes,
        weekNumber,
      },
      include: {
        student: true,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الحضور' },
      { status: 500 }
    );
  }
}

// Batch save attendance for multiple students
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, date, startTime, endTime, sessionTime, weekNumber, attendances } = body;

    if (!groupId || !date || !attendances || !Array.isArray(attendances)) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    const results = [];

    for (const att of attendances) {
      const result = await db.attendance.upsert({
        where: {
          groupId_studentId_date: {
            groupId,
            studentId: att.studentId,
            date: attendanceDate,
          },
        },
        create: {
          groupId,
          studentId: att.studentId,
          date: attendanceDate,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          sessionTime,
          isPresent: att.isPresent,
          notes: att.notes,
          weekNumber,
        },
        update: {
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          sessionTime,
          isPresent: att.isPresent,
          notes: att.notes,
          weekNumber,
        },
      });
      results.push(result);
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Error batch saving attendance:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الحضور' },
      { status: 500 }
    );
  }
}
