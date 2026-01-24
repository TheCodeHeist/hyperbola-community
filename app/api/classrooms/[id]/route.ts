import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classroom, qualification, student, routine } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a classroom
const updateClassroomSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  qualificationId: z.string().min(1, "Qualification ID is required"),
  scheduleInfo: z.any().optional(),
});

// GET /api/classrooms/[id] - Get a specific classroom with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const classroomId = (await params).id;

    const classroomData = await db
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
      .where(eq(classroom.id, classroomId))
      .groupBy(classroom.id, qualification.name)
      .limit(1);

    if (classroomData.length === 0) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(classroomData[0]);
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return NextResponse.json(
      { error: "Failed to fetch classroom" },
      { status: 500 },
    );
  }
}

// PUT /api/classrooms/[id] - Update a classroom
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const classroomId = (await params).id;
    const body = await request.json();

    // Validate the request body
    const validatedData = updateClassroomSchema.parse(body);

    // Check if classroom exists
    const existingClassroom = await db
      .select()
      .from(classroom)
      .where(eq(classroom.id, classroomId))
      .limit(1);

    if (existingClassroom.length === 0) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 },
      );
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

    // Check if another classroom with the same name exists in the same qualification (excluding current classroom)
    const duplicateClassroom = await db
      .select()
      .from(classroom)
      .where(
        sql`${classroom.name} = ${validatedData.name} AND ${classroom.qualificationId} = ${validatedData.qualificationId} AND ${classroom.id} != ${classroomId}`,
      )
      .limit(1);

    if (duplicateClassroom.length > 0) {
      return NextResponse.json(
        {
          error:
            "A classroom with this name already exists in the selected qualification",
        },
        { status: 400 },
      );
    }

    // Update the classroom
    const updatedClassroom = await db
      .update(classroom)
      .set({
        name: validatedData.name,
        qualificationId: validatedData.qualificationId,
        scheduleInfo: validatedData.scheduleInfo || null,
        updatedAt: new Date(),
      })
      .where(eq(classroom.id, classroomId))
      .returning();

    return NextResponse.json(updatedClassroom[0]);
  } catch (error) {
    console.error("Error updating classroom:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update classroom" },
      { status: 500 },
    );
  }
}

// DELETE /api/classrooms/[id] - Delete a classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const classroomId = (await params).id;

    // Check if classroom exists
    const existingClassroom = await db
      .select()
      .from(classroom)
      .where(eq(classroom.id, classroomId))
      .limit(1);

    if (existingClassroom.length === 0) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 },
      );
    }

    // Check if classroom has associated students or routines
    const studentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(student)
      .where(eq(student.classroomId, classroomId));

    const routinesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(routine)
      .where(eq(routine.classroomId, classroomId));

    if (studentsCount[0].count > 0 || routinesCount[0].count > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete classroom that has associated students or routines",
          details: {
            students: studentsCount[0].count,
            routines: routinesCount[0].count,
          },
        },
        { status: 400 },
      );
    }

    // Delete the classroom
    await db.delete(classroom).where(eq(classroom.id, classroomId));

    return NextResponse.json({ message: "Classroom deleted successfully" });
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return NextResponse.json(
      { error: "Failed to delete classroom" },
      { status: 500 },
    );
  }
}
