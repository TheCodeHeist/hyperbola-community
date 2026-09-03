"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

interface AttendanceCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface SessionData {
  id: string;
  courseName: string;
  classroomName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: string;
  attendanceCount: number;
  totalStudents: number;
}

export function AttendanceCalendar({
  selectedDate,
  onDateSelect,
}: AttendanceCalendarProps) {
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        // Fetch sessions for the current month to show calendar indicators
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = format(startOfMonth, "yyyy-MM-dd");
        const endDate = format(endOfMonth, "yyyy-MM-dd");

        const response = await fetch(
          `/api/class-sessions?startDate=${startDate}&endDate=${endDate}`,
        );
        if (response.ok) {
          const data = await response.json();
          setAllSessions(data);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      }
    };

    fetchAllSessions();
  }, []);

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const daySessions = allSessions.filter(
      (session) => session.sessionDate === dateStr,
    );

    if (daySessions.length === 0) return undefined;

    const totalAttendance = daySessions.reduce(
      (sum, session) => sum + session.attendanceCount,
      0,
    );
    const totalStudents = daySessions.reduce(
      (sum, session) => sum + session.totalStudents,
      0,
    );

    const attendanceRate =
      totalStudents > 0 ? (totalAttendance / totalStudents) * 100 : 0;

    if (attendanceRate >= 90)
      return {
        status: "excellent",
        sessions: daySessions.length,
        attendanceRate,
      };
    if (attendanceRate >= 80)
      return { status: "good", sessions: daySessions.length, attendanceRate };
    if (attendanceRate >= 70)
      return {
        status: "average",
        sessions: daySessions.length,
        attendanceRate,
      };
    return { status: "poor", sessions: daySessions.length, attendanceRate };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "average":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "poor":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const selectedDateData = getDateStatus(selectedDate);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          className="rounded-md border"
          modifiers={{
            hasAttendance: (date) => getDateStatus(date) !== undefined,
          }}
          modifiersStyles={{
            hasAttendance: {
              fontWeight: "bold",
              backgroundColor: "hsl(var(--primary) / 0.1)",
            },
          }}
        />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {format(selectedDate, "MMMM dd, yyyy")}
            </CardTitle>
            <CardDescription>
              Attendance summary for selected date
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {selectedDateData.sessions}
                    </div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {selectedDateData.attendanceRate?.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avg Attendance
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Badge className={getStatusColor(selectedDateData.status)}>
                    {selectedDateData.status?.toUpperCase()} ATTENDANCE
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Session Details</h4>
                  <div className="space-y-2">
                    {allSessions
                      .filter(
                        (session) =>
                          session.sessionDate ===
                          format(selectedDate, "yyyy-MM-dd"),
                      )
                      .map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {session.courseName} - {session.classroomName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.startTime} - {session.endTime}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                session.attendanceCount ===
                                session.totalStudents
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {session.attendanceCount}/{session.totalStudents}
                            </Badge>
                            {session.attendanceCount ===
                            session.totalStudents ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No sessions scheduled for this date
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
