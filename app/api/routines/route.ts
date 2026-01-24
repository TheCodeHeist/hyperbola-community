import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routine, classroom, course } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const routines = await db
      .select({
        id: routine.id,
        classroomId: routine.classroomId,
        courseId: routine.courseId,
        dayOfWeek: routine.dayOfWeek,
        startTime: routine.startTime,
        endTime: routine.endTime,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
        classroomName: classroom.name,
        courseName: course.name,
        qualificationName: classroom.qualificationId, // We'll need to join qualification too
      })
      .from(routine)
      .innerJoin(classroom, eq(routine.classroomId, classroom.id))
      .innerJoin(course, eq(routine.courseId, course.id));

    return NextResponse.json({ routines });
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json(
      { error: "Failed to fetch routines" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classroomId, courseId, dayOfWeek, startTime, endTime } = body;

    if (!classroomId || !courseId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Check for time conflicts in the same classroom on the same day
    const existingRoutines = await db
      .select()
      .from(routine)
      .where(
        and(
          eq(routine.classroomId, classroomId),
          eq(routine.dayOfWeek, dayOfWeek),
        ),
      );

    // Simple time conflict check (in a real app, you'd want more sophisticated logic)
    const hasConflict = existingRoutines.some((existing) => {
      const existingStart = existing.startTime;
      const existingEnd = existing.endTime;
      const newStart = startTime;
      const newEnd = endTime;

      // Check if new routine overlaps with existing ones
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "Time conflict: Another course is already scheduled in this classroom at this time",
        },
        { status: 409 },
      );
    }

    const newRoutine = await db
      .insert(routine)
      .values({
        id: crypto.randomUUID(),
        classroomId,
        courseId,
        dayOfWeek,
        startTime,
        endTime,
      })
      .returning();

    return NextResponse.json({ routine: newRoutine[0] });
  } catch (error) {
    console.error("Error creating routine:", error);
    return NextResponse.json(
      { error: "Failed to create routine" },
      { status: 500 },
    );
  }
}
