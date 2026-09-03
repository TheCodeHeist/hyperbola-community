import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, classSession } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classSessionId = searchParams.get("classSessionId");
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (startDate && endDate) {
      // For date range queries, we need to join with classSession
      const start = new Date(startDate).toISOString().split("T")[0];
      const end = new Date(endDate).toISOString().split("T")[0];

      const result = await db
        .select()
        .from(attendance)
        .innerJoin(classSession, eq(attendance.classSessionId, classSession.id))
        .where(
          and(
            gte(classSession.sessionDate, start),
            lte(classSession.sessionDate, end),
          ),
        );

      return NextResponse.json(result);
    }

    // Collect where conditions for the simple query
    const whereConditions = [];
    if (classSessionId) {
      whereConditions.push(eq(attendance.classSessionId, classSessionId));
    }
    if (studentId) {
      whereConditions.push(eq(attendance.studentId, studentId));
    }

    const result = await db
      .select()
      .from(attendance)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { classSessionId, attendanceData, notes } = body;

    if (!classSessionId || !attendanceData) {
      return NextResponse.json(
        { error: "Missing required fields: classSessionId, attendanceData" },
        { status: 400 },
      );
    }

    // Validate that the class session exists
    const existingSession = await db
      .select()
      .from(classSession)
      .where(eq(classSession.id, classSessionId))
      .limit(1);

    if (existingSession.length === 0) {
      return NextResponse.json(
        { error: "Class session not found" },
        { status: 404 },
      );
    }

    // Prepare attendance records
    const attendanceRecords = Object.entries(attendanceData).map(
      ([studentId, status]) => ({
        classSessionId,
        studentId,
        status,
        markedBy: session.user.id,
        notes: notes || null,
      }),
    );

    // Use a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Delete existing attendance records for this session
      await tx
        .delete(attendance)
        .where(eq(attendance.classSessionId, classSessionId));

      // Insert new attendance records
      if (attendanceRecords.length > 0) {
        await tx.insert(attendance).values(attendanceRecords);
      }

      return attendanceRecords;
    });

    return NextResponse.json({
      message: "Attendance marked successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance data" },
      { status: 500 },
    );
  }
}
