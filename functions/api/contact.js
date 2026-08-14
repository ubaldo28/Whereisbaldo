export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const message = (body.message || '').trim();

    if (!name || !email || !message || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'All fields are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <hello@whereisbaldo.com>',
        to: ['hello@whereisbaldo.com'],
        reply_to: `${name} <${email}>`,
        subject: `New inquiry from ${name}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
            <h2 style="color: #c49959; margin-bottom: 24px;">New Portfolio Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <a href="mailto:${email}?subject=Re: Your portfolio inquiry" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#c49959;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Reply to ${name} →</a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.7;">${message}</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      return new Response(JSON.stringify({ error: emailData.message || 'Failed to send message.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Something went wrong.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
