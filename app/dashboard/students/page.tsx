"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  ArrowUpDown,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

// Zod schema for student admission form
const studentAdmissionSchema = z.object({
  surname: z
    .string()
    .min(1, "Surname is required")
    .max(50, "Surname must be less than 50 characters"),
  otherNames: z
    .string()
    .min(1, "Other names are required")
    .max(100, "Other names must be less than 100 characters"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format"),
  nationalId: z
    .string()
    .min(1, "National ID is required")
    .max(20, "National ID must be less than 20 characters"),
  nationality: z
    .string()
    .min(1, "Nationality is required")
    .max(50, "Nationality must be less than 50 characters"),
  presentAddress: z
    .string()
    .min(1, "Present address is required")
    .max(200, "Address must be less than 200 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 5 && age <= 100; // Reasonable age range for students
    }, "Student must be between 5 and 100 years old"),
  gender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a gender",
  }),
  guardianFullName: z
    .string()
    .min(1, "Guardian full name is required")
    .max(100, "Guardian name must be less than 100 characters"),
  guardianOccupation: z
    .string()
    .min(1, "Guardian occupation is required")
    .max(50, "Occupation must be less than 50 characters"),
  guardianPhoneNumber: z
    .string()
    .min(1, "Guardian phone number is required")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format"),
  customFields: z.record(z.string(), z.string()).optional(), // Optional custom fields as key-value pairs
});

type StudentFormData = z.infer<typeof studentAdmissionSchema>;

type Student = {
  id: string;
  surname: string;
  otherNames: string;
  phoneNumber: string;
  nationalId: string;
  nationality: string;
  presentAddress: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  guardianFullName: string;
  guardianOccupation: string;
  guardianPhoneNumber: string;
  classroomName: string;
  qualificationName: string;
  enrolledCourses: string[];
  createdAt: string;
  customFields?: Record<string, string>;
};

// Type for Course
type Course = {
  id: string;
  name: string;
  description: string | null;
  qualificationId: string;
  qualificationName: string;
  createdAt: string;
  updatedAt: string;
};

// Type for Classroom
type Classroom = {
  id: string;
  name: string;
  qualificationId: string;
  qualificationName: string;
  scheduleInfo: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [customFields, setCustomFields] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fetch students from the database
  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch students");
      }

      setStudents(result.students);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  // Load students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch courses and classrooms when enrollment form is opened
  useEffect(() => {
    if (showEnrollmentForm) {
      const fetchCoursesAndClassrooms = async () => {
        try {
          const [coursesResponse, classroomsResponse] = await Promise.all([
            fetch("/api/courses"),
            fetch("/api/classrooms"),
          ]);

          const coursesResult = await coursesResponse.json();
          const classroomsResult = await classroomsResponse.json();

          if (coursesResponse.ok) {
            setCourses(coursesResult || []);
          }
          if (classroomsResponse.ok) {
            setClassrooms(classroomsResult || []);
          }
        } catch (error) {
          console.error("Error fetching courses and classrooms:", error);
          toast.error("Failed to load enrollment options");
        }
      };

      fetchCoursesAndClassrooms();
    }
  }, [showEnrollmentForm]);

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "surname",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Surname
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.original.surname}</div>
      ),
    },
    {
      accessorKey: "otherNames",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Other Names
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.original.otherNames}</div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Phone
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "nationalId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            National ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "gender",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Gender
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "enrolledCourses",
      header: "Enrolled Courses",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.enrolledCourses.slice(0, 2).map((course) => (
            <Badge key={course} variant="outline" className="text-xs">
              {course}
            </Badge>
          ))}
          {row.original.enrolledCourses.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.original.enrolledCourses.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "guardianFullName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Guardian
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium">{row.original.guardianFullName}</div>
          <div className="text-muted-foreground">
            {row.original.guardianOccupation}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Joined
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleEnrollStudent(row.original)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Enroll
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentAdmissionSchema),
    defaultValues: {
      surname: "",
      otherNames: "",
      phoneNumber: "",
      nationalId: "",
      nationality: "",
      presentAddress: "",
      dateOfBirth: "",
      guardianFullName: "",
      guardianOccupation: "",
      guardianPhoneNumber: "",
      customFields: undefined,
    },
  });

  const watchedDateOfBirth = watch("dateOfBirth");

  const onSubmit = async (data: StudentFormData) => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    try {
      // Convert custom fields array to object
      const customFieldsObject = customFields.reduce(
        (acc, field) => {
          if (field.key.trim()) {
            acc[field.key.trim()] = field.value.trim();
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      const studentData = {
        ...data,
        customFields:
          Object.keys(customFieldsObject).length > 0
            ? customFieldsObject
            : undefined,
      };

      // Make API call to admit student
      const response = await fetch("/api/students/admit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to admit student");
      }

      // Success - show success message and reset form
      console.log("Student admitted successfully:", result.student);

      // Reset form and hide
      reset();
      setCustomFields([]);
      setShowAdmissionForm(false);

      // Refresh the students list
      await fetchStudents();

      toast.success("Student admitted successfully!");
    } catch (error) {
      console.error("Error admitting student:", error);
      toast.error(
        `Error admitting student: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollStudent = async (student: Student) => {
    setSelectedStudent(student);
    setSelectedCourses([]);
    setSelectedClassroom("");

    // Load current enrollments
    try {
      const response = await fetch(
        `/api/students/enroll?studentId=${student.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedCourses(data.enrolledCourseIds || []);
        setSelectedClassroom(data.classroomId || "");
      }
    } catch (error) {
      console.error("Error loading current enrollments:", error);
    }

    setShowEnrollmentForm(true);
  };

  const handleEnrollSubmit = async () => {
    if (!selectedStudent) return;

    setIsEnrolling(true);
    try {
      const response = await fetch("/api/students/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseIds: selectedCourses,
          classroomId: selectedClassroom || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to enroll student");
      }

      toast.success("Student enrolled successfully!");
      setShowEnrollmentForm(false);
      setSelectedStudent(null);
      setSelectedCourses([]);
      setSelectedClassroom("");

      // Refresh the students list to show updated enrollments
      await fetchStudents();
    } catch (error) {
      console.error("Error enrolling student:", error);
      toast.error(
        `Error enrolling student: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Students</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={showAdmissionForm ? "secondary" : "default"}
            onClick={() => setShowAdmissionForm(!showAdmissionForm)}
          >
            {showAdmissionForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Admission Form */}
      {showAdmissionForm && (
        <Card>
          <CardHeader>
            <CardTitle>Student Admission Form</CardTitle>
            <CardDescription>
              Enter the student&apos;s information to create a new student
              record.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surname">Surname *</Label>
                    <Input
                      id="surname"
                      placeholder="e.g., Smith"
                      {...register("surname")}
                    />
                    {errors.surname && (
                      <p className="text-sm text-red-600">
                        {errors.surname.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherNames">Other Names *</Label>
                    <Input
                      id="otherNames"
                      placeholder="e.g., John Michael"
                      {...register("otherNames")}
                    />
                    {errors.otherNames && (
                      <p className="text-sm text-red-600">
                        {errors.otherNames.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      {...register("phoneNumber")}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID *</Label>
                    <Input
                      id="nationalId"
                      placeholder="e.g., 1234567890123"
                      {...register("nationalId")}
                    />
                    {errors.nationalId && (
                      <p className="text-sm text-red-600">
                        {errors.nationalId.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      placeholder="e.g., American"
                      {...register("nationality")}
                    />
                    {errors.nationality && (
                      <p className="text-sm text-red-600">
                        {errors.nationality.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.gender && (
                      <p className="text-sm text-red-600">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <DatePicker
                      date={
                        watchedDateOfBirth
                          ? new Date(watchedDateOfBirth)
                          : undefined
                      }
                      onDateChange={(date) => {
                        setValue(
                          "dateOfBirth",
                          date
                            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                            : "",
                        );
                      }}
                      placeholder="Pick a date"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-red-600">
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presentAddress">Present Address *</Label>
                  <Textarea
                    id="presentAddress"
                    placeholder="e.g., 123 Main Street, Springfield, IL 62701"
                    {...register("presentAddress")}
                  />
                  {errors.presentAddress && (
                    <p className="text-sm text-red-600">
                      {errors.presentAddress.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Guardian Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianFullName">
                      Guardian Full Name *
                    </Label>
                    <Input
                      id="guardianFullName"
                      placeholder="e.g., Jane Smith"
                      {...register("guardianFullName")}
                    />
                    {errors.guardianFullName && (
                      <p className="text-sm text-red-600">
                        {errors.guardianFullName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianOccupation">
                      Guardian Occupation *
                    </Label>
                    <Input
                      id="guardianOccupation"
                      placeholder="e.g., Teacher"
                      {...register("guardianOccupation")}
                    />
                    {errors.guardianOccupation && (
                      <p className="text-sm text-red-600">
                        {errors.guardianOccupation.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhoneNumber">
                      Guardian Phone Number *
                    </Label>
                    <Input
                      id="guardianPhoneNumber"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      {...register("guardianPhoneNumber")}
                    />
                    {errors.guardianPhoneNumber && (
                      <p className="text-sm text-red-600">
                        {errors.guardianPhoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Custom Fields (Optional)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCustomFields([...customFields, { key: "", value: "" }])
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>
                <div className="space-y-3">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Field name (e.g., Emergency Contact)"
                          value={field.key}
                          onChange={(e) => {
                            const newFields = [...customFields];
                            newFields[index].key = e.target.value;
                            setCustomFields(newFields);
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Field value (e.g., +1234567890)"
                          value={field.value}
                          onChange={(e) => {
                            const newFields = [...customFields];
                            newFields[index].value = e.target.value;
                            setCustomFields(newFields);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomFields(
                            customFields.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No custom fields added. Click &quot;Add Field&quot; to add
                      additional information about the student.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdmissionForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Admitting..." : "Admit Student"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Enrollment Form */}
      {showEnrollmentForm && selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Enroll Student</CardTitle>
            <CardDescription>
              Enroll {selectedStudent.surname} {selectedStudent.otherNames} in
              courses and assign to a classroom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Classroom Assignment */}
              <div className="space-y-2">
                <Label>Assign to Classroom</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {classrooms.length > 0 ? (
                    classrooms.map((classroom) => (
                      <div
                        key={classroom.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="radio"
                          id={`classroom-${classroom.id}`}
                          name="classroom"
                          value={classroom.id}
                          checked={selectedClassroom === classroom.id}
                          onChange={(e) => setSelectedClassroom(e.target.value)}
                          className="rounded"
                        />
                        <label
                          htmlFor={`classroom-${classroom.id}`}
                          className="text-sm font-medium"
                        >
                          {classroom.name} ({classroom.qualificationName})
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No classrooms available
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClassroom("")}
                  className="mt-2"
                >
                  Clear Classroom Assignment
                </Button>
              </div>

              {/* Course Enrollment */}
              <div className="space-y-2">
                <Label>Enroll in Courses</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`course-${course.id}`}
                          checked={selectedCourses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourses([
                                ...selectedCourses,
                                course.id,
                              ]);
                            } else {
                              setSelectedCourses(
                                selectedCourses.filter(
                                  (id) => id !== course.id,
                                ),
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <label
                          htmlFor={`course-${course.id}`}
                          className="text-sm font-medium"
                        >
                          {course.name} ({course.qualificationName})
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No courses available
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCourses(courses.map((c) => c.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCourses([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEnrollmentForm(false);
                    setSelectedStudent(null);
                    setSelectedCourses([]);
                    setSelectedClassroom("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleEnrollSubmit}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Student"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="w-full flex grow-0 shrink-0 overflow-x-auto">
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>
            Manage and view all student information, enrollments, and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          {/* <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div> */}

          {/* Students Table */}
          <div className="container mx-auto py-2">
            <DataTable
              columns={columns}
              data={students}
              searchKey="otherNames"
              searchPlaceholder="Search students by name..."
            />
          </div>

          {/* Summary Stats */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>Showing {students.length} students</div>
            <div className="flex space-x-4">
              <span>Total Students: {students.length}</span>
              <span>
                Male: {students.filter((s) => s.gender === "Male").length}
              </span>
              <span>
                Female: {students.filter((s) => s.gender === "Female").length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
