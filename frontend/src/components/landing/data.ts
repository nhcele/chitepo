import { CourseDifficulty } from '@mindelta/shared';

export type FeaturedCourse = {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  duration: number;
  coverImage: string;
  difficulty: CourseDifficulty;
  /** Fallback preview data — links to the catalogue instead of a detail page */
  isSample?: boolean;
};

export const stats = [
  { label: 'Practical tracks', value: '6' },
  { label: 'Local government focus', value: '100%' },
  { label: 'Party structures', value: 'Ward-DCC' },
  { label: 'Governance modules', value: '16' },
];

export const features = [
  {
    number: '01',
    title: 'Practical governance track',
    description:
      'Structured training for councillors, DCC members, ward leaders, and public servants responsible for delivery on the ground.',
  },
  {
    number: '02',
    title: 'Party structures and mobilization',
    description:
      'Courses for branch, district, and provincial organizing: political education, community engagement, and accountable leadership.',
  },
  {
    number: '03',
    title: 'Local government delivery',
    description:
      'Applied learning in service delivery, rural development, public administration, and coordination between party and government.',
  },
];

export const sampleCourses: FeaturedCourse[] = [
  {
    id: 'pan-africanism',
    isSample: true,
    title: 'District Coordinating Committee (DCC) Training',
    subtitle: 'Practical coordination for party structures, local development priorities, and government delivery.',
    instructor: 'Kudzai Nhema',
    duration: 420,
    coverImage: '/api/placeholder/400/225',
    difficulty: CourseDifficulty.INTERMEDIATE,
  },
  {
    id: 'revolutionary-theory',
    isSample: true,
    title: 'Local Government and Ward Leadership',
    subtitle: 'Tools for councillors and ward teams working on service delivery, consultation, and community accountability.',
    instructor: 'Tafadzwa Mupfumira',
    duration: 450,
    coverImage: '/api/placeholder/400/225',
    difficulty: CourseDifficulty.INTERMEDIATE,
  },
  {
    id: 'leadership-governance',
    isSample: true,
    title: 'Rural Development and Community Engagement',
    subtitle: 'Agriculture, infrastructure, and grassroots planning for leaders working with communities every week.',
    instructor: 'Rumbidzai Chikwanha',
    duration: 420,
    coverImage: '/api/placeholder/400/225',
    difficulty: CourseDifficulty.INTERMEDIATE,
  },
];

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const difficultyLabel: Record<CourseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
