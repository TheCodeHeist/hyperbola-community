"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { RecentSessions } from "@/components/attendance/recent-sessions";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { AttendanceMarking } from "@/components/attendance/attendance-marking";

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

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentSession, setCurrentSession] = useState<CurrentSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      try {
        const response = await fetch("/api/attendance/current-session");
        if (response.ok) {
          const data = await response.json();
          setCurrentSession(data);
        }
      } catch (error) {
        console.error("Failed to fetch current session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSession();
  }, []);

  return (
    <div className="overflow-x-hidden space-y-4 p-4 md:p-8 pt-6 max-w-full min-w-auto max-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AttendanceStats />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Current Session
                </CardTitle>
                <CardDescription>
                  Active class session for attendance marking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
                  </div>
                ) : currentSession?.hasCurrentSession && currentSession.session ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{currentSession.session.courseName}</p>
                        <p className="text-sm text-muted-foreground">
                          {currentSession.session.classroomName} • {currentSession.session.startTime} - {currentSession.session.endTime}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentSession.students?.length || 0} students enrolled
                        </p>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => setIsAttendanceDrawerOpen(true)}
                    >
                      Mark Attendance
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active session at the moment</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Check back during scheduled class times
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <RecentSessions />
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Calendar</CardTitle>
              <CardDescription>
                View and manage attendance across all scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
              <CardDescription>
                Generate detailed attendance reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <h3 className="font-medium">Student Reports</h3>
                      <p className="text-sm text-muted-foreground">
                        Individual student attendance history
                      </p>
                      <Button className="w-full mt-2" variant="outline">
                        Generate Report
                      </Button>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                      <h3 className="font-medium">Class Reports</h3>
                      <p className="text-sm text-muted-foreground">
                        Attendance by classroom and course
                      </p>
                      <Button className="w-full mt-2" variant="outline">
                        Generate Report
                      </Button>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                      <h3 className="font-medium">Monthly Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        Overall attendance statistics
                      </p>
                      <Button className="w-full mt-2" variant="outline">
                        Generate Report
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AttendanceMarking
        open={isAttendanceDrawerOpen}
        onOpenChange={setIsAttendanceDrawerOpen}
        sessionData={currentSession}
      />
    </div>
  );
}
