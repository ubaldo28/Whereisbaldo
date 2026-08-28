const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const template = ({ name, email, topic, message }) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2A2A2C;padding:26px 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
<tr><td align="center" style="padding:0 16px;">
  <table role="presentation" width="430" cellpadding="0" cellspacing="0" style="width:430px;max-width:100%;background:#FFFDF8;border-radius:16px;overflow:hidden;">

    <tr><td style="background:#A84A12;padding:16px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:middle;">
          <img src="https://whereisbaldo.com/email-pin.png" width="24" height="30" alt="" style="display:block;border:0;" />
        </td>
        <td style="vertical-align:middle;">
          <div style="font-size:9px;letter-spacing:3px;color:#FFE9D6;font-weight:700;">WHERE IS</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-style:italic;font-weight:bold;color:#FFFDF8;line-height:1.1;">Baldo<span style="color:#FFD0A5">?</span></div>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:26px 24px 0;">
      <div style="font-size:10px;letter-spacing:2.4px;font-weight:700;color:#C08A4A;text-transform:uppercase;">New message${topic ? ' &middot; ' + escape(topic) : ''}</div>
      <div style="font-size:25px;font-weight:700;color:#231C16;margin-top:8px;letter-spacing:-0.4px;">${escape(name)}</div>
      <a href="mailto:${escape(email)}" style="display:inline-block;margin-top:3px;font-size:14px;color:#C25A22;text-decoration:none;">${escape(email)}</a>
    </td></tr>

    <tr><td style="padding:20px 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F1E6;border-radius:10px;">
        <tr><td style="padding:16px 18px;border-left:3px solid #F2762E;border-radius:10px;">
          <div style="font-size:15px;line-height:1.65;color:#33291F;white-space:pre-wrap;">${escape(message)}</div>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="padding:22px 24px 6px;">
      <a href="mailto:${escape(email)}?subject=${encodeURIComponent('Re: your message to whereisbaldo.com')}"
         style="display:block;background:#A84A12;color:#FFFDF8;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-size:15px;font-weight:700;">Reply to ${escape(name)}</a>
    </td></tr>

    <tr><td style="padding:16px 24px 24px;">
      <div style="height:1px;background:#EDE4D5;margin-bottom:14px;"></div>
      <div style="font-size:11.5px;color:#A2988A;line-height:1.5;">
        Sent from the contact form on <a href="https://whereisbaldo.com" style="color:#A2988A;">whereisbaldo.com</a>.
        Replying goes straight to ${escape(name)}.
      </div>
    </td></tr>

  </table>
</td></tr>
</table>`;

const ALLOWED_ORIGINS = [
  'https://whereisbaldo.com',
  'https://www.whereisbaldo.com',
];

// One line, no header tricks — this value ends up inside an email header.
const oneLine = (s, max) => String(s).replace(/[\r\n]+/g, ' ').trim().slice(0, max);

const json = (payload, status, origin) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
    },
  });

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin)) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // The form is only ever posted from this site. Previously any page anywhere
  // could script this endpoint and put mail in the inbox.
  const origin = request.headers.get('Origin') || '';
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return json({ error: 'Not allowed.' }, 403, ALLOWED_ORIGINS[0]);
  }
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  try {
    const body = await request.json();

    // Honeypot: a real person never fills this in.
    if ((body.company || '').trim()) {
      return json({ success: true }, 200, allowOrigin);
    }

    const name = oneLine(body.name || '', 120);
    const email = oneLine(body.email || '', 200).toLowerCase();
    const topic = oneLine(body.subject || '', 80);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'All fields are required.' }, 400, allowOrigin);
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'whereisbaldo.com <hello@whereisbaldo.com>',
        to: ['hello@whereisbaldo.com'],
        reply_to: `${name} <${email}>`,
        subject: topic ? `${topic} — ${name}` : `New message from ${name}`,
        html: template({ name, email, topic, message }),
        text: `${topic ? topic + '\n' : ''}${name} <${email}>\n\n${message}\n\nSent from the contact form on whereisbaldo.com`,
      }),
    });

    const data = await emailRes.json();

    if (!emailRes.ok) {
      console.error('resend error', emailRes.status, data && data.message);
      return json({ error: 'Failed to send message.' }, 502, allowOrigin);
    }

    return json({ success: true }, 200, allowOrigin);

  } catch (e) {
    console.error('contact error', e && e.message);
    return json({ error: 'Something went wrong.' }, 500, allowOrigin);
  }
}
