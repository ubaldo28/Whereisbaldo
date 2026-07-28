export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add contact to Resend audience
    const res = await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    if (!res.ok) {
      const err = await res.json();
      return new Response(JSON.stringify({ error: err.message || 'Failed to subscribe.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
