import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qualification, course, classroom } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for updating a qualification
const updateQualificationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

// GET /api/qualifications/[id] - Get a specific qualification with counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const qualificationId = (await params).id;

    const qualificationData = await db
      .select({
        id: qualification.id,
        name: qualification.name,
        description: qualification.description,
        createdAt: qualification.createdAt,
        updatedAt: qualification.updatedAt,
        _count: {
          courses: sql<number>`count(distinct ${course.id})`.as("courses"),
          classrooms: sql<number>`count(distinct ${classroom.id})`.as(
            "classrooms",
          ),
        },
      })
      .from(qualification)
      .leftJoin(course, eq(course.qualificationId, qualification.id))
      .leftJoin(classroom, eq(classroom.qualificationId, qualification.id))
      .where(eq(qualification.id, qualificationId))
      .groupBy(qualification.id)
      .limit(1);

    if (qualificationData.length === 0) {
      return NextResponse.json(
        { error: "Qualification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(qualificationData[0]);
  } catch (error) {
    console.error("Error fetching qualification:", error);
    return NextResponse.json(
      { error: "Failed to fetch qualification" },
      { status: 500 },
    );
  }
}

// PUT /api/qualifications/[id] - Update a qualification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const qualificationId = (await params).id;
    const body = await request.json();

    // Validate the request body
    const validatedData = updateQualificationSchema.parse(body);

    // Check if qualification exists
    const existingQualification = await db
      .select()
      .from(qualification)
      .where(eq(qualification.id, qualificationId))
      .limit(1);

    if (existingQualification.length === 0) {
      return NextResponse.json(
        { error: "Qualification not found" },
        { status: 404 },
      );
    }

    // Check if another qualification with the same name exists (excluding current one)
    const duplicateQualification = await db
      .select()
      .from(qualification)
      .where(
        sql`${qualification.name} = ${validatedData.name} AND ${qualification.id} != ${qualificationId}`,
      )
      .limit(1);

    if (duplicateQualification.length > 0) {
      return NextResponse.json(
        { error: "A qualification with this name already exists" },
        { status: 400 },
      );
    }

    // Update the qualification
    const updatedQualification = await db
      .update(qualification)
      .set({
        name: validatedData.name,
        description: validatedData.description || null,
        updatedAt: new Date(),
      })
      .where(eq(qualification.id, qualificationId))
      .returning();

    return NextResponse.json(updatedQualification[0]);
  } catch (error) {
    console.error("Error updating qualification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update qualification" },
      { status: 500 },
    );
  }
}

// DELETE /api/qualifications/[id] - Delete a qualification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const qualificationId = (await params).id;

    // Check if qualification exists
    const existingQualification = await db
      .select()
      .from(qualification)
      .where(eq(qualification.id, qualificationId))
      .limit(1);

    if (existingQualification.length === 0) {
      return NextResponse.json(
        { error: "Qualification not found" },
        { status: 404 },
      );
    }

    // Check if qualification has associated courses or classrooms
    const coursesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(course)
      .where(eq(course.qualificationId, qualificationId));

    const classroomsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(classroom)
      .where(eq(classroom.qualificationId, qualificationId));

    if (coursesCount[0].count > 0 || classroomsCount[0].count > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete qualification that has associated courses or classrooms",
          details: {
            courses: coursesCount[0].count,
            classrooms: classroomsCount[0].count,
          },
        },
        { status: 400 },
      );
    }

    // Delete the qualification
    await db.delete(qualification).where(eq(qualification.id, qualificationId));

    return NextResponse.json({ message: "Qualification deleted successfully" });
  } catch (error) {
    console.error("Error deleting qualification:", error);
    return NextResponse.json(
      { error: "Failed to delete qualification" },
      { status: 500 },
    );
  }
}
