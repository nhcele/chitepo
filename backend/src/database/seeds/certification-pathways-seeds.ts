import { DataSource } from 'typeorm';
import { CertificationPathway, PathwayType } from '../../certifications/entities/certification-pathway.entity';

export async function seedCertificationPathways(dataSource: DataSource) {
  const pathwayRepository = dataSource.getRepository(CertificationPathway);

  const pathways = [
    // GENERAL IDEOLOGICAL EDUCATION PATHWAY
    {
      name: 'General Ideological Education',
      type: PathwayType.GENERAL_EDUCATION,
      level: 0,
      levelTitle: 'Orientation Certificate',
      estimatedDurationWeeks: 2,
      cost: 0,
      minimumCourses: 0,
      passPercentage: 60,
      requirements: ['Complete 10-hour orientation program', 'Pass basic quiz (60%)'],
      outcome: 'Foundation for further studies',
      isMandatory: false,
      orderIndex: 0,
    },
    {
      name: 'General Ideological Education',
      type: PathwayType.GENERAL_EDUCATION,
      level: 1,
      levelTitle: 'Certificate in Political Ideology',
      estimatedDurationWeeks: 12,
      cost: 30,
      minimumCourses: 4,
      passPercentage: 50,
      requirements: ['Complete 4 core courses', '50% pass mark', 'Capstone essay (2,000 words)'],
      outcome: 'Comprehensive ideological foundation',
      isMandatory: false,
      orderIndex: 1,
    },
    {
      name: 'General Ideological Education',
      type: PathwayType.GENERAL_EDUCATION,
      level: 2,
      levelTitle: 'Advanced Certificate in Ideology and Governance',
      estimatedDurationWeeks: 24,
      cost: 60,
      minimumCourses: 8,
      passPercentage: 60,
      requirements: ['Complete 8 courses (4 core + 4 contemporary)', '60% pass mark', 'Research project'],
      outcome: 'Advanced ideological competence',
      isMandatory: false,
      orderIndex: 2,
    },
    {
      name: 'General Ideological Education',
      type: PathwayType.GENERAL_EDUCATION,
      level: 3,
      levelTitle: 'Diploma in Political Ideology and African Studies',
      estimatedDurationWeeks: 48,
      cost: 120,
      minimumCourses: 16,
      passPercentage: 65,
      requirements: ['Complete all 16 core & contemporary courses', '65% pass mark', 'Thesis (10,000 words)', 'Field research'],
      outcome: 'Nationally recognized diploma',
      isMandatory: false,
      orderIndex: 3,
    },
    {
      name: 'General Ideological Education',
      type: PathwayType.GENERAL_EDUCATION,
      level: 4,
      levelTitle: 'Master Trainer Certification',
      estimatedDurationWeeks: 6,
      cost: 50,
      minimumCourses: 16,
      passPercentage: 70,
      requirements: ['Hold Diploma', '2 years experience', 'Train-the-trainer program', 'Deliver 3 training sessions'],
      outcome: 'Authorized to train party members',
      isMandatory: false,
      orderIndex: 4,
    },

    // GOVERNMENT OFFICIALS PATHWAY
    {
      name: 'Government Officials Track',
      type: PathwayType.GOVERNMENT_OFFICIALS,
      level: 1,
      levelTitle: 'Certificate in Public Service and Ideology',
      estimatedDurationWeeks: 8,
      cost: 0,
      minimumCourses: 1,
      passPercentage: 50,
      requirements: ['Complete orientation', 'Complete 1 specialized track', 'Field project report'],
      outcome: 'Basic qualification for official duties',
      isMandatory: true,
      mandatoryFor: 'New councillors (within 6 months of election)',
      orderIndex: 10,
    },
    {
      name: 'Government Officials Track',
      type: PathwayType.GOVERNMENT_OFFICIALS,
      level: 2,
      levelTitle: 'Advanced Certificate in Governance',
      estimatedDurationWeeks: 12,
      cost: 0,
      minimumCourses: 2,
      passPercentage: 60,
      requirements: ['Hold Level 1', 'Complete 2 specialized tracks', 'Development project'],
      outcome: 'Qualification for senior positions',
      isMandatory: true,
      mandatoryFor: 'Mayoral candidates, Council chairpersons',
      orderIndex: 11,
    },
    {
      name: 'Government Officials Track',
      type: PathwayType.GOVERNMENT_OFFICIALS,
      level: 3,
      levelTitle: 'Diploma in Governance and Ideology',
      estimatedDurationWeeks: 24,
      cost: 0,
      minimumCourses: 6,
      passPercentage: 70,
      requirements: ['Complete all Phase 1-3', '70% distinction', 'Thesis on governance', 'Leadership demonstration'],
      outcome: 'Highest qualification for officials',
      isMandatory: true,
      mandatoryFor: 'Parliamentary candidates, Senate candidates',
      orderIndex: 12,
    },
    {
      name: 'Government Officials Track',
      type: PathwayType.GOVERNMENT_OFFICIALS,
      level: 4,
      levelTitle: 'Train-the-Trainer (Ward-Based)',
      estimatedDurationWeeks: 4,
      cost: 0,
      minimumCourses: 6,
      passPercentage: 75,
      requirements: ['Hold Diploma', 'Train 20 ward members', 'Develop training materials'],
      outcome: 'Build ward capacity',
      isMandatory: false,
      orderIndex: 13,
    },

    // DIASPORA ENGAGEMENT PATHWAY
    {
      name: 'Diaspora Engagement Track',
      type: PathwayType.DIASPORA_ENGAGEMENT,
      level: 1,
      levelTitle: 'Certificate in Diaspora Engagement',
      estimatedDurationWeeks: 8,
      cost: 50,
      minimumCourses: 1,
      passPercentage: 50,
      requirements: ['Complete 1 diaspora stream', 'Capstone project', 'Active in community'],
      outcome: 'Formal diaspora recognition',
      isMandatory: false,
      orderIndex: 20,
    },
    {
      name: 'Diaspora Engagement Track',
      type: PathwayType.DIASPORA_ENGAGEMENT,
      level: 2,
      levelTitle: 'Advanced Certificate in Diaspora Leadership',
      estimatedDurationWeeks: 16,
      cost: 90,
      minimumCourses: 2,
      passPercentage: 60,
      requirements: ['Complete 2 diaspora streams', 'Leadership project', 'Lead initiative'],
      outcome: 'Diaspora leadership eligibility',
      isMandatory: false,
      orderIndex: 21,
    },
    {
      name: 'Diaspora Engagement Track',
      type: PathwayType.DIASPORA_ENGAGEMENT,
      level: 3,
      levelTitle: 'Diploma in Diaspora Affairs',
      estimatedDurationWeeks: 30,
      cost: 150,
      minimumCourses: 4,
      passPercentage: 70,
      requirements: ['Complete all 4 streams', 'Major contribution', 'Attend annual conference'],
      outcome: 'National diaspora representative',
      isMandatory: false,
      orderIndex: 22,
    },
    {
      name: 'Diaspora Engagement Track',
      type: PathwayType.DIASPORA_ENGAGEMENT,
      level: 4,
      levelTitle: 'Diaspora Ambassador Certification',
      estimatedDurationWeeks: 6,
      cost: 0,
      minimumCourses: 4,
      passPercentage: 75,
      requirements: ['Hold Diploma', 'Excellence in advocacy', 'Network of 100+ members', 'Media presence'],
      outcome: 'Official diaspora ambassador',
      isMandatory: false,
      orderIndex: 23,
    },

    // YOUTH LEADERSHIP PATHWAY
    {
      name: 'Youth Leadership Track',
      type: PathwayType.YOUTH_LEADERSHIP,
      level: 1,
      levelTitle: 'Certificate in Youth Leadership',
      estimatedDurationWeeks: 6,
      cost: 15,
      minimumCourses: 1,
      passPercentage: 50,
      requirements: ['Age 18-35', 'Youth leadership course', 'Community service (20 hours)'],
      outcome: 'Youth league recognition',
      isMandatory: false,
      orderIndex: 30,
    },
    {
      name: 'Youth Leadership Track',
      type: PathwayType.YOUTH_LEADERSHIP,
      level: 2,
      levelTitle: 'Advanced Certificate in Youth Political Leadership',
      estimatedDurationWeeks: 12,
      cost: 30,
      minimumCourses: 4,
      passPercentage: 60,
      requirements: ['Hold Level 1', '4 additional courses', 'Mobilization campaign'],
      outcome: 'Youth leadership positions',
      isMandatory: false,
      orderIndex: 31,
    },
    {
      name: 'Youth Leadership Track',
      type: PathwayType.YOUTH_LEADERSHIP,
      level: 3,
      levelTitle: 'Diploma in Youth Development and Ideology',
      estimatedDurationWeeks: 24,
      cost: 60,
      minimumCourses: 8,
      passPercentage: 65,
      requirements: ['Complete 8 core courses', 'Major youth project', 'Research dissertation'],
      outcome: 'Full party leadership eligibility',
      isMandatory: false,
      orderIndex: 32,
    },

    // WOMEN'S LEADERSHIP PATHWAY
    {
      name: 'Women\'s Leadership Track',
      type: PathwayType.WOMENS_LEADERSHIP,
      level: 1,
      levelTitle: 'Certificate in Women\'s Leadership',
      estimatedDurationWeeks: 8,
      cost: 15,
      minimumCourses: 1,
      passPercentage: 50,
      requirements: ['Gender studies course', 'Empowerment project'],
      outcome: 'Women\'s league recognition',
      isMandatory: false,
      orderIndex: 40,
    },
    {
      name: 'Women\'s Leadership Track',
      type: PathwayType.WOMENS_LEADERSHIP,
      level: 2,
      levelTitle: 'Advanced Certificate in Women\'s Political Leadership',
      estimatedDurationWeeks: 12,
      cost: 30,
      minimumCourses: 4,
      passPercentage: 60,
      requirements: ['Hold Level 1', '4 additional courses', 'Mentor 5 younger women'],
      outcome: 'Senior women\'s league positions',
      isMandatory: false,
      orderIndex: 41,
    },
    {
      name: 'Women\'s Leadership Track',
      type: PathwayType.WOMENS_LEADERSHIP,
      level: 3,
      levelTitle: 'Diploma in Gender and Development',
      estimatedDurationWeeks: 24,
      cost: 60,
      minimumCourses: 8,
      passPercentage: 70,
      requirements: ['Comprehensive curriculum', 'Research on gender issues', 'Demonstrated impact'],
      outcome: 'Expert recognition, policy consultation',
      isMandatory: false,
      orderIndex: 42,
    },
  ];

  console.log('Starting to seed certification pathways...');

  for (const pathwayData of pathways) {
    // Check if pathway already exists
    const existing = await pathwayRepository.findOne({
      where: {
        type: pathwayData.type,
        level: pathwayData.level,
      },
    });

    if (existing) {
      console.log(`Pathway "${pathwayData.levelTitle}" already exists, skipping...`);
      continue;
    }

    const pathway = pathwayRepository.create(pathwayData);
    await pathwayRepository.save(pathway);
    console.log(`Created pathway: ${pathway.levelTitle}`);
  }

  console.log('✅ Certification pathways seeding completed!');
  console.log(`   Total pathways created: ${pathways.length}`);
  console.log('   Pathway types:');
  console.log('   - General Education: 5 levels');
  console.log('   - Government Officials: 4 levels');
  console.log('   - Diaspora Engagement: 4 levels');
  console.log('   - Youth Leadership: 3 levels');
  console.log('   - Women\'s Leadership: 3 levels');
}

