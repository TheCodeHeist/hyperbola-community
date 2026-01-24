import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qualification, course, classroom } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating a qualification
const createQualificationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

// GET /api/qualifications - List all qualifications
export async function GET() {
  try {
    const qualifications = await db
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
      .groupBy(qualification.id)
      .orderBy(desc(qualification.createdAt));

    return NextResponse.json(qualifications);
  } catch (error) {
    console.error("Error fetching qualifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch qualifications" },
      { status: 500 },
    );
  }
}

// POST /api/qualifications - Create a new qualification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = createQualificationSchema.parse(body);

    // Check if qualification with same name already exists
    const existingQualification = await db
      .select()
      .from(qualification)
      .where(eq(qualification.name, validatedData.name))
      .limit(1);

    if (existingQualification.length > 0) {
      return NextResponse.json(
        { error: "A qualification with this name already exists" },
        { status: 400 },
      );
    }

    // Create the qualification
    const newQualification = await db
      .insert(qualification)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description || null,
      })
      .returning();

    return NextResponse.json(newQualification[0], { status: 201 });
  } catch (error) {
    console.error("Error creating qualification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create qualification" },
      { status: 500 },
    );
  }
}
