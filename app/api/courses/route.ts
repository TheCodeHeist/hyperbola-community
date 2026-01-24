import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  course,
  qualification,
  studentCourseEnrollment,
  routine,
} from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a course
const createCourseSchema = z.object({
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

// GET /api/courses - List all courses with qualification names and counts
export async function GET() {
  try {
    const courses = await db
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
      .groupBy(course.id, qualification.name)
      .orderBy(desc(course.createdAt));

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createCourseSchema.parse(body);

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

    // Check if course with same name exists in the same qualification
    const existingCourse = await db
      .select()
      .from(course)
      .where(
        sql`${course.name} = ${validatedData.name} AND ${course.qualificationId} = ${validatedData.qualificationId}`,
      )
      .limit(1);

    if (existingCourse.length > 0) {
      return NextResponse.json(
        {
          error:
            "A course with this name already exists in the selected qualification",
        },
        { status: 400 },
      );
    }

    // Create the course
    const newCourse = await db
      .insert(course)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description || null,
        qualificationId: validatedData.qualificationId,
      })
      .returning();

    return NextResponse.json(newCourse[0], { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
