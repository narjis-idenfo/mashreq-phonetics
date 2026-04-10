/**
 * Urdu-to-Latin transliteration for phonetic name comparison.
 *
 * Maps Urdu (Arabic-script) characters to their most common Latin
 * romanisation so the result can be fed into Double Metaphone and
 * compared with English name spellings.
 */

// ── Single-character map ──────────────────────────────────────────
const CHAR_MAP = {
  // Vowels / semi-vowels
  'ا': 'a',
  'آ': 'aa',
  'أ': 'a',
  'إ': 'i',
  'ٱ': 'a',
  'و': 'w',    // context-dependent: w / u / o
  'ی': 'y',    // context-dependent: y / i / ee
  'ي': 'y',    // Arabic ya
  'ے': 'e',
  'ئ': '',     // hamza-on-ya (glottal, usually silent in names)
  'ء': '',     // hamza
  'ؤ': 'u',

  // Consonants – basic Arabic set
  'ب': 'b',
  'ت': 't',
  'ث': 's',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'z',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'z',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ڪ': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'ة': 'a',

  // Urdu-specific letters
  'پ': 'p',
  'ٹ': 't',
  'چ': 'ch',
  'ڈ': 'd',
  'ڑ': 'r',
  'ژ': 'zh',
  'ک': 'k',
  'گ': 'g',
  'ں': 'n',
  'ھ': 'h',    // do-chashmi he (aspiration marker)
  'ہ': 'h',    // gol he / choti he
  'ۃ': 'h',    // ta marbuta
  'ۀ': 'h',

  // Diacritics (harakat)
  '\u064E': 'a',   // fatha  َ
  '\u064F': 'u',   // damma  ُ
  '\u0650': 'i',   // kasra  ِ
  '\u064B': 'an',  // tanwin fath  ً
  '\u064C': 'un',  // tanwin damm  ٌ
  '\u064D': 'in',  // tanwin kasr  ٍ
  '\u0651': '',    // shadda  ّ  (gemination – handled below)
  '\u0652': '',    // sukun   ْ
  '\u0670': 'a',   // superscript alef

  // Common extras
  'ى': 'a',    // alif maqsura
};

// Two-character combinations that should be matched first
const DIGRAPHS = [
  // aspirated consonants (letter + do-chashmi he ھ)
  ['بھ', 'bh'],
  ['پھ', 'ph'],
  ['تھ', 'th'],
  ['ٹھ', 'th'],
  ['جھ', 'jh'],
  ['چھ', 'chh'],
  ['دھ', 'dh'],
  ['ڈھ', 'dh'],
  ['رھ', 'rh'],
  ['ڑھ', 'rh'],
  ['کھ', 'kh'],
  ['گھ', 'gh'],
  ['لھ', 'lh'],
  ['مھ', 'mh'],
  ['نھ', 'nh'],
  // lam-alif ligature (sometimes encoded separately)
  ['لا', 'la'],
];

// Sort digraphs longest-first so greedy matching works
DIGRAPHS.sort((a, b) => b[0].length - a[0].length);

// ── Helpers ───────────────────────────────────────────────────────

/** Remove zero-width / formatting Unicode characters */
function stripInvisible(str) {
  return str.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF\u00AD]/g, '');
}

function normaliseArabicPresentationForms(str) {
  return str
    .normalize('NFKC')
    .replace(/\u0640/g, '');
}

/** Deduplicate consecutive identical Latin letters (aa → a, etc.)
 *  Call *after* transliteration to normalise output. */
function dedup(str) {
  return str.replace(/(.)\1+/g, '$1');
}

function isWordBoundary(ch) {
  return !ch || /[\s\-\u200C]/.test(ch);
}

/**
 * Canonicalise English spellings into the Latin equivalents this Urdu
 * transliterator produces, so Urdu/English comparison can align letters
 * such as c/k, o/w, u/ain, and v/waw.
 */
export function normaliseEnglishForUrduComparison(value) {
  if (!value || typeof value !== 'string') return '';

  return stripInvisible(value.trim())
    .toLowerCase()
    .replace(/c/g, 'k')
    .replace(/[ov]/g, 'w')
    .replace(/u/g, 'a')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Main transliteration function ─────────────────────────────────

/**
 * Transliterate an Urdu string to Latin script.
 *
 * @param {string} urdu  – text in Urdu / Arabic script
 * @returns {string}       lower-case Latin transliteration
 */
export function transliterateUrdu(urdu) {
  if (!urdu || typeof urdu !== 'string') return '';

  let text = normaliseArabicPresentationForms(stripInvisible(urdu.trim()));
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Try digraphs first
    let matched = false;
    for (const [src, dest] of DIGRAPHS) {
      if (text.startsWith(src, i)) {
        result += dest;
        i += src.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = text[i];
    const nextCh = text[i + 1];

    // Shadda: double the previous consonant
    if (ch === '\u0651') {
      if (result.length > 0) {
        result += result[result.length - 1];
      }
      i++;
      continue;
    }

    // Space / dash passthrough
    if (ch === ' ' || ch === '-' || ch === '\u200C') {
      result += ' ';
      i++;
      continue;
    }

    // Word-final heh often sounds like trailing "a" in names: حمزہ → hamza
    if ((ch === 'ہ' || ch === 'ھ' || ch === 'ۃ' || ch === 'ۀ') && isWordBoundary(nextCh)) {
      result += 'a';
      i++;
      continue;
    }

    // Mapped character
    if (CHAR_MAP[ch] !== undefined) {
      result += CHAR_MAP[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      // Already Latin – keep as-is
      result += ch.toLowerCase();
    }
    // else: skip unmapped characters

    i++;
  }

  // Clean up
  result = result
    .replace(/\s+/g, ' ')   // collapse whitespace
    .trim();

  return result;
}

/**
 * Normalised transliteration suitable for phonetic comparison.
 * Deduplicates consecutive identical letters so "Muhammed" / "Muhammad"
 * style differences become identical before Double Metaphone runs.
 */
export function transliterateUrduNormalised(urdu) {
  return dedup(transliterateUrdu(urdu));
}
