import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Illustration from './Illustration';

interface UnsplashImage {
  url: string;
  thumbUrl: string;
  alt: string;
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
}

// Module-level cache so navigating away and back (or two cards with the
// same query) doesn't refetch.
const clientCache = new Map<string, UnsplashImage | null>();

export default function RemoteImage({
  query,
  fallbackVariant,
  seed,
  height = 140
}: {
  query: string;
  fallbackVariant: Parameters<typeof Illustration>[0]['variant'];
  seed: string;
  height?: number;
}) {
  const [image, setImage] = useState<UnsplashImage | null | undefined>(clientCache.get(query));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (clientCache.has(query)) {
      setImage(clientCache.get(query));
      return;
    }
    let cancelled = false;
    api
      .get(`/api/images/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (cancelled) return;
        clientCache.set(query, res.image);
        setImage(res.image);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // No key configured, lookup failed, or nothing found -> abstract fallback.
  if (failed || image === null) {
    return <Illustration variant={fallbackVariant} seed={seed} height={height} />;
  }

  // Still loading.
  if (image === undefined) {
    return (
      <div
        style={{
          height,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-2)',
          animation: 'imgPulse 1.4s ease-in-out infinite'
        }}
      >
        <style>{`@keyframes imgPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--surface-2)' }}>
      <img
        src={image.thumbUrl}
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px)', transform: 'scale(1.1)' }}
      />
      <img
        src={image.url}
        alt={image.alt}
        loading="lazy"
        style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setFailed(true)}
      />
      <a
        href={image.photographerUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          fontSize: 10,
          color: '#fff',
          background: 'rgba(0,0,0,0.45)',
          padding: '2px 8px',
          borderRadius: 999,
          textDecoration: 'none'
        }}
      >
        📷 {image.photographerName} / Unsplash
      </a>
    </div>
  );
}
