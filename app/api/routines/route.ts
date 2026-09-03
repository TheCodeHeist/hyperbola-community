import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routine, classroom, course } from "@/lib/schema";
import { user } from "@/lib/auth-schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const routines = await db
      .select({
        id: routine.id,
        classroomId: routine.classroomId,
        courseId: routine.courseId,
        conductedBy: routine.conductedBy,
        dayOfWeek: routine.dayOfWeek,
        startTime: routine.startTime,
        endTime: routine.endTime,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
        classroomName: classroom.name,
        courseName: course.name,
        qualificationName: classroom.qualificationId,
        teacherName: user.name,
      })
      .from(routine)
      .innerJoin(classroom, eq(routine.classroomId, classroom.id))
      .innerJoin(course, eq(routine.courseId, course.id))
      .leftJoin(user, eq(routine.conductedBy, user.id));

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
    const { classroomId, courseId, conductedBy, dayOfWeek, startTime, endTime } = body;

    if (!classroomId || !courseId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Check for time conflicts in the same classroom on the same day
    // We use half-open intervals [start, end) where end is exclusive
    // This allows consecutive classes like 2pm-3pm and 3pm-4pm
    const existingRoutines = await db
      .select()
      .from(routine)
      .where(
        and(
          eq(routine.classroomId, classroomId),
          eq(routine.dayOfWeek, dayOfWeek),
        ),
      );

    // Check for overlapping time using half-open interval logic:
    // Two intervals overlap if start1 < end2 AND start2 < end1
    const hasConflict = existingRoutines.some((existing) => {
      const existingStart = existing.startTime;
      const existingEnd = existing.endTime;
      const newStart = startTime;
      const newEnd = endTime;

      // Half-open interval overlap check: start1 < end2 AND start2 < end1
      // Using string comparison since time values are in HH:MM format
      return compareTime(newStart, existingEnd) < 0 && compareTime(existingStart, newEnd) < 0;
    });

    // Helper function to compare time strings (HH:MM format)
    function compareTime(time1: string, time2: string): number {
      return time1.localeCompare(time2);
    }

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "Time conflict: Another course is already scheduled in this classroom at this time",
        },
        { status: 409 },
      );
    }

    // Check for teacher time conflicts if conductedBy is provided
    if (conductedBy) {
      const existingTeacherRoutines = await db
        .select()
        .from(routine)
        .where(
          and(
            eq(routine.conductedBy, conductedBy),
            eq(routine.dayOfWeek, dayOfWeek),
          ),
        );

      const hasTeacherConflict = existingTeacherRoutines.some((existing) => {
        const existingStart = existing.startTime;
        const existingEnd = existing.endTime;
        const newStart = startTime;
        const newEnd = endTime;

        // Same half-open interval overlap check
        return compareTime(newStart, existingEnd) < 0 && compareTime(existingStart, newEnd) < 0;
      });

      if (hasTeacherConflict) {
        return NextResponse.json(
          {
            error:
              "Time conflict: The selected teacher is already teaching another course at this time",
          },
          { status: 409 },
        );
      }
    }

    const newRoutine = await db
      .insert(routine)
      .values({
        id: crypto.randomUUID(),
        classroomId,
        courseId,
        conductedBy,
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
