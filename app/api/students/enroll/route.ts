import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { student, studentCourseEnrollment } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized operation" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { studentId, courseIds, classroomId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    // Validate that the student exists
    const existingStudent = await db
      .select()
      .from(student)
      .where(eq(student.id, studentId))
      .limit(1);

    if (existingStudent.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Start a transaction to handle all enrollments atomically
    await db.transaction(async (tx) => {
      // 1. Assign student to classroom if provided
      if (classroomId) {
        await tx
          .update(student)
          .set({ classroomId })
          .where(eq(student.id, studentId));
      }

      // 2. Enroll student in courses if provided
      if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
        // Remove existing enrollments for these courses to avoid duplicates
        await tx
          .delete(studentCourseEnrollment)
          .where(
            and(
              eq(studentCourseEnrollment.studentId, studentId),
              ...courseIds.map((courseId) =>
                eq(studentCourseEnrollment.courseId, courseId),
              ),
            ),
          );

        // Add new enrollments
        const enrollments = courseIds.map((courseId) => ({
          id: crypto.randomUUID(),
          studentId,
          courseId,
        }));

        await tx.insert(studentCourseEnrollment).values(enrollments);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Student enrolled successfully",
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { error: "Failed to enroll student" },
      { status: 500 },
    );
  }
}

// GET /api/students/enroll?studentId=... - Get student's current enrollments
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized operation" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    // Get student's classroom assignment and course enrollments
    const studentData = await db
      .select({
        id: student.id,
        classroomId: student.classroomId,
      })
      .from(student)
      .where(eq(student.id, studentId))
      .limit(1);

    if (studentData.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get enrolled courses
    const enrollments = await db
      .select({
        courseId: studentCourseEnrollment.courseId,
      })
      .from(studentCourseEnrollment)
      .where(eq(studentCourseEnrollment.studentId, studentId));

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    return NextResponse.json({
      success: true,
      studentId,
      classroomId: studentData[0].classroomId,
      enrolledCourseIds,
    });
  } catch (error) {
    console.error("Error fetching student enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch student enrollments" },
      { status: 500 },
    );
  }
}
