import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  course,
  qualification,
  studentCourseEnrollment,
  routine,
} from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a course
const updateCourseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  qualificationId: z.string().min(1, "Qualification ID is required"),
});

// GET /api/courses/[id] - Get a specific course with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const courseId = (await params).id;

    const courseData = await db
      .select({
        id: course.id,
        name: course.name,
        description: course.description,
        qualificationId: course.qualificationId,
        qualificationName: qualification.name,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        _count: {
          enrollments:
            sql<number>`count(distinct ${studentCourseEnrollment.id})`.as(
              "enrollments",
            ),
          routines: sql<number>`count(distinct ${routine.id})`.as("routines"),
        },
      })
      .from(course)
      .leftJoin(qualification, eq(course.qualificationId, qualification.id))
      .leftJoin(
        studentCourseEnrollment,
        eq(course.id, studentCourseEnrollment.courseId),
      )
      .leftJoin(routine, eq(course.id, routine.courseId))
      .where(eq(course.id, courseId))
      .groupBy(course.id, qualification.name)
      .limit(1);

    if (courseData.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(courseData[0]);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 },
    );
  }
}

// PUT /api/courses/[id] - Update a course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const courseId = (await params).id;
    const body = await request.json();

    // Validate the request body
    const validatedData = updateCourseSchema.parse(body);

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(course)
      .where(eq(course.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if qualification exists
    const existingQualification = await db
      .select()
      .from(qualification)
      .where(eq(qualification.id, validatedData.qualificationId))
      .limit(1);

    if (existingQualification.length === 0) {
      return NextResponse.json(
        { error: "Qualification not found" },
        { status: 400 },
      );
    }

    // Check if another course with the same name exists in the same qualification (excluding current course)
    const duplicateCourse = await db
      .select()
      .from(course)
      .where(
        sql`${course.name} = ${validatedData.name} AND ${course.qualificationId} = ${validatedData.qualificationId} AND ${course.id} != ${courseId}`,
      )
      .limit(1);

    if (duplicateCourse.length > 0) {
      return NextResponse.json(
        {
          error:
            "A course with this name already exists in the selected qualification",
        },
        { status: 400 },
      );
    }

    // Update the course
    const updatedCourse = await db
      .update(course)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        qualificationId: validatedData.qualificationId,
        updatedAt: new Date(),
      })
      .where(eq(course.id, courseId))
      .returning();

    return NextResponse.json(updatedCourse[0]);
  } catch (error) {
    console.error("Error updating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
}

// DELETE /api/courses/[id] - Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const courseId = (await params).id;

    // Check if course exists
    const existingCourse = await db
      .select()
      .from(course)
      .where(eq(course.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if course has associated enrollments or routines
    const enrollmentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentCourseEnrollment)
      .where(eq(studentCourseEnrollment.courseId, courseId));

    const routinesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(routine)
      .where(eq(routine.courseId, courseId));

    if (enrollmentsCount[0].count > 0 || routinesCount[0].count > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete course that has associated enrollments or routines",
          details: {
            enrollments: enrollmentsCount[0].count,
            routines: routinesCount[0].count,
          },
        },
        { status: 400 },
      );
    }

    // Delete the course
    await db.delete(course).where(eq(course.id, courseId));

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
