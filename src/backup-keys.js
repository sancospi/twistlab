// This app's keys in localStorage: the backup's (progress.ts) and the account's (api/progress.js) allowlist. Plain JS so
// the Vercel functions can import it as is (the project's TypeScript 7 has no API for Vercel's compiler to call).
/** This app's own keys only (an allowlist: the origin's localStorage may hold other apps' data, e.g. on localhost).
 * Each cube's MAC belongs to this device's Bluetooth pairing: never exported, synced nor replaced.
 * @param {string} key */
export const inBackup = (key) => /^(cube|academy|quiz|cross|practice|progress|paint)-/.test(key) && !key.startsWith('cube-mac:');
