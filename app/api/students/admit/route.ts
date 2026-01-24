import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { student } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized operation" },
        { status: 401 },
      );
    }

    // Parse the request body
    const body = await request.json();

    const {
      surname,
      otherNames,
      phoneNumber,
      nationalId,
      nationality,
      presentAddress,
      dateOfBirth,
      gender,
      guardianFullName,
      guardianOccupation,
      guardianPhoneNumber,
      customFields,
      classroomId,
    } = body;

    // Validate required fields
    if (
      !surname ||
      !otherNames ||
      !phoneNumber ||
      !nationalId ||
      !nationality ||
      !presentAddress ||
      !dateOfBirth ||
      !gender ||
      !guardianFullName ||
      !guardianOccupation ||
      !guardianPhoneNumber
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate a unique student ID
    const studentId = `STU${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Prepare the student data
    const studentData = {
      id: studentId,
      surname: surname.trim(),
      otherNames: otherNames.trim(),
      phoneNumber: phoneNumber.trim(),
      nationalId: nationalId.trim(),
      nationality: nationality.trim(),
      presentAddress: presentAddress.trim(),
      dateOfBirth,
      gender,
      guardianFullName: guardianFullName.trim(),
      guardianOccupation: guardianOccupation.trim(),
      guardianPhoneNumber: guardianPhoneNumber.trim(),
      customFields: customFields || null,
      classroomId: classroomId || null,
    };

    // Insert the student into the database
    const result = await db.insert(student).values(studentData).returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "Failed to create student record" },
        { status: 500 },
      );
    }

    const newStudent = result[0];

    return NextResponse.json({
      success: true,
      message: "Student admitted successfully",
      student: {
        id: newStudent.id,
        surname: newStudent.surname,
        otherNames: newStudent.otherNames,
        phoneNumber: newStudent.phoneNumber,
        nationalId: newStudent.nationalId,
        nationality: newStudent.nationality,
        presentAddress: newStudent.presentAddress,
        dateOfBirth: newStudent.dateOfBirth,
        gender: newStudent.gender,
        guardianFullName: newStudent.guardianFullName,
        guardianOccupation: newStudent.guardianOccupation,
        guardianPhoneNumber: newStudent.guardianPhoneNumber,
        customFields: newStudent.customFields,
        classroomId: newStudent.classroomId,
        createdAt: newStudent.createdAt,
      },
    });
  } catch (error) {
    console.error("Error admitting student:", error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { error: "A student with this National ID already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
