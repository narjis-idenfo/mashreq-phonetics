import { doubleMetaphone } from 'double-metaphone';
import {
  normaliseEnglishForUrduComparison,
  transliterateUrdu,
  transliterateUrduNormalised,
} from './urduTransliteration.js';

/**
 * Phonetic matching using Double Metaphone algorithm.
 * Produces primary + secondary codes for accurate name matching.
 */

/** Get Double Metaphone codes for a name */
const INVISIBLE_TEXT_RE = /[\u200B-\u200F\u202A-\u202E\uFEFF\u00AD]/g;
const URDU_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function normaliseNameText(value) {
  if (value === null || value === undefined) return '';

  return String(value)
    .normalize('NFKC')
    .replace(INVISIBLE_TEXT_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPhoneticInput(name) {
  const text = normaliseNameText(name);
  if (!text) return '';

  if (URDU_SCRIPT_RE.test(text)) {
    const transliterated = transliterateUrdu(text);
    return transliterated || text;
  }

  return text;
}

/** Get Double Metaphone codes for a name */
export function getPhoneticCodes(name) {
  const n = toPhoneticInput(name);
  if (!n) return null;
  const dm = doubleMetaphone(n);
  return {
    primary: dm[0],
    secondary: dm[1],
  };
}

/** Compare two names using Double Metaphone */
function comparePhoneticInputs(primary, variation) {
  const codesA = getPhoneticCodes(primary);
  const codesB = getPhoneticCodes(variation);

  if (!codesA || !codesB) return null;

  const isMatch =
    codesA.primary === codesB.primary ||
    codesA.primary === codesB.secondary ||
    codesA.secondary === codesB.primary;

  return {
    codesA,
    codesB,
    isMatch,
  };
}

export function compareNames(primary, variation) {
  const left = normaliseNameText(primary);
  const right = normaliseNameText(variation);

  if (!left || !right) return null;

  const leftIsUrdu = isUrduScript(left);
  const rightIsUrdu = isUrduScript(right);

  if (leftIsUrdu && rightIsUrdu) {
    const leftTransliteration = transliterateUrdu(left);
    const rightTransliteration = transliterateUrdu(right);
    const comparison = comparePhoneticInputs(leftTransliteration, rightTransliteration);

    if (!comparison) return null;

    return {
      primary: left,
      variation: right,
      ...comparison,
      primaryTransliteration: leftTransliteration,
      variationTransliteration: rightTransliteration,
    };
  }

  if (leftIsUrdu || rightIsUrdu) {
    const urdu = leftIsUrdu ? left : right;
    const english = leftIsUrdu ? right : left;
    const comparison = compareUrduWithEnglish(urdu, english);

    if (!comparison) return null;

    return {
      primary: left,
      variation: right,
      codesA: leftIsUrdu ? comparison.codesTranslit : comparison.codesEnglish,
      codesB: leftIsUrdu ? comparison.codesEnglish : comparison.codesTranslit,
      isMatch: comparison.isMatch,
      primaryTransliteration: leftIsUrdu ? comparison.transliteration : comparison.english,
      variationTransliteration: leftIsUrdu ? comparison.english : comparison.transliteration,
    };
  }

  const comparison = comparePhoneticInputs(left, right);
  if (!comparison) return null;

  return {
    primary: left,
    variation: right,
    ...comparison,
  };
}

// ── Urdu ↔ English comparison ──────────────────────────────────────

/** Detect whether a string contains Urdu / Arabic-script characters */
export function isUrduScript(text) {
  return URDU_SCRIPT_RE.test(normaliseNameText(text));
}

/**
 * Strip vowels and weak semi-vowels from a Latin string to produce a
 * consonant skeleton. Urdu spellings often omit short vowels entirely and
 * English variants may insert w/y to spell long vowel sounds, as in
 * Sohail ↔ سہیل.
 */
function consonantSkeleton(str) {
  return str.toLowerCase().replace(/[aeiouwy]/g, '');
}

function tokenizeName(str) {
  return normaliseNameText(str)
    .toLowerCase()
    .split(/[\s-/]+/)
    .filter(Boolean);
}

function compareNameTokens(left, right) {
  const leftTokens = tokenizeName(left);
  const rightTokens = tokenizeName(right);

  if (!leftTokens.length || leftTokens.length !== rightTokens.length) {
    return false;
  }

  return leftTokens.every((leftToken, index) => {
    const rightToken = rightTokens[index];
    const tokenComparison = compareNames(leftToken, rightToken);

    if (tokenComparison?.isMatch) {
      return true;
    }

    return consonantSkeleton(leftToken) === consonantSkeleton(rightToken);
  });
}

/**
 * Compare an Urdu name with an English name.
 *
 * Strategy (layered — any layer can produce a match):
 *  1. Direct Double Metaphone on transliterated Urdu vs English
 *  2. Double Metaphone on normalised (deduplicated) transliteration
 *  3. Consonant-skeleton comparison (strips vowels from both sides,
 *     then runs Double Metaphone — handles the fact that Urdu doesn't
 *     write short vowels)
 *  4. Exact transliteration string match
 *  5. Exact consonant-skeleton string match
 */
export function compareUrduWithEnglish(urduName, englishName) {
  const urdu = normaliseNameText(urduName);
  const english = normaliseNameText(englishName);
  const englishComparable = normaliseEnglishForUrduComparison(english);

  if (!urdu || !english) return null;

  const transliteration = transliterateUrdu(urdu);
  const transliterationNorm = transliterateUrduNormalised(urdu);
  const transliterationJoined = transliteration.replace(/\s+/g, '');
  const englishJoined = englishComparable.replace(/\s+/g, '');

  if (!transliteration) return null;

  // --- Layer 1 & 2: full-string Double Metaphone ---
  const codesTranslit = getPhoneticCodes(transliteration);
  const codesTranslitNorm = getPhoneticCodes(transliterationNorm);
  const codesEnglish = getPhoneticCodes(englishComparable);

  if (!codesTranslit || !codesEnglish) return null;

  const isMatchRaw =
    codesTranslit.primary === codesEnglish.primary ||
    codesTranslit.primary === codesEnglish.secondary ||
    codesTranslit.secondary === codesEnglish.primary;

  const isMatchNorm = codesTranslitNorm
    ? codesTranslitNorm.primary === codesEnglish.primary ||
      codesTranslitNorm.primary === codesEnglish.secondary ||
      codesTranslitNorm.secondary === codesEnglish.primary
    : false;

  // --- Layer 3: consonant-skeleton Double Metaphone ---
  const skelTranslit = consonantSkeleton(transliteration);
  const skelEnglish  = consonantSkeleton(englishComparable);
  const codesSkelTranslit = skelTranslit ? getPhoneticCodes(skelTranslit) : null;
  const codesSkelEnglish  = skelEnglish  ? getPhoneticCodes(skelEnglish)  : null;

  const isMatchSkeleton =
    codesSkelTranslit && codesSkelEnglish
      ? codesSkelTranslit.primary === codesSkelEnglish.primary ||
        codesSkelTranslit.primary === codesSkelEnglish.secondary ||
        codesSkelTranslit.secondary === codesSkelEnglish.primary
      : false;

  // --- Layer 4: exact transliteration string match ---
  const isExactTranslit =
    transliteration.toLowerCase() === englishComparable.toLowerCase() ||
    transliterationNorm.toLowerCase() === englishComparable.toLowerCase();

  // --- Layer 5: exact consonant-skeleton string match ---
  const isSkeletonExact = skelTranslit === skelEnglish;

  // --- Layer 6: joined-name fallback (ignores spaces) ---
  const codesJoinedTranslit = transliterationJoined ? getPhoneticCodes(transliterationJoined) : null;
  const codesJoinedEnglish = englishJoined ? getPhoneticCodes(englishJoined) : null;

  const isMatchJoined =
    codesJoinedTranslit && codesJoinedEnglish
      ? codesJoinedTranslit.primary === codesJoinedEnglish.primary ||
        codesJoinedTranslit.primary === codesJoinedEnglish.secondary ||
        codesJoinedTranslit.secondary === codesJoinedEnglish.primary
      : false;

  // --- Layer 7: token-by-token fallback ---
  const isMatchTokens = compareNameTokens(transliteration, englishComparable);

  const isMatch =
    isMatchRaw ||
    isMatchNorm ||
    isMatchSkeleton ||
    isExactTranslit ||
    isSkeletonExact ||
    isMatchJoined ||
    isMatchTokens;

  return {
    urdu,
    english,
    englishComparable,
    transliteration,
    transliterationNorm,
    skelTranslit,
    skelEnglish,
    codesTranslit,
    codesTranslitNorm,
    codesEnglish,
    codesSkelTranslit,
    codesSkelEnglish,
    isMatch,
    isExactTranslit,
    isSkeletonExact,
    isMatchRaw,
    isMatchNorm,
    isMatchSkeleton,
    isMatchJoined,
    isMatchTokens,
  };
}

function compareUploadedPair(primaryName, variationName) {
  const primary = normaliseNameText(primaryName);
  const variation = normaliseNameText(variationName);

  if (!primary || !variation) return null;

  const primaryIsUrdu = isUrduScript(primary);
  const variationIsUrdu = isUrduScript(variation);

  if (primaryIsUrdu && variationIsUrdu) {
    const primaryTransliteration = transliterateUrdu(primary);
    const variationTransliteration = transliterateUrdu(variation);
    const comparison = compareNames(primaryTransliteration, variationTransliteration);

    if (!comparison) return null;

    return {
      ...comparison,
      primary,
      variation,
      comparisonType: 'urdu-urdu',
      primaryTransliteration,
      variationTransliteration,
    };
  }

  if (primaryIsUrdu || variationIsUrdu) {
    const urdu = primaryIsUrdu ? primary : variation;
    const english = primaryIsUrdu ? variation : primary;
    const comparison = compareUrduWithEnglish(urdu, english);

    if (!comparison) return null;

    return {
      primary,
      variation,
      codesA: primaryIsUrdu ? comparison.codesTranslit : comparison.codesEnglish,
      codesB: primaryIsUrdu ? comparison.codesEnglish : comparison.codesTranslit,
      isMatch: comparison.isMatch,
      comparisonType: 'urdu-english',
      primaryTransliteration: primaryIsUrdu ? comparison.transliteration : comparison.english,
      variationTransliteration: primaryIsUrdu ? comparison.english : comparison.transliteration,
      urdu: comparison.urdu,
      english: comparison.english,
      isExactTranslit: comparison.isExactTranslit,
      isSkeletonExact: comparison.isSkeletonExact,
      isMatchRaw: comparison.isMatchRaw,
      isMatchNorm: comparison.isMatchNorm,
      isMatchSkeleton: comparison.isMatchSkeleton,
    };
  }

  return compareNames(primary, variation);
}

/** Process an array of rows from Excel: [{ primary, variations: [...] }] */
export function processExcelData(rows) {
  const results = [];
  for (const row of rows) {
    const primary = normaliseNameText(row.primary);
    if (!primary) continue;

    for (const variation of row.variations) {
      const comparison = compareUploadedPair(primary, variation);
      if (comparison) results.push(comparison);
    }
  }
  return results;
}
