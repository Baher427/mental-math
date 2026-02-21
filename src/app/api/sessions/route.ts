import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all sessions with evaluations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const levelMonth = searchParams.get('month');
    const sessionNumber = searchParams.get('session');

    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;
    if (levelMonth) where.levelMonth = parseInt(levelMonth);
    if (sessionNumber) where.sessionNumber = parseInt(sessionNumber);

    const sessions = await db.session.findMany({
      where,
      include: {
        group: {
          include: {
            location: true,
            level: true,
            students: true,
          },
        },
        evaluations: {
          include: {
            student: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
      ],
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الحصص' },
      { status: 500 }
    );
  }
}

// Create or update session with evaluations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, levelMonth, sessionNumber, date, notes, evaluations } = body;

    if (!groupId || !levelMonth || !sessionNumber) {
      return NextResponse.json(
        { error: 'بيانات الحصة غير مكتملة' },
        { status: 400 }
      );
    }

    // Create or update session
    const session = await db.session.upsert({
      where: {
        groupId_levelMonth_sessionNumber: {
          groupId,
          levelMonth,
          sessionNumber,
        },
      },
      create: {
        groupId,
        levelMonth,
        sessionNumber,
        date: date ? new Date(date) : new Date(),
        notes,
      },
      update: {
        date: date ? new Date(date) : new Date(),
        notes,
      },
    });

    // Create or update evaluations
    if (evaluations && evaluations.length > 0) {
      for (const eval_ of evaluations) {
        await db.evaluation.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: eval_.studentId,
            },
          },
          create: {
            sessionId: session.id,
            studentId: eval_.studentId,
            isPresent: eval_.isPresent ?? true,
            behavior: eval_.behavior,
            focus: eval_.focus,
            speed: eval_.speed,
            imaginationWrite: eval_.imaginationWrite,
            imaginationVerbal: eval_.imaginationVerbal,
            abacus: eval_.abacus,
            notes: eval_.notes,
          },
          update: {
            isPresent: eval_.isPresent ?? true,
            behavior: eval_.behavior,
            focus: eval_.focus,
            speed: eval_.speed,
            imaginationWrite: eval_.imaginationWrite,
            imaginationVerbal: eval_.imaginationVerbal,
            abacus: eval_.abacus,
            notes: eval_.notes,
          },
        });
      }
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الحصة' },
      { status: 500 }
    );
  }
}
