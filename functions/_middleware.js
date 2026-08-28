// Keep Google out of the *.pages.dev copies of the site.
//
// Cloudflare serves this project at whereisbaldo.pages.dev and at a unique
// preview URL for every pull request. Those are the same pages as the real
// site, so left alone they compete with whereisbaldo.com in search.
//
// A redirect would break PR previews, so instead we tell crawlers not to
// index anything that is not served from the real domain. Visitors, and the
// preview links you click yourself, are unaffected.
export async function onRequest(context) {
  const response = await context.next();
  const host = new URL(context.request.url).hostname;

  if (host.endsWith('.pages.dev')) {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
