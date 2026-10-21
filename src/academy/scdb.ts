// SpeedCubeDB links. Own module so data files (cfop.ts) can use it without importing methods.ts,
// which imports them (that cycle would hit a TDZ error when a data file is loaded first).
import type { SpeedCubeDbRef } from './types.ts';

// Checked against the live site (2026-10-20): /a/3x3/F2L/F2L_1, /a/3x3/OLL/OLL_27, /a/3x3/PLL/Ua.
// Other spellings ("OLL27", "T-perm", "%20") return an empty page or a 404.
export function scdbUrl(set: SpeedCubeDbRef['set'], id: string): string {
  return `https://speedcubedb.com/a/3x3/${set}/${set === 'PLL' ? id : `${set}_${id}`}`;
}
