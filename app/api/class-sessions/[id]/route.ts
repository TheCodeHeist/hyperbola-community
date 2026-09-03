import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  classSession,
  routine,
  classroom,
  course,
  student,
  attendance,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classSessionId = params.id;

    // Get class session details with routine, classroom, and course info
    const sessionData = await db
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
      .where(eq(classSession.id, classSessionId))
      .limit(1);

    if (sessionData.length === 0) {
      return NextResponse.json(
        { error: "Class session not found" },
        { status: 404 },
      );
    }

    // Get all students in the classroom
    const classroomStudents = await db
      .select({
        id: student.id,
        surname: student.surname,
        otherNames: student.otherNames,
        profilePictureKey: student.profilePictureKey,
      })
      .from(student)
      .where(eq(student.classroomId, sessionData[0].routine.classroom.id));

    // Get attendance records for this session
    const attendanceRecords = await db
      .select({
        studentId: attendance.studentId,
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        notes: attendance.notes,
        markedAt: attendance.markedAt,
      })
      .from(attendance)
      .where(eq(attendance.classSessionId, classSessionId));

    // Combine student data with attendance data
    const studentsWithAttendance = classroomStudents.map((student) => {
      const attendanceRecord = attendanceRecords.find(
        (record) => record.studentId === student.id,
      );

      return {
        id: student.id,
        name: `${student.surname} ${student.otherNames}`,
        avatar: student.profilePictureKey,
        attendance: attendanceRecord || null,
      };
    });

    const result = {
      ...sessionData[0],
      students: studentsWithAttendance,
      attendanceSummary: {
        total: classroomStudents.length,
        present: attendanceRecords.filter((r) => r.status === "present").length,
        absent: attendanceRecords.filter((r) => r.status === "absent").length,
        late: attendanceRecords.filter((r) => r.status === "late").length,
        excused: attendanceRecords.filter((r) => r.status === "excused").length,
        unmarked: classroomStudents.length - attendanceRecords.length,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching class session details:", error);
    return NextResponse.json(
      { error: "Failed to fetch class session details" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classSessionId = params.id;
    const body = await request.json();
    const { status, notes, startTime, endTime } = body;

    const updateData: Partial<
      Pick<
        typeof classSession.$inferInsert,
        "status" | "notes" | "startTime" | "endTime"
      >
    > = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const result = await db
      .update(classSession)
      .set(updateData)
      .where(eq(classSession.id, classSessionId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Class session not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Class session updated successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("Error updating class session:", error);
    return NextResponse.json(
      { error: "Failed to update class session" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classSessionId = params.id;

    // Check if the session has attendance records
    const attendanceCount = await db
      .select()
      .from(attendance)
      .where(eq(attendance.classSessionId, classSessionId));

    if (attendanceCount.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete session with existing attendance records" },
        { status: 400 },
      );
    }

    const result = await db
      .delete(classSession)
      .where(eq(classSession.id, classSessionId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Class session not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Class session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class session:", error);
    return NextResponse.json(
      { error: "Failed to delete class session" },
      { status: 500 },
    );
  }
}
