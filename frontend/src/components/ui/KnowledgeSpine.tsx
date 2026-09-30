import Link from 'next/link';
import { motion } from 'framer-motion';

export interface SpineItem {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'pending';
  href?: string;
}

interface KnowledgeSpineProps {
  items: SpineItem[];
  title?: string;
}

export default function KnowledgeSpine({ items, title }: KnowledgeSpineProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-paper border border-border/60 rounded-md p-6">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone mb-6">
          {title}
        </h3>
      )}
      <div className="relative">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/60" aria-hidden="true" />
        <ul className="relative space-y-6">
          {items.map((item, index) => {
            const content = (
              <>
                <div className="flex items-start gap-4">
                  <span
                    className={`relative z-10 mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      item.status === 'completed'
                        ? 'bg-forest-600 border-forest-600'
                        : item.status === 'current'
                        ? 'bg-ochre-500 border-ochre-500'
                        : 'bg-paper border-border/60'
                    }`}
                  >
                    {item.status === 'completed' && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {item.status === 'current' && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        item.status === 'pending' ? 'text-pewter' : 'text-charcoal'
                      }`}
                    >
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-stone mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </>
            );

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={item.href ? '' : ''}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block -ml-1 -my-1 p-1 rounded-md hover:bg-forest-100/50 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
