# Flexible Routine Scheduling System - Implementation Plan

## Context
Currently, routines are rigid: they bind a single classroom + course to a specific day of week with fixed times. The user wants flexibility for:
1. **Recurring patterns** (Mon/Wed/Fri, weekdays, multiple days)
2. **Date-range scheduling** (routines that run for a semester, with start/end dates)
3. **Course-independent routines** (schedule time slots without specifying the course)
4. **Batch scheduling** (create multiple routines at once with templating)
5. **Subject/Topic-based flexibility** (schedule by subject area, not just specific courses)

This unlocks scheduling scenarios like:
- "Every Mon/Wed/Fri at 9am" instead of creating 3 separate routines
- "Physics for A-level (any specific course)" instead of locking to Advanced Physics
- "Free study slot" (no course, just reserve a classroom time)
- "Create the same schedule for all A-level classrooms"

## Proposed Architecture

### 1. Schema Changes (lib/schema.ts)

**New `subject` table** (for requirement #7):
- Allows courses to be grouped by subject area
- Enables scheduling by subject instead of specific course
- Example: "Physics" subject contains "Advanced Physics", "Physics Mechanics", etc.

**Extended `routine` table fields**:
- `recurrencePattern` (jsonb): Store recurrence rule
  - `type`: "single" | "weekly" | "custom"
  - `weekDays`: string[] (e.g., ["monday", "wednesday", "friday"])
  - `customDates`: date[] (specific dates for one-off classes)
  - `frequency`: "weekly" | "biweekly" | etc.
  
- `validFrom` (date, nullable): When routine starts being active
- `validTo` (date, nullable): When routine stops being active
- `subjectId` (text, nullable, FK to subject): Allow subject-based scheduling instead of courseId
- `isCourseRequired` (boolean): If false, routine is just a time slot (no specific course)
- `isTemplate` (boolean): If true, used as a template for batch creation

**New `routine_instance` table** (materialized view alternative):
- When fetching routines for a specific date range, expand recurrence patterns into individual instances
- This allows the UI to show "All occurrences" and helps with conflict detection

### 2. API Changes

**POST /api/routines** (enhanced):
- Accept recurrence pattern in request body
- Validate that if `recurrencePattern` is provided, expand into multiple time slots for conflict checking
- Support `batchTemplate` mode: create one routine + auto-populate similar routines for other classrooms
- Return expanded instances if recurrence is multi-day

**GET /api/routines** (enhanced):
- Accept `dateRange` query param (from-to dates) to expand recurring routines
- Return either single records OR expanded instances based on client preference
- Example: `?expandRecurrence=true&from=2026-09-01&to=2026-12-31`

**PUT /api/routines/[id]** (enhanced):
- Support updating recurrence pattern
- Handle "update this and future" vs "update all instances" choices

### 3. Frontend Changes (app/dashboard/routines/page.tsx)

**New form sections**:
- **Scheduling type toggle**: "Single class" vs "Recurring" vs "Subject-based"
- **Recurrence picker**: 
  - Checkboxes for days (Mon, Tue, Wed, etc.)
  - Preset buttons: "Weekdays", "Every day", "Custom dates"
  - Start/end date fields
- **Subject vs Course selector**:
  - Toggle between "Specific course" and "Subject area"
  - If subject selected, show which courses fall under it
- **Course requirement checkbox**: "This is just a time slot (no specific course)"
- **Batch creation**:
  - Checkbox: "Apply this schedule to other classrooms"
  - Filter: Select which classrooms to apply to

**Updated table display**:
- Show recurrence pattern in a readable format: "Mon/Wed/Fri 9:00-10:00"
- Show date range if applicable: "Sep 1, 2026 - Dec 15, 2026"
- Show subject if applicable
- Expand/collapse recurring routines to see all instances

### 4. Conflict Detection Strategy

**For recurring routines**:
- When validating a new routine, expand recurrence pattern into actual dates
- Check each expanded instance against existing routines in the classroom
- For teacher conflicts, check against all instances of teacher's existing routines
- Show user which specific dates have conflicts (not just "conflict exists")

### 5. Implementation Sequence (User Preferences Applied)

**Phase 1: Recurrence patterns (enables #1, #2)** — START HERE
- Add recurrence fields to routine schema: `recurrencePattern` (jsonb), `validFrom`, `validTo`
- Update routine API to accept recurrence patterns
- Implement recurrence expansion logic (convert pattern to date instances)
- Update conflict detection to handle all expanded instances (critical: check each date)
- Basic UI: checkboxes for days (Mon/Tue/Wed/etc.), date range fields
- **Edit behavior**: When editing recurring routine, update ALL instances together

**Phase 2: Course-independent routines (enables #3)**
- Make `courseId` optional in routine table
- Add `isCourseRequired` boolean field
- Update conflict detection (skip course validation if not required)
- Add checkbox in form: "This is a free time slot"

**Phase 3: Batch scheduling (enables #6)**
- Add `isTemplate` field to routine
- Create `/api/routines/batch` endpoint to create multiple routines (one per selected classroom)
- **Conflict handling**: Warn user which classrooms have conflicts; let them manually select which classrooms to apply routine to
- Add UI: checkbox "Apply to other classrooms" + classroom multiselect
- Show preview of which classrooms will be affected and any conflicts

**Phase 4: Subject system (enables #7)** — DEFERRED
- Will add in future phase; focus on recurrence flexibility first
- Courses remain the primary scheduling unit for now

**Phase 5: UI Polish**
- Expandable recurring routine view (show pattern collapsed by default, click to expand all instances)
- Advanced recurrence picker (more presets, custom date entry)
- Conflict display for recurring routines (show which specific dates conflict)

## Critical Files to Modify

**Phase 1 (Recurrence)**:
- `lib/schema.ts` — Add recurrence fields to routine table: `recurrencePattern` (jsonb), `validFrom` (date), `validTo` (date)
- `app/api/routines/route.ts` — Accept recurrence in POST, expand patterns for conflict checking, return expanded instances
- `app/api/routines/[id]/route.ts` — Handle PUT with recurrence updates (update all instances), expand for conflict detection
- `app/dashboard/routines/page.tsx` — Add recurrence picker UI (day checkboxes, date range fields), update table to show pattern format

**Phase 2 (Course-independent)**:
- `lib/schema.ts` — Make `courseId` nullable, add `isCourseRequired` boolean
- `app/api/routines/route.ts` — Update validation to allow courseId to be null
- `app/dashboard/routines/page.tsx` — Add checkbox "This is a free time slot"

**Phase 3 (Batch)**:
- `app/api/routines/batch.ts` (new endpoint) — Accept template routine + classroom list, validate conflicts per classroom, create routines
- `app/dashboard/routines/page.tsx` — Add multiselect for classrooms, show conflict preview before batch creation

**Optional migrations**:
- `drizzle/migrations/` — If using migrations, create one for schema changes

## Verification

1. **Schema validation**: Confirm new routine fields exist (`recurrencePattern`, `validFrom`, `validTo`)
2. **API tests**:
   - Create recurring routine with pattern `{type: "weekly", weekDays: ["monday", "wednesday", "friday"]}` over a date range
   - Verify API returns all 3 instances when fetching with conflict detection
   - Verify conflict detection checks all instances (not just one)
   - Verify editing recurring routine updates all instances
   - Create course-independent routine (courseId null, isCourseRequired false) — verify it saves and displays
   - Create batch routine for 2 classrooms; verify both get the same schedule or correct conflicts flagged
3. **UI tests**:
   - Form accepts recurrence pattern (day checkboxes, date range)
   - Table displays "Mon/Wed/Fri 9-10am, Sep 1 - Dec 15" format
   - Can expand recurring routine to show individual instances
   - Conflict warnings show specific conflicting dates
   - Batch creation shows preview and conflict warnings
   - Course selector becomes optional when "free time slot" is checked
4. **Integration**:
   - Create recurring routine, fetch via API, verify instances appear in conflict detection
   - Edit recurring routine, change pattern to Mon/Tue/Wed, verify old instances replaced
   - Fetch routines over date range, verify only instances in range are returned

## Design Decision: Subject vs Course

**Why add subjects?**
- Courses are specific (Advanced Physics), subjects are flexible (Physics)
- Allows "schedule Physics at 9am" without forcing a specific course variant
- Better matches how schools actually schedule (by department/subject first, then assign specific teacher)
- Subjects can be optional — existing course-based routines still work

**Example scenario**:
- Subject: "Physics" (contains courses: Advanced Physics, Physics Mechanics, Physics Fundamentals)
- Routine: "A-level Physics, Mon/Wed/Fri 9-10am" (scheduled by subject)
- Teacher assigns which specific course each student takes in that slot
- System can auto-balance students across Physics courses

This is backward-compatible: existing routines stay course-specific, new ones can be subject-based.
