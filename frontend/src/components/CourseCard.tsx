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
  beginner: 'bg-forest-100 text-forest-800',
  intermediate: 'bg-ochre-100 text-ochre-800',
  advanced: 'bg-terracotta-100 text-terracotta-800',
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
    <div className="course-card bg-white rounded-md shadow-sm overflow-hidden hover:shadow-sm transition-all duration-300">
      {/* Course Image */}
      <Link href={`/courses/${course.id}`} className="block">
        <div className="relative h-48 bg-forest-100">
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
          <h3 className="text-lg font-semibold text-charcoal mb-2 line-clamp-2 hover:text-primary-600">
            {course.title}
          </h3>
        </Link>
        <p className="text-sm text-stone mb-3 line-clamp-2">
          {course.subtitle}
        </p>
        
        <p className="text-sm text-stone mb-4">
          by {course.instructor}
        </p>

        {/* Course Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-stone">
          <div className="flex items-center gap-1">
            <StarIcon className={`w-4 h-4 ${course.rating ? 'text-ochre-400' : 'text-pewter'}`} />
            <span className="font-medium">{course.rating ? course.rating.toFixed(1) : 'New'}</span>
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
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
        >
          View course
        </Link>
      </div>
    </div>
  );
}
