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
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

// Zod schema for classroom form
const classroomSchema = z.object({
  name: z
    .string()
    .min(1, "Classroom name is required")
    .max(100, "Classroom name must be less than 100 characters"),
  qualificationId: z.string().min(1, "Qualification is required"),
});

// Type for form data
type ClassroomFormData = z.infer<typeof classroomSchema>;

// Type for classroom
type Classroom = {
  id: string;
  name: string;
  qualificationId: string;
  qualificationName: string;
  scheduleInfo: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
    routines: number;
  };
};

// Type for qualification (for dropdown)
type Qualification = {
  id: string;
  name: string;
};

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
  });

  // Fetch classrooms and qualifications
  const fetchClassrooms = async () => {
    try {
      const response = await fetch("/api/classrooms");
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
      } else {
        toast.error("Failed to fetch classrooms");
      }
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      toast.error("Failed to fetch classrooms");
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
      await Promise.all([fetchClassrooms(), fetchQualifications()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (data: ClassroomFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingClassroom
        ? `/api/classrooms/${editingClassroom.id}`
        : "/api/classrooms";

      const method = editingClassroom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          editingClassroom
            ? "Classroom updated successfully"
            : "Classroom created successfully",
        );
        setShowForm(false);
        setEditingClassroom(null);
        reset();
        fetchClassrooms();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save classroom");
      }
    } catch (error) {
      console.error("Error saving classroom:", error);
      toast.error("Failed to save classroom");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom);
    setValue("name", classroom.name);
    setValue("qualificationId", classroom.qualificationId);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this classroom?")) {
      return;
    }

    try {
      const response = await fetch(`/api/classrooms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Classroom deleted successfully");
        fetchClassrooms();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete classroom");
      }
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast.error("Failed to delete classroom");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingClassroom(null);
    reset();
  };

  // Table columns
  const columns: ColumnDef<Classroom>[] = [
    {
      accessorKey: "name",
      header: "Classroom Name",
    },
    {
      accessorKey: "qualificationName",
      header: "Qualification",
    },
    {
      accessorKey: "_count.students",
      header: "Enrolled Students",
      cell: ({ row }) => row.original._count?.students || 0,
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
        const classroom = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(classroom)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(classroom.id)}
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
        <div className="text-lg">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden space-y-4 p-4 md:p-8 pt-6 max-w-full min-w-auto max-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Classrooms</h2>
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
                Add Classroom
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
              {editingClassroom ? "Edit Classroom" : "Add New Classroom"}
            </CardTitle>
            <CardDescription>
              {editingClassroom
                ? "Update the classroom details"
                : "Create a new classroom for a qualification"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Classroom Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Batch A, Morning Class, Evening Batch"
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
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingClassroom
                      ? "Updating..."
                      : "Creating..."
                    : editingClassroom
                      ? "Update Classroom"
                      : "Create Classroom"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="w-full flex grow-0 shrink-0 overflow-x-auto">
        <CardHeader>
          <CardTitle>Classroom Management</CardTitle>
          <CardDescription>
            View and manage all classrooms within qualifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Classrooms Table */}
          <div className="container mx-auto py-2">
            <DataTable
              columns={columns}
              data={classrooms}
              searchKey="name"
              searchPlaceholder="Search classrooms..."
            />
          </div>

          {/* Summary Stats */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>Showing {classrooms.length} classrooms</div>
            <div className="flex space-x-4">
              <span>Total Classrooms: {classrooms.length}</span>
              <span>
                Total Students:{" "}
                {classrooms.reduce(
                  (sum, classroom) => sum + (classroom._count?.students || 0),
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
