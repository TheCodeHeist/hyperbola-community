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
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

// Zod schema for qualification form
const qualificationSchema = z.object({
  name: z
    .string()
    .min(1, "Qualification name is required")
    .max(100, "Qualification name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

// Type for form data
type QualificationFormData = z.infer<typeof qualificationSchema>;

// Type for qualification
type Qualification = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    courses: number;
    classrooms: number;
  };
};

export default function QualificationsPage() {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQualification, setEditingQualification] =
    useState<Qualification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(qualificationSchema),
  });

  // Fetch qualifications
  const fetchQualifications = async () => {
    try {
      const response = await fetch("/api/qualifications");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched qualifications:", data);
        setQualifications(data);
      } else {
        toast.error("Failed to fetch qualifications");
      }
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      toast.error("Failed to fetch qualifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQualifications();
  }, []);

  // Handle form submission
  const onSubmit = async (data: QualificationFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingQualification
        ? `/api/qualifications/${editingQualification.id}`
        : "/api/qualifications";

      const method = editingQualification ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          editingQualification
            ? "Qualification updated successfully"
            : "Qualification created successfully",
        );
        setShowForm(false);
        setEditingQualification(null);
        reset();
        fetchQualifications();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save qualification");
      }
    } catch (error) {
      console.error("Error saving qualification:", error);
      toast.error("Failed to save qualification");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (qualification: Qualification) => {
    setEditingQualification(qualification);
    setValue("name", qualification.name);
    setValue("description", qualification.description || "");
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this qualification?")) {
      return;
    }

    try {
      console.log("Deleting qualification with id:", id);
      const response = await fetch(`/api/qualifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Qualification deleted successfully");
        fetchQualifications();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete qualification");
      }
    } catch (error) {
      console.error("Error deleting qualification:", error);
      toast.error("Failed to delete qualification");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingQualification(null);
    reset();
  };

  // Table columns
  const columns: ColumnDef<Qualification>[] = [
    {
      accessorKey: "name",
      header: "Name",
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
      accessorKey: "_count.courses",
      header: "Courses",
      cell: ({ row }) => row.original._count?.courses || 0,
    },
    {
      accessorKey: "_count.classrooms",
      header: "Classrooms",
      cell: ({ row }) => row.original._count?.classrooms || 0,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const qualification = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(qualification)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(qualification.id)}
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
        <div className="text-lg">Loading qualifications...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden space-y-4 p-4 md:p-8 pt-6 max-w-full min-w-auto max-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Qualifications</h2>
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
                Add Qualification
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
              {editingQualification
                ? "Edit Qualification"
                : "Add New Qualification"}
            </CardTitle>
            <CardDescription>
              {editingQualification
                ? "Update the qualification details"
                : "Create a new qualification level"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Qualification Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. O-level, A-level, Undergraduate"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description of the qualification"
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
                    ? editingQualification
                      ? "Updating..."
                      : "Creating..."
                    : editingQualification
                      ? "Update Qualification"
                      : "Create Qualification"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="w-full flex grow-0 shrink-0 overflow-x-auto">
        <CardHeader>
          <CardTitle>Qualification Management</CardTitle>
          <CardDescription>
            View and manage all qualification levels in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Qualifications Table */}
          <div className="container mx-auto py-2">
            <DataTable
              columns={columns}
              data={qualifications}
              searchKey="name"
              searchPlaceholder="Search qualifications..."
            />
          </div>

          {/* Summary Stats */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>Showing {qualifications.length} qualifications</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
