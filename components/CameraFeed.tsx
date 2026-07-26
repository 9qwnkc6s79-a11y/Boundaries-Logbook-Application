import React, { useEffect, useRef, useState } from 'react';
import { Video, Plus, Trash2, AlertTriangle, Maximize2, X } from 'lucide-react';
import { Organization, CameraFeedConfig } from '../types';

declare global {
  interface Window { Hls?: any }
}

type FeedKind = 'hls' | 'mjpeg' | 'snapshot' | 'iframe' | 'rtsp' | 'insecure';

function detectKind(url: string): FeedKind {
  const u = url.toLowerCase().trim();
  if (u.startsWith('rtsp://') || u.startsWith('rtmp://')) return 'rtsp';
  if (window.location.protocol === 'https:' && u.startsWith('http://')) return 'insecure';
  if (u.includes('.m3u8')) return 'hls';
  if (u.includes('mjpg') || u.includes('mjpeg') || u.includes('faststream')) return 'mjpeg';
  if (u.includes('cmd=snap') || /\.(jpg|jpeg|png)(\?|$)/.test(u)) return 'snapshot';
  return 'iframe';
}

let hlsLoadPromise: Promise<void> | null = null;
function loadHlsJs(): Promise<void> {
  if (window.Hls) return Promise.resolve();
  if (!hlsLoadPromise) {
    hlsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
      script.onload = () => resolve();
      script.onerror = () => { hlsLoadPromise = null; reject(new Error('Failed to load HLS player')); };
      document.head.appendChild(script);
    });
  }
  return hlsLoadPromise;
}

const HlsPlayer: React.FC<{ url: string; onError: (msg: string) => void }> = ({ url, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: any = null;
    let cancelled = false;

    // Safari plays HLS natively; everything else needs hls.js
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {/* autoplay may need interaction */});
    } else {
      loadHlsJs().then(() => {
        if (cancelled || !window.Hls) return;
        if (!window.Hls.isSupported()) {
          onError('This browser cannot play HLS streams.');
          return;
        }
        hls = new window.Hls({ lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
          if (data?.fatal) onError('Stream error — check the URL is live and allows this site (CORS).');
        });
        video.play().catch(() => {/* autoplay may need interaction */});
      }).catch(e => onError(e.message));
    }

    return () => { cancelled = true; if (hls) hls.destroy(); };
  }, [url, onError]);

  return <video ref={videoRef} muted playsInline controls className="w-full h-full object-contain bg-black" />;
};

const SnapshotPlayer: React.FC<{ url: string; refreshSeconds?: number }> = ({ url, refreshSeconds = 5 }) => {
  const [src, setSrc] = useState(url);
  useEffect(() => {
    const tick = () => {
      const sep = url.includes('?') ? '&' : '?';
      setSrc(`${url}${sep}_t=${Date.now()}`);
    };
    tick();
    const id = setInterval(tick, refreshSeconds * 1000);
    return () => clearInterval(id);
  }, [url, refreshSeconds]);
  return <img src={src} className="w-full h-full object-contain bg-black" alt="Camera snapshot" />;
};

const FeedPlayer: React.FC<{ url: string }> = ({ url }) => {
  const [error, setError] = useState<string | null>(null);
  const kind = detectKind(url);

  if (kind === 'rtsp') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900 text-neutral-300 p-6 text-center">
        <AlertTriangle size={24} className="text-amber-400" />
        <p className="text-xs font-bold">Browsers can't play RTSP/RTMP directly.</p>
        <p className="text-[10px] text-neutral-400 max-w-sm">
          Restream it as HLS or MJPEG first — e.g. Reolink's NVR web view, go2rtc, or Frigate — then paste that HTTPS URL here.
        </p>
      </div>
    );
  }
  if (kind === 'insecure') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900 text-neutral-300 p-6 text-center">
        <AlertTriangle size={24} className="text-amber-400" />
        <p className="text-xs font-bold">This camera URL is HTTP, but the app is HTTPS.</p>
        <p className="text-[10px] text-neutral-400 max-w-sm">
          Browsers block mixed content. Serve the feed over HTTPS (e.g. via your domain's SSL, a reverse proxy, or Cloudflare Tunnel).
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900 text-neutral-300 p-6 text-center">
        <AlertTriangle size={24} className="text-amber-400" />
        <p className="text-xs font-bold">{error}</p>
      </div>
    );
  }

  switch (kind) {
    case 'hls':
      return <HlsPlayer url={url} onError={setError} />;
    case 'mjpeg':
      return <img src={url} className="w-full h-full object-contain bg-black" alt="Camera feed" />;
    case 'snapshot':
      return <SnapshotPlayer url={url} />;
    case 'iframe':
    default:
      return (
        <iframe
          src={url}
          className="w-full h-full bg-black"
          allow="autoplay; fullscreen"
          title="Camera feed"
        />
      );
  }
};

interface CameraSectionProps {
  org: Organization | null | undefined;
  currentStoreId: string;
  onSaveOrg?: (org: Organization) => Promise<boolean>;
  canEdit: boolean;
}

const CameraSection: React.FC<CameraSectionProps> = ({ org, currentStoreId, onSaveOrg, canEdit }) => {
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState<CameraFeedConfig | null>(null);

  const storeCameras = (org?.cameras || []).filter(c => c.storeId === currentStoreId && c.url);

  const handleAdd = async () => {
    if (!org || !onSaveOrg || !newUrl.trim()) return;
    setSaving(true);
    try {
      const camera: CameraFeedConfig = {
        storeId: currentStoreId,
        name: newName.trim() || 'Camera',
        url: newUrl.trim(),
      };
      const ok = await onSaveOrg({ ...org, cameras: [...(org.cameras || []), camera] });
      if (ok) {
        setAdding(false);
        setNewUrl('');
        setNewName('');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (camera: CameraFeedConfig) => {
    if (!org || !onSaveOrg) return;
    const next = (org.cameras || []).filter(c => !(c.storeId === camera.storeId && c.url === camera.url));
    await onSaveOrg({ ...org, cameras: next });
  };

  // Nothing configured and can't edit — render nothing
  if (storeCameras.length === 0 && !canEdit) return null;

  return (
    <section className="bg-white p-4 md:p-6 rounded-xl border border-neutral-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Video size={20} /></div>
        <h2 className="text-lg md:text-xl font-black text-[#0F2B3C] uppercase tracking-tight">Live Cameras</h2>
        {canEdit && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-blue-600 hover:text-blue-700"
          >
            <Plus size={12} /> Add Camera
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Camera name (e.g. Drive-Thru)"
            className="w-full p-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://... (HLS .m3u8, MJPEG, snapshot JPEG, or embeddable page)"
            className="w-full p-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10px] text-neutral-400 font-medium">
            Must be an HTTPS URL the browser can display. RTSP links from the camera itself won't play — restream as HLS/MJPEG first.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newUrl.trim()}
              className="px-4 py-2 bg-[#0F2B3C] text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Camera'}
            </button>
            <button
              onClick={() => { setAdding(false); setNewUrl(''); setNewName(''); }}
              className="px-4 py-2 bg-neutral-200 text-neutral-600 rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {storeCameras.length > 0 ? (
        <div className={`grid gap-4 ${storeCameras.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {storeCameras.map((camera, idx) => (
            <div key={`${camera.url}-${idx}`} className="rounded-xl overflow-hidden border border-neutral-200 bg-black">
              <div className="flex items-center justify-between px-3 py-2 bg-neutral-900">
                <span className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {camera.name || 'Camera'}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFullscreen(camera)} className="text-neutral-400 hover:text-white" title="Fullscreen">
                    <Maximize2 size={14} />
                  </button>
                  {canEdit && (
                    <button onClick={() => handleRemove(camera)} className="text-neutral-400 hover:text-red-400" title="Remove camera">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="aspect-video">
                <FeedPlayer url={camera.url} />
              </div>
            </div>
          ))}
        </div>
      ) : canEdit && !adding ? (
        <p className="text-neutral-400 text-xs font-medium text-center py-6">
          No cameras configured for this store yet. Click "Add Camera" to connect one.
        </p>
      ) : null}

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setFullscreen(null)}>
          <div className="flex items-center justify-between p-4">
            <span className="text-white text-sm font-black uppercase tracking-widest">{fullscreen.name || 'Camera'}</span>
            <button className="text-white/70 hover:text-white"><X size={24} /></button>
          </div>
          <div className="flex-1 p-4" onClick={e => e.stopPropagation()}>
            <FeedPlayer url={fullscreen.url} />
          </div>
        </div>
      )}
    </section>
  );
};

export default CameraSection;
