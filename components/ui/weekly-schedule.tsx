"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

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

interface WeeklyScheduleProps {
  routines: Routine[];
}

const dayLabels = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Calendar configuration
const CALENDAR_START_HOUR = 6; // 6 AM
const CALENDAR_END_HOUR = 22; // 10 PM
const CALENDAR_HEIGHT = 720; // pixels for the entire calendar (increased for better visibility)

// Helper functions for time calculations
const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToPixels = (minutes: number, totalMinutes: number): number => {
  return (minutes / totalMinutes) * CALENDAR_HEIGHT;
};

const getRoutinePosition = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime) - CALENDAR_START_HOUR * 60;
  const endMinutes = timeToMinutes(endTime) - CALENDAR_START_HOUR * 60;

  const top = minutesToPixels(
    startMinutes,
    (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60,
  );
  const height = Math.max(
    minutesToPixels(
      endMinutes - startMinutes,
      (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60,
    ),
    20,
  ); // minimum height

  return { top, height };
};

// Generate hour markers
const generateHourMarkers = () => {
  const markers = [];
  for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour++) {
    markers.push(hour);
  }
  return markers;
};

export function WeeklySchedule({ routines }: WeeklyScheduleProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(
    null,
  );
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  );
  const hourMarkers = generateHourMarkers();

  // Update current time position in real-time
  useEffect(() => {
    let animationFrame: number;

    const updateCurrentTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();

      // Update time display
      setCurrentTimeDisplay(
        now.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );

      // Only show current time indicator if we're within calendar hours
      if (
        currentHour < CALENDAR_START_HOUR ||
        currentHour >= CALENDAR_END_HOUR
      ) {
        setCurrentTimePosition(null);
      } else {
        const currentMinutes =
          (currentHour - CALENDAR_START_HOUR) * 60 +
          currentMinute +
          currentSecond / 60;
        const totalCalendarMinutes =
          (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
        const top = (currentMinutes / totalCalendarMinutes) * CALENDAR_HEIGHT;

        setCurrentTimePosition(top);
      }

      // Continue the animation loop
      animationFrame = requestAnimationFrame(updateCurrentTime);
    };

    // Start the animation loop
    animationFrame = requestAnimationFrame(updateCurrentTime);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 1 = Monday

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "next" ? 7 : -7;
    setCurrentWeek(addDays(currentWeek, days));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Check if a day is today
  const isToday = (dayIndex: number) => {
    const today = new Date();
    const dayDate = addDays(weekStart, dayIndex);
    return (
      dayDate.getDate() === today.getDate() &&
      dayDate.getMonth() === today.getMonth() &&
      dayDate.getFullYear() === today.getFullYear()
    );
  };

  // Group routines by day
  const getRoutinesForDay = (dayOfWeek: string) => {
    return routines.filter((routine) => routine.dayOfWeek === dayOfWeek);
  };

  // Handle overlapping routines by calculating their positions
  const getRoutineLayout = (dayRoutines: Routine[]) => {
    const sortedRoutines = dayRoutines.sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
    );

    return sortedRoutines.map((routine, index) => {
      const position = getRoutinePosition(routine.startTime, routine.endTime);

      // Simple overlap handling - for now, just stack them with slight offset
      // In a more advanced version, we could implement proper collision detection
      const overlaps = sortedRoutines.filter(
        (r) =>
          r.id !== routine.id &&
          timeToMinutes(r.startTime) < timeToMinutes(routine.endTime) &&
          timeToMinutes(r.endTime) > timeToMinutes(routine.startTime),
      );

      const overlapIndex = overlaps.length > 0 ? index % 2 : 0; // Simple alternating for overlaps
      const width = overlaps.length > 0 ? "calc(50% - 2px)" : "100%";
      const left = overlaps.length > 0 ? `${overlapIndex * 50}%` : "0%";

      return {
        ...routine,
        ...position,
        width,
        left,
        zIndex: 10 + index,
      };
    });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Week of {format(weekStart, "MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-w-full">
          <div className="w-full min-w-200 max-w-none">
            {/* Header with days */}
            <div className="flex mb-2">
              <div className="w-20 p-2 font-medium text-sm text-muted-foreground shrink-0">
                Time
              </div>
              {dayOrder.map((day, dayIndex) => (
                <div
                  key={day}
                  className={`flex-1 p-2 font-medium text-sm text-center border-b border-border ${
                    isToday(dayIndex)
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : ""
                  }`}
                >
                  {dayLabels[day as keyof typeof dayLabels]}
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(addDays(weekStart, dayIndex), "MMM d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="relative flex" style={{ height: CALENDAR_HEIGHT }}>
              {/* Time Column */}
              <div className="w-20 shrink-0 relative">
                {hourMarkers.map((hour) => {
                  const top = minutesToPixels(
                    (hour - CALENDAR_START_HOUR) * 60,
                    (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60,
                  );
                  return (
                    <div
                      key={hour}
                      className="absolute right-2 text-xs text-muted-foreground text-right pr-1"
                      style={{ top: top - 6 }}
                    >
                      {new Date(1970, 0, 1, hour).toLocaleTimeString([], {
                        hour: "numeric",
                        hour12: true,
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Calendar Days Grid */}
              <div className="flex-1 relative">
                {/* Grid lines */}
                {hourMarkers.map((hour) => {
                  const top = minutesToPixels(
                    (hour - CALENDAR_START_HOUR) * 60,
                    (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60,
                  );
                  return (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-border h-px"
                      style={{ top }}
                    ></div>
                  );
                })}

                {/* Current time indicator */}
                {currentTimePosition !== null && currentTimeDisplay && (
                  <div
                    className="absolute w-full border-t-2 border-primary z-20"
                    style={{ top: currentTimePosition }}
                  >
                    <div className="absolute left-0 -top-1 w-2 h-2 bg-primary rounded-full"></div>
                    <div className="absolute right-0 -top-2 text-xs font-medium text-primary bg-background px-1 rounded shadow-sm">
                      {currentTimeDisplay}
                    </div>
                  </div>
                )}

                {/* Day columns */}
                {dayOrder.map((day, dayIndex) => {
                  const dayRoutines = getRoutinesForDay(day);
                  const layoutRoutines = getRoutineLayout(dayRoutines);

                  return (
                    <div
                      key={day}
                      className="absolute top-0 border-r border-border last:border-r-0"
                      style={{
                        left: `${(dayIndex / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        height: "100%",
                      }}
                    >
                      {/* Render routines for this day */}
                      {layoutRoutines.map((routine) => (
                        <div
                          key={routine.id}
                          className="absolute bg-blue-100 border border-blue-200 rounded p-2 text-xs overflow-hidden hover:bg-blue-200 transition-colors cursor-pointer shadow-sm"
                          style={{
                            top: `${routine.top}px`,
                            height: `${routine.height}px`,
                            width: routine.width,
                            left: routine.left,
                            zIndex: routine.zIndex,
                          }}
                          title={`${routine.courseName} - ${routine.classroomName} (${formatTimeRange(routine.startTime, routine.endTime)})`}
                        >
                          <div className="font-medium text-blue-900 truncate">
                            {routine.courseName}
                          </div>
                          <div className="text-blue-700 truncate">
                            {routine.classroomName}
                          </div>
                          <div className="text-blue-600 text-xs mt-1">
                            {formatTimeRange(
                              routine.startTime,
                              routine.endTime,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Class Schedule</span>
          </div>
          <div className="text-muted-foreground">
            Total routines: {routines.length}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
