# Hybrid Training Platform Implementation Guide

## Overview

The Chitepo School platform now supports **hybrid training** - allowing trainers to conduct physical classroom sessions while seamlessly integrating with the online learning platform. Students can join sessions either physically or remotely, and trainers can monitor progress in real-time.

## Features Implemented

### ✅ Core Functionality

1. **Session Management**
   - Create, start, pause, and end classroom sessions
   - Support for Physical, Hybrid, and Virtual session types
   - Unique 6-character session codes for easy joining
   - Session scheduling with start/end times

2. **Participant Management**
   - Students join sessions using session codes
   - Track physical vs remote participants
   - Real-time progress monitoring
   - Automatic participant tracking

3. **Trainer Dashboard**
   - View all sessions (upcoming, active, completed)
   - Create new sessions with course linking
   - Manage session settings
   - Live progress statistics

4. **Live Session Control**
   - Start/pause/end session controls
   - Update current lesson (synchronized content)
   - Real-time participant list with progress
   - Session statistics dashboard

5. **Presenter Mode**
   - Large-screen optimized interface
   - Session code prominently displayed
   - Course and lesson information
   - Perfect for classroom projection

6. **Student Join Experience**
   - Simple code-based joining
   - Physical/remote participant selection
   - Direct access to course content
   - Progress tracking

## Database Setup

### Run Migration

To create the required database tables, run:

```bash
cd backend
npx ts-node src/database/add-classroom-sessions-tables.ts
```

This creates:
- `classroom_sessions` table
- `classroom_session_participants` table

## API Endpoints

### Trainer Endpoints (Requires INSTRUCTOR role)

- `POST /api/classroom-sessions` - Create a new session
- `GET /api/classroom-sessions/trainer/my-sessions` - Get trainer's sessions
- `GET /api/classroom-sessions/:id` - Get session details
- `POST /api/classroom-sessions/:id/start` - Start a session
- `POST /api/classroom-sessions/:id/pause` - Pause a session
- `POST /api/classroom-sessions/:id/end` - End a session
- `DELETE /api/classroom-sessions/:id` - Cancel a session
- `PATCH /api/classroom-sessions/:id/lesson` - Update current lesson
- `GET /api/classroom-sessions/:id/participants` - Get participants
- `GET /api/classroom-sessions/:id/stats` - Get session statistics
- `PATCH /api/classroom-sessions/:id/settings` - Update settings

### Student Endpoints

- `GET /api/classroom-sessions/code/:code` - Get session by code
- `POST /api/classroom-sessions/join` - Join a session
- `POST /api/classroom-sessions/:id/leave` - Leave a session
- `PATCH /api/classroom-sessions/:id/progress` - Update progress

## Frontend Pages

### Trainer Pages

1. **`/trainer/classroom`** - Main dashboard
   - View all sessions
   - Create new sessions
   - Filter by status/type
   - Quick access to session management

2. **`/trainer/classroom/[sessionId]`** - Session management
   - Start/pause/end controls
   - Live progress monitor
   - Participant list
   - Course content access

3. **`/trainer/classroom/[sessionId]/presenter`** - Presenter mode
   - Large-screen optimized
   - Session code display
   - Course information
   - Perfect for projection

### Student Pages

1. **`/classroom/join`** - Join session
   - Enter session code
   - Select physical/remote
   - Access course content
   - Track progress

## Usage Guide

### For Trainers

#### Creating a Session

1. Navigate to `/trainer/classroom`
2. Click "Create Session"
3. Fill in:
   - Title and description
   - Session type (Physical/Hybrid/Virtual)
   - Start date and time
   - Venue/location
   - Max participants
   - Optional: Link to a course
4. Click "Create Session"
5. A unique 6-character code is generated (e.g., "ABC123")

#### Running a Session

1. Go to your session dashboard
2. Click "Manage" on the session
3. When ready, click "Start Session"
4. Share the session code with students
5. Monitor progress in real-time
6. Use "Open Presenter Mode" for classroom projection
7. Update current lesson as you progress
8. Click "End Session" when finished

#### Presenter Mode

1. In session management, click "Open Presenter Mode"
2. This opens a full-screen view optimized for projection
3. Session code is prominently displayed
4. Students can see current course/lesson information
5. Perfect for physical classroom settings

### For Students

#### Joining a Session

1. Navigate to `/classroom/join`
2. Enter the 6-character session code provided by trainer
3. Select if you're physically present or remote
4. Click "Join Session"
5. You'll see the session details and can access course content

#### During Session

- Your progress is automatically tracked
- You can access course content via the link
- Trainer can see your progress in real-time
- You can leave the session at any time

## Session Types

### Physical
- All students are physically present
- Trainer conducts in-person instruction
- Platform used for content delivery and tracking

### Hybrid
- Mix of physical and remote students
- Remote students join via platform
- Trainer can see both groups in progress monitor
- Synchronized content delivery

### Virtual
- Fully online session
- All participants join remotely
- Same features as hybrid but no physical presence

## Integration with Existing Features

### Courses
- Sessions can be linked to courses
- Students can access course content during session
- Progress syncs with course enrollment

### Cohorts (Future Enhancement)
- Sessions can be linked to training cohorts
- Automatic enrollment for cohort members
- Cohort-specific session scheduling

### AI Companion
- Students can use AI companion during sessions
- Trainer can see engagement metrics
- Enhanced learning support

## Best Practices

### For Trainers

1. **Pre-Session Setup**
   - Create session at least 1 day in advance
   - Link to relevant course
   - Set appropriate max participants
   - Enable remote join for hybrid sessions

2. **During Session**
   - Start session 5 minutes before scheduled time
   - Display session code prominently
   - Use presenter mode for projection
   - Update current lesson as you progress
   - Monitor participant progress regularly

3. **Post-Session**
   - End session when finished
   - Review participant statistics
   - Follow up with students who had low progress

### For Students

1. **Before Session**
   - Have session code ready
   - Ensure device is charged
   - Test internet connection (for remote)

2. **During Session**
   - Join early if possible
   - Keep device active to maintain connection
   - Follow along with course content
   - Ask questions via platform if enabled

## Technical Details

### Session Code Generation
- 6-character alphanumeric codes
- Excludes confusing characters (0, O, I, 1)
- Guaranteed unique
- Easy to share verbally or display

### Real-time Updates
- Progress refreshes every 5 seconds
- Session status updates every 3 seconds
- Participant list updates in real-time

### Synchronization
- When trainer updates lesson, all participants see update
- Progress tracking is automatic
- Session state is consistent across all clients

## Troubleshooting

### Common Issues

1. **Can't join session**
   - Verify session code is correct (case-insensitive)
   - Check if session is active or scheduled
   - Ensure session hasn't been cancelled

2. **Progress not updating**
   - Refresh the page
   - Check internet connection
   - Verify you're still in the session

3. **Session not starting**
   - Verify you're the trainer
   - Check session status
   - Ensure session is scheduled

## Future Enhancements

- [ ] Integration with cohorts system
- [ ] Breakout room assignments
- [ ] In-session polling and quizzes
- [ ] Video conferencing integration
- [ ] Screen sharing capabilities
- [ ] Digital whiteboard
- [ ] Session recording
- [ ] Attendance tracking
- [ ] Offline mode support

## Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Contact platform administrators

---

**Last Updated:** November 27, 2025
**Version:** 1.0.0

