import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';

async function cleanFoodCourses() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || '3306');
  const username = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const database = process.env.DATABASE_NAME || 'mindelta';

  console.log('[clean] Connecting to database...');

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
    console.log('[clean] Database connected');

    const courseRepository = dataSource.getRepository(Course);

    // Find all courses
    const allCourses = await courseRepository.find();
    console.log(`\n[clean] Found ${allCourses.length} total courses in database`);

    // List all course titles
    console.log('\n[clean] Current courses:');
    allCourses.forEach((course, index) => {
      console.log(`  ${index + 1}. ${course.title}`);
    });

    // Define food-related keywords to search for
    const foodKeywords = ['food', 'safety', 'defense', 'fraud', 'waste', 'loss', 'haccp', 'fsma', 'gfsi'];

    // Find food-related courses
    const foodCourses = allCourses.filter(course => {
      const titleLower = course.title.toLowerCase();
      const descLower = (course.description || '').toLowerCase();
      return foodKeywords.some(keyword => 
        titleLower.includes(keyword) || descLower.includes(keyword)
      );
    });

    if (foodCourses.length === 0) {
      console.log('\n✅ No food-related courses found. Database is clean!');
    } else {
      console.log(`\n[clean] Found ${foodCourses.length} food-related courses to remove:`);
      foodCourses.forEach(course => {
        console.log(`  - ${course.title}`);
      });

      // Delete food courses
      console.log('\n[clean] Removing food-related courses...');
      for (const course of foodCourses) {
        await courseRepository.remove(course);
        console.log(`  ✓ Removed: ${course.title}`);
      }

      console.log(`\n✅ Successfully removed ${foodCourses.length} food-related courses!`);
    }

    // Show final count
    const remainingCourses = await courseRepository.count();
    console.log(`\n📊 Final course count: ${remainingCourses}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

cleanFoodCourses();

