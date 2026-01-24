"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, MoreHorizontal, Edit, Trash2, X } from "lucide-react";
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
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

// Zod schema for course form
const courseSchema = z.object({
  name: z
    .string()
    .min(1, "Course name is required")
    .max(100, "Course name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  qualificationId: z.string().min(1, "Qualification is required"),
});

// Type for form data
type CourseFormData = z.infer<typeof courseSchema>;

// Type for course
type Course = {
  id: string;
  name: string;
  description: string | null;
  qualificationId: string;
  qualificationName: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    enrollments: number;
    routines: number;
  };
};

// Type for qualification (for dropdown)
type Qualification = {
  id: string;
  name: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  // Fetch courses and qualifications
  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        toast.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
    }
  };

  const fetchQualifications = async () => {
    try {
      const response = await fetch("/api/qualifications");
      if (response.ok) {
        const data = await response.json();
        setQualifications(data);
      } else {
        toast.error("Failed to fetch qualifications");
      }
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      toast.error("Failed to fetch qualifications");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchCourses(), fetchQualifications()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingCourse
        ? `/api/courses/${editingCourse.id}`
        : "/api/courses";

      const method = editingCourse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          editingCourse
            ? "Course updated successfully"
            : "Course created successfully",
        );
        setShowForm(false);
        setEditingCourse(null);
        reset();
        fetchCourses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save course");
      }
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setValue("name", course.name);
    setValue("description", course.description || "");
    setValue("qualificationId", course.qualificationId);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Course deleted successfully");
        fetchCourses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingCourse(null);
    reset();
  };

  // Table columns
  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "name",
      header: "Course Name",
    },
    {
      accessorKey: "qualificationName",
      header: "Qualification",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("description") || "No description"}
        </div>
      ),
    },
    {
      accessorKey: "_count.enrollments",
      header: "Enrolled Students",
      cell: ({ row }) => row.original._count?.enrollments || 0,
    },
    {
      accessorKey: "_count.routines",
      header: "Scheduled Classes",
      cell: ({ row }) => row.original._count?.routines || 0,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(course)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(course.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden space-y-4 p-4 md:p-8 pt-6 max-w-full min-w-auto max-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Courses</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={showForm ? "secondary" : "default"}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCourse ? "Edit Course" : "Add New Course"}
            </CardTitle>
            <CardDescription>
              {editingCourse
                ? "Update the course details"
                : "Create a new course within a qualification"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Mathematics, Physics, Chemistry"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualificationId">Qualification *</Label>
                  <Select
                    value={watch("qualificationId")}
                    onValueChange={(value) =>
                      setValue("qualificationId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      {qualifications.map((qualification) => (
                        <SelectItem
                          key={qualification.id}
                          value={qualification.id}
                        >
                          {qualification.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.qualificationId && (
                    <p className="text-sm text-red-600">
                      {errors.qualificationId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description of the course"
                    rows={3}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingCourse
                      ? "Updating..."
                      : "Creating..."
                    : editingCourse
                      ? "Update Course"
                      : "Create Course"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="w-full flex grow-0 shrink-0 overflow-x-auto">
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>
            View and manage all courses within qualifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Courses Table */}
          <div className="container mx-auto py-2">
            <DataTable
              columns={columns}
              data={courses}
              searchKey="name"
              searchPlaceholder="Search courses..."
            />
          </div>

          {/* Summary Stats */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>Showing {courses.length} courses</div>
            <div className="flex space-x-4">
              <span>Total Courses: {courses.length}</span>
              <span>
                Active Enrollments:{" "}
                {courses.reduce(
                  (sum, course) => sum + (course._count?.enrollments || 0),
                  0,
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
