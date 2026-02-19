import { DataSource } from 'typeorm';
import {
  TrainingCohort,
  CohortStatus,
  CohortQuarter,
  CohortTrack,
} from '../../cohorts/entities/training-cohort.entity';

export async function seedTrainingCohorts(dataSource: DataSource) {
  const cohortRepository = dataSource.getRepository(TrainingCohort);

  const cohorts = [
    // 2025 Q1 Cohorts (January - March)
    {
      name: 'DCC Training Cohort Q1 2025',
      track: CohortTrack.DCC_TRAINING,
      quarter: CohortQuarter.Q1,
      year: 2025,
      status: CohortStatus.COMPLETED,
      description: 'District Coordinating Committee training for Q1 2025 focusing on grassroots mobilization and local party-government coordination.',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-03-10'),
      enrollmentOpenDate: new Date('2024-12-01'),
      enrollmentCloseDate: new Date('2025-01-10'),
      maxParticipants: 150,
      currentParticipants: 142,
      isMandatory: true,
      mandatoryFor: 'DCC members elected in 2024',
      isVirtual: false,
      meetingSchedule: 'Every Saturday 9:00-17:00 CAT',
      venue: 'Herbert Chitepo School of Ideology, Harare',
      cost: 0,
      prerequisites: [],
    },
    {
      name: 'Local Government Administration Q1 2025',
      track: CohortTrack.LOCAL_GOVERNMENT,
      quarter: CohortQuarter.Q1,
      year: 2025,
      status: CohortStatus.COMPLETED,
      description: 'Comprehensive training for mayors, councillors, and municipal directors.',
      startDate: new Date('2025-01-20'),
      endDate: new Date('2025-03-20'),
      enrollmentOpenDate: new Date('2024-12-01'),
      enrollmentCloseDate: new Date('2025-01-15'),
      maxParticipants: 100,
      currentParticipants: 95,
      isMandatory: true,
      mandatoryFor: 'New councillors elected in 2024',
      isVirtual: false,
      meetingSchedule: 'Every Monday & Wednesday 18:00-21:00 CAT',
      venue: 'Multiple provincial centers',
      cost: 0,
      prerequisites: [],
    },

    // 2025 Q2 Cohorts (April - June)
    {
      name: 'DCC Training Cohort Q2 2025',
      track: CohortTrack.DCC_TRAINING,
      quarter: CohortQuarter.Q2,
      year: 2025,
      status: CohortStatus.IN_PROGRESS,
      description: 'District Coordinating Committee training for Q2 2025.',
      startDate: new Date('2025-04-15'),
      endDate: new Date('2025-06-10'),
      enrollmentOpenDate: new Date('2025-03-01'),
      enrollmentCloseDate: new Date('2025-04-10'),
      maxParticipants: 150,
      currentParticipants: 128,
      isMandatory: true,
      mandatoryFor: 'New DCC members',
      isVirtual: false,
      meetingSchedule: 'Every Saturday 9:00-17:00 CAT',
      venue: 'Herbert Chitepo School of Ideology, Harare',
      cost: 0,
      prerequisites: [],
    },
    {
      name: 'Rural Development & Community Engagement Q2 2025',
      track: CohortTrack.RURAL_DEVELOPMENT,
      quarter: CohortQuarter.Q2,
      year: 2025,
      status: CohortStatus.IN_PROGRESS,
      description: 'Training for rural development coordinators and ward councillors.',
      startDate: new Date('2025-04-20'),
      endDate: new Date('2025-06-15'),
      enrollmentOpenDate: new Date('2025-03-01'),
      enrollmentCloseDate: new Date('2025-04-15'),
      maxParticipants: 120,
      currentParticipants: 98,
      isMandatory: false,
      isVirtual: false,
      meetingSchedule: 'Every Tuesday & Thursday 14:00-17:00 CAT',
      venue: 'Multiple provincial centers',
      cost: 0,
      prerequisites: [],
    },
    {
      name: 'Diaspora Virtual Program Q2 2025',
      track: CohortTrack.DIASPORA_VIRTUAL,
      quarter: CohortQuarter.Q2,
      year: 2025,
      status: CohortStatus.IN_PROGRESS,
      description: 'Virtual training for diaspora members across all time zones.',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      enrollmentOpenDate: new Date('2025-02-01'),
      enrollmentCloseDate: new Date('2025-03-25'),
      maxParticipants: 500,
      currentParticipants: 387,
      isMandatory: false,
      isVirtual: true,
      meetingSchedule: 'Multiple sessions: 8:00 CAT, 14:00 CAT, 20:00 CAT (to accommodate all time zones)',
      venue: 'Online via Zoom',
      cost: 50,
      prerequisites: [],
    },

    // 2025 Q3 Cohorts (July - September)
    {
      name: 'DCC Training Cohort Q3 2025',
      track: CohortTrack.DCC_TRAINING,
      quarter: CohortQuarter.Q3,
      year: 2025,
      status: CohortStatus.OPEN_FOR_ENROLLMENT,
      description: 'District Coordinating Committee training for Q3 2025.',
      startDate: new Date('2025-07-15'),
      endDate: new Date('2025-09-10'),
      enrollmentOpenDate: new Date('2025-06-01'),
      enrollmentCloseDate: new Date('2025-07-10'),
      maxParticipants: 150,
      currentParticipants: 67,
      isMandatory: true,
      mandatoryFor: 'DCC members without certification',
      isVirtual: false,
      meetingSchedule: 'Every Saturday 9:00-17:00 CAT',
      venue: 'Herbert Chitepo School of Ideology, Harare',
      cost: 0,
      prerequisites: [],
    },
    {
      name: 'Local Government Administration Q3 2025',
      track: CohortTrack.LOCAL_GOVERNMENT,
      quarter: CohortQuarter.Q3,
      year: 2025,
      status: CohortStatus.OPEN_FOR_ENROLLMENT,
      description: 'Advanced training for local government officials.',
      startDate: new Date('2025-07-20'),
      endDate: new Date('2025-09-20'),
      enrollmentOpenDate: new Date('2025-06-01'),
      enrollmentCloseDate: new Date('2025-07-15'),
      maxParticipants: 100,
      currentParticipants: 54,
      isMandatory: true,
      mandatoryFor: 'Mayoral candidates and council chairpersons',
      isVirtual: false,
      meetingSchedule: 'Every Monday & Wednesday 18:00-21:00 CAT',
      venue: 'Multiple provincial centers',
      cost: 0,
      prerequisites: ['Certificate in Public Service and Ideology'],
    },
    {
      name: 'Traditional Leadership Program Q3 2025',
      track: CohortTrack.TRADITIONAL_LEADERSHIP,
      quarter: CohortQuarter.Q3,
      year: 2025,
      status: CohortStatus.OPEN_FOR_ENROLLMENT,
      description: 'Specialized training for traditional leaders on governance and development.',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-09-30'),
      enrollmentOpenDate: new Date('2025-06-15'),
      enrollmentCloseDate: new Date('2025-07-25'),
      maxParticipants: 80,
      currentParticipants: 32,
      isMandatory: false,
      isVirtual: false,
      meetingSchedule: 'Every Friday 10:00-16:00 CAT',
      venue: 'Provincial cultural centers',
      cost: 0,
      prerequisites: [],
    },
    {
      name: 'Judicial Officers Training Q3 2025',
      track: CohortTrack.JUDICIAL_OFFICERS,
      quarter: CohortQuarter.Q3,
      year: 2025,
      status: CohortStatus.OPEN_FOR_ENROLLMENT,
      description: 'Ideological training for judges and magistrates.',
      startDate: new Date('2025-08-05'),
      endDate: new Date('2025-10-05'),
      enrollmentOpenDate: new Date('2025-06-15'),
      enrollmentCloseDate: new Date('2025-07-30'),
      maxParticipants: 50,
      currentParticipants: 18,
      isMandatory: true,
      mandatoryFor: 'All newly appointed judicial officers',
      isVirtual: false,
      meetingSchedule: 'Every Saturday 10:00-16:00 CAT',
      venue: 'Judicial Services Commission Training Center',
      cost: 0,
      prerequisites: [],
    },

    // 2025 Q4 Cohorts (October - December)
    {
      name: 'DCC Training Cohort Q4 2025',
      track: CohortTrack.DCC_TRAINING,
      quarter: CohortQuarter.Q4,
      year: 2025,
      status: CohortStatus.UPCOMING,
      description: 'District Coordinating Committee training for Q4 2025.',
      startDate: new Date('2025-10-15'),
      endDate: new Date('2025-12-10'),
      enrollmentOpenDate: new Date('2025-09-01'),
      enrollmentCloseDate: new Date('2025-10-10'),
      maxParticipants: 150,
      currentParticipants: 0,
      isMandatory: true,
      mandatoryFor: 'All DCC members',
      isVirtual: false,
      meetingSchedule: 'Every Saturday 9:00-17:00 CAT',
      venue: 'Herbert Chitepo School of Ideology, Harare',
      cost: 0,
      prerequisites: [],
    },
    {
      name: 'General Ideology Intensive Q4 2025',
      track: CohortTrack.GENERAL_IDEOLOGY,
      quarter: CohortQuarter.Q4,
      year: 2025,
      status: CohortStatus.UPCOMING,
      description: 'Intensive ideological training for party members.',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-20'),
      enrollmentOpenDate: new Date('2025-08-15'),
      enrollmentCloseDate: new Date('2025-09-25'),
      maxParticipants: 200,
      currentParticipants: 0,
      isMandatory: false,
      isVirtual: false,
      meetingSchedule: 'Flexible schedule - see course details',
      venue: 'Online and in-person options available',
      cost: 30,
      prerequisites: [],
    },
    {
      name: 'Diaspora Virtual Program Q4 2025',
      track: CohortTrack.DIASPORA_VIRTUAL,
      quarter: CohortQuarter.Q4,
      year: 2025,
      status: CohortStatus.UPCOMING,
      description: 'End-of-year virtual training for diaspora members.',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-31'),
      enrollmentOpenDate: new Date('2025-08-01'),
      enrollmentCloseDate: new Date('2025-09-25'),
      maxParticipants: 500,
      currentParticipants: 0,
      isMandatory: false,
      isVirtual: true,
      meetingSchedule: 'Multiple sessions across all time zones',
      venue: 'Online via Zoom',
      cost: 50,
      prerequisites: [],
    },

    // 2026 Q1 Cohorts (Preview)
    {
      name: 'DCC Training Cohort Q1 2026',
      track: CohortTrack.DCC_TRAINING,
      quarter: CohortQuarter.Q1,
      year: 2026,
      status: CohortStatus.UPCOMING,
      description: 'District Coordinating Committee training for Q1 2026.',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-03-10'),
      enrollmentOpenDate: new Date('2025-12-01'),
      enrollmentCloseDate: new Date('2026-01-10'),
      maxParticipants: 150,
      currentParticipants: 0,
      isMandatory: true,
      mandatoryFor: 'All new DCC members',
      isVirtual: false,
      meetingSchedule: 'Every Saturday 9:00-17:00 CAT',
      venue: 'Herbert Chitepo School of Ideology, Harare',
      cost: 0,
      prerequisites: [],
    },
  ];

  console.log('Starting to seed training cohorts...');

  for (const cohortData of cohorts) {
    // Check if cohort already exists
    const existing = await cohortRepository.findOne({
      where: {
        name: cohortData.name,
      },
    });

    if (existing) {
      console.log(`Cohort "${cohortData.name}" already exists, skipping...`);
      continue;
    }

    const cohort = cohortRepository.create(cohortData);
    await cohortRepository.save(cohort);
    console.log(`Created cohort: ${cohort.name}`);
  }

  console.log('✅ Training cohorts seeding completed!');
  console.log(`   Total cohorts created: ${cohorts.length}`);
  console.log('   Breakdown by year and quarter:');
  console.log('   - 2025 Q1: 2 cohorts (Completed)');
  console.log('   - 2025 Q2: 3 cohorts (In Progress)');
  console.log('   - 2025 Q3: 4 cohorts (Open for Enrollment)');
  console.log('   - 2025 Q4: 3 cohorts (Upcoming)');
  console.log('   - 2026 Q1: 1 cohort (Upcoming)');
  console.log('');
  console.log('   Tracks covered:');
  console.log('   - DCC Training: 5 cohorts');
  console.log('   - Local Government: 2 cohorts');
  console.log('   - Rural Development: 1 cohort');
  console.log('   - Traditional Leadership: 1 cohort');
  console.log('   - Judicial Officers: 1 cohort');
  console.log('   - General Ideology: 1 cohort');
  console.log('   - Diaspora Virtual: 2 cohorts');
}

