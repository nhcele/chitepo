import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiClient } from '@/lib/api/client';

type ScormPackageDto = {
  id: string;
  courseId: string | null;
  version: string;
  entryPoint: string;
  launchUrl: string;
};

type StartRunDto = {
  id: string;
  scormPackageId: string;
  courseId: string | null;
  enrollmentId: string | null;
  status: string;
  cmi: any;
  startedAt: string;
};

function normalizeLaunchUrlToSameOrigin(launchUrl: string): string {
  // Backend returns absolute URL like http://localhost:3001/uploads/scorm/<id>/index.html
  // Frontend has a rewrite for /uploads/* -> backend /uploads/*
  // For SCORM API discovery and asset loading, keep iframe on same origin as the app.
  try {
    const u = new URL(launchUrl);
    return u.pathname + u.search + u.hash;
  } catch {
    // If already relative
    return launchUrl;
  }
}

export default function ScormPlayerPage() {
  const router = useRouter();
  const { packageId } = router.query;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pkg, setPkg] = useState<ScormPackageDto | null>(null);
  const [run, setRun] = useState<StartRunDto | null>(null);

  const commitTimerRef = useRef<any>(null);
  const cmiRef = useRef<Record<string, any>>({});

  const iframeSrc = useMemo(() => {
    if (!pkg?.launchUrl) return null;
    return normalizeLaunchUrlToSameOrigin(pkg.launchUrl);
  }, [pkg?.launchUrl]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!packageId || typeof packageId !== 'string') return;

    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      try {
        const p = await apiClient.get<ScormPackageDto>(`/scorm/packages/${packageId}`);
        if (cancelled) return;
        setPkg(p);

        const r = await apiClient.post<StartRunDto>(`/scorm/runs/start`, {
          scormPackageId: packageId,
          courseId: p.courseId || undefined,
        });
        if (cancelled) return;
        setRun(r);
        cmiRef.current = (r as any)?.cmi || {};
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to initialize SCORM player');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, packageId]);

  useEffect(() => {
    // Cleanup commit timer on unmount
    return () => {
      if (commitTimerRef.current) {
        clearInterval(commitTimerRef.current);
        commitTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!run?.id) return;

    // Auto-commit every 15 seconds (best-effort)
    if (commitTimerRef.current) clearInterval(commitTimerRef.current);
    commitTimerRef.current = setInterval(() => {
      apiClient
        .post(`/scorm/runs/${run.id}/commit`, { cmi: cmiRef.current })
        .catch(() => {
          // non-fatal
        });
    }, 15000);

    return () => {
      if (commitTimerRef.current) {
        clearInterval(commitTimerRef.current);
        commitTimerRef.current = null;
      }
    };
  }, [run?.id]);

  useEffect(() => {
    if (!run?.id) return;

    const api = {
      LMSInitialize: (_: string) => {
        return 'true';
      },
      LMSFinish: (_: string) => {
        // Fire-and-forget finish; SCORM expects string return.
        apiClient.post(`/scorm/runs/${run.id}/finish`, { cmi: cmiRef.current }).catch(() => {});
        return 'true';
      },
      LMSGetValue: (element: string) => {
        // Basic getter
        return String((cmiRef.current as any)[element] ?? '');
      },
      LMSSetValue: (element: string, value: any) => {
        (cmiRef.current as any)[element] = value;
        return 'true';
      },
      LMSCommit: (_: string) => {
        apiClient.post(`/scorm/runs/${run.id}/commit`, { cmi: cmiRef.current }).catch(() => {});
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: (_: string) => '',
      LMSGetDiagnostic: (_: string) => '',
    };

    // Expose SCORM 1.2 API in the parent window. The content (inside iframe) searches parent/top.
    (window as any).API = api;

    return () => {
      if ((window as any).API === api) {
        delete (window as any).API;
      }
    };
  }, [run?.id]);

  // Ensure we mark finish on tab close (best-effort)
  useEffect(() => {
    if (!run?.id) return;

    const handler = () => {
      navigator.sendBeacon?.(
        `/api/scorm/runs/${run.id}/finish`,
        new Blob([JSON.stringify({ cmi: cmiRef.current })], { type: 'application/json' }),
      );
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [run?.id]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">SCORM Player</h1>
              <p className="text-sm text-gray-600">Package: {typeof packageId === 'string' ? packageId : ''}</p>
            </div>
            <button
              className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">Loading SCORM...</div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-6 text-red-700">{error}</div>
          ) : !iframeSrc ? (
            <div className="bg-white rounded-lg shadow p-6">Missing SCORM launch URL</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative" style={{ height: '75vh' }}>
                <iframe
                  ref={iframeRef}
                  title="SCORM Content"
                  src={iframeSrc}
                  className="w-full h-full"
                  allow="fullscreen"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

