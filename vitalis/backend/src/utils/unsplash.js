/**
 * Looks up a relevant photo on Unsplash for a given search query (an
 * exercise or recipe name). Results are cached in memory for the life of
 * the server process so the same query never hits Unsplash twice - this
 * matters because the free tier is capped at 50 requests/hour.
 *
 * Requires UNSPLASH_ACCESS_KEY in the environment. If it's not set, or the
 * lookup fails for any reason, this returns null and the frontend falls
 * back to its built-in abstract illustration - the app never breaks.
 */

const cache = new Map();
const usedPhotoIds = new Set();

async function searchUnsplashImage(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const cacheKey = query.trim().toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '6');
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('content_filter', 'high');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${key}` }
    });

    if (!res.ok) {
      console.error('Unsplash lookup failed:', res.status, await res.text());
      cache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    const results = data.results || [];
    if (!results.length) {
      cache.set(cacheKey, null);
      return null;
    }

    // Prefer a photo we haven't used for another card yet, so two similar
    // searches (e.g. "Push-Up" and "Burpees") don't end up with the exact
    // same stock photo. Falls back to the top result if everything's taken.
    const photo = results.find((p) => !usedPhotoIds.has(p.id)) || results[0];
    usedPhotoIds.add(photo.id);

    // Unsplash's `raw` URL supports Imgix-style params, so we ask for an
    // image cropped to the exact size/aspect ratio we display it at (a
    // wide landscape card) at good quality. This avoids the blur/narrow
    // look that comes from stretching their small default thumbnail into
    // a different-shaped box.
    const crispUrl = `${photo.urls.raw}&w=960&h=540&fit=crop&crop=entropy&q=80&auto=format`;

    const result = {
      url: crispUrl,
      thumbUrl: `${photo.urls.raw}&w=64&h=36&fit=crop&blur=20&q=40`,
      alt: photo.alt_description || query,
      photographerName: photo.user.name,
      photographerUrl: `${photo.user.links.html}?utm_source=vitalis_app&utm_medium=referral`,
      unsplashUrl: 'https://unsplash.com/?utm_source=vitalis_app&utm_medium=referral'
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Unsplash lookup error:', err.message);
    cache.set(cacheKey, null);
    return null;
  }
}

module.exports = { searchUnsplashImage };
