import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  student,
  classroom,
  qualification,
  course,
  studentCourseEnrollment,
} from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized operation" },
        { status: 401 },
      );
    }

    // Fetch all students with their enrollments and classroom assignments
    const studentsWithEnrollments = await db
      .select({
        id: student.id,
        surname: student.surname,
        otherNames: student.otherNames,
        phoneNumber: student.phoneNumber,
        nationalId: student.nationalId,
        nationality: student.nationality,
        presentAddress: student.presentAddress,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        guardianFullName: student.guardianFullName,
        guardianOccupation: student.guardianOccupation,
        guardianPhoneNumber: student.guardianPhoneNumber,
        classroomId: student.classroomId,
        classroomName: classroom.name,
        qualificationName: qualification.name,
        createdAt: student.createdAt,
        customFields: student.customFields,
      })
      .from(student)
      .leftJoin(classroom, eq(student.classroomId, classroom.id))
      .leftJoin(qualification, eq(classroom.qualificationId, qualification.id))
      .orderBy(student.createdAt);

    // Get all course enrollments
    const enrollments = await db
      .select({
        studentId: studentCourseEnrollment.studentId,
        courseId: studentCourseEnrollment.courseId,
        courseName: course.name,
      })
      .from(studentCourseEnrollment)
      .innerJoin(course, eq(studentCourseEnrollment.courseId, course.id));

    // Group enrollments by student
    const enrollmentsByStudent = enrollments.reduce(
      (acc, enrollment) => {
        if (!acc[enrollment.studentId]) {
          acc[enrollment.studentId] = [];
        }
        acc[enrollment.studentId].push(enrollment.courseName);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    // Transform the data to match the expected format
    const formattedStudents = studentsWithEnrollments.map((student) => ({
      id: student.id,
      surname: student.surname,
      otherNames: student.otherNames,
      phoneNumber: student.phoneNumber,
      nationalId: student.nationalId,
      nationality: student.nationality,
      presentAddress: student.presentAddress,
      dateOfBirth: student.dateOfBirth as string,
      gender: student.gender,
      guardianFullName: student.guardianFullName,
      guardianOccupation: student.guardianOccupation,
      guardianPhoneNumber: student.guardianPhoneNumber,
      classroomName: student.classroomName || "Not Assigned",
      qualificationName: student.qualificationName || "Not Set",
      enrolledCourses: enrollmentsByStudent[student.id] || [],
      createdAt: student.createdAt.toISOString().split("T")[0],
      customFields: student.customFields,
    }));

    return NextResponse.json({
      success: true,
      students: formattedStudents,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
