// POST /api/auth/code {email, lang?, website?}: emails a 6-digit sign-in code (valid CODE_MINUTES, replacing any earlier
// one). The answer is the same whether the address has an account or not.
import { clientIp, codeHash, CODE_MINUTES, inbox, newCode, normalizeEmail } from '../_lib/rules.js';
import { body, db, json, limit, route, secret, tooMany } from '../_lib/server.js';

/** The email: a short plain text and the same as minimal HTML. @param {string} lang @param {string} code */
function mail(lang, code) {
  const [subject, line, note] = lang === 'en'
    ? [`Your TwistLab code: ${code}`, 'Your code to sign in to TwistLab is', `It expires in ${CODE_MINUTES} minutes. If you didn't ask for it, ignore this email.`]
    : lang === 'pt'
      ? [`Seu código do TwistLab: ${code}`, 'Seu código para entrar no TwistLab é', `Ele expira em ${CODE_MINUTES} minutos. Se você não pediu, ignore este e-mail.`]
      : [`Tu código de TwistLab: ${code}`, 'Tu código para iniciar sesión en TwistLab es', `Caduca en ${CODE_MINUTES} minutos. Si no lo pediste tú, ignora este correo.`];
  return {
    subject,
    text: `${line} ${code}.\n\n${note}`,
    html: `<p style="font:16px system-ui,sans-serif">${line}</p><p style="font:700 28px ui-monospace,monospace;letter-spacing:4px">${code}</p>`
      + `<p style="font:14px system-ui,sans-serif;color:#666">${note}</p>`,
  };
}

/** @param {Request} req */
export const POST = route(async (req) => {
  const b = await body(req, 1024);
  if (!b) return json({ error: 'bad' }, 400);
  if (b.website) return json({ ok: true }); // the honeypot: only a bot fills the hidden field
  const email = normalizeEmail(b.email);
  if (!email) return json({ error: 'email' }, 400);
  const key = process.env.RESEND_API_KEY;
  if (!key && process.env.VERCEL) return json({ error: 'mail' }, 503); // the console fallback below is for the local dev server only
  const ip = clientIp(req.headers);
  const to = inbox(email);
  // ponytail: anyone can use up an address's daily codes (and lock its owner out for a day): the price of no passwords
  const wait = await limit([
    [`code:email:${to}`, 60, 1], [`code:email:${to}`, 3600, 5], [`code:email:${to}`, 86_400, 10],
    [`code:ip:${ip}`, 3600, 10], [`code:ip:${ip}`, 86_400, 30],
    ['code:all', 3600, 300], // the mail provider's quota
  ]);
  if (wait) return tooMany(wait);
  const code = newCode();
  await db().transaction([
    db()`INSERT INTO login_codes (email, code_hash, expires_at) VALUES (${email}, ${codeHash(secret(), email, code)}, now() + make_interval(mins => ${CODE_MINUTES}))
      ON CONFLICT (email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = now()`,
    db()`DELETE FROM login_codes WHERE expires_at < now()`,
  ]);
  if (!key) { // outside production without a mail key: the code goes to the server's console
    console.log(`[dev] code for ${email}: ${code}`);
    return json({ ok: true });
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [email], ...mail(String(b.lang), code) }),
  });
  if (!res.ok) {
    console.error('resend', res.status, await res.text());
    return json({ error: 'mail' }, 502);
  }
  return json({ ok: true });
});
