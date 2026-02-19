import Link from 'next/link';
import Image from 'next/image';
import { StarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { CourseDifficulty } from '@mindelta/shared';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    subtitle: string;
    instructor: string;
    rating: number;
    students: number;
    duration: number; // in minutes
    coverImage: string;
    difficulty: CourseDifficulty;
  };
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export default function CourseCard({ course }: CourseCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatStudents = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="course-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Course Image */}
      <Link href={`/courses/${course.id}`} className="block">
        <div className="relative h-48 bg-gray-200">
          <Image
            src={course.coverImage}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${difficultyColors[course.difficulty]}`}>
              {course.difficulty}
            </span>
          </div>
        </div>
      </Link>

      {/* Course Content */}
      <div className="p-6">
        <Link href={`/courses/${course.id}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600">
            {course.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {course.subtitle}
        </p>
        
        <p className="text-sm text-gray-500 mb-4">
          by {course.instructor}
        </p>

        {/* Course Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="font-medium">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserGroupIcon className="w-4 h-4" />
            <span>{formatStudents(course.students)}</span>
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span>{formatDuration(course.duration)}</span>
          </div>
        </div>
      </div>

      {/* Enroll Button */}
      <div className="px-6 pb-6 flex justify-end">
        <Link 
          href={`/courses/${course.id}`}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Enroll Now
        </Link>
      </div>
    </div>
  );
}
