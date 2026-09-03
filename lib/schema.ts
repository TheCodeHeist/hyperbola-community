import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  serial,
  timestamp,
  date,
  jsonb,
  integer,
  time,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const student = pgTable(
  "student",
  {
    id: text("id").primaryKey(),
    surname: text("surname").notNull(),
    otherNames: text("other_names").notNull(),
    phoneNumber: text("phone_number").notNull(),
    nationalId: text("national_id").notNull(),
    nationality: text("nationality").notNull(),
    presentAddress: text("present_address").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: text("gender").notNull(),
    guardianFullName: text("guardian_full_name").notNull(),
    guardianOccupation: text("guardian_occupation").notNull(),
    guardianPhoneNumber: text("guardian_phone_number").notNull(),
    customFields: jsonb("custom_fields"),
    profilePictureKey: text("profile_picture_key"), // MinIO file key for profile picture
    classroomId: text("classroom_id").references(() => classroom.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("student_surname_idx").on(table.surname),
    index("student_national_id_idx").on(table.nationalId),
  ],
);

// Day of week enum for routines
export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// Qualification levels (O-level, A-level, Undergrad, etc.)
export const qualification = pgTable(
  "qualification",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // e.g. "O-level", "A-level", "Undergraduate"
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("qualification_name_idx").on(table.name)],
);

// Courses within qualifications (Maths, Physics, etc.)
export const course = pgTable(
  "course",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // e.g. "Mathematics", "Physics", "Mechanics"
    description: text("description"),
    qualificationId: text("qualification_id")
      .notNull()
      .references(() => qualification.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("course_qualification_id_idx").on(table.qualificationId),
    index("course_name_idx").on(table.name),
  ],
);

// Classrooms/Batches (Morning Class, Batch A, etc.)
export const classroom = pgTable(
  "classroom",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // e.g. "Batch A", "Morning Class", "Evening Batch"
    qualificationId: text("qualification_id")
      .notNull()
      .references(() => qualification.id, { onDelete: "cascade" }),
    scheduleInfo: jsonb("schedule_info"), // Additional scheduling information
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("classroom_qualification_id_idx").on(table.qualificationId),
    index("classroom_name_idx").on(table.name),
  ],
);

// Junction table for student-course enrollments
export const studentCourseEnrollment = pgTable(
  "student_course_enrollment",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  },
  (table) => [
    index("student_course_enrollment_student_id_idx").on(table.studentId),
    index("student_course_enrollment_course_id_idx").on(table.courseId),
  ],
);

// Weekly routines for classrooms (constant schedule)
export const routine = pgTable(
  "routine",
  {
    id: text("id").primaryKey(),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classroom.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    conductedBy: text("conducted_by").references(() => user.id, {
      onDelete: "set null",
    }), // Teacher who conducts this routine
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("routine_classroom_id_idx").on(table.classroomId),
    index("routine_course_id_idx").on(table.courseId),
    index("routine_conducted_by_idx").on(table.conductedBy),
    index("routine_day_of_week_idx").on(table.dayOfWeek),
  ],
);

// Attendance status enum
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
  "pending", // For future sessions
]);

// Class sessions (actual instances of scheduled routines on specific dates)
export const classSession = pgTable(
  "class_session",
  {
    id: text("id").primaryKey(),
    routineId: text("routine_id")
      .notNull()
      .references(() => routine.id, { onDelete: "cascade" }),
    sessionDate: date("session_date").notNull(), // The actual date this session occurred
    startTime: time("start_time").notNull(), // Actual start time (might differ from routine)
    endTime: time("end_time"), // Actual end time
    status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
    notes: text("notes"), // Session-specific notes
    conductedBy: text("conducted_by").references(() => user.id, {
      onDelete: "set null",
    }), // Teacher who conducted the class
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }), // User who created this session
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("class_session_routine_id_idx").on(table.routineId),
    index("class_session_date_idx").on(table.sessionDate),
    index("class_session_status_idx").on(table.status),
    index("class_session_conducted_by_idx").on(table.conductedBy),
  ],
);

// Attendance records for each student in each class session
export const attendance = pgTable(
  "attendance",
  {
    id: text("id").primaryKey(),
    classSessionId: text("class_session_id")
      .notNull()
      .references(() => classSession.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull().default("pending"),
    checkInTime: timestamp("check_in_time"), // When student checked in (if applicable)
    checkOutTime: timestamp("check_out_time"), // When student checked out (if applicable)
    notes: text("notes"), // Individual attendance notes
    markedBy: text("marked_by").references(() => user.id, {
      onDelete: "set null",
    }), // User who marked this attendance
    markedAt: timestamp("marked_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("attendance_class_session_id_idx").on(table.classSessionId),
    index("attendance_student_id_idx").on(table.studentId),
    index("attendance_status_idx").on(table.status),
    index("attendance_marked_by_idx").on(table.markedBy),
    // Composite unique constraint to prevent duplicate attendance records
    index("attendance_session_student_unique").on(
      table.classSessionId,
      table.studentId,
    ),
  ],
);

// Relations
export const qualificationRelations = relations(qualification, ({ many }) => ({
  courses: many(course),
  classrooms: many(classroom),
}));

export const courseRelations = relations(course, ({ one, many }) => ({
  qualification: one(qualification, {
    fields: [course.qualificationId],
    references: [qualification.id],
  }),
  enrollments: many(studentCourseEnrollment),
  routines: many(routine),
}));

export const classroomRelations = relations(classroom, ({ one, many }) => ({
  qualification: one(qualification, {
    fields: [classroom.qualificationId],
    references: [qualification.id],
  }),
  students: many(student),
  routines: many(routine),
}));

export const studentRelations = relations(student, ({ one, many }) => ({
  classroom: one(classroom, {
    fields: [student.classroomId],
    references: [classroom.id],
  }),
  courseEnrollments: many(studentCourseEnrollment),
}));

export const studentCourseEnrollmentRelations = relations(
  studentCourseEnrollment,
  ({ one }) => ({
    student: one(student, {
      fields: [studentCourseEnrollment.studentId],
      references: [student.id],
    }),
    course: one(course, {
      fields: [studentCourseEnrollment.courseId],
      references: [course.id],
    }),
  }),
);

export const routineRelations = relations(routine, ({ one, many }) => ({
  classroom: one(classroom, {
    fields: [routine.classroomId],
    references: [classroom.id],
  }),
  course: one(course, {
    fields: [routine.courseId],
    references: [course.id],
  }),
  conductedByUser: one(user, {
    fields: [routine.conductedBy],
    references: [user.id],
  }),
  classSessions: many(classSession),
}));

export const classSessionRelations = relations(
  classSession,
  ({ one, many }) => ({
    routine: one(routine, {
      fields: [classSession.routineId],
      references: [routine.id],
    }),
    attendances: many(attendance),
    conductedByUser: one(user, {
      fields: [classSession.conductedBy],
      references: [user.id],
    }),
    createdByUser: one(user, {
      fields: [classSession.createdBy],
      references: [user.id],
    }),
  }),
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  classSession: one(classSession, {
    fields: [attendance.classSessionId],
    references: [classSession.id],
  }),
  student: one(student, {
    fields: [attendance.studentId],
    references: [student.id],
  }),
  markedByUser: one(user, {
    fields: [attendance.markedBy],
    references: [user.id],
  }),
}));

// export const attachmentRelations = relations(attachment, ({}) => ({
//   // Relations can be added based on entity types when needed
// }));
