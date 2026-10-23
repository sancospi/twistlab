// Progreso → Cuenta: the optional account, only to keep the progress on every device (sync.ts). No password: the
// email gets a 6-digit code (api/auth), checked as soon as its 6 digits are typed. Signed in: how the sync goes, sign
// out, delete the account, and the public name of the daily challenge's ranking (daily-view.ts).
import { lang, t, tp } from './i18n.ts';
import { el } from './el.ts';
import { api, forget, onStatus, signedIn, status } from './sync.ts';

const RESEND_S = 60; // api/auth/code.js: one code a minute per address

/** "hace 5 minutos" */
function ago(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  return s < 60 ? rtf.format(-s, 'second') : s < 3600 ? rtf.format(-Math.floor(s / 60), 'minute')
    : s < 86_400 ? rtf.format(-Math.floor(s / 3600), 'hour') : rtf.format(-Math.floor(s / 86_400), 'day');
}
const waitText = (s: number) => (s < 120 ? `${s} s` : `${Math.ceil(s / 60)} min`);

/** The API's answer, or null offline. */
async function call(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> } | null> {
  try {
    const res = await api('POST', path, body ?? {});
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch {
    return null;
  }
}

export function accountSection(): HTMLElement {
  const box = el('section', { className: 'cube-block' });
  const live = el('p', { className: 'account-status', role: 'status', id: 'account-status' }); // read out by screen readers as it changes
  let email = '';
  let timer = 0;
  const say = (s: string) => void (live.textContent = s);
  const fail = (r: Awaited<ReturnType<typeof call>>) => say(
    !r ? t('account.offline')
      : r.status === 429 ? t('account.wait', { time: waitText(Number(r.data.retryAfter) || 60) })
      : r.data.error === 'email' ? t('account.badEmail')
      : r.data.error === 'mail' ? t('account.mailDown') : t('account.error'));
  const field = (label: string, input: HTMLInputElement) => el('label', { className: 'library-field' }, el('span', { className: 'hint', textContent: label }), input);

  // 1. The email
  const emailStep = () => {
    clearInterval(timer);
    const input = el('input', { type: 'email', name: 'email', autocomplete: 'email', required: true, maxLength: 254, value: email });
    const trap = el('input', { name: 'website', tabIndex: -1, autocomplete: 'off' }); // the honeypot: hidden from people, not from bots
    const send = el('button', { className: 'primary', textContent: t('account.send') });
    const form = el('form', { className: 'row account-form' }, field(t('account.email'), input),
      el('label', { className: 'account-trap', ariaHidden: 'true' }, 'Website', trap), send);
    form.onsubmit = async (e) => {
      e.preventDefault();
      send.disabled = true;
      say(t('account.sending'));
      const r = await call('/api/auth/code', { email: input.value, lang, website: trap.value });
      send.disabled = false;
      if (!r?.ok) return fail(r);
      email = input.value.trim().toLowerCase();
      codeStep();
    };
    box.replaceChildren(el('h3', { textContent: t('account.title') }), el('p', { className: 'hint', textContent: t('account.hint') }),
      el('p', { className: 'hint', textContent: t('account.dailyHint') }), form, live);
  };

  // 2. The code: verified as soon as it has 6 digits
  const codeStep = () => {
    // no maxLength: a pasted '123 456' must keep its 6 digits (oninput keeps only those)
    const input = el('input', { name: 'code', inputMode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]{6}', className: 'account-code' });
    input.setAttribute('aria-describedby', live.id);
    const resend = el('button', { type: 'button' });
    const change = el('button', { type: 'button', textContent: t('account.change'), onclick: () => (say(''), emailStep()) });
    let left = RESEND_S;
    const tick = () => {
      if (!resend.isConnected && left < RESEND_S) return clearInterval(timer); // the card is gone (another page)
      resend.disabled = left > 0;
      resend.textContent = left > 0 ? t('account.resendIn', { s: left }) : t('account.resend');
      left--;
    };
    clearInterval(timer);
    timer = window.setInterval(tick, 1000);
    tick();
    resend.onclick = async () => {
      say(t('account.sending'));
      const r = await call('/api/auth/code', { email, lang });
      if (!r?.ok) return fail(r);
      left = RESEND_S;
      tick();
      say(t('account.sent', { email }));
      input.focus();
    };
    let checking = false;
    input.oninput = async () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 6);
      input.removeAttribute('aria-invalid');
      if (input.value.length < 6 || checking) return;
      checking = true;
      say(t('account.checking'));
      const r = await call('/api/auth/verify', { email, code: input.value });
      checking = false;
      if (r?.ok) {
        clearInterval(timer);
        say(t('account.syncing'));
        await signedIn(String(r.data.email)); // reloads the page if the account brought data
        return signedInStep();
      }
      input.select();
      input.setAttribute('aria-invalid', 'true');
      if (r?.data.error === 'wrong') return say(Number(r.data.attemptsLeft) ? tp('account.wrong', Number(r.data.attemptsLeft)) : t('account.noAttempts'));
      if (r?.data.error === 'expired') return say(t('account.expired'));
      fail(r);
    };
    box.replaceChildren(el('h3', { textContent: t('account.title') }), field(t('account.code'), input), el('div', { className: 'row' }, resend, change), live);
    say(t('account.sent', { email })); // the live region: read out, while the focus goes to the code
    input.focus();
  };

  // 3. Signed in
  const signedInStep = () => {
    const syncLine = el('p', { className: 'hint' });
    const draw = () => {
      if (!box.contains(syncLine)) return; // another step is shown
      if (!status.email) return void (onStatus(null), emailStep()); // the session ended
      syncLine.textContent = status.state === 'syncing' ? t('account.syncing')
        : status.state === 'error' ? t('account.syncError')
        : status.state === 'offline' ? t('account.syncOffline')
        : status.state === 'tooBig' ? t('account.tooBig')
        : status.at ? t('account.synced', { ago: ago(status.at) }) : t('account.notYet');
    };
    onStatus(draw);
    const logout = el('button', { type: 'button', textContent: t('account.logout') });
    logout.onclick = async () => {
      const r = await call('/api/auth/logout');
      if (!r?.ok) return fail(r);
      forget(); // this browser keeps its data
      emailStep();
      say(t('account.loggedOut'));
    };
    // The name in the daily challenge's ranking: read from the account (api/me.js), '' = "Anónimo"
    const nameInput = el('input', { name: 'name', autocomplete: 'off', maxLength: 20 });
    nameInput.setAttribute('aria-describedby', 'account-name-hint');
    void api('GET', '/api/me').then((r) => r.json()).then((d) => void (nameInput.value ||= d.name ?? ''), () => {});
    const nameForm = el('form', { className: 'row account-form' }, field(t('account.name'), nameInput),
      el('button', { textContent: t('account.nameSave') }));
    nameForm.onsubmit = async (e) => {
      e.preventDefault();
      const r = await call('/api/account/name', { name: nameInput.value });
      if (r?.ok) return void ((nameInput.value = String(r.data.name)), say(t('account.nameSaved')));
      if (r?.data.error === 'name') return say(t('account.badName'));
      fail(r);
    };
    const confirm = el('div', { className: 'backup-confirm', role: 'alert' });
    confirm.hidden = true;
    const remove = el('button', { type: 'button', textContent: t('account.delete') });
    remove.onclick = () => {
      const yes = el('button', { type: 'button', className: 'primary', textContent: t('account.deleteYes') });
      const no = el('button', { type: 'button', textContent: t('backup.cancel'), onclick: () => ((confirm.hidden = true), remove.focus()) });
      yes.onclick = async () => {
        const r = await call('/api/account/delete');
        if (!r?.ok) return fail(r);
        forget();
        emailStep();
        say(t('account.deleted'));
      };
      confirm.replaceChildren(el('p', { textContent: t('account.deleteConfirm') }), el('div', { className: 'row' }, yes, no));
      confirm.hidden = false;
      no.focus();
    };
    box.replaceChildren(el('h3', { textContent: t('account.title') }), el('p', { textContent: t('account.signedIn', { email: status.email }) }),
      syncLine, nameForm, el('p', { className: 'hint', id: 'account-name-hint', textContent: t('account.nameHint') }), el('div', { className: 'row' }, logout, remove), confirm, live);
    say('');
    draw();
  };

  if (status.email) signedInStep();
  else emailStep();
  return box;
}
