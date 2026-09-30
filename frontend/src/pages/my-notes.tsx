import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { TrashIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Note, listMyNotes, deleteNote } from '@/lib/api/notes';

function formatTimestamp(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || seconds < 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MyNotesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listMyNotes()
      .then((data) => {
        if (!cancelled) setNotes(data || []);
      })
      .catch(() => {
        if (!cancelled) {
          setNotes([]);
          setError('Could not load your notes.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return notes;
    return notes.filter(
      (note) =>
        (note.content || '').toLowerCase().includes(term) ||
        (note.title || '').toLowerCase().includes(term) ||
        (note.lesson?.title || '').toLowerCase().includes(term) ||
        (note.course?.title || '').toLowerCase().includes(term),
    );
  }, [notes, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: Note[] }>();
    for (const note of filtered) {
      const key = note.courseId || 'general';
      const label = note.course?.title || 'Other notes';
      const group = map.get(key) || { label, items: [] };
      group.items.push(note);
      map.set(key, group);
    }
    return Array.from(map.values());
  }, [filtered]);

  const handleDelete = async (noteId: string) => {
    if (!globalThis.confirm?.('Delete this note?')) return;
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch {
      setError('Failed to delete note.');
    }
  };

  return (
    <AppLayout>
      <Head>
        <title>My Notes — Chitepo</title>
      </Head>
      <main id="main-content" className="min-h-screen bg-ink-950 text-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="font-serif text-3xl font-semibold mb-2">My Notebook</h1>
          <p className="text-sm text-cream/60 mb-6">
            Private notes captured while learning. Notes with a timestamp link back to that point in the lesson.
          </p>

          <div className="mb-6">
            <label htmlFor="note-search" className="sr-only">Search notes</label>
            <input
              id="note-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes, lessons or courses…"
              className="w-full max-w-md px-3 py-2 text-sm bg-ink-900 border border-cream/20 rounded-md text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-ochre-500"
            />
          </div>

          {!isAuthenticated && !isLoading && (
            <div className="rounded-md border border-ochre-500/40 bg-ochre-500/10 p-4 text-sm text-cream/80">
              Please sign in to view your notebook.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-terracotta-500/40 bg-terracotta-500/10 p-4 text-sm text-terracotta-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-cream/50">Loading your notes…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-cream/10 bg-ink-900/50 p-8 text-center">
              <p className="text-cream/70">No notes yet.</p>
              <p className="mt-1 text-sm text-cream/50">
                Open a lesson and use “Add note” to capture a thought at a specific moment.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <section key={group.label} aria-label={`Notes for ${group.label}`}>
                  <h2 className="font-serif text-lg font-semibold text-cream mb-3">{group.label}</h2>
                  <ul className="space-y-3">
                    {group.items.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-md border border-cream/10 bg-ink-900/60 p-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-cream/50">
                            {note.lesson?.title && (
                              <span className="font-medium text-cream/70">{note.lesson.title}</span>
                            )}
                            {note.videoTimestampSeconds !== undefined &&
                              note.videoTimestampSeconds !== null && (
                                <span className="text-ochre-400">
                                  at {formatTimestamp(note.videoTimestampSeconds)}
                                </span>
                              )}
                            <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</span>
                          </div>
                          {note.title && (
                            <p className="mt-1 text-sm font-semibold text-cream">{note.title}</p>
                          )}
                          <p className="mt-1 text-sm text-cream/80 whitespace-pre-wrap">{note.content}</p>
                          {note.lessonId && note.courseId && (
                            <Link
                              href={`/courses/${note.courseId}/lessons/${note.lessonId}`}
                              className="mt-2 inline-flex text-xs font-semibold text-ochre-400 hover:text-ochre-300"
                            >
                              Open lesson →
                            </Link>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 text-cream/50 hover:text-terracotta-400 hover:bg-terracotta-400/10 rounded transition-colors"
                          aria-label="Delete note"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
