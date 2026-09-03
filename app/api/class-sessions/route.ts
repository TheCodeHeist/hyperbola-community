import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classSession, routine, classroom, course, studentCourseEnrollment, attendance } from "@/lib/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    let query = db
      .select({
        id: classSession.id,
        sessionDate: classSession.sessionDate,
        startTime: classSession.startTime,
        endTime: classSession.endTime,
        status: classSession.status,
        notes: classSession.notes,
        conductedBy: classSession.conductedBy,
        createdAt: classSession.createdAt,
        routine: {
          id: routine.id,
          classroom: {
            id: classroom.id,
            name: classroom.name,
          },
          course: {
            id: course.id,
            name: course.name,
          },
        },
      })
      .from(classSession)
      .innerJoin(routine, eq(classSession.routineId, routine.id))
      .innerJoin(classroom, eq(routine.classroomId, classroom.id))
      .innerJoin(course, eq(routine.courseId, course.id))
      .orderBy(desc(classSession.sessionDate), desc(classSession.startTime));

    if (classroomId) {
      query = query.where(eq(routine.classroomId, classroomId));
    }

    if (date) {
      const targetDate = new Date(date);
      query = query.where(eq(classSession.sessionDate, targetDate));
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query = query.where(
        and(
          gte(classSession.sessionDate, start),
          lte(classSession.sessionDate, end),
        ),
      );
    }

    if (status) {
      query = query.where(eq(classSession.status, status));
    }

    let result = await query;

    if (limit) {
      const limitNum = parseInt(limit);
      result = result.slice(0, limitNum);
    }

    // Add attendance counts for each session
    const sessionsWithAttendance = await Promise.all(
      result.map(async (session) => {
        const attendanceCount = await db
          .select({ count: count() })
          .from(attendance)
          .where(
            and(
              eq(attendance.classSessionId, session.id),
              eq(attendance.status, "present"),
            ),
          );

        // Get total enrolled students for this course
        const totalStudents = await db
          .select({ count: count() })
          .from(studentCourseEnrollment)
          .where(eq(studentCourseEnrollment.courseId, session.routine.course.id));

        return {
          ...session,
          attendanceCount: attendanceCount[0]?.count || 0,
          totalStudents: totalStudents[0]?.count || 0,
        };
      }),
    );

    return NextResponse.json(sessionsWithAttendance);
  } catch (error) {
    console.error("Error fetching class sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch class sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { routineId, sessionDate, startTime, endTime, notes } = body;

    if (!routineId || !sessionDate) {
      return NextResponse.json(
        { error: "Missing required fields: routineId, sessionDate" },
        { status: 400 },
      );
    }

    // Validate that the routine exists
    const existingRoutine = await db
      .select()
      .from(routine)
      .where(eq(routine.id, routineId))
      .limit(1);

    if (existingRoutine.length === 0) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    const newSession = await db
      .insert(classSession)
      .values({
        routineId,
        sessionDate: new Date(sessionDate),
        startTime: startTime || existingRoutine[0].startTime,
        endTime: endTime || existingRoutine[0].endTime,
        status: "scheduled",
        notes,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      message: "Class session created successfully",
      data: newSession[0],
    });
  } catch (error) {
    console.error("Error creating class session:", error);
    return NextResponse.json(
      { error: "Failed to create class session" },
      { status: 500 },
    );
  }
}
