import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classroom, qualification, student, routine } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a classroom
const createClassroomSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  qualificationId: z.string().min(1, "Qualification ID is required"),
  scheduleInfo: z.any().optional(),
});

// GET /api/classrooms - List all classrooms with qualification names and counts
export async function GET() {
  try {
    const classrooms = await db
      .select({
        id: classroom.id,
        name: classroom.name,
        qualificationId: classroom.qualificationId,
        qualificationName: qualification.name,
        scheduleInfo: classroom.scheduleInfo,
        createdAt: classroom.createdAt,
        updatedAt: classroom.updatedAt,
        _count: {
          students: sql<number>`count(distinct ${student.id})`.as("students"),
          routines: sql<number>`count(distinct ${routine.id})`.as("routines"),
        },
      })
      .from(classroom)
      .leftJoin(qualification, eq(classroom.qualificationId, qualification.id))
      .leftJoin(student, eq(classroom.id, student.classroomId))
      .leftJoin(routine, eq(classroom.id, routine.classroomId))
      .groupBy(classroom.id, qualification.name)
      .orderBy(desc(classroom.createdAt));

    return NextResponse.json(classrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch classrooms" },
      { status: 500 },
    );
  }
}

// POST /api/classrooms - Create a new classroom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createClassroomSchema.parse(body);

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

    // Check if classroom with same name exists in the same qualification
    const existingClassroom = await db
      .select()
      .from(classroom)
      .where(
        sql`${classroom.name} = ${validatedData.name} AND ${classroom.qualificationId} = ${validatedData.qualificationId}`,
      )
      .limit(1);

    if (existingClassroom.length > 0) {
      return NextResponse.json(
        {
          error:
            "A classroom with this name already exists in the selected qualification",
        },
        { status: 400 },
      );
    }

    // Create the classroom
    const newClassroom = await db
      .insert(classroom)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        qualificationId: validatedData.qualificationId,
        scheduleInfo: validatedData.scheduleInfo || null,
      })
      .returning();

    return NextResponse.json(newClassroom[0], { status: 201 });
  } catch (error) {
    console.error("Error creating classroom:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create classroom" },
      { status: 500 },
    );
  }
}
