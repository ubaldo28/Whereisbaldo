// Step 2 of the CMS login: GitHub sends the browser back here with a code.
// We swap that code for a token and hand it to the CMS window.
const page = (script) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Signing in…</title></head>
     <body style="font-family:Georgia,serif;padding:40px;text-align:center;color:#3A2010;">
     <p>Signing you in…</p><script>${script}<\/script></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

const handshake = (payload) => `
  (function () {
    var message = 'authorization:github:${payload.type}:' + ${JSON.stringify(JSON.stringify(payload.body))};
    function receive(e) {
      if (!e.data || e.data !== 'authorizing:github') return;
      window.removeEventListener('message', receive, false);
      window.opener.postMessage(message, e.origin);
    }
    window.addEventListener('message', receive, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
`;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookie = request.headers.get('Cookie') || '';
  const expected = (cookie.match(/cms_oauth_state=([^;]+)/) || [])[1];

  if (!code) return page(handshake({ type: 'error', body: { message: 'GitHub did not send a code.' } }));
  if (!state || !expected || state !== expected) {
    return page(handshake({ type: 'error', body: { message: 'Login expired. Close this window and try again.' } }));
  }
  if (!env.GITHUB_OAUTH_CLIENT_SECRET) {
    return page(handshake({ type: 'error', body: { message: 'GITHUB_OAUTH_CLIENT_SECRET is not set on this site.' } }));
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    return page(handshake({ type: 'error', body: { message: data.error_description || 'GitHub refused the login.' } }));
  }

  return page(handshake({ type: 'success', body: { token: data.access_token, provider: 'github' } }));
}
