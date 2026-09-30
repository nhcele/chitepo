import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { trackEvent, AnalyticsEventType } from '@/lib/api/analytics';
import { aiChat, getAiUsage, AiMode } from '@/lib/api/ai';
import Hls from 'hls.js';
import { getCarbonIntensity, isHighCarbon } from '@/lib/carbon';

export interface LessonPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface LessonPlayerProps {
  src: string; // HLS manifest (m3u8) or mp4
  poster?: string;
  autoPlay?: boolean;
  initialPositionSeconds?: number;
  captionsUrl?: string; // WebVTT captions file
  onEnded?: () => void;
  onDuration?: (seconds: number) => void;
  onProgress?: (state: { lastPositionSeconds: number; watchedSeconds: number; percent: number }) => void;
  lessonId?: string; // Needed for AI companion
  courseId?: string;
}

const LessonPlayer = forwardRef<LessonPlayerHandle, LessonPlayerProps>(function LessonPlayer(
  { src, poster, autoPlay = false, initialPositionSeconds = 0, captionsUrl, onEnded, onDuration, onProgress, lessonId, courseId },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const lastEmitRef = useRef(0);
  const [canUseNative, setCanUseNative] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [hlsLevels, setHlsLevels] = useState<Array<{ index: number; height: number; width?: number }>>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [started, setStarted] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [mode, setMode] = useState<AiMode>('answer');
  const [level, setLevel] = useState<5 | 15 | 25>(15);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      const video = videoRef.current;
      if (!video || !Number.isFinite(seconds)) return;
      video.currentTime = Math.max(0, seconds);
      video.play().catch(() => {});
    },
    getCurrentTime() {
      const video = videoRef.current;
      return video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
    },
    setQuality(levelIndex: number) {
      const hls = hlsRef.current;
      if (hls && typeof hls.currentLevel === 'number') {
        hls.currentLevel = levelIndex;
      }
    },
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Check if it's an HLS manifest or regular video file
    const isHls = src.includes('.m3u8') || src.includes('manifest');
    const isMp4 = src.includes('.mp4') || src.includes('.webm') || src.includes('.ogg');

    // For regular video files (MP4, WebM, etc.), use native video element
    if (isMp4 || !isHls) {
      setCanUseNative(true);
      video.src = src;
      return;
    }

    // If the browser supports native HLS (Safari), use it directly
    const canPlayHlsNatively = video.canPlayType('application/vnd.apple.mpegurl');
    if (canPlayHlsNatively) {
      setCanUseNative(true);
      video.src = src;
      return;
    }

    setCanUseNative(false);

    let hls: any = null;
    let destroyed = false;
    
    const setup = async () => {
      try {
        const carbon = await getCarbonIntensity();
        const high = isHighCarbon(carbon);
        
        if (!Hls.isSupported()) {
          video.src = src; // Fallback: mp4 or native support
          return;
        }

        if (destroyed) return;

        hls = new Hls({
          maxBufferLength: 30,
          backBufferLength: 30,
          enableWorker: true,
          startLevel: high ? 2 : -1,
          capLevelToPlayerSize: true,
        });
        hlsRef.current = hls;

        hls.loadSource(src);

        // Wait for video to be ready before attaching
        if (video.readyState >= 1 || !destroyed) {
          hls.attachMedia(video);
        }

        hls.on(Hls.Events.MANIFEST_PARSED, (_ev: any, data: any) => {
          if (Array.isArray(data.levels) && data.levels.length > 0) {
            setHlsLevels(
              data.levels.map((l: any, idx: number) => ({
                index: idx,
                height: l.height || 0,
                width: l.width || 0,
              })),
            );
          }

          if (high && !destroyed) {
            const targetHeight = 480;
            let levelIndex = 0;
            if (Array.isArray(data.levels) && data.levels.length > 0) {
              const candidates = data.levels.map((l: any, idx: number) => ({ idx, height: l.height || 0 }));
              candidates.sort((a: { idx: number; height: number }, b: { idx: number; height: number }) => a.height - b.height);
              for (let i = 0; i < candidates.length; i++) {
                if (candidates[i].height <= targetHeight) levelIndex = candidates[i].idx;
              }
            }
            hls.currentLevel = levelIndex;
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_ev: any, data: any) => {
          if (!destroyed) setCurrentLevel(data.level);
        });
        
        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal && !destroyed) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('HLS Network Error, retrying...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('HLS Media Error, recovering...');
                hls.recoverMediaError();
                break;
              default:
                console.error('HLS Fatal Error:', data);
                hls.destroy();
                // Fallback to native video element
                video.src = src;
                break;
            }
          }
        });
      } catch (error) {
        console.error('HLS setup error:', error);
        // Fallback to native video element
        video.src = src;
      }
    };
    
    setup();

    return () => {
      destroyed = true;
      hlsRef.current = null;
      setHlsLevels([]);
      setCurrentLevel(-1);
      if (hls) {
        try {
          hls.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [src]);

  // Wire duration event
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleLoaded = () => {
      const d = Number.isFinite(v.duration) ? Math.floor(v.duration) : null;
      if (d && d > 0) {
        setDuration(d);
        onDuration?.(d);
      }
    };
    v.addEventListener('loadedmetadata', handleLoaded);
    return () => v.removeEventListener('loadedmetadata', handleLoaded);
  }, [src, onDuration]);

  // Resume at the last known position
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !initialPositionSeconds || initialPositionSeconds <= 0) return;
    const seek = () => {
      if (Number.isFinite(v.duration) && initialPositionSeconds < v.duration) {
        v.currentTime = initialPositionSeconds;
      }
    };
    if (v.readyState >= 1) {
      seek();
    } else {
      v.addEventListener('loadedmetadata', seek, { once: true });
    }
  }, [src, initialPositionSeconds]);

  // Track first play as LESSON_STARTED
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => {
      if (!started) {
        setStarted(true);
        if (lessonId) {
          trackEvent({
            eventType: AnalyticsEventType.LESSON_STARTED,
            lessonId,
            courseId,
            metadata: { src },
          });
        }
      }
    };
    v.addEventListener('play', onPlay);
    return () => v.removeEventListener('play', onPlay);
  }, [started, lessonId, src, courseId]);

  // Report video progress periodically and on meaningful events
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !onProgress) return;

    const report = (force = false) => {
      const now = Date.now();
      if (!force && now - lastEmitRef.current < 10000) return;
      lastEmitRef.current = now;
      const current = Number.isFinite(v.currentTime) ? Math.floor(v.currentTime) : 0;
      const total = Number.isFinite(v.duration) ? v.duration : 0;
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      onProgress({ lastPositionSeconds: current, watchedSeconds: current, percent });
    };

    const onTimeUpdate = () => report(false);
    const onPause = () => report(true);
    const onSeeked = () => report(true);

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeked', onSeeked);
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeked', onSeeked);
    };
  }, [onProgress]);

  // Fetch AI usage when panel opens
  useEffect(() => {
    if (!aiOpen) return;
    (async () => {
      try {
        const u = await getAiUsage();
        setRemaining(u.remaining);
      } catch (e) {
        // ignore
      }
    })();
  }, [aiOpen]);

  const send = async () => {
    if (!lessonId) {
      setError('Lesson context unavailable.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await aiChat({ lessonId, mode, level, message });
      setResponse(res.text);
      setSources(res.sources || []);
      setRemaining(res.remaining);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const format = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="w-full relative border-4 border-border/60 rounded-md shadow-sm p-2 bg-gradient-to-br from-forest-100 to-forest-100">
      <video
        ref={videoRef}
        className="w-full rounded-md bg-black"
        poster={poster}
        controls
        playsInline
        autoPlay={autoPlay}
        onEnded={() => {
          if (onProgress) {
            const total = duration || 0;
            onProgress({ lastPositionSeconds: total, watchedSeconds: total, percent: 100 });
          }
          if (lessonId) {
            trackEvent({ eventType: AnalyticsEventType.LESSON_COMPLETED, lessonId, courseId, metadata: { src } });
          }
          onEnded?.();
        }}
      >
        {canUseNative ? (
          <source src={src} type="application/vnd.apple.mpegurl" />
        ) : (
          <source src={src} />
        )}
        {captionsUrl && (
          <track
            kind="captions"
            src={captionsUrl}
            srcLang="en"
            label="English"
            default
          />
        )}
      </video>
      {duration != null && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {format(duration)}
        </div>
      )}

      {/* Quality selector for hls.js streams */}
      {hlsLevels.length > 0 && (
        <div className="absolute top-2 left-2">
          <label htmlFor="hls-quality" className="sr-only">Video quality</label>
          <select
            id="hls-quality"
            value={currentLevel}
            onChange={(e) => {
              const level = Number(e.target.value);
              if (hlsRef.current) {
                hlsRef.current.currentLevel = level;
              }
              setCurrentLevel(level);
            }}
            className="bg-black/70 text-white text-xs px-2 py-1 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-ochre-500"
            aria-label="Video quality"
          >
            <option value={-1}>Auto</option>
            {hlsLevels.map((level) => (
              <option key={level.index} value={level.index}>
                {level.height ? `${level.height}p` : `Level ${level.index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* AI Companion Toggle */}
      {lessonId && (
        <button
          type="button"
          onClick={() => setAiOpen((v) => !v)}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-charcoal text-xs px-3 py-1 rounded shadow"
        >
          {aiOpen ? 'Close AI' : 'AI Companion'}{remaining != null ? ` (${remaining})` : ''}
        </button>
      )}

      {/* AI Companion Panel */}
      {aiOpen && (
        <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white border-l border-border/60 shadow-sm rounded-r-lg flex flex-col">
          <div className="px-3 py-2 border-b flex items-center gap-2">
            <span className="font-semibold text-sm">AI Companion</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AiMode)}
              className="ml-auto border rounded text-xs px-2 py-1"
            >
              <option value="answer">Answer</option>
              <option value="summarize">Summarize</option>
              <option value="explain">Explain</option>
            </select>
          </div>
          <div className="p-3 space-y-3 overflow-auto">
            {mode !== 'summarize' && (
              <div>
                <label className="block text-xs text-stone mb-1">Your question</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-2 py-1 text-sm"
                  placeholder="Ask about this lesson..."
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-stone mb-1">Explain level: {level}</label>
              <input
                type="range"
                min={5}
                max={25}
                step={10}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value) as 5 | 15 | 25)}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-stone">
                <span>5</span>
                <span>15</span>
                <span>25</span>
              </div>
            </div>
            <button
              onClick={send}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm px-3 py-1 rounded"
            >
              {loading ? 'Thinking…' : mode === 'summarize' ? 'Summarize' : 'Ask'}
            </button>

            {error && <div className="text-xs text-terracotta-600">{error}</div>}
            {response && (
              <div className="text-sm whitespace-pre-wrap border-t pt-2">
                {response}
              </div>
            )}
            {!!sources.length && (
              <div className="text-[11px] text-stone border-t pt-2">
                <div className="font-semibold mb-1">Sources</div>
                {sources.map((s, i) => (
                  <div key={i} className="mb-1">{s.slice(0, 200)}{s.length > 200 ? '…' : ''}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default LessonPlayer;
