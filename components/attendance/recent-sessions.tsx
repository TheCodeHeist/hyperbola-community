"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, Eye } from "lucide-react";

interface RecentSession {
  id: string;
  courseName: string;
  classroomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  attendanceCount: number;
  totalStudents: number;
  conductedBy: string;
}

export function RecentSessions() {
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentSessions = async () => {
      try {
        const response = await fetch("/api/class-sessions?limit=3");
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        }
      } catch (error) {
        console.error("Failed to fetch recent sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Sessions
          </CardTitle>
          <CardDescription>
            Latest class sessions and their attendance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-32" />
                    <div className="h-3 bg-muted rounded animate-pulse w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                  <div className="h-3 bg-muted rounded animate-pulse w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Sessions
        </CardTitle>
        <CardDescription>
          Latest class sessions and their attendance status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm">
                    {session.courseName} - {session.classroomName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.date), "MMM dd, yyyy")} •{" "}
                    {session.startTime} - {session.endTime}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {session.conductedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {session.attendanceCount}/{session.totalStudents}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(
                      (session.attendanceCount / session.totalStudents) * 100,
                    )}
                    % present
                  </p>
                </div>
                {getStatusBadge(session.status)}
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" variant="outline">
          View All Sessions
        </Button>
      </CardContent>
    </Card>
  );
}
