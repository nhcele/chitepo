import { DataSource } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

export async function updateCourseInstructors(dataSource: DataSource) {
  console.log('[update] Updating course instructors...');
  
  const courseRepository = dataSource.getRepository(Course);
  const userRepository = dataSource.getRepository(User);

  // Find instructors
  const simbarasheMumbengegwi = await userRepository.findOne({ where: { email: 'simbarashe.mumbengegwi@chitepo.edu.zw' } });
  const tafadzwaMupfumira = await userRepository.findOne({ where: { email: 'tafadzwa.mupfumira@chitepo.edu.zw' } });
  const kudzaiNhema = await userRepository.findOne({ where: { email: 'kudzai.nhema@chitepo.edu.zw' } });
  const rumbidzaiChikwanha = await userRepository.findOne({ where: { email: 'rumbidzai.chikwanha@chitepo.edu.zw' } });
  const tendaiMoyo = await userRepository.findOne({ where: { email: 'tendai.moyo@chitepo.edu.zw' } });
  const nyashaMutasa = await userRepository.findOne({ where: { email: 'nyasha.mutasa@chitepo.edu.zw' } });

  if (!simbarasheMumbengegwi || !tafadzwaMupfumira || !kudzaiNhema || !rumbidzaiChikwanha || !tendaiMoyo || !nyashaMutasa) {
    console.error('[update] Required instructors not found. Please run user seeds first.');
    return;
  }

  // Map courses to instructors
  const courseInstructorMap: { [key: string]: User } = {
    'District Coordinating Committee (DCC) Training': kudzaiNhema,
    'Local Government Administration and Development': tafadzwaMupfumira,
    'Voter Mobilization and Campaign Management': kudzaiNhema,
    'Rural Development and Community Engagement': rumbidzaiChikwanha,
    'Party-Government Synergy and Policy Implementation': simbarasheMumbengegwi,
    'Zimbabwe\'s National Development and Vision 2030': tendaiMoyo,
    'Virtual Political Engagement and Diaspora Mobilization': nyashaMutasa,
    'Heritage Preservation and Cultural Connection': nyashaMutasa,
    'Investment and Economic Participation': nyashaMutasa,
    'Transnational Advocacy and Representation': nyashaMutasa
  };

  let updatedCount = 0;

  for (const [courseTitle, instructor] of Object.entries(courseInstructorMap)) {
    const course = await courseRepository.findOne({ where: { title: courseTitle } });
    if (course) {
      course.instructorId = instructor.id;
      await courseRepository.save(course);
      console.log(`✅ Updated instructor for: ${courseTitle} -> ${instructor.firstName} ${instructor.lastName}`);
      updatedCount++;
    } else {
      console.log(`⚠️  Course not found: ${courseTitle}`);
    }
  }

  // Update all other courses to use simbarasheMumbengegwi as default
  const allCourses = await courseRepository.find();
  for (const course of allCourses) {
    if (!courseInstructorMap[course.title]) {
      course.instructorId = simbarasheMumbengegwi.id;
      await courseRepository.save(course);
      console.log(`✅ Updated instructor for: ${course.title} -> ${simbarasheMumbengegwi.firstName} ${simbarasheMumbengegwi.lastName} (default)`);
      updatedCount++;
    }
  }

  console.log(`\n✅ Course instructors update completed! Updated ${updatedCount} courses.`);
}
