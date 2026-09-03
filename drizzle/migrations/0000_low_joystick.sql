CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused', 'pending');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"class_session_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" "attendance_status" DEFAULT 'pending' NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"notes" text,
	"marked_by" text,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_session" (
	"id" text PRIMARY KEY NOT NULL,
	"routine_id" text NOT NULL,
	"session_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"conducted_by" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"qualification_id" text NOT NULL,
	"schedule_info" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"qualification_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualification" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine" (
	"id" text PRIMARY KEY NOT NULL,
	"classroom_id" text NOT NULL,
	"course_id" text NOT NULL,
	"conducted_by" text,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" text PRIMARY KEY NOT NULL,
	"surname" text NOT NULL,
	"other_names" text NOT NULL,
	"phone_number" text NOT NULL,
	"national_id" text NOT NULL,
	"nationality" text NOT NULL,
	"present_address" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" text NOT NULL,
	"guardian_full_name" text NOT NULL,
	"guardian_occupation" text NOT NULL,
	"guardian_phone_number" text NOT NULL,
	"custom_fields" jsonb,
	"profile_picture_key" text,
	"classroom_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_course_enrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"course_id" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_session_id_class_session_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_user_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_routine_id_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_conducted_by_user_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_session" ADD CONSTRAINT "class_session_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_qualification_id_qualification_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_qualification_id_qualification_id_fk" FOREIGN KEY ("qualification_id") REFERENCES "public"."qualification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine" ADD CONSTRAINT "routine_conducted_by_user_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollment" ADD CONSTRAINT "student_course_enrollment_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollment" ADD CONSTRAINT "student_course_enrollment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "attendance_class_session_id_idx" ON "attendance" USING btree ("class_session_id");--> statement-breakpoint
CREATE INDEX "attendance_student_id_idx" ON "attendance" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_status_idx" ON "attendance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "attendance_marked_by_idx" ON "attendance" USING btree ("marked_by");--> statement-breakpoint
CREATE INDEX "attendance_session_student_unique" ON "attendance" USING btree ("class_session_id","student_id");--> statement-breakpoint
CREATE INDEX "class_session_routine_id_idx" ON "class_session" USING btree ("routine_id");--> statement-breakpoint
CREATE INDEX "class_session_date_idx" ON "class_session" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "class_session_status_idx" ON "class_session" USING btree ("status");--> statement-breakpoint
CREATE INDEX "class_session_conducted_by_idx" ON "class_session" USING btree ("conducted_by");--> statement-breakpoint
CREATE INDEX "classroom_qualification_id_idx" ON "classroom" USING btree ("qualification_id");--> statement-breakpoint
CREATE INDEX "classroom_name_idx" ON "classroom" USING btree ("name");--> statement-breakpoint
CREATE INDEX "course_qualification_id_idx" ON "course" USING btree ("qualification_id");--> statement-breakpoint
CREATE INDEX "course_name_idx" ON "course" USING btree ("name");--> statement-breakpoint
CREATE INDEX "qualification_name_idx" ON "qualification" USING btree ("name");--> statement-breakpoint
CREATE INDEX "routine_classroom_id_idx" ON "routine" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX "routine_course_id_idx" ON "routine" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "routine_conducted_by_idx" ON "routine" USING btree ("conducted_by");--> statement-breakpoint
CREATE INDEX "routine_day_of_week_idx" ON "routine" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "student_surname_idx" ON "student" USING btree ("surname");--> statement-breakpoint
CREATE INDEX "student_national_id_idx" ON "student" USING btree ("national_id");--> statement-breakpoint
CREATE INDEX "student_course_enrollment_student_id_idx" ON "student_course_enrollment" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_course_enrollment_course_id_idx" ON "student_course_enrollment" USING btree ("course_id");