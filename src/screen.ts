// The screen shown (main.ts sets it on every route; the others read it): the Resolver, the Cubo screen, the Academia…
// Its own module so the Resolver's parts (resolver.ts, cube-link.ts…) can read it without importing main.ts.

// 'solve' = competition attempt (WCA notation, never translated); 'cube' = the cube's options and guided tools, in the
// viewer's frame; 'academy' = learn a method's algorithms (same frame as the guide); 'progress' = statistics and learning
// progress (no cube); 'challenges' = Retos (/retos); 'about' = /acerca, static markup shown by CSS
export type Mod = 'solve' | 'cube' | 'academy' | 'progress' | 'challenges' | 'about';
export let mod: Mod = 'solve';
export const setMod = (m: Mod) => void (mod = m);

/** Runs `fn` once the page is idle (Safari has no requestIdleCallback). */
export const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(() => fn(), { timeout: 2000 }) : setTimeout(fn, 300));
