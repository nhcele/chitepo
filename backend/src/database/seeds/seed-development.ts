import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedUsers } from './user-seeds';
import { seedChitepoIdeologyCourses } from './chitepo-ideology-seeds';
import { seedExampleQuizzes } from './assessment-seeds';
import { seedEnrollments } from './enrollment-seeds';
import { seedCertificates } from './certificate-seeds';
import { seedAnalytics } from './analytics-seeds';

interface SeedOptions {
  users?: boolean;
  courses?: boolean;
  assessments?: boolean;
  enrollments?: boolean;
  certificates?: boolean;
  analytics?: boolean;
  all?: boolean;
  clear?: boolean;
}

async function runDevelopmentSeeds(options: SeedOptions) {
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

    if (options.clear) {
      console.log('[seeds] Clearing all data...');
      await clearAllData(dataSource);
    }

    const seedTasks = [];

    if (options.all || options.users) {
      seedTasks.push(() => seedUsers(dataSource));
    }
    if (options.all || options.courses) {
      seedTasks.push(() => seedChitepoIdeologyCourses(dataSource));
    }
    if (options.all || options.assessments) {
      seedTasks.push(() => seedExampleQuizzes(dataSource));
    }
    if (options.all || options.enrollments) {
      seedTasks.push(() => seedEnrollments(dataSource));
    }
    if (options.all || options.certificates) {
      seedTasks.push(() => seedCertificates(dataSource));
    }
    if (options.all || options.analytics) {
      seedTasks.push(() => seedAnalytics(dataSource));
    }

    if (seedTasks.length === 0) {
      console.log('[seeds] No seed options specified. Use --help for usage.');
      return;
    }

    console.log(`[seeds] Running ${seedTasks.length} seed task(s)...`);
    
    for (const task of seedTasks) {
      await task();
    }

    console.log('✅ Development seeding completed successfully!');
    
    // Print summary
    await printSeedSummary(dataSource);
    
  } catch (error) {
    console.error('❌ Error running development seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function clearAllData(dataSource: DataSource) {
  const tables = [
    'analytics_events',
    'certificates',
    'enrollments',
    'quiz_attempts',
    'quizzes',
    'lessons',
    'modules',
    'courses',
    'instructor_applications',
    'users',
  ];

  for (const table of tables) {
    try {
      await dataSource.query(`DELETE FROM ${table}`);
      console.log(`[seeds] Cleared table: ${table}`);
    } catch (error) {
      console.warn(`[seeds] Could not clear table ${table}:`, error.message);
    }
  }
}

async function printSeedSummary(dataSource: DataSource) {
  try {
    const [userCount, courseCount, enrollmentCount, certificateCount, analyticsCount] = await Promise.all([
      dataSource.query('SELECT COUNT(*) as count FROM users'),
      dataSource.query('SELECT COUNT(*) as count FROM courses'),
      dataSource.query('SELECT COUNT(*) as count FROM enrollments'),
      dataSource.query('SELECT COUNT(*) as count FROM certificates'),
      dataSource.query('SELECT COUNT(*) as count FROM analytics_events'),
    ]);

    console.log('\n📊 Seed Summary:');
    console.log(`   👥 Users: ${userCount[0]?.count || 0}`);
    console.log(`   📚 Courses: ${courseCount[0]?.count || 0}`);
    console.log(`   📝 Enrollments: ${enrollmentCount[0]?.count || 0}`);
    console.log(`   🏆 Certificates: ${certificateCount[0]?.count || 0}`);
    console.log(`   📈 Analytics Events: ${analyticsCount[0]?.count || 0}`);
    console.log('\n🔑 Test Accounts:');
    console.log('   Admin: admin@mindelta.com');
    console.log('   Instructor: instructor@mindelta.com');
    console.log('   Learner: alice.wilson@example.com');
    console.log('\n🚀 Development environment is ready!');
    
  } catch (error) {
    console.warn('Could not generate seed summary:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SeedOptions = {
  all: args.includes('--all') || args.length === 0,
  clear: args.includes('--clear'),
  users: args.includes('--users'),
  courses: args.includes('--courses'),
  assessments: args.includes('--assessments'),
  enrollments: args.includes('--enrollments'),
  certificates: args.includes('--certificates'),
  analytics: args.includes('--analytics'),
};

if (args.includes('--help')) {
  console.log(`
Usage: npm run seed:dev [options]

Options:
  --all              Run all seeds (default)
  --clear            Clear all data before seeding
  --users            Seed user accounts only
  --courses          Seed courses only
  --assessments      Seed assessments only
  --enrollments      Seed enrollments only
  --certificates     Seed certificates only
  --analytics        Seed analytics data only
  --help             Show this help message

Examples:
  npm run seed:dev                    # Run all seeds
  npm run seed:dev --clear --all     # Clear and run all seeds
  npm run seed:dev --users           # Seed users only
  npm run seed:dev --courses --users # Seed courses and users
  `);
  process.exit(0);
}

runDevelopmentSeeds(options);
