import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedQuizzesFromLessonContent } from './assessments/lesson-content-quizzes';

async function run() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[seed:lesson-content-quizzes] Connecting to MySQL', {
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
    console.log('[seed:lesson-content-quizzes] Database connection established');
    await seedQuizzesFromLessonContent(dataSource);
  } catch (error) {
    console.error('[seed:lesson-content-quizzes] Error:', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
