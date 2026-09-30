import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { withBasePath } from '@/lib/basePath';

interface LessonLayoutProps {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  progress?: number;
  onMenuClick?: () => void;
  rightElement?: ReactNode;
}

export default function LessonLayout({
  children,
  backHref,
  backLabel,
  progress,
  onMenuClick,
  rightElement,
}: LessonLayoutProps) {
  return (
    <div className="min-h-screen bg-ink-950 text-cream flex flex-col">
      <a
        href="#lesson-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-cream focus:px-4 focus:py-2 focus:text-ink-950 focus:outline-none"
      >
        Skip to lesson content
      </a>

      <header className="sticky top-0 z-40 bg-ink-950/95 backdrop-blur border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="relative block h-8 w-8">
                <Image
                  src={withBasePath('/chitepo-logo.jpg')}
                  alt="Chitepo School of Ideology"
                  fill
                  className="object-contain"
                  sizes="2rem"
                />
              </span>
              <span className="hidden sm:block font-serif text-base font-semibold text-cream">
                Chitepo
              </span>
            </Link>

            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-sm text-cream/70 hover:text-cream transition-colors min-w-0"
              >
                <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate hidden sm:inline">{backLabel || 'Back'}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {typeof progress === 'number' && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-32 h-1.5 bg-cream/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ochre-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-cream/70">{progress}%</span>
              </div>
            )}

            {rightElement}

            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                className="lg:hidden p-2 text-cream/70 hover:text-cream hover:bg-cream/10 rounded-md transition-colors"
                aria-label="Open course outline"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="lesson-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
