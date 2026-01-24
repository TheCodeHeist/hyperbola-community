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
    index("routine_day_of_week_idx").on(table.dayOfWeek),
  ],
);

// File attachments stored in MinIO
export const attachment = pgTable(
  "attachment",
  {
    id: serial("id").primaryKey(),
    entityType: text("entity_type").notNull(), // e.g., "student", "user", "course", "qualification"
    entityId: text("entity_id").notNull(), // ID of the entity this attachment belongs to
    fileKey: text("file_key").notNull(), // MinIO S3 key/path
    fileName: text("file_name").notNull(), // Original filename
    mimeType: text("mime_type").notNull(), // MIME type
    fileSize: integer("file_size"), // File size in bytes
    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }), // User ID who uploaded the file
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft delete timestamp
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("attachment_entity_type_idx").on(table.entityType),
    index("attachment_entity_id_idx").on(table.entityId),
    index("attachment_uploaded_by_idx").on(table.uploadedBy),
    index("attachment_file_key_idx").on(table.fileKey),
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

export const routineRelations = relations(routine, ({ one }) => ({
  classroom: one(classroom, {
    fields: [routine.classroomId],
    references: [classroom.id],
  }),
  course: one(course, {
    fields: [routine.courseId],
    references: [course.id],
  }),
}));

export const attachmentRelations = relations(attachment, ({}) => ({
  // Relations can be added based on entity types when needed
}));
