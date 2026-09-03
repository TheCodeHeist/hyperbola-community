"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Users, Save } from "lucide-react";

interface AttendanceStatus {
  status: "present" | "absent" | "late" | "excused";
}

interface ApiStudent {
  id: string;
  attendance: AttendanceStatus;
}

interface Student {
  id: string;
  name: string;
  avatar?: string;
}

interface AttendanceMarkingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionData: CurrentSessionData | null;
}

interface CurrentSessionData {
  hasCurrentSession: boolean;
  session?: {
    id: string;
    courseName: string;
    classroomName: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
  };
  students?: Array<{
    id: string;
    name: string;
    avatar?: string;
    attendance: {
      status: string;
      checkInTime?: string;
      notes?: string;
    };
  }>;
  message?: string;
}

export function AttendanceMarking({
  open,
  onOpenChange,
  sessionData,
}: AttendanceMarkingProps) {
  const [attendance, setAttendance] = useState<
    Record<string, "present" | "absent" | "late" | "excused">
  >({});
  const [notes, setNotes] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sessionData?.hasCurrentSession && sessionData.session) {
      loadCurrentSession();
    }
  }, [open, sessionData]);

  const loadCurrentSession = () => {
    if (!sessionData?.session || !sessionData?.students) return;

    setSessionId(sessionData.session.id);
    setNotes(sessionData.session.notes || "");

    // Load existing attendance data
    const attendanceMap: Record<
      string,
      "present" | "absent" | "late" | "excused"
    > = {};

    sessionData.students.forEach((student) => {
      attendanceMap[student.id] = student.attendance.status as "present" | "absent" | "late" | "excused";
    });
    setAttendance(attendanceMap);
  };

  const handleStatusChange = (
    studentId: string,
    status: "present" | "absent" | "late" | "excused",
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    if (!sessionId) {
      console.error("No session ID available");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classSessionId: sessionId,
          attendanceData: attendance,
          notes: notes.trim() || null,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
      } else {
        console.error("Failed to save attendance");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "excused":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: "default" as const,
      absent: "destructive" as const,
      late: "secondary" as const,
      excused: "outline" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status[0].toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const attendanceSummary = {
    present: Object.values(attendance).filter((status) => status === "present")
      .length,
    absent: Object.values(attendance).filter((status) => status === "absent")
      .length,
    late: Object.values(attendance).filter((status) => status === "late")
      .length,
    excused: Object.values(attendance).filter((status) => status === "excused")
      .length,
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Mark Attendance</DrawerTitle>
          <DrawerDescription>
            {sessionData?.session ? (
              <>
                {sessionData.session.courseName} - {sessionData.session.classroomName}
                <br />
                {sessionData.session.startTime} - {sessionData.session.endTime}
              </>
            ) : (
              "Mark attendance for the current session"
            )}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {attendanceSummary.present}
                </div>
                <p className="text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {attendanceSummary.absent}
                </div>
                <p className="text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {attendanceSummary.late}
                </div>
                <p className="text-sm text-muted-foreground">Late</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {attendanceSummary.excused}
                </div>
                <p className="text-sm text-muted-foreground">Excused</p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newAttendance = Object.fromEntries(
                  (sessionData?.students || []).map((student) => [student.id, "present" as const]),
                );
                setAttendance(newAttendance);
              }}
            >
              Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newAttendance = Object.fromEntries(
                  (sessionData?.students || []).map((student) => [student.id, "absent" as const]),
                );
                setAttendance(newAttendance);
              }}
            >
              Mark All Absent
            </Button>
          </div>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(sessionData?.students || []).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(attendance[student.id])}
                      {getStatusBadge(attendance[student.id])}

                      <div className="flex gap-1">
                        <Button
                          variant={
                            attendance[student.id] === "present"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(student.id, "present")
                          }
                        >
                          P
                        </Button>
                        <Button
                          variant={
                            attendance[student.id] === "absent"
                              ? "destructive"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(student.id, "absent")
                          }
                        >
                          A
                        </Button>
                        <Button
                          variant={
                            attendance[student.id] === "late"
                              ? "secondary"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleStatusChange(student.id, "late")}
                        >
                          L
                        </Button>
                        <Button
                          variant={
                            attendance[student.id] === "excused"
                              ? "outline"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(student.id, "excused")
                          }
                        >
                          E
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
