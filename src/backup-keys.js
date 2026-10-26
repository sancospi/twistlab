// This app's keys in localStorage: the backup's (progress.ts) and the account's (api/progress.js) allowlist, and the
// account's size limits, shared by the page (sync.ts) and the API (api/_lib/rules.js). Plain JS so
// the Vercel functions can import it as is (the project's TypeScript 7 has no API for Vercel's compiler to call).
/** This app's own keys only (an allowlist: the origin's localStorage may hold other apps' data, e.g. on localhost).
 * Each cube's MAC belongs to this device's Bluetooth pairing: never exported, synced nor replaced.
 * @param {string} key */
export const inBackup = (key) => /^(cube|academy|quiz|cross|practice|progress|paint)-/.test(key) && !key.startsWith('cube-mac:');

// The account's limits (api/_lib/rules.js checks them, sync.ts stays under them): here so both sides read one number.
export const MAX_VALUE = 512 * 1024; // bytes, per key
export const MAX_REQUEST = 2 * 1024 * 1024; // bytes, per push
export const MAX_TOTAL = 5 * 1024 * 1024; // bytes, per account
export const MAX_KEYS = 400;
