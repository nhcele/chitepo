import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, PlayIcon, DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export interface SpineLesson {
  id: string;
  title: string;
  type: 'video' | 'document' | 'text' | 'quiz' | string;
  durationMinutes?: number;
  isPreview: boolean;
  status: 'completed' | 'in_progress' | 'current' | 'pending';
  isLocked?: boolean;
  href?: string;
}

export interface SpineModule {
  id: string;
  orderIndex: number;
  title: string;
  description?: string;
  lessons: SpineLesson[];
}

interface CourseKnowledgeSpineProps {
  modules: SpineModule[];
  isEnrolled: boolean;
  title?: string;
}

const LessonIcon = ({ type, status }: { type: string; status: string }) => {
  if (status === 'completed') {
    return (
      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (type === 'video') return <PlayIcon className="w-3.5 h-3.5 text-current" />;
  if (type === 'quiz') return <span className="text-[10px] font-bold">Q</span>;
  return <DocumentTextIcon className="w-3.5 h-3.5 text-current" />;
};

export default function CourseKnowledgeSpine({ modules, isEnrolled, title = 'Knowledge Spine' }: CourseKnowledgeSpineProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(modules.map((m) => m.id)));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (modules.length === 0) return null;

  return (
    <div className="bg-paper border border-border/60 rounded-md p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone mb-6">{title}</h3>
      <div className="relative space-y-6">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/60" aria-hidden="true" />

        {modules.map((module, moduleIndex) => {
          const isExpanded = expanded.has(module.id);
          const moduleCompletedLessons = module.lessons.filter((l) => l.status === 'completed').length;
          const moduleProgress = module.lessons.length > 0 ? (moduleCompletedLessons / module.lessons.length) * 100 : 0;

          return (
            <div key={module.id} className="relative">
              <button
                onClick={() => toggle(module.id)}
                aria-expanded={isExpanded}
                aria-controls={`module-${module.id}`}
                aria-label={`Toggle ${module.title}`}
                className="w-full flex items-start gap-4 text-left group"
              >
                <span className="relative z-10 mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-paper border-forest-600 text-forest-600 font-semibold text-xs">
                  {moduleIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-charcoal group-hover:text-forest-600 transition-colors">
                      {module.title}
                    </p>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-pewter flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-pewter flex-shrink-0" />
                    )}
                  </div>
                  {module.description && (
                    <p className="text-xs text-stone mt-1 line-clamp-2">{module.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="flex-1 h-1 bg-forest-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-label={`${module.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(moduleProgress)}
                    >
                      <div className="h-full bg-forest-600" style={{ width: `${moduleProgress}%` }} />
                    </div>
                    <span className="text-xs text-stone flex-shrink-0">
                      {moduleCompletedLessons}/{module.lessons.length}
                    </span>
                  </div>
                </div>
              </button>

              {isExpanded && module.lessons.length > 0 && (
                <motion.ul
                  id={`module-${module.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 ml-5 space-y-2"
                  role="list"
                >
                  {module.lessons.map((lesson) => {
                    const isLocked = lesson.isLocked ?? (!isEnrolled && !lesson.isPreview);
                    const statusColor =
                      lesson.status === 'completed'
                        ? 'bg-forest-600 border-forest-600 text-white'
                        : lesson.status === 'current' || lesson.status === 'in_progress'
                        ? 'bg-ochre-500 border-ochre-500 text-white'
                        : 'bg-paper border-border/60 text-pewter';

                    const content = (
                      <div className="flex items-start gap-3 py-2">
                        <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${statusColor}`}>
                          <LessonIcon type={lesson.type} status={lesson.status} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              lesson.status === 'pending' && isLocked ? 'text-pewter' : 'text-charcoal'
                            }`}
                          >
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {lesson.durationMinutes !== undefined && lesson.durationMinutes > 0 && (
                              <span className="text-xs text-stone">{lesson.durationMinutes}m</span>
                            )}
                            {lesson.isPreview && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-forest-600 bg-forest-100 px-1.5 py-0.5 rounded">
                                Preview
                              </span>
                            )}
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-pewter">
                                <LockClosedIcon className="w-3 h-3" />
                                Locked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <li key={lesson.id} aria-current={lesson.status === 'current' ? 'step' : undefined}>
                        {lesson.href && !isLocked ? (
                          <Link
                            href={lesson.href}
                            aria-current={lesson.status === 'current' ? 'step' : undefined}
                            className="block -mx-2 px-2 rounded-md hover:bg-forest-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-forest-500"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div
                            className="block -mx-2 px-2"
                            aria-disabled="true"
                            tabIndex={-1}
                          >
                            {content}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
