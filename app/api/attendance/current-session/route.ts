import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  classSession,
  routine,
  classroom,
  course,
  studentCourseEnrollment,
  student,
  attendance,
} from "@/lib/schema";
import { eq, and, gte, lte, or, isNull, leftJoin } from "drizzle-orm";
import { auth } from "@/lib/auth";

async function ensureSessionsForToday(teacherId: string, currentDate: string, currentDay: string) {
  // Get all routines for today
  const todaysRoutines = await db
    .select({
      id: routine.id,
      startTime: routine.startTime,
      endTime: routine.endTime,
    })
    .from(routine)
    .where(eq(routine.dayOfWeek, currentDay));

  // Check which routines already have sessions today
  const existingSessions = await db
    .select({
      routineId: classSession.routineId,
    })
    .from(classSession)
    .where(eq(classSession.sessionDate, currentDate));

  const existingRoutineIds = new Set(existingSessions.map(s => s.routineId));

  // Create sessions for routines that don't have them
  for (const routineData of todaysRoutines) {
    if (!existingRoutineIds.has(routineData.id)) {
      await db.insert(classSession).values({
        id: crypto.randomUUID(),
        routineId: routineData.id,
        sessionDate: currentDate,
        startTime: routineData.startTime,
        endTime: routineData.endTime,
        status: "scheduled",
        conductedBy: teacherId, // Assign to current teacher
      });
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
    const currentDay = now
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    // First, check if there are any sessions for today that should be happening now
    // If not, create them from routines
    await ensureSessionsForToday(session.user.id, currentDate, currentDay);

    // Find the current class session for this teacher
    const currentSession = await db
      .select({
        id: classSession.id,
        sessionDate: classSession.sessionDate,
        startTime: classSession.startTime,
        endTime: classSession.endTime,
        status: classSession.status,
        notes: classSession.notes,
        conductedBy: classSession.conductedBy,
        routineId: routine.id,
        dayOfWeek: routine.dayOfWeek,
        routineStartTime: routine.startTime,
        routineEndTime: routine.endTime,
        classroomId: classroom.id,
        classroomName: classroom.name,
        courseId: course.id,
        courseName: course.name,
      })
      .from(classSession)
      .innerJoin(routine, eq(classSession.routineId, routine.id))
      .innerJoin(classroom, eq(routine.classroomId, classroom.id))
      .innerJoin(course, eq(routine.courseId, course.id))
      .where(
        and(
          eq(classSession.sessionDate, currentDate),
          or(
            eq(classSession.conductedBy, session.user.id),
            isNull(classSession.conductedBy),
          ),
          lte(classSession.startTime, currentTime),
          gte(classSession.endTime, currentTime),
          or(
            eq(classSession.status, "in_progress"),
            eq(classSession.status, "scheduled"),
          ),
        ),
      )
      .limit(1);

    if (currentSession.length === 0) {
      return NextResponse.json({
        hasCurrentSession: false,
        message: "No active class session found for current time",
      });
    }

    const result = currentSession[0];

    // If session is scheduled, mark it as in_progress and assign teacher
    if (result.status === "scheduled" || !result.conductedBy) {
      await db
        .update(classSession)
        .set({ 
          status: "in_progress",
          conductedBy: session.user.id
        })
        .where(eq(classSession.id, result.id));
    }

    const sessionData = {
      id: result.id,
      sessionDate: result.sessionDate,
      startTime: result.startTime,
      endTime: result.endTime,
      status: "in_progress", // Always return as in_progress
      notes: result.notes,
      conductedBy: result.conductedBy,
      routine: {
        id: result.routineId,
        dayOfWeek: result.dayOfWeek,
        startTime: result.routineStartTime,
        endTime: result.routineEndTime,
        classroom: {
          id: result.classroomId,
          name: result.classroomName,
        },
        course: {
          id: result.courseId,
          name: result.courseName,
        },
      },
    };

    // Get enrolled students for this course
    const enrolledStudents = await db
      .select({
        id: student.id,
        surname: student.surname,
        otherNames: student.otherNames,
        profilePictureKey: student.profilePictureKey,
      })
      .from(studentCourseEnrollment)
      .innerJoin(student, eq(studentCourseEnrollment.studentId, student.id))
      .where(
        eq(studentCourseEnrollment.courseId, sessionData.routine.course.id),
      );

    // Get existing attendance records for this session
    const existingAttendance = await db
      .select({
        studentId: attendance.studentId,
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        notes: attendance.notes,
      })
      .from(attendance)
      .where(eq(attendance.classSessionId, sessionData.id));

    // Create attendance map
    type AttendanceEntry = {
      status: string;
      checkInTime: string | null;
      notes: string | null;
    };
    const attendanceMap: Record<string, AttendanceEntry> = {};
    existingAttendance.forEach((record) => {
      attendanceMap[record.studentId] = {
        status: record.status,
        checkInTime: record.checkInTime
          ? record.checkInTime.toISOString()
          : null,
        notes: record.notes,
      };
    });

    // Combine student data with attendance status
    const studentsWithAttendance = enrolledStudents.map((student) => ({
      id: student.id,
      name: `${student.surname} ${student.otherNames}`,
      avatar: student.profilePictureKey,
      attendance: attendanceMap[student.id] || {
        status: "pending",
        checkInTime: null,
        notes: null,
      },
    }));

    return NextResponse.json({
      hasCurrentSession: true,
      session: {
        id: sessionData.id,
        courseName: sessionData.routine.course.name,
        classroomName: sessionData.routine.classroom.name,
        sessionDate: sessionData.sessionDate,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        status: sessionData.status,
        notes: sessionData.notes,
      },
      students: studentsWithAttendance,
    });
  } catch (error) {
    console.error("Error fetching current session:", error);
    return NextResponse.json(
      { error: "Failed to fetch current session" },
      { status: 500 },
    );
  }
}
