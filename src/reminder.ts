// Hoy's daily reminder (Web Push, api/push.js): "Recordármelo cada día a las HH". Only where the browser can receive
// pushes and the service worker is up (the installed app on iOS 16.4+, Android, desktop browsers); elsewhere nothing
// is shown. The server keeps the subscription with the chosen local hour, the time zone and how many cases will be
// due then, refreshed whenever /hoy is open (sync), so the reminder can say it.
import { lang, t } from './i18n.ts';
import { el } from './el.ts';
import { api } from './sync.ts';
import { load, save } from './academy/store.ts';

const KEY = 'ui-reminder'; // {hour, due, tz, at}: what the server last got from this device (not in the backup: per device)
type Sent = { hour: number; due: number; tz: number; at?: number }; // at: the reminder `due` is for
const DEFAULT_HOUR = 19;

/** The next time the clock shows `hour`:00, after `now`. */
export function nextAt(hour: number, now: number): number {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

const sent = (): Sent | null => {
  const v = load(KEY) as Sent | null;
  return v && Number.isInteger(v.hour) && v.hour >= 0 && v.hour < 24 ? v : null;
};
const registration = async () => ('PushManager' in window && 'Notification' in window && navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : undefined);
const hourText = (h: number) => new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h));

/** Sends the subscription with the hour and the cases due then (`dueAt`), if any of it changed since last time. */
async function push(sub: PushSubscription, hour: number, dueAt: (at: number) => number, force = false): Promise<boolean> {
  const at = nextAt(hour, Date.now());
  const now: Sent = { hour, due: dueAt(at), tz: new Date().getTimezoneOffset() };
  const last = sent();
  // a new reminder's count is sent even if the same: the server only uses one reported since the last reminder
  if (!force && last && last.at === at && last.hour === now.hour && last.due === now.due && last.tz === now.tz) return true;
  // ponytail: the API's reminders are in Spanish or English (api/push.js refuses others): Portuguese gets the Spanish
  const res = await api('POST', '/api/push', { subscription: sub.toJSON(), ...now, lang: lang === 'en' ? 'en' : 'es' });
  if (res.ok) save(KEY, { ...now, at });
  return res.ok;
}

/** /hoy refreshes the subscription's due count (when it is open and something changed). */
export async function syncReminder(dueAt: (at: number) => number): Promise<void> {
  try {
    const sub = await (await registration())?.pushManager.getSubscription();
    const hour = sent()?.hour ?? DEFAULT_HOUR;
    if (sub && Notification.permission === 'granted') await push(sub, hour, dueAt);
  } catch { /* offline: next time */ }
}

/** The toggle and its hour; null where pushes can't be received (then nothing is shown). */
export async function reminderView(dueAt: (at: number) => number): Promise<HTMLElement | null> {
  const reg = await registration().catch(() => undefined);
  if (!reg) return null;
  const status = el('p', { className: 'hint', role: 'status' });
  const toggle = el('input', { type: 'checkbox', checked: !!(await reg.pushManager.getSubscription().catch(() => null)) && Notification.permission === 'granted' });
  const hour = el('select', {}, ...Array.from({ length: 24 }, (_, h) => el('option', { value: String(h), textContent: hourText(h) })));
  hour.value = String(sent()?.hour ?? DEFAULT_HOUR);
  const busy = (on: boolean) => void (toggle.disabled = hour.disabled = on);
  const keepHour = () => save(KEY, { hour: Number(hour.value), due: -1, tz: 0 }); // off: just the hour, for next time

  async function turnOn() {
    if ((await Notification.requestPermission()) !== 'granted') {
      toggle.checked = false;
      return void (status.textContent = t('today.remindDenied'));
    }
    const sub = (await reg!.pushManager.getSubscription()) ?? await (async () => {
      const { key } = await (await api('GET', '/api/push')).json() as { key: string | null };
      if (!key) throw new Error('no key');
      const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
      return reg!.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)) });
    })();
    if (!(await push(sub, Number(hour.value), dueAt, true))) throw new Error('not saved');
    status.textContent = t('today.remindOn', { hour: hourText(Number(hour.value)) });
  }
  async function turnOff() {
    const sub = await reg!.pushManager.getSubscription();
    if (sub) {
      await api('DELETE', '/api/push', { endpoint: sub.endpoint }).catch(() => {}); // a dead one is deleted at the next send anyway
      await sub.unsubscribe();
    }
    keepHour();
    status.textContent = t('today.remindOff');
  }
  const apply = async () => {
    busy(true);
    try {
      await (toggle.checked ? turnOn() : turnOff());
    } catch {
      toggle.checked = !toggle.checked;
      status.textContent = t('today.remindError');
    }
    busy(false);
  };
  toggle.onchange = () => void apply();
  hour.onchange = () => void (toggle.checked ? apply() : keepHour());
  if (Notification.permission === 'denied') status.textContent = t('today.remindDenied');
  return el('section', { className: 'cube-block today-reminder', ariaLabel: t('today.reminder') },
    el('h3', { textContent: t('today.reminder') }),
    el('div', { className: 'row' }, el('label', {}, toggle, ' ', t('today.remind')), el('label', {}, t('today.remindAt'), ' ', hour)),
    el('p', { className: 'hint', textContent: t('today.remindHint') }), status);
}
