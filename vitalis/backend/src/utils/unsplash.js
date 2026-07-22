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

async function searchUnsplashImage(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const cacheKey = query.trim().toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '1');
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
    const photo = data.results?.[0];
    if (!photo) {
      cache.set(cacheKey, null);
      return null;
    }

    const result = {
      url: photo.urls.regular,
      thumbUrl: photo.urls.small,
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
