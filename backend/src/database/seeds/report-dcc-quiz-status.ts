import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { Quiz } from '../../assessments/entities/quiz.entity';
import { SystemSetting } from '../../admin/entities/system-setting.entity';

async function run() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[report:dcc-quizzes] Connecting to MySQL', {
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
    console.log('[report:dcc-quizzes] Database connection established');

    const settingRepo = dataSource.getRepository(SystemSetting);
    const assessmentSetting = await settingRepo.findOne({ where: { key: 'feature.assessmentsEnabled' } });
    if (assessmentSetting) {
      console.log('[report:dcc-quizzes] feature.assessmentsEnabled =', assessmentSetting.value);
    } else {
      console.log('[report:dcc-quizzes] feature.assessmentsEnabled not set (defaults to true)');
    }

    const courseRepo = dataSource.getRepository(Course);
    const quizRepo = dataSource.getRepository(Quiz);

    const dccCourse = await courseRepo.findOne({
      where: { title: 'District Coordinating Committee (DCC) Training' },
      relations: ['modules', 'modules.lessons'],
    });

    if (!dccCourse) {
      console.log('[report:dcc-quizzes] DCC Training course not found');
      return;
    }

    const modules = (dccCourse.modules || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
    let totalLessons = 0;
    let lessonsWithQuiz = 0;

    for (const module of modules) {
      const lessons = (module.lessons || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
      console.log(`\n[Module] ${module.title} (${lessons.length} lessons)`);
      for (const lesson of lessons) {
        totalLessons++;
        const quizzes = await quizRepo.find({ where: { lessonId: lesson.id } });
        if (quizzes.length > 0) lessonsWithQuiz++;
        console.log(
          `- ${lesson.title} | quizzes=${quizzes.length} | hasQuiz=${(lesson as any).hasQuiz ? 'true' : 'false'} | id=${lesson.id}`
        );
      }
    }

    console.log('\n[report:dcc-quizzes] Summary', {
      totalLessons,
      lessonsWithQuiz,
    });
  } catch (error) {
    console.error('[report:dcc-quizzes] Error:', error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
}

run();
