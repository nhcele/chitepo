import { DataSource } from 'typeorm';
import { Quiz } from '../../../assessments/entities/quiz.entity';
import { Question } from '../../../assessments/entities/question.entity';
import { QuestionType } from '@mindelta/shared';
import { Course } from '../../../courses/entities/course.entity';
import { Lesson } from '../../../courses/entities/lesson.entity';

export async function seedDCCTrainingFinalExam(dataSource: DataSource) {
  const quizRepository = dataSource.getRepository(Quiz);
  const questionRepository = dataSource.getRepository(Question);
  const courseRepository = dataSource.getRepository(Course);
  const lessonRepository = dataSource.getRepository(Lesson);

  console.log('Starting to seed DCC Training Final Exam...');

  // Get the DCC Training course
  const dccCourse = await courseRepository.findOne({
    where: { title: 'District Coordinating Committee (DCC) Training' },
    relations: ['modules', 'modules.lessons'],
  });

  if (!dccCourse) {
    console.log('DCC Training course not found, skipping final exam seeding');
    return;
  }

  // Find the last lesson of the course (or create a placeholder lesson for final exam)
  // We'll use the last lesson of Module 3: Community Engagement and Development
  const module3 = dccCourse.modules.find((m) => 
    m.title.includes('Community Engagement') || m.title.includes('Community Development')
  );
  
  let finalExamLesson: Lesson | null = null;
  
  if (module3 && module3.lessons && module3.lessons.length > 0) {
    // Use the last lesson of Module 3
    const sortedLessons = module3.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
    finalExamLesson = sortedLessons[sortedLessons.length - 1];
  } else {
    // Fallback: use the last lesson from any module
    const allLessons: Lesson[] = [];
    dccCourse.modules.forEach((module) => {
      if (module.lessons) {
        allLessons.push(...module.lessons);
      }
    });
    if (allLessons.length > 0) {
      const sortedLessons = allLessons.sort((a, b) => a.orderIndex - b.orderIndex);
      finalExamLesson = sortedLessons[sortedLessons.length - 1];
    }
  }

  if (!finalExamLesson) {
    console.log('No lesson found for final exam, skipping');
    return;
  }

  // Check if final exam already exists
  const existingExam = await quizRepository.findOne({
    where: { 
      lessonId: finalExamLesson.id,
      title: 'DCC Training Final Exam'
    },
  });

  if (existingExam) {
    console.log('Final exam already exists, skipping');
    return;
  }

  // Create the final exam quiz
  const finalExam = await quizRepository.save(
    quizRepository.create({
      lessonId: finalExamLesson.id,
      title: 'DCC Training Final Exam',
      description: 'Comprehensive final examination covering all three modules of the DCC Training course. Total marks: 130. Passing score: 70% (91 marks).',
      passingScore: 70,
      timeLimitMinutes: 180, // 3 hours
      maxAttempts: 2,
      isPublished: true,
    }),
  );

  console.log(`Created final exam quiz: ${finalExam.id}`);

  let orderIndex = 1;

  // ============================================
  // SECTION 1: MULTIPLE CHOICE QUESTIONS (50 marks - 25 questions × 2 marks)
  // ============================================
  console.log('Creating multiple choice questions...');

  // Module 1: Political Mobilization and Organization
  const mcQuestions = [
    // Module 1 Questions (10 questions, 20 marks)
    {
      question: 'How many District Coordinating Committees are there in Zimbabwe?',
      options: ['10', '45', '63', '100'],
      correctAnswer: '2', // Index 2 = '63'
      explanation: 'Zimbabwe has 63 District Coordinating Committees, one for each administrative district.',
      points: 2,
    },
    {
      question: 'In which year did the ZANU-PF Central Committee pass the resolution requiring mandatory training for electoral candidates?',
      options: ['2014', '2015', '2016', '2017'],
      correctAnswer: '2', // Index 2 = '2016'
      explanation: 'The 2016 ZANU-PF Central Committee resolution established mandatory training at the Herbert Chitepo School of Ideology.',
      points: 2,
    },
    {
      question: 'What is the target number of voters to be registered by 2028 according to the current mobilization strategy?',
      options: ['2 million', '3 million', '5 million', '7 million'],
      correctAnswer: '2', // Index 2 = '5 million'
      explanation: 'The ZANU-PF strategy targets registration of 5 million voters by 2028.',
      points: 2,
    },
    {
      question: 'How many wards are there across Zimbabwe?',
      options: ['500', '1,000', '1,958', '2,500'],
      correctAnswer: '2', // Index 2 = '1,958'
      explanation: 'Zimbabwe has 1,958 wards, making the ward the fundamental unit of grassroots organization.',
      points: 2,
    },
    {
      question: 'What is the quorum requirement for DCC meetings?',
      options: ['Half of members', 'Two-thirds of members', '75% of members', 'All members must attend'],
      correctAnswer: '1', // Index 1 = 'Two-thirds of members'
      explanation: 'A DCC meeting requires two-thirds (2/3) of members to be present to constitute a quorum.',
      points: 2,
    },
    {
      question: 'Who is responsible for maintaining DCC meeting minutes and documentation?',
      options: ['Chairperson', 'Vice-Chairperson', 'Secretary', 'Organizing Secretary'],
      correctAnswer: '2', // Index 2 = 'Secretary'
      explanation: 'The DCC Secretary is responsible for recording all meetings and maintaining documentation.',
      points: 2,
    },
    {
      question: 'A typical cell consists of how many households?',
      options: ['5-10 households', '10-20 households', '20-50 households', '50-100 households'],
      correctAnswer: '1', // Index 1 = '10-20 households'
      explanation: 'A cell is the smallest organizational unit, typically consisting of 10-20 households.',
      points: 2,
    },
    {
      question: 'What is the primary role of the DCC Organizing Secretary?',
      options: ['Financial management', 'Mobilization and recruitment', 'Meeting minutes', 'Media relations'],
      correctAnswer: '1', // Index 1 = 'Mobilization and recruitment'
      explanation: 'The Organizing Secretary is responsible for mobilization, recruitment, and event organization.',
      points: 2,
    },
    {
      question: 'How often should regular DCC meetings be held at minimum?',
      options: ['Weekly', 'Monthly', 'Quarterly', 'Bi-annually'],
      correctAnswer: '1', // Index 1 = 'Monthly'
      explanation: 'Regular DCC meetings should be held at least monthly for effective coordination.',
      points: 2,
    },
    {
      question: 'What is the minimum duration of mandatory training for parliamentary candidates?',
      options: ['1 month', '2 months', '3 months', '6 months'],
      correctAnswer: '2', // Index 2 = '3 months'
      explanation: 'Parliamentary candidates are required to complete 3 months of training as per the 2016 resolution.',
      points: 2,
    },
    
    // Module 2: Party-Government Coordination (8 questions, 16 marks)
    {
      question: 'What is the principle that governs party-government relations in Zimbabwe?',
      options: [
        'Separation of powers',
        'Complementarity not contradiction',
        'Complete independence',
        'Government dominance',
      ],
      correctAnswer: '1', // Index 1 = 'Complementarity not contradiction'
      explanation: 'The principle of "complementarity not contradiction" ensures party and government work together harmoniously.',
      points: 2,
    },
    {
      question: 'Which of the following is a key coordination mechanism between DCCs and local government?',
      options: [
        'Regular joint meetings',
        'Complete separation of functions',
        'Government subordination to party',
        'No formal coordination needed',
      ],
      correctAnswer: '0', // Index 0 = 'Regular joint meetings'
      explanation: 'Regular joint meetings between DCCs and local government structures facilitate coordination.',
      points: 2,
    },
    {
      question: 'What is the DCC\'s role in Vision 2030 implementation?',
      options: [
        'No role',
        'Passive observer',
        'Grassroots implementation and community mobilization',
        'National policy formulation only',
      ],
      correctAnswer: '2', // Index 2 = 'Grassroots implementation and community mobilization'
      explanation: 'DCCs play a crucial role in implementing Vision 2030 at the grassroots level through community mobilization.',
      points: 2,
    },
    {
      question: 'How should DCCs coordinate with Rural District Councils (RDCs)?',
      options: [
        'Ignore RDC decisions',
        'Through formal channels with mutual respect',
        'Through conflict and competition',
        'Complete separation',
      ],
      correctAnswer: '1', // Index 1 = 'Through formal channels with mutual respect'
      explanation: 'DCCs should coordinate with RDCs through formal channels while maintaining mutual respect for each other\'s roles.',
      points: 2,
    },
    {
      question: 'What is the primary focus when coordinating with traditional leaders?',
      options: [
        'Undermining their authority',
        'Respecting cultural protocols and collaborative development',
        'Ignoring traditional structures',
        'Replacing traditional leadership',
      ],
      correctAnswer: '1', // Index 1 = 'Respecting cultural protocols and collaborative development'
      explanation: 'Coordination with traditional leaders requires respecting cultural protocols and working collaboratively.',
      points: 2,
    },
    {
      question: 'In resource mobilization and allocation, DCCs should:',
      options: [
        'Control all resources exclusively',
        'Coordinate with multiple stakeholders transparently',
        'Ignore community needs',
        'Work in isolation',
      ],
      correctAnswer: '1', // Index 1 = 'Coordinate with multiple stakeholders transparently'
      explanation: 'Effective resource mobilization requires transparent coordination with all relevant stakeholders.',
      points: 2,
    },
    {
      question: 'What is the best approach to managing inter-agency relationships?',
      options: [
        'Competition',
        'Conflict',
        'Collaboration and communication',
        'Isolation',
      ],
      correctAnswer: '2', // Index 2 = 'Collaboration and communication'
      explanation: 'Effective inter-agency relationships require active collaboration and open communication.',
      points: 2,
    },
    {
      question: 'When coordinating policy implementation at district level, DCCs must ensure:',
      options: [
        'Policy interpretation without consultation',
        'Alignment with national goals and local context',
        'Complete autonomy from national policy',
        'Policy modification without authorization',
      ],
      correctAnswer: '1', // Index 1 = 'Alignment with national goals and local context'
      explanation: 'Policy implementation must balance national goals with local context and needs.',
      points: 2,
    },

    // Module 3: Community Engagement and Development (7 questions, 14 marks)
    {
      question: 'What is the first step in community needs assessment?',
      options: [
        'Implement solutions immediately',
        'Conduct comprehensive community consultation',
        'Ignore community input',
        'Impose external solutions',
      ],
      correctAnswer: '1', // Index 1 = 'Conduct comprehensive community consultation'
      explanation: 'Effective community needs assessment begins with comprehensive consultation with community members.',
      points: 2,
    },
    {
      question: 'In development project management, what is essential for success?',
      options: [
        'Working in isolation',
        'Community participation and ownership',
        'Ignoring local knowledge',
        'Top-down decision making only',
      ],
      correctAnswer: '1', // Index 1 = 'Community participation and ownership'
      explanation: 'Successful development projects require active community participation and ownership from the start.',
      points: 2,
    },
    {
      question: 'Public-Private Partnerships (PPPs) in community development require:',
      options: [
        'No oversight',
        'Clear agreements and mutual benefit',
        'Private sector dominance',
        'Complete public control',
      ],
      correctAnswer: '1', // Index 1 = 'Clear agreements and mutual benefit'
      explanation: 'Effective PPPs require clear agreements that benefit both public and private partners.',
      points: 2,
    },
    {
      question: 'When engaging with civil society organizations, DCCs should:',
      options: [
        'Avoid all contact',
        'Build partnerships based on shared community goals',
        'Dominate and control',
        'Ignore their contributions',
      ],
      correctAnswer: '1', // Index 1 = 'Build partnerships based on shared community goals'
      explanation: 'Civil society engagement should be based on partnership and shared goals for community development.',
      points: 2,
    },
    {
      question: 'Effective communication and public relations require:',
      options: [
        'One-way messaging',
        'Transparency, consistency, and two-way engagement',
        'Secrecy',
        'Misinformation',
      ],
      correctAnswer: '1', // Index 1 = 'Transparency, consistency, and two-way engagement'
      explanation: 'Effective communication is transparent, consistent, and allows for feedback and engagement.',
      points: 2,
    },
    {
      question: 'What is crucial for monitoring and evaluating community development projects?',
      options: [
        'No monitoring needed',
        'Regular data collection and community feedback',
        'Only external evaluation',
        'Ignore results',
      ],
      correctAnswer: '1', // Index 1 = 'Regular data collection and community feedback'
      explanation: 'Effective monitoring requires regular data collection and incorporating community feedback.',
      points: 2,
    },
    {
      question: 'In community engagement, building trust requires:',
      options: [
        'Quick promises',
        'Consistent actions, transparency, and delivering on commitments',
        'Empty rhetoric',
        'Avoiding difficult conversations',
      ],
      correctAnswer: '1', // Index 1 = 'Consistent actions, transparency, and delivering on commitments'
      explanation: 'Trust is built through consistent actions, transparency, and following through on commitments.',
      points: 2,
    },
  ];

  // Create multiple choice questions
  for (const q of mcQuestions) {
    await questionRepository.save(
      questionRepository.create({
        quizId: finalExam.id,
        questionType: QuestionType.MULTIPLE_CHOICE,
        questionText: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        orderIndex: orderIndex++,
      }),
    );
  }

  // ============================================
  // SECTION 2: TRUE/FALSE QUESTIONS (20 marks - 20 questions × 1 mark)
  // ============================================
  console.log('Creating true/false questions...');

  const tfQuestions = [
    {
      question: 'DCCs were established immediately after independence in 1980 as formal structures.',
      correctAnswer: 'False',
      explanation: 'DCCs evolved gradually through the 1980s and 1990s, becoming formalized structures over time.',
      points: 1,
    },
    {
      question: 'The principle "No representation without certification" applies to all party members.',
      correctAnswer: 'False',
      explanation: 'This principle applies to electoral candidates seeking party endorsement, not to ordinary members.',
      points: 1,
    },
    {
      question: 'Vision 2030 implementation at the grassroots level is a current key focus area for DCC activities.',
      correctAnswer: 'True',
      explanation: 'DCCs are central to implementing Vision 2030 goals at the community level.',
      points: 1,
    },
    {
      question: 'DCC decisions can be made by the Chairperson alone without consulting other members.',
      correctAnswer: 'False',
      explanation: 'DCCs operate on collective leadership principles; major decisions require consensus or majority vote.',
      points: 1,
    },
    {
      question: 'Ward Chairpersons are permanent members of the DCC.',
      correctAnswer: 'False',
      explanation: 'Ward Chairpersons typically send representative samples to DCC meetings rather than all attending as permanent members.',
      points: 1,
    },
    {
      question: 'Cell chairpersons are responsible for maintaining membership lists and collecting membership fees.',
      correctAnswer: 'True',
      explanation: 'Cell chairpersons manage membership at the most basic level, including maintaining lists and collecting fees.',
      points: 1,
    },
    {
      question: 'Ward Coordinating Committees should submit monthly reports to the DCC.',
      correctAnswer: 'True',
      explanation: 'Monthly reporting from wards to DCCs is essential for tracking progress and ensuring accountability.',
      points: 1,
    },
    {
      question: 'Digital tools like WhatsApp groups are now important for modern ward coordination.',
      correctAnswer: 'True',
      explanation: 'Digital transformation enhances coordination efficiency with modern communication tools.',
      points: 1,
    },
    {
      question: 'According to democratic centralism, once a decision is made, all members must implement it in a unified manner.',
      correctAnswer: 'True',
      explanation: 'Democratic centralism allows free discussion before decisions but requires unified implementation afterward.',
      points: 1,
    },
    {
      question: 'DCCs should compete with local government structures rather than coordinate.',
      correctAnswer: 'False',
      explanation: 'DCCs should coordinate with local government through complementarity, not competition.',
      points: 1,
    },
    {
      question: 'Community needs assessment should be conducted without community input to avoid bias.',
      correctAnswer: 'False',
      explanation: 'Community needs assessment requires active community participation and input.',
      points: 1,
    },
    {
      question: 'Public-Private Partnerships can enhance community development when properly structured.',
      correctAnswer: 'True',
      explanation: 'Well-structured PPPs can bring resources and expertise to community development projects.',
      points: 1,
    },
    {
      question: 'DCCs should ignore civil society organizations when planning development projects.',
      correctAnswer: 'False',
      explanation: 'Civil society organizations can be valuable partners in community development when engaged appropriately.',
      points: 1,
    },
    {
      question: 'Transparency in communication helps build community trust in DCC activities.',
      correctAnswer: 'True',
      explanation: 'Transparency is a fundamental principle for building and maintaining community trust.',
      points: 1,
    },
    {
      question: 'Quarterly Ward Conferences should be held every three months.',
      correctAnswer: 'True',
      explanation: 'Quarterly Ward Conferences bring together cell chairpersons every three months for review and planning.',
      points: 1,
    },
    {
      question: 'The DCC Finance Secretary handles all financial matters independently without oversight.',
      correctAnswer: 'False',
      explanation: 'Financial matters should be subject to proper oversight and accountability mechanisms.',
      points: 1,
    },
    {
      question: 'Resource mobilization should involve only the DCC without external stakeholders.',
      correctAnswer: 'False',
      explanation: 'Effective resource mobilization requires coordination with multiple stakeholders.',
      points: 1,
    },
    {
      question: 'Traditional leaders have no role in modern DCC coordination efforts.',
      correctAnswer: 'False',
      explanation: 'Traditional leaders play important roles in community coordination and should be engaged respectfully.',
      points: 1,
    },
    {
      question: 'Community participation is optional in development project management.',
      correctAnswer: 'False',
      explanation: 'Community participation is essential for project success and sustainability.',
      points: 1,
    },
    {
      question: 'Monitoring and evaluation are crucial for learning and improving development projects.',
      correctAnswer: 'True',
      explanation: 'Regular monitoring and evaluation enable continuous learning and project improvement.',
      points: 1,
    },
  ];

  // Create true/false questions
  for (const q of tfQuestions) {
    await questionRepository.save(
      questionRepository.create({
        quizId: finalExam.id,
        questionType: QuestionType.TRUE_FALSE,
        questionText: q.question,
        options: ['True', 'False'],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
        orderIndex: orderIndex++,
      }),
    );
  }

  // ============================================
  // SECTION 3: SHORT ANSWER QUESTIONS (60 marks - 12 questions × 5 marks)
  // ============================================
  console.log('Creating short answer questions...');

  const shortAnswerQuestions = [
    {
      question: 'Explain the historical evolution of DCCs from the liberation struggle to the present day, highlighting key milestones.',
      correctAnswer: 'Student should describe evolution through: 1980-1990 foundation years, 1990-2000 consolidation, 2000-2010 adaptation period, 2010-present modernization including 2016 mandatory training resolution. Key milestones include post-independence integration, formalization, land reform coordination, and Vision 2030 alignment.',
      points: 5,
    },
    {
      question: 'Describe the structure and composition of a District Coordinating Committee, including the roles of key leadership positions.',
      correctAnswer: 'Should include: 10 core positions (Chairperson, Vice-Chairperson, Secretary, Organizing Secretary, Finance Secretary, and five sectoral secretaries). Explain key responsibilities: Chairperson leads meetings, Secretary maintains records, Organizing Secretary handles mobilization, Finance Secretary manages resources. Mention quorum requirements (two-thirds) and meeting frequency (monthly minimum).',
      points: 5,
    },
    {
      question: 'How does the ward-based coordination system work, and what is the relationship between cells, wards, and districts?',
      correctAnswer: 'Explain: Cells (10-20 households) as smallest unit managed by cell chairpersons, Wards (1,958 total) coordinated by Ward Coordinating Committees, Districts (63) managed by DCCs. Describe upward reporting (cells→wards→districts), Quarterly Ward Conferences, monthly reporting requirements, and coordination mechanisms.',
      points: 5,
    },
    {
      question: 'What is the principle of "complementarity not contradiction" in party-government relations, and how should DCCs apply it?',
      correctAnswer: 'Explain that party and government should work together harmoniously without conflict. DCCs should coordinate through joint meetings, respect constitutional boundaries, collaborate on development projects, maintain unified communication, and ensure policy alignment. Avoid overstepping into government functions while supporting policy implementation.',
      points: 5,
    },
    {
      question: 'Describe the coordination mechanisms between DCCs and Rural District Councils, including best practices.',
      correctAnswer: 'Mechanisms include: formal communication channels, joint planning sessions, regular meetings, coordinated project monitoring, unified community engagement. Best practices: mutual respect, clear role definition, transparent communication, collaborative problem-solving, avoiding duplication of efforts.',
      points: 5,
    },
    {
      question: 'What is the DCC\'s role in implementing Vision 2030 at the grassroots level?',
      correctAnswer: 'DCCs play a crucial role in: mobilizing communities to understand Vision 2030 goals, coordinating local development projects aligned with national objectives, facilitating community participation, monitoring progress, providing feedback to higher levels, and ensuring grassroots ownership of development initiatives.',
      points: 5,
    },
    {
      question: 'Explain the process of conducting a comprehensive community needs assessment.',
      correctAnswer: 'Process includes: community consultation through meetings and surveys, identifying key stakeholders, data collection on demographics and challenges, prioritization of needs with community input, documentation and analysis, developing action plans based on findings, and ensuring ongoing community participation throughout the process.',
      points: 5,
    },
    {
      question: 'How should DCCs approach development project management to ensure success and sustainability?',
      correctAnswer: 'Approach should include: community participation from planning to implementation, clear project goals and timelines, resource mobilization and transparent allocation, regular monitoring and evaluation, stakeholder engagement, risk management, capacity building for sustainability, and building local ownership.',
      points: 5,
    },
    {
      question: 'Describe how DCCs should engage with civil society organizations and what benefits this can bring.',
      correctAnswer: 'Engagement should be: based on partnership and shared community goals, transparent and respectful, avoiding domination. Benefits include: additional resources and expertise, broader community reach, enhanced credibility, innovative approaches, and strengthened community mobilization. Should maintain clear boundaries and mutual respect.',
      points: 5,
    },
    {
      question: 'What communication strategies should DCCs employ for effective public relations and community engagement?',
      correctAnswer: 'Strategies include: transparency and consistency in messaging, two-way communication allowing feedback, use of multiple channels (meetings, digital platforms, traditional media), timely information sharing, addressing misinformation proactively, engaging with diverse community groups, and maintaining regular communication schedules.',
      points: 5,
    },
    {
      question: 'Explain the importance of monitoring and evaluation in community development projects and outline key evaluation metrics.',
      correctAnswer: 'Importance: enables learning, identifies problems early, ensures accountability, measures impact, guides future planning. Key metrics: project completion rates, community satisfaction levels, resource utilization efficiency, goal achievement, participation rates, sustainability indicators, and lessons learned for improvement.',
      points: 5,
    },
    {
      question: 'How can DCCs build and maintain trust within their communities?',
      correctAnswer: 'Build trust through: consistent actions matching words, transparency in decision-making, delivering on commitments, active listening to community concerns, accountability for resources and actions, inclusive participation, addressing problems promptly, respecting community values, and maintaining integrity in all activities.',
      points: 5,
    },
  ];

  // Create short answer questions
  for (const q of shortAnswerQuestions) {
    await questionRepository.save(
      questionRepository.create({
        quizId: finalExam.id,
        questionType: QuestionType.SHORT_ANSWER,
        questionText: q.question,
        options: null,
        correctAnswer: q.correctAnswer,
        explanation: q.correctAnswer, // Use the same as correctAnswer for grading reference
        points: q.points,
        orderIndex: orderIndex++,
      }),
    );
  }

  const totalMarks = mcQuestions.reduce((sum, q) => sum + q.points, 0) +
                      tfQuestions.reduce((sum, q) => sum + q.points, 0) +
                      shortAnswerQuestions.reduce((sum, q) => sum + q.points, 0);

  console.log('✅ DCC Training Final Exam seeding completed!');
  console.log(`   Total marks: ${totalMarks}`);
  console.log(`   Multiple Choice: ${mcQuestions.length} questions (${mcQuestions.reduce((sum, q) => sum + q.points, 0)} marks)`);
  console.log(`   True/False: ${tfQuestions.length} questions (${tfQuestions.reduce((sum, q) => sum + q.points, 0)} marks)`);
  console.log(`   Short Answer: ${shortAnswerQuestions.length} questions (${shortAnswerQuestions.reduce((sum, q) => sum + q.points, 0)} marks)`);
}

