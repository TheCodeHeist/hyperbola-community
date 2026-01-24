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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeeklySchedule } from "@/components/ui/weekly-schedule";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Zod schema for routine form
const routineSchema = z
  .object({
    classroomId: z.string().min(1, "Classroom is required"),
    courseId: z.string().min(1, "Course is required"),
    dayOfWeek: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      const start = new Date(`1970-01-01T${data.startTime}`);
      const end = new Date(`1970-01-01T${data.endTime}`);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

// Type for form data
type RoutineFormData = z.infer<typeof routineSchema>;

// Type for routine
type Routine = {
  id: string;
  classroomId: string;
  courseId: string;
  dayOfWeek:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  classroomName: string;
  courseName: string;
};

// Type for classroom (for dropdown)
type Classroom = {
  id: string;
  name: string;
  qualificationName: string;
};

// Type for course (for dropdown)
type Course = {
  id: string;
  name: string;
  qualificationName: string;
};

const dayLabels = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
  });

  // Fetch routines, classrooms, and courses
  const fetchRoutines = async () => {
    try {
      const response = await fetch("/api/routines");
      if (response.ok) {
        const data = await response.json();
        setRoutines(data.routines);
      } else {
        toast.error("Failed to fetch routines");
      }
    } catch (error) {
      console.error("Error fetching routines:", error);
      toast.error("Failed to fetch routines");
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await fetch("/api/classrooms");
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data || []);
      } else {
        toast.error("Failed to fetch classrooms");
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Failed to fetch classrooms");
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data || []);
      } else {
        toast.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchRoutines(), fetchClassrooms(), fetchCourses()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (data: RoutineFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingRoutine
        ? `/api/routines/${editingRoutine.id}`
        : "/api/routines";

      const method = editingRoutine ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          editingRoutine
            ? "Routine updated successfully"
            : "Routine created successfully",
        );
        setShowForm(false);
        setEditingRoutine(null);
        reset();
        fetchRoutines();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save routine");
      }
    } catch (error) {
      console.error("Error saving routine:", error);
      toast.error("Failed to save routine");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setValue("classroomId", routine.classroomId);
    setValue("courseId", routine.courseId);
    setValue("dayOfWeek", routine.dayOfWeek);
    setValue("startTime", routine.startTime);
    setValue("endTime", routine.endTime);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this routine?")) {
      return;
    }

    try {
      const response = await fetch(`/api/routines/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Routine deleted successfully");
        fetchRoutines();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete routine");
      }
    } catch (error) {
      console.error("Error deleting routine:", error);
      toast.error("Failed to delete routine");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingRoutine(null);
    reset();
  };

  // Table columns
  const columns: ColumnDef<Routine>[] = [
    {
      accessorKey: "courseName",
      header: "Course",
    },
    {
      accessorKey: "classroomName",
      header: "Classroom",
    },
    {
      accessorKey: "dayOfWeek",
      header: "Day",
      cell: ({ row }) =>
        dayLabels[row.getValue("dayOfWeek") as keyof typeof dayLabels],
    },
    {
      accessorKey: "startTime",
      header: "Start Time",
      cell: ({ row }) => {
        const time = row.getValue("startTime") as string;
        return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      accessorKey: "endTime",
      header: "End Time",
      cell: ({ row }) => {
        const time = row.getValue("endTime") as string;
        return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const routine = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(routine)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(routine.id)}
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
        <div className="text-lg">Loading routines...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden space-y-4 p-4 md:p-8 pt-6 max-w-full min-w-auto max-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Class Routines</h2>
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
                Add Routine
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
              {editingRoutine ? "Edit Routine" : "Add New Routine"}
            </CardTitle>
            <CardDescription>
              {editingRoutine
                ? "Update the class routine details"
                : "Schedule a course in a classroom at specific times"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classroomId">Classroom *</Label>
                  <Select
                    value={watch("classroomId")}
                    onValueChange={(value) => setValue("classroomId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.name} ({classroom.qualificationName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classroomId && (
                    <p className="text-sm text-red-600">
                      {errors.classroomId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseId">Course *</Label>
                  <Select
                    value={watch("courseId")}
                    onValueChange={(value) => setValue("courseId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.qualificationName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.courseId && (
                    <p className="text-sm text-red-600">
                      {errors.courseId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day of Week *</Label>
                  <Select
                    value={watch("dayOfWeek")}
                    onValueChange={(
                      value:
                        | "monday"
                        | "tuesday"
                        | "wednesday"
                        | "thursday"
                        | "friday"
                        | "saturday"
                        | "sunday",
                    ) => setValue("dayOfWeek", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dayLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.dayOfWeek && (
                    <p className="text-sm text-red-600">
                      {errors.dayOfWeek.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register("startTime")}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-600">
                        {errors.startTime.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input id="endTime" type="time" {...register("endTime")} />
                    {errors.endTime && (
                      <p className="text-sm text-red-600">
                        {errors.endTime.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingRoutine
                      ? "Updating..."
                      : "Creating..."
                    : editingRoutine
                      ? "Update Routine"
                      : "Create Routine"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="w-full flex grow-0 shrink-0 overflow-x-auto">
        <CardHeader>
          <CardTitle>Routine Management</CardTitle>
          <CardDescription>
            View and manage all class schedules and routines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4">
              {/* Routines Table */}
              <div className="container mx-auto py-2">
                <DataTable
                  columns={columns}
                  data={routines}
                  searchKey="courseName"
                  searchPlaceholder="Search routines..."
                />
              </div>

              {/* Summary Stats */}
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>Showing {routines.length} routines</div>
                <div className="flex space-x-4">
                  <span>Total Routines: {routines.length}</span>
                  <span>
                    Unique Classrooms:{" "}
                    {new Set(routines.map((r) => r.classroomId)).size}
                  </span>
                  <span>
                    Unique Courses: {new Set(routines.map((r) => r.courseId)).size}
                  </span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="mt-4">
              {/* Weekly Calendar View */}
              <div className="container mx-auto py-2">
                <WeeklySchedule routines={routines} />
              </div>

              {/* Summary Stats for Calendar */}
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>Showing {routines.length} routines in calendar view</div>
                <div className="flex space-x-4">
                  <span>Total Routines: {routines.length}</span>
                  <span>
                    Unique Classrooms:{" "}
                    {new Set(routines.map((r) => r.classroomId)).size}
                  </span>
                  <span>
                    Unique Courses: {new Set(routines.map((r) => r.courseId)).size}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
