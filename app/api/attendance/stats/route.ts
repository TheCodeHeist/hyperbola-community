import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classSession, attendance, student } from "@/lib/schema";
import { eq, and, gte, sql, count, avg } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthStr = currentMonth.toISOString().split("T")[0];
    const nextMonthStr = nextMonth.toISOString().split("T")[0];

    // Get total sessions this month
    const totalSessionsResult = await db
      .select({ count: count() })
      .from(classSession)
      .where(
        and(
          eq(classSession.conductedBy, session.user.id),
          gte(classSession.sessionDate, currentMonthStr),
          sql`${classSession.sessionDate} < ${nextMonthStr}`,
        ),
      );

    const totalSessions = totalSessionsResult[0]?.count || 0;

    // Get completed sessions this month
    const completedSessionsResult = await db
      .select({ count: count() })
      .from(classSession)
      .where(
        and(
          eq(classSession.conductedBy, session.user.id),
          eq(classSession.status, "completed"),
          gte(classSession.sessionDate, currentMonthStr),
          sql`${classSession.sessionDate} < ${nextMonthStr}`,
        ),
      );

    const completedSessions = completedSessionsResult[0]?.count || 0;

    // Get average attendance percentage
    const averageAttendanceResult = await db
      .select({
        average: avg(
          sql`CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END`,
        ),
      })
      .from(attendance)
      .innerJoin(classSession, eq(attendance.classSessionId, classSession.id))
      .where(
        and(
          eq(classSession.conductedBy, session.user.id),
          gte(classSession.sessionDate, currentMonthStr),
          sql`${classSession.sessionDate} < ${nextMonthStr}`,
        ),
      );

    const averageAttendance =
      Math.round(
        ((averageAttendanceResult[0]?.average as unknown as number) || 0) * 100 * 100,
      ) / 100;

    // Get total students count
    const totalStudentsResult = await db
      .select({ count: count() })
      .from(student);

    const totalStudents = totalStudentsResult[0]?.count || 0;

    // Get today's attendance stats
    const todayAttendance = await db
      .select({
        status: attendance.status,
        count: count(),
      })
      .from(attendance)
      .innerJoin(classSession, eq(attendance.classSessionId, classSession.id))
      .where(
        and(
          eq(classSession.conductedBy, session.user.id),
          eq(classSession.sessionDate, currentDate),
        ),
      )
      .groupBy(attendance.status);

    const todayStats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    todayAttendance.forEach((stat) => {
      todayStats[stat.status as keyof typeof todayStats] = stat.count;
    });

    return NextResponse.json({
      totalSessions,
      completedSessions,
      averageAttendance,
      totalStudents,
      presentToday: todayStats.present,
      absentToday: todayStats.absent,
      lateToday: todayStats.late,
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance statistics" },
      { status: 500 },
    );
  }
}