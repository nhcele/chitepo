import { DataSource } from 'typeorm';
import { Quiz } from '../../../assessments/entities/quiz.entity';
import { Question } from '../../../assessments/entities/question.entity';
import { QuestionType } from '@mindelta/shared';
import { Course } from '../../../courses/entities/course.entity';
import { Lesson } from '../../../courses/entities/lesson.entity';

export async function seedDCCTrainingQuizzes(dataSource: DataSource) {
  const quizRepository = dataSource.getRepository(Quiz);
  const questionRepository = dataSource.getRepository(Question);
  const courseRepository = dataSource.getRepository(Course);
  const lessonRepository = dataSource.getRepository(Lesson);

  console.log('Starting to seed DCC Training course quizzes...');

  // Get the DCC Training course
  const dccCourse = await courseRepository.findOne({
    where: { title: 'District Coordinating Committee (DCC) Training' },
    relations: ['modules', 'modules.lessons'],
  });

  if (!dccCourse) {
    console.log('DCC Training course not found, skipping quiz seeding');
    return;
  }

  // Module 1: Political Mobilization and Organization
  const module1 = dccCourse.modules.find(m => m.title.includes('Political Mobilization') || m.title.includes('Understanding the DCC Role'));
  if (module1) {
    // Lesson 1.1 Quiz: History and Evolution of DCCs
    const lesson1_1 = module1.lessons.find(l => l.title.includes('History and Evolution'));
    if (lesson1_1) {
      const quiz1_1 = await quizRepository.save(
        quizRepository.create({
          lessonId: lesson1_1.id,
          title: 'Quiz: History and Evolution of DCCs in Zimbabwe',
          description: 'Test your understanding of the historical development of District Coordinating Committees',
          timeLimitMinutes: 15,
          passingScore: 70,
          maxAttempts: 3,
        }),
      );

      // Question 1
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'In which year did the ZANU-PF Central Committee pass the resolution requiring mandatory training for electoral candidates?',
          options: ['2014', '2015', '2016', '2017'],
          correctAnswer: '2',
          points: 10,
          explanation: 'The 2016 ZANU-PF Central Committee resolution established mandatory training at the Herbert Chitepo School of Ideology for all electoral candidates, introducing the principle of "No representation without certification."',
          orderIndex: 1,
        }),
      );

      // Question 2
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'How many District Coordinating Committees are there in Zimbabwe?',
          options: ['10', '45', '63', '100'],
          correctAnswer: '2',
          points: 10,
          explanation: 'Zimbabwe has 63 District Coordinating Committees, one for each administrative district, coordinating with 10 provincial structures.',
          orderIndex: 2,
        }),
      );

      // Question 3
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'DCCs were established immediately after independence in 1980 as formal structures.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          points: 10,
          explanation: 'False. While coordination mechanisms existed, DCCs evolved gradually through the 1980s and 1990s, becoming formalized structures over time rather than being established immediately in 1980.',
          orderIndex: 3,
        }),
      );

      // Question 4
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What is the target number of voters to be registered by 2028 according to the current mobilization strategy?',
          options: ['2 million', '3 million', '5 million', '7 million'],
          correctAnswer: '2',
          points: 10,
          explanation: 'The ZANU-PF strategy targets registration of 5 million voters by 2028 through systematic ward-based and cell-level mobilization efforts.',
          orderIndex: 4,
        }),
      );

      // Question 5
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'During which period did the land reform program become a key focus of DCC coordination?',
          options: ['1980-1990', '1990-2000', '2000-2010', '2010-Present'],
          correctAnswer: '2',
          points: 10,
          explanation: 'The 2000-2010 period saw DCCs heavily involved in coordinating the land reform program alongside their other mobilization responsibilities.',
          orderIndex: 5,
        }),
      );

      // Question 6
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'The principle "No representation without certification" means that all party members must be certified to vote.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          points: 10,
          explanation: 'False. This principle applies to electoral candidates who seek party endorsement for elected positions, not to ordinary party members or voters. It ensures that those seeking to represent the party have proper ideological grounding.',
          orderIndex: 6,
        }),
      );

      // Question 7
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'How many ward-based structures are there across Zimbabwe?',
          options: ['500', '1,000', '1,958', '2,500'],
          correctAnswer: '1,958',
          points: 10,
          explanation: 'Zimbabwe has 1,958 wards, making the ward the fundamental unit of grassroots political organization and community representation.',
          orderIndex: 7,
        }),
      );

      // Question 8
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What is the minimum duration of mandatory training for parliamentary candidates?',
          options: ['1 month', '2 months', '3 months', '6 months'],
          correctAnswer: '3 months',
          points: 10,
          explanation: 'Parliamentary candidates are required to complete 3 months of training at the Herbert Chitepo School of Ideology as per the 2016 Central Committee resolution.',
          orderIndex: 8,
        }),
      );

      // Question 9
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'Vision 2030 is a current key focus area for DCC activities.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 10,
          explanation: 'True. Vision 2030 implementation at the grassroots level is one of the primary contemporary responsibilities of DCCs, ensuring national development goals are understood and supported at the community level.',
          orderIndex: 9,
        }),
      );

      // Question 10
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_1.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What was a major focus of DCC coordination during the liberation struggle (1966-1979)?',
          options: [
            'Election management',
            'Mobilization and resource distribution',
            'Infrastructure development',
            'International diplomacy',
          ],
          correctAnswer: '1',
          points: 10,
          explanation: 'During the liberation struggle, district and provincial coordination was crucial for effective mobilization of people and distribution of resources to support the armed struggle.',
          orderIndex: 10,
        }),
      );

      console.log(`Created quiz for lesson: ${lesson1_1.title}`);
    }

    // Lesson 1.2 Quiz: DCC Structure and Composition
    const lesson1_2 = module1.lessons.find(l => l.title.includes('DCC Structure and Composition'));
    if (lesson1_2) {
      const quiz1_2 = await quizRepository.save(
        quizRepository.create({
          lessonId: lesson1_2.id,
          title: 'Quiz: DCC Structure and Composition',
          description: 'Test your knowledge of DCC organizational structure and member roles',
          timeLimitMinutes: 15,
          passingScore: 70,
          maxAttempts: 3,
        }),
      );

      // Question 1
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What is the quorum requirement for DCC meetings?',
          options: ['Half of members', 'Two-thirds of members', '75% of members', 'All members must attend'],
          correctAnswer: '1',
          points: 10,
          explanation: 'A DCC meeting requires two-thirds (2/3) of members to be present to constitute a quorum and make valid decisions.',
          orderIndex: 1,
        }),
      );

      // Question 2
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'Who is responsible for maintaining DCC meeting minutes and documentation?',
          options: ['Chairperson', 'Vice-Chairperson', 'Secretary', 'Organizing Secretary'],
          correctAnswer: '2',
          points: 10,
          explanation: 'The DCC Secretary is responsible for recording all meetings, maintaining documentation and archives, and managing correspondence.',
          orderIndex: 2,
        }),
      );

      // Question 3
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'How many core leadership positions are there in a standard DCC?',
          options: ['5', '10', '15', '20'],
          correctAnswer: '10',
          points: 10,
          explanation: 'A standard DCC has 10 core positions: Chairperson, Vice-Chairperson, Secretary, Organizing Secretary, Finance Secretary, and five sectoral secretaries (Information, Security, Youth, Women, War Veterans).',
          orderIndex: 3,
        }),
      );

      // Question 4
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'DCC decisions can be made by the Chairperson alone without consulting other members.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          points: 10,
          explanation: 'False. DCCs operate on principles of collective leadership and democratic centralism, meaning major decisions must be made collectively through consensus or majority vote.',
          orderIndex: 4,
        }),
      );

      // Question 5
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What is the primary role of the DCC Organizing Secretary?',
          options: [
            'Financial management',
            'Mobilization and recruitment',
            'Meeting minutes',
            'Media relations',
          ],
          correctAnswer: '1',
          points: 10,
          explanation: 'The Organizing Secretary is responsible for mobilization, recruitment, event organization, and membership database management.',
          orderIndex: 5,
        }),
      );

      // Question 6
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'How often should regular DCC meetings be held at minimum?',
          options: ['Weekly', 'Monthly', 'Quarterly', 'Bi-annually'],
          correctAnswer: '1',
          points: 10,
          explanation: 'Regular DCC meetings should be held at least monthly to ensure effective coordination and timely decision-making.',
          orderIndex: 6,
        }),
      );

      // Question 7
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'Ward Chairpersons are permanent members of the DCC.',
          options: ['True', 'False'],
          correctAnswer: 'False',
          points: 10,
          explanation: 'False. Ward Chairpersons typically send representative samples to DCC meetings rather than all attending as permanent members, though they are part of the extended structure.',
          orderIndex: 7,
        }),
      );

      // Question 8
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'In the Marondera District case study, what was their DCC meeting attendance rate?',
          options: ['70%', '80%', '90%', '100%'],
          correctAnswer: '90%',
          points: 10,
          explanation: 'Marondera District DCC achieved 90%+ meeting attendance, contributing to their status as a model DCC.',
          orderIndex: 8,
        }),
      );

      // Question 9
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'Who has the authority to call an extraordinary DCC meeting?',
          options: [
            'Only the Chairperson',
            'Chairperson or 1/3 of members',
            'Secretary only',
            'Provincial Committee only',
          ],
          correctAnswer: '1',
          points: 10,
          explanation: 'Extraordinary meetings can be called by the Chairperson or at the request of one-third of DCC members, with 48-hour notice.',
          orderIndex: 9,
        }),
      );

      // Question 10
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_2.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'According to the principle of democratic centralism, once a decision is made, all members must implement it in a unified manner.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 10,
          explanation: 'True. Democratic centralism allows for free discussion before decisions, but requires unified implementation once a decision is made, ensuring organizational discipline and effectiveness.',
          orderIndex: 10,
        }),
      );

      console.log(`Created quiz for lesson: ${lesson1_2.title}`);
    }

    // Lesson 1.3 Quiz: Ward-Based Coordination
    const lesson1_3 = module1.lessons.find(l => l.title.includes('Ward-Based Coordination'));
    if (lesson1_3) {
      const quiz1_3 = await quizRepository.save(
        quizRepository.create({
          lessonId: lesson1_3.id,
          title: 'Quiz: Ward-Based Coordination and Cell Structures',
          description: 'Assess your understanding of ward and cell organization',
          timeLimitMinutes: 15,
          passingScore: 70,
          maxAttempts: 3,
        }),
      );

      // Question 1
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'How many wards are there across Zimbabwe?',
          options: ['500', '1,000', '1,958', '2,500'],
          correctAnswer: '1,958',
          points: 10,
          explanation: 'Zimbabwe has 1,958 wards, which serve as the fundamental unit of grassroots political organization.',
          orderIndex: 1,
        }),
      );

      // Question 2
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'A typical cell consists of how many households?',
          options: ['5-10 households', '10-20 households', '20-50 households', '50-100 households'],
          correctAnswer: '10-20 households',
          points: 10,
          explanation: 'A cell is the smallest organizational unit, typically consisting of 10-20 households, allowing for direct contact and effective mobilization.',
          orderIndex: 2,
        }),
      );

      // Question 3
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What is the target for total voter registration by 2028?',
          options: ['3 million', '4 million', '5 million', '6 million'],
          correctAnswer: '5 million',
          points: 10,
          explanation: 'The 5-million voter strategy aims to register 5 million voters by 2028 through systematic cell-by-cell and ward-by-ward mobilization.',
          orderIndex: 3,
        }),
      );

      // Question 4
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'Cell chairpersons are responsible for maintaining membership lists and collecting membership fees.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 10,
          explanation: 'True. Cell chairpersons manage membership at the most basic level, including maintaining lists, collecting fees, and distributing membership cards.',
          orderIndex: 4,
        }),
      );

      // Question 5
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'In the Harare Province case study, how many new voters were registered in the 2023 campaign?',
          options: ['150,000', '187,000', '200,000', '250,000'],
          correctAnswer: '187,000',
          points: 10,
          explanation: 'The Harare Province campaign registered 187,000 new voters, achieving 93.5% of their 200,000 target.',
          orderIndex: 5,
        }),
      );

      // Question 6
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'What percentage of wards in the Harare campaign exceeded their voter registration targets?',
          options: ['75%', '85%', '95%', '100%'],
          correctAnswer: '95%',
          points: 10,
          explanation: '95% of wards exceeded their targets in the Harare Province campaign, demonstrating effective coordination and mobilization.',
          orderIndex: 6,
        }),
      );

      // Question 7
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'Ward Coordinating Committees should submit monthly reports to the DCC.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 10,
          explanation: 'True. Monthly reporting from wards to DCCs is essential for tracking progress, identifying issues, and ensuring accountability.',
          orderIndex: 7,
        }),
      );

      // Question 8
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'Which of the following is NOT listed as a primary cell function?',
          options: [
            'Membership management',
            'Information dissemination',
            'Financial auditing',
            'Feedback collection',
          ],
          correctAnswer: '2',
          points: 10,
          explanation: 'Financial auditing is a higher-level function. Cell functions include membership management, information dissemination, mobilization, feedback collection, and problem-solving.',
          orderIndex: 8,
        }),
      );

      // Question 9
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.MULTIPLE_CHOICE,
          questionText: 'How often should Quarterly Ward Conferences be held?',
          options: ['Monthly', 'Bi-monthly', 'Quarterly', 'Annually'],
          correctAnswer: '2',
          points: 10,
          explanation: 'Quarterly Ward Conferences bring together all cell chairpersons every three months for review, training, problem-solving, and planning.',
          orderIndex: 9,
        }),
      );

      // Question 10
      await questionRepository.save(
        questionRepository.create({
          quizId: quiz1_3.id,
          questionType: QuestionType.TRUE_FALSE,
          questionText: 'Digital tools like WhatsApp groups are now important for modern ward coordination.',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 10,
          explanation: 'True. Digital transformation is enhancing coordination efficiency, with WhatsApp groups, databases, and SMS messaging playing key roles in modern ward and cell coordination.',
          orderIndex: 10,
        }),
      );

      console.log(`Created quiz for lesson: ${lesson1_3.title}`);
    }
  }

  console.log('✅ DCC Training quizzes seeding completed!');
  console.log('   Module 1: 3 quizzes created (30 questions total)');
}

