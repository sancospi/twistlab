// Tooltips: one shared native popover (light dismiss, Esc), placed next to whatever opened it.
// Tapping the same anchor again closes it. Its nodes are never moved needlessly: content like a 3D player must
// stay connected (cubing.js builds a new view each time its element is re-attached).

let box: HTMLElement | null = null;
let anchor: HTMLElement | null = null;
let onHide: (() => void) | null = null;
let closed = { at: 0, anchor: null as HTMLElement | null }; // light dismiss fires before the anchor's click

/** The current anchor is done: reset its state and stop whatever the tooltip was running. */
function release() {
  anchor?.removeAttribute('aria-describedby');
  anchor?.setAttribute('aria-expanded', 'false');
  anchor = null;
  onHide?.();
  onHide = null;
}

function ensureBox(): HTMLElement {
  if (box) return box;
  box = document.createElement('div');
  box.className = 'tip';
  box.popover = 'auto';
  box.setAttribute('role', 'tooltip');
  box.id = 'tip';
  box.addEventListener('toggle', (e) => {
    if ((e as ToggleEvent).newState === 'open') return;
    closed = { at: performance.now(), anchor };
    release();
  });
  return box;
}

/** Shows `content` next to `target`, or closes it if it was already showing for `target`; true when shown. */
export function showTip(target: HTMLElement, content: Node[], hide?: () => void): boolean {
  const tip = ensureBox();
  const open = tip.matches(':popover-open');
  if (open && anchor === target) {
    tip.hidePopover(); // keyboard: the same move again closes it
    return false;
  }
  if (!open && closed.anchor === target && performance.now() - closed.at < 300) return false; // the tap that just dismissed it
  if (open) {
    release(); // switching moves: tidy the old one now — toggle events are async and coalesce
    tip.hidePopover();
  }
  if (!tip.isConnected) document.body.append(tip); // top layer: shows above modal dialogs too
  anchor = target;
  onHide = hide ?? null;
  target.setAttribute('aria-describedby', tip.id);
  target.setAttribute('aria-expanded', 'true');
  tip.showPopover(); // before adding content: a 3D view set up while hidden (zero size) renders blank
  if (content.length !== tip.childNodes.length || content.some((n, i) => tip.childNodes[i] !== n)) tip.replaceChildren(...content);
  place(tip, target);
  return true;
}

/** Below the anchor, or above when there's no room; always inside the viewport. */
function place(tip: HTMLElement, target: HTMLElement) {
  const r = target.getBoundingClientRect();
  const { width, height } = tip.getBoundingClientRect();
  const gap = 8;
  const below = r.bottom + gap + height <= innerHeight || r.top - gap - height < 0;
  tip.style.top = `${below ? r.bottom + gap : r.top - gap - height}px`;
  tip.style.left = `${Math.min(Math.max(gap, r.left + r.width / 2 - width / 2), innerWidth - width - gap)}px`;
}

/** Closes the tooltip, e.g. when a link in it leaves the page. */
export const hideTip = (): void => void (box?.matches(':popover-open') && box.hidePopover());
