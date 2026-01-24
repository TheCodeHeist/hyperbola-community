import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routine, classroom, course } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const routineData = await db
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
      })
      .from(routine)
      .innerJoin(classroom, eq(routine.classroomId, classroom.id))
      .innerJoin(course, eq(routine.courseId, course.id))
      .where(eq(routine.id, id))
      .limit(1);

    if (routineData.length === 0) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ routine: routineData[0] });
  } catch (error) {
    console.error("Error fetching routine:", error);
    return NextResponse.json(
      { error: "Failed to fetch routine" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { classroomId, courseId, dayOfWeek, startTime, endTime } = body;

    if (!classroomId || !courseId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Check for time conflicts (excluding current routine)
    const existingRoutines = await db
      .select()
      .from(routine)
      .where(
        and(
          eq(routine.classroomId, classroomId),
          eq(routine.dayOfWeek, dayOfWeek),
          // Exclude current routine from conflict check
          ne(routine.id, id),
        ),
      );

    const hasConflict = existingRoutines.some((existing) => {
      const existingStart = existing.startTime;
      const existingEnd = existing.endTime;
      const newStart = startTime;
      const newEnd = endTime;

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

    const updatedRoutine = await db
      .update(routine)
      .set({
        classroomId,
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        updatedAt: new Date(),
      })
      .where(eq(routine.id, id))
      .returning();

    if (updatedRoutine.length === 0) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ routine: updatedRoutine[0] });
  } catch (error) {
    console.error("Error updating routine:", error);
    return NextResponse.json(
      { error: "Failed to update routine" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deletedRoutine = await db
      .delete(routine)
      .where(eq(routine.id, id))
      .returning();

    if (deletedRoutine.length === 0) {
      return NextResponse.json({ error: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Routine deleted successfully" });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json(
      { error: "Failed to delete routine" },
      { status: 500 },
    );
  }
}
