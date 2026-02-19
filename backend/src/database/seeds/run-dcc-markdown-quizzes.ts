import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedDccQuizzesFromMarkdown } from './assessments/dcc-training-quizzes-from-markdown';

async function run() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[seed:dcc:markdown-quizzes] Connecting to MySQL', {
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
    console.log('[seed:dcc:markdown-quizzes] Database connection established');
    const argv = new Set(process.argv.slice(2));
    const replaceExisting = argv.has('--replace') || argv.has('--force') || process.env.DCC_QUIZ_REPLACE === 'true';
    await seedDccQuizzesFromMarkdown(dataSource, {
      replaceExisting,
    });
  } catch (error) {
    console.error('[seed:dcc:markdown-quizzes] Error:', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
