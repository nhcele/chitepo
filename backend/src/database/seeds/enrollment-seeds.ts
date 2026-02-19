import { DataSource } from 'typeorm';
import { Enrollment } from '../../courses/entities/enrollment.entity';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

export async function seedEnrollments(dataSource: DataSource) {
  console.log('[seeds] Seeding enrollments...');
  
  const enrollmentRepository = dataSource.getRepository(Enrollment);
  const courseRepository = dataSource.getRepository(Course);
  const userRepository = dataSource.getRepository(User);
  
  // Clear existing enrollments
  await enrollmentRepository.clear();
  
  // Get courses and users
  const courses = await courseRepository.find();
  const learners = await userRepository.find({ 
    where: { role: 'learner' as any }
  });
  
  if (courses.length === 0 || learners.length === 0) {
    console.log('[seeds] No courses or learners found, skipping enrollment seeding');
    return [];
  }

  const enrollments = [];
  
  // Create realistic enrollment patterns
  const enrollmentPatterns = [
    // Chitepo School courses - popular among learners interested in political education
    { learnerIndex: 0, courseIndices: [0, 1, 4], progress: [85, 100, 45] },
    { learnerIndex: 1, courseIndices: [0, 1, 5], progress: [60, 90, 30] },
    { learnerIndex: 4, courseIndices: [0, 1, 2, 4], progress: [100, 100, 75, 60] },
    
    // Ideology courses - popular among students of African history
    { learnerIndex: 2, courseIndices: [0, 2], progress: [40, 80] },
    { learnerIndex: 3, courseIndices: [0, 2], progress: [30, 65] },
    { learnerIndex: 5, courseIndices: [0, 2], progress: [50, 90] },
    
    // Mixed enrollments
    { learnerIndex: 0, courseIndices: [2], progress: [25] },
    { learnerIndex: 1, courseIndices: [2], progress: [15] },
    { learnerIndex: 2, courseIndices: [1], progress: [20] },
    { learnerIndex: 3, courseIndices: [1], progress: [35] },
    { learnerIndex: 4, courseIndices: [3], progress: [55] },
    { learnerIndex: 5, courseIndices: [4], progress: [40] },
  ];

  const now = new Date();
  
  for (const pattern of enrollmentPatterns) {
    if (pattern.learnerIndex >= learners.length) continue;
    
    const learner = learners[pattern.learnerIndex];
    
    for (let i = 0; i < pattern.courseIndices.length; i++) {
      const courseIndex = pattern.courseIndices[i];
      const progress = pattern.progress[i];
      
      if (courseIndex >= courses.length) continue;
      
      const course = courses[courseIndex];
      
      // Calculate enrollment and completion dates
      const enrolledAt = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random within last 90 days
      const completedAt = progress >= 100 
        ? new Date(enrolledAt.getTime() + (Math.random() * 30 + 10) * 24 * 60 * 60 * 1000)
        : null;

      enrollments.push({
        id: `enrollment-${enrollments.length + 1}`,
        userId: learner.id,
        courseId: course.id,
        progressPercentage: progress,
        enrolledAt,
        completedAt,
        certificateIssued: progress >= 100,
      });
    }
  }

  const createdEnrollments = await enrollmentRepository.save(enrollments);
  console.log(`[seeds] Created ${createdEnrollments.length} enrollments`);
  
  return createdEnrollments;
}
