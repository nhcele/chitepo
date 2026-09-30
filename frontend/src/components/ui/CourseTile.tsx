import Link from 'next/link';
import { ArrowRightIcon, AcademicCapIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import CourseCover from './CourseCover';

interface CourseTileProps {
  id: string;
  title: string;
  description?: string;
  instructor?: string;
  category?: string;
  difficulty?: string;
  estimatedDuration?: number;
  students?: number;
  coverImage?: string;
  enrolled?: boolean;
  progress?: number;
}

export default function CourseTile({
  id,
  title,
  description,
  instructor,
  category,
  difficulty,
  estimatedDuration,
  students,
  coverImage,
  enrolled,
  progress,
}: CourseTileProps) {
  const href = enrolled ? `/courses/${id}/learn` : `/courses/${id}`;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Link
      href={href}
      className="group block bg-paper border border-border/60 rounded-md overflow-hidden hover:border-forest-600 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-[16/10] bg-forest-100 overflow-hidden">
        <CourseCover
          title={title}
          src={coverImage}
          className="transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {enrolled && typeof progress === 'number' && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-forest-100">
            <div className="h-full bg-forest-600" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="p-5">
        {category && (
          <p className="text-xs font-semibold uppercase tracking-wider text-ochre-600 mb-2">
            {category}
          </p>
        )}
        <h3 className="font-serif text-lg font-semibold text-charcoal group-hover:text-forest-600 transition-colors mb-2 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-stone line-clamp-2 mb-4">{description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-pewter">
          {instructor && (
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-charcoal">{instructor}</span>
            </span>
          )}
          {difficulty && (
            <span className="inline-flex items-center gap-1">
              <AcademicCapIcon className="w-3.5 h-3.5" />
              {difficulty.toLowerCase()}
            </span>
          )}
          {estimatedDuration ? (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatDuration(estimatedDuration)}
            </span>
          ) : null}
          {typeof students === 'number' && students > 0 && (
            <span className="inline-flex items-center gap-1">
              <UserGroupIcon className="w-3.5 h-3.5" />
              {students.toLocaleString()}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
          <span className="text-sm font-semibold text-forest-600 group-hover:text-forest-500 transition-colors">
            {enrolled ? 'Continue learning' : 'View course'}
          </span>
          <ArrowRightIcon className="w-4 h-4 text-forest-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
