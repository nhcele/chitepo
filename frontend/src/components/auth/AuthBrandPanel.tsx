import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { withBasePath } from '@/lib/basePath';

interface AuthBrandPanelProps {
  headline?: string;
  body?: string;
}

export default function AuthBrandPanel({
  headline = 'Continue your journey in African political education.',
  body = 'Access your courses, track your progress, and connect with a community of learners across the continent and diaspora.',
}: AuthBrandPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-ink-950 text-cream relative overflow-hidden items-center justify-center p-12">
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-forest-900/50 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-ochre-500/10 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-ochre-400 via-terracotta-600 to-forest-500" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-3 mb-12">
          <span className="relative block h-12 w-12 flex-shrink-0">
            <Image
              src={withBasePath('/chitepo-logo.jpg')}
              alt="Chitepo School of Ideology"
              fill
              className="object-contain"
              sizes="3rem"
              loading="eager"
              fetchPriority="high"
            />
          </span>
          <div>
            <span className="font-serif text-lg font-semibold text-cream leading-tight block">
              Chitepo
            </span>
            <span className="text-xs text-cream/60 leading-tight block">School of Ideology</span>
          </div>
        </Link>

        <h2 className="font-serif text-4xl font-semibold leading-tight mb-6">{headline}</h2>
        <p className="text-lg text-cream/70 leading-relaxed mb-10">{body}</p>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-forest-600 flex items-center justify-center">
            <span className="font-serif text-xl text-white font-semibold">C</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-cream">Decolonising the Mind</p>
            <p className="text-xs text-cream/50">Pan-African political education</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
