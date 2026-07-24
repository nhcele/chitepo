# Progress Tracking and Recommendations Implementation

## Overview

This document describes the implementation of:
1. Individual progress tracking for students
2. Instructor ability to view student progress and communicate with students
3. Recommendation system based on progress and performance

## Implementation Summary

### ✅ Completed Features

#### 1. Messaging/Communication System
**Location:** `backend/src/messaging/`

- **Message Entity** (`entities/message.entity.ts`)
  - Supports instructor-to-student and student-to-instructor messaging
  - Tracks message status (sent, delivered, read)
  - Links messages to courses for context
  - Archive functionality

- **Messaging Service** (`messaging.service.ts`)
  - Send messages between instructors and students
  - Get conversation threads
  - Inbox and sent messages management
  - Unread message count
  - Mark messages as read
  - Archive messages
  - Get all conversations for a course (instructor view)

- **Messaging Controller** (`messaging.controller.ts`)
  - `POST /messaging/send` - Send a message
  - `GET /messaging/conversation/:courseId/:otherUserId` - Get conversation thread
  - `GET /messaging/inbox` - Get inbox messages
  - `GET /messaging/sent` - Get sent messages
  - `GET /messaging/unread-count` - Get unread message count
  - `PATCH /messaging/:id/read` - Mark message as read
  - `PATCH /messaging/:id/archive` - Archive a message
  - `GET /messaging/course/:courseId/conversations` - Get all conversations for a course (instructor)

- **Database Migration** (`migrations/1733000000000-AddMessagingTable.ts`)
  - Creates `messages` table with proper indexes and foreign keys

#### 2. Instructor Student Progress Viewing
**Location:** `backend/src/instructor/`

- **Enhanced Instructor Service** (`instructor.service.ts`)
  - `getCourseStudents()` - Get all students enrolled in a course with progress summary
  - `getStudentProgress()` - Get detailed progress for a specific student
  - `getCourseProgressSummary()` - Get aggregate progress statistics for a course

- **New Endpoints** (`instructor.controller.ts`)
  - `GET /instructor/courses/:courseId/students` - List all students in a course
  - `GET /instructor/courses/:courseId/students/:studentId/progress` - Get detailed student progress
  - `GET /instructor/courses/:courseId/progress-summary` - Get course progress summary

**Progress Data Includes:**
- Enrollment information (enrolled date, completion date)
- Progress percentage
- Total watch time
- Completed lessons count
- Average quiz/assessment scores
- Last activity timestamp
- Per-lesson progress breakdown
- Lesson completion status
- Quiz scores and attempts

#### 3. Enhanced Progress Tracking
**Location:** `backend/src/assessments/entities/progress.entity.ts`

The existing Progress entity already tracks:
- Lesson-level completion
- Watch time (in seconds)
- Quiz/assessment scores
- Number of attempts
- Last accessed timestamp
- Completion dates

**Integration:**
- Progress data is automatically tracked when students interact with lessons
- Progress records are linked to enrollments
- Used by instructor service to provide detailed analytics

#### 4. Recommendation System
**Location:** `backend/src/recommendations/`

- **Recommendations Service** (`recommendations.service.ts`)
  - `getPersonalizedRecommendations()` - Get course recommendations based on:
    - Completed courses
    - In-progress courses
    - Performance scores (quiz attempts, progress scores)
    - Preferred difficulty level
    - Skill interests
    - Category preferences
  - `getLearningPathRecommendations()` - Get sequential learning path recommendations
  - `getStrugglingStudentRecommendations()` - Get remedial recommendations for struggling students

- **Recommendations Controller** (`recommendations.controller.ts`)
  - `GET /recommendations/personalized` - Get personalized course recommendations
  - `GET /recommendations/learning-path` - Get learning path recommendations
  - `GET /recommendations/struggling` - Get recommendations for struggling students

**Recommendation Algorithm:**
- Analyzes user's learning history
- Calculates match scores based on:
  - Difficulty level alignment
  - Skill overlap
  - Category preferences
  - Performance patterns
- Generates personalized reasons for each recommendation
- Considers prerequisites and learning paths

## API Endpoints Summary

### Messaging Endpoints
```
POST   /messaging/send
GET    /messaging/conversation/:courseId/:otherUserId
GET    /messaging/inbox?courseId=optional
GET    /messaging/sent?courseId=optional
GET    /messaging/unread-count
PATCH  /messaging/:id/read
PATCH  /messaging/:id/archive
GET    /messaging/course/:courseId/conversations (instructor only)
```

### Instructor Progress Endpoints
```
GET    /instructor/courses/:courseId/students
GET    /instructor/courses/:courseId/students/:studentId/progress
GET    /instructor/courses/:courseId/progress-summary
```

### Recommendations Endpoints
```
GET    /recommendations/personalized?limit=10
GET    /recommendations/learning-path
GET    /recommendations/struggling
```

## Database Schema

### Messages Table
```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  recipient_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('instructor_to_student', 'student_to_instructor', 'system'),
  status ENUM('sent', 'delivered', 'read'),
  read_at TIMESTAMP NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Usage Examples

### Student Sends Message to Instructor
```typescript
POST /messaging/send
{
  "courseId": "course-uuid",
  "recipientId": "instructor-uuid",
  "content": "I'm having trouble with lesson 5. Can you help?"
}
```

### Instructor Views All Students in Course
```typescript
GET /instructor/courses/{courseId}/students
// Returns list of students with progress summaries
```

### Instructor Views Detailed Student Progress
```typescript
GET /instructor/courses/{courseId}/students/{studentId}/progress
// Returns detailed progress including per-lesson breakdown
```

### Get Personalized Recommendations
```typescript
GET /recommendations/personalized?limit=10
// Returns courses recommended based on progress and performance
```

## Frontend Integration (Pending)

The following frontend components need to be created:

1. **Student Progress Dashboard**
   - Display individual progress metrics
   - Show completed vs. in-progress courses
   - Display watch time, scores, and achievements
   - Show personalized recommendations

2. **Instructor Student Management**
   - List all students in a course
   - View individual student progress
   - Filter and search students
   - Export progress data

3. **Messaging Interface**
   - Inbox view
   - Conversation threads
   - Send/reply to messages
   - Unread notifications
   - Archive functionality

## Next Steps

1. Run database migration:
   ```bash
   npm run migration:run
   ```

2. Test API endpoints using the provided examples

3. Create frontend components to consume these APIs

4. Add real-time notifications for new messages (optional enhancement)

5. Add email notifications for important messages (already integrated in service)

## Testing

All services include proper error handling and validation:
- Permission checks (instructors can only view their own course students)
- Course ownership verification
- User authentication required for all endpoints
- Proper HTTP status codes and error messages

## Notes

- The recommendation system uses a scoring algorithm that can be enhanced with machine learning
- Progress tracking is automatically updated when students interact with lessons
- Messages are linked to courses for better context and organization
- All endpoints require JWT authentication
- Instructor endpoints require instructor role or higher

