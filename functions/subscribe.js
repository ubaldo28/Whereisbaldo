export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Add to Resend audience
    const audienceRes = await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });

    const audienceData = await audienceRes.json();

    if (!audienceRes.ok) {
      return new Response(JSON.stringify({ error: audienceData.message || 'Failed to add contact.', detail: audienceData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Send welcome email
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Baldo <noreply@whereisbaldo.com>',
        to: [email],
        subject: "You're in. The stories are coming.",
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #3A2010;">
            <h2 style="font-style: italic; color: #4A2C10;">Hey — you made it.</h2>
            <p>Thanks for signing up. I'm Baldo. California boy, Mexican roots, 22 countries, and a life that recently fell apart in Scotland.</p>
            <p>The first stories drop soon. You'll get them straight to this inbox before anyone else.</p>
            <p>If you want to know more before then — <a href="https://whereisbaldo.com" style="color: #C4995A;">whereisbaldo.com</a> has everything so far.</p>
            <p style="margin-top: 40px;">— Baldo</p>
            <hr style="border: none; border-top: 1px solid #F5E3B0; margin: 40px 0;" />
            <p style="font-size: 12px; color: #8B5E2E;">You signed up at whereisbaldo.com</p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      // Contact added but email failed — still return success to user but log the error
      return new Response(JSON.stringify({ success: true, emailError: emailData.message }), {
        status: 200,
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
