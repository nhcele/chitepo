import 'dotenv/config';
import { DataSource } from 'typeorm';

async function updateCourseCategories() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || 'password';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[update-categories] Connecting to MySQL', { host, port, username, database });

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    charset: 'utf8mb4',
    timezone: 'Z',
  });

  try {
    await dataSource.initialize();
    console.log('[update-categories] Database connection established');

    // Core Ideological Courses (8 courses)
    const coreIdeologyCourses = [
      'Pan-Africanism and African Unity',
      'Revolutionary Theory and Practice',
      'Political Economy and Development',
      'Leadership and Governance',
      'African History and Liberation Heritage',
      'Social Transformation and Nation Building',
      'International Relations and Diplomacy',
      'Political Philosophy and Ideology'
    ];

    // Contemporary Studies (8 courses)
    const contemporaryStudiesCourses = [
      'Contemporary African Politics and Democracy',
      'Gender Studies and Feminism in Africa',
      'Environmental Justice and Climate Policy',
      'Youth Leadership and Empowerment',
      'Pan-African Media and Communication',
      'African Languages and Cultural Studies',
      'Security Studies and Conflict Resolution',
      'Human Rights and Social Movements'
    ];

    let updated = 0;

    // Update Core Ideological Courses
    console.log('[update-categories] Updating Core Ideological courses...');
    for (const title of coreIdeologyCourses) {
      const result = await dataSource.query(
        `UPDATE courses SET category = 'core_ideology' WHERE title = ?`,
        [title]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ ${title}`);
        updated++;
      }
    }

    // Update Contemporary Studies Courses
    console.log('[update-categories] Updating Contemporary Studies courses...');
    for (const title of contemporaryStudiesCourses) {
      const result = await dataSource.query(
        `UPDATE courses SET category = 'contemporary_studies' WHERE title = ?`,
        [title]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✓ ${title}`);
        updated++;
      }
    }

    console.log(`\n[update-categories] ✅ Updated ${updated} courses with categories`);

    // Verify the updates
    const categoryCount = await dataSource.query(`
      SELECT category, COUNT(*) as count 
      FROM courses 
      WHERE category IS NOT NULL 
      GROUP BY category
    `);

    console.log('\n[update-categories] Courses by category:');
    categoryCount.forEach((row: any) => {
      console.log(`  ${row.category}: ${row.count} courses`);
    });

    await dataSource.destroy();
  } catch (error) {
    console.error('[update-categories] ❌ Error:', error);
    try {
      await dataSource.destroy();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

updateCourseCategories();

