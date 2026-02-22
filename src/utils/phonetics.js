import { doubleMetaphone } from 'double-metaphone';

/**
 * Phonetic matching using Double Metaphone algorithm.
 * Produces primary + secondary codes for accurate name matching.
 */

/** Get Double Metaphone codes for a name */
export function getPhoneticCodes(name) {
  if (!name || !name.trim()) return null;
  const n = name.trim();
  const dm = doubleMetaphone(n);
  return {
    primary: dm[0],
    secondary: dm[1],
  };
}

/** Compare two names using Double Metaphone */
export function compareNames(primary, variation) {
  const codesA = getPhoneticCodes(primary);
  const codesB = getPhoneticCodes(variation);

  if (!codesA || !codesB) return null;

  const isMatch =
    codesA.primary === codesB.primary ||
    codesA.primary === codesB.secondary ||
    codesA.secondary === codesB.primary;

  return {
    primary,
    variation,
    codesA,
    codesB,
    isMatch,
  };
}

/** Process an array of rows from Excel: [{ primary, variations: [...] }] */
export function processExcelData(rows) {
  const results = [];
  for (const row of rows) {
    if (!row.primary) continue;
    for (const variation of row.variations) {
      if (!variation || !variation.trim()) continue;
      const comparison = compareNames(row.primary, variation.trim());
      if (comparison) results.push(comparison);
    }
  }
  return results;
}
