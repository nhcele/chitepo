import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedChitepoIdeologyCourses } from './chitepo-ideology-seeds';
import { seedChitepoNewCourses } from './chitepo-new-courses-seeds';
import { seedCertificationPathways } from './certification-pathways-seeds';
import { seedTrainingCohorts } from './training-cohorts-seeds';
import { seedExampleQuizzes } from './assessment-seeds';
import { seedDCCTrainingQuizzes } from './assessments/dcc-training-quizzes';
import { seedDCCTrainingFinalExam } from './assessments/dcc-training-final-exam';
import { populateDCCTrainingContent } from './scripts/populate-dcc-content';
import { seedQuizzesFromLessonContent } from './assessments/lesson-content-quizzes';
import { seedDccQuizzesFromMarkdown } from './assessments/dcc-training-quizzes-from-markdown';
import { seedUsers } from './user-seeds';
import { seedEnrollments } from './enrollment-seeds';
import { seedCertificates } from './certificate-seeds';
import { seedAnalytics } from './analytics-seeds';

async function runSeeds() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[seeds] Connecting to MySQL', {
    host,
    port,
    username,
    database,
  });

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    charset: 'utf8mb4',
    timezone: 'Z',
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Disable foreign key checks to allow clearing tables
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('[seeds] Disabled foreign key checks');

    // Run seeds in dependency order
    console.log('[seeds] Starting comprehensive database seeding...');
    
    // 1. Seed users first
    await seedUsers(dataSource);
    
    // 2. Seed Chitepo School of Ideology courses (original 16 courses)
    await seedChitepoIdeologyCourses(dataSource);
    
    // 3. Seed new Chitepo courses (10 new courses: Governance + Diaspora)
    await seedChitepoNewCourses(dataSource);
    
    // 4. Seed certification pathways
    await seedCertificationPathways(dataSource);
    
    // 5. Seed training cohorts
    await seedTrainingCohorts(dataSource);
    
    // 6. Seed assessments/quizzes
    await seedExampleQuizzes(dataSource);

    // 6a. Populate DCC Training lesson content from markdown
    await populateDCCTrainingContent(dataSource);
    
    // 6b. Seed DCC Training module quizzes
    await seedDCCTrainingQuizzes(dataSource);
    
    // 6c. Seed DCC Training final exam (130 marks)
    await seedDCCTrainingFinalExam(dataSource);

    // 6d. Seed quizzes parsed from lesson content
    await seedQuizzesFromLessonContent(dataSource);

    // 6e. Seed DCC quizzes parsed directly from markdown (fills gaps)
    await seedDccQuizzesFromMarkdown(dataSource);
    
    // 7. Seed enrollments (depends on users and courses)
    await seedEnrollments(dataSource);
    
    // 8. Seed certificates (depends on enrollments)
    await seedCertificates(dataSource);
    
    // 9. Seed analytics data
    await seedAnalytics(dataSource);
    
    // Re-enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[seeds] Re-enabled foreign key checks');
    
    console.log('✅ All seeds completed successfully!');
    console.log('📊 Database is now ready for development with:');
    console.log('   - Multiple user accounts (admin, instructors, learners)');
    console.log('   - Comprehensive course catalog (26 Chitepo School courses)');
    console.log('     • 16 core and contemporary courses');
    console.log('     • 6 practical governance track courses');
    console.log('     • 4 diaspora engagement program courses');
    console.log('   - 19 certification pathways (5 pathway types)');
    console.log('   - 13 training cohorts (2025-2026 academic year)');
    console.log('     • 7 tracks: DCC, Local Gov, Rural Dev, Traditional, Judicial, General, Diaspora');
    console.log('   - Realistic enrollment patterns');
    console.log('   - Certificate records');
    console.log('   - Analytics events for the last 30 days');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    // Re-enable foreign key checks even on error
    try {
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (fkError) {
      console.error('Could not re-enable foreign key checks:', fkError);
    }
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
