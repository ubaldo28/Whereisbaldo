const getFormHTML = (to, name, subject) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reply to ${name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      background: #0f0f0f;
      color: #f0ece4;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 600px;
    }
    .logo {
      color: #c49959;
      font-size: 13px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 28px;
      opacity: 0.8;
    }
    h1 { font-size: 22px; margin-bottom: 20px; color: #f0ece4; }
    .meta {
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #999;
      line-height: 1.8;
    }
    .meta span { color: #f0ece4; }
    textarea {
      width: 100%;
      min-height: 220px;
      background: #111;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 16px;
      color: #f0ece4;
      font-family: Georgia, serif;
      font-size: 15px;
      line-height: 1.7;
      resize: vertical;
      outline: none;
      transition: border-color 0.2s;
    }
    textarea:focus { border-color: #c49959; }
    button {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 14px;
      background: #c49959;
      color: #0f0f0f;
      border: none;
      border-radius: 8px;
      font-family: Georgia, serif;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #d4a96a; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Where Is Baldo — Reply</div>
    <h1>Reply to ${name}</h1>
    <div class="meta">
      <strong>From:</strong> <span>Ubaldo Figueroa &lt;hello@whereisbaldo.com&gt;</span><br>
      <strong>To:</strong> <span>${name} &lt;${to}&gt;</span><br>
      <strong>Subject:</strong> <span>${subject}</span>
    </div>
    <form id="replyForm">
      <input type="hidden" name="to" value="${to}">
      <input type="hidden" name="name" value="${name}">
      <input type="hidden" name="subject" value="${subject}">
      <textarea name="message" placeholder="Write your reply here..." required></textarea>
      <button type="submit" id="sendBtn">Send Reply →</button>
    </form>
  </div>
  <script>
    document.getElementById('replyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('sendBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';
      const data = new FormData(e.target);
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.get('to'),
          name: data.get('name'),
          subject: data.get('subject'),
          message: data.get('message'),
        }),
      });
      if (res.ok) {
        document.querySelector('.card').innerHTML = \`
          <div class="logo">Where Is Baldo</div>
          <h1 style="color:#c49959;">Reply Sent ✓</h1>
          <p style="margin-top:16px;color:#999;line-height:1.7;">Your message to <strong style="color:#f0ece4;">${name}</strong> was sent from <strong style="color:#c49959;">hello@whereisbaldo.com</strong>.</p>
        \`;
      } else {
        btn.disabled = false;
        btn.textContent = 'Send Reply →';
        alert('Something went wrong. Please try again.');
      }
    });
  </script>
</body>
</html>`;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const to = url.searchParams.get('to') || '';
    const name = url.searchParams.get('name') || 'Visitor';
    const subject = url.searchParams.get('subject') || 'Re: Your portfolio inquiry';

    return new Response(getFormHTML(to, name, subject), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (request.method === 'POST') {
    try {
      const { to, name, subject, message } = await request.json();

      if (!to || !message) {
        return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Ubaldo Figueroa <hello@whereisbaldo.com>',
          to: [to],
          subject: subject || `Re: Your portfolio inquiry`,
          html: `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.7;">
            <p style="white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #888; font-size: 13px;">
              Ubaldo Figueroa<br>
              <a href="https://whereisbaldo.com" style="color: #c49959; text-decoration: none;">whereisbaldo.com</a>
            </p>
          </div>`,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.json();
        return new Response(JSON.stringify({ error: err.message || 'Failed to send.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message || 'Something went wrong.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
