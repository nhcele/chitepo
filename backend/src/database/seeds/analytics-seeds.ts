import { DataSource } from 'typeorm';
import { AnalyticsEvent } from '../../analytics/entities/analytics-event.entity';
import { User } from '../../users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';

export async function seedAnalytics(dataSource: DataSource) {
  console.log('[seeds] Seeding analytics events...');
  
  const analyticsRepository = dataSource.getRepository(AnalyticsEvent);
  const userRepository = dataSource.getRepository(User);
  const courseRepository = dataSource.getRepository(Course);
  
  // Clear existing analytics
  await analyticsRepository.clear();
  
  const users = await userRepository.find();
  const courses = await courseRepository.find();
  
  if (users.length === 0 || courses.length === 0) {
    console.log('[seeds] No users or courses found, skipping analytics seeding');
    return [];
  }

  const events = [];
  const eventTypes = [
    'course_view',
    'lesson_start',
    'lesson_complete',
    'quiz_start',
    'quiz_complete',
    'course_enroll',
    'certificate_earned',
    'login',
    'profile_update',
  ];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Generate realistic analytics data for the last 30 days
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(thirtyDaysAgo.getTime() + day * 24 * 60 * 60 * 1000);
    
    // Generate 5-50 events per day
    const dailyEventCount = Math.floor(Math.random() * 45) + 5;
    
    for (let i = 0; i < dailyEventCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const course = courses[Math.floor(Math.random() * courses.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Random time during the day
      const eventTime = new Date(currentDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      
      let eventData: Record<string, any> = {};

      // Add relevant event data based on event type
      switch (eventType) {
        case 'course_view':
        case 'course_enroll':
        case 'lesson_start':
        case 'lesson_complete':
        case 'quiz_start':
        case 'quiz_complete':
          eventData = { courseId: course.id };
          break;
        case 'certificate_earned':
          eventData = { 
            courseId: course.id,
            certificateId: `cert-${Math.random().toString(36).substr(2, 9)}`
          };
          break;
        case 'login':
          eventData = { 
            userAgent: 'Mozilla/5.0 (Development Seed)',
            ip: '127.0.0.1'
          };
          break;
        case 'profile_update':
          eventData = { 
            fieldsUpdated: ['bio', 'skills']
          };
          break;
      }

      events.push({
        id: `analytics-${events.length + 1}`,
        userId: user.id,
        eventType: eventType,
        eventData: eventData,
        sessionId: `session-${user.id}-${Math.floor(eventTime.getTime() / 1000000)}`,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Development Seed)',
      });
    }
  }

  const createdEvents = await analyticsRepository.save(events);
  console.log(`[seeds] Created ${createdEvents.length} analytics events`);
  
  return createdEvents;
}
