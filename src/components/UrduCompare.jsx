import React from 'react';
import { compareUrduWithEnglish, isUrduScript } from '../utils/phonetics';
import { transliterateUrdu } from '../utils/urduTransliteration';

function UrduCompare({ urduName, englishName, setUrduName, setEnglishName }) {
  const hasInput = urduName.trim() && englishName.trim();
  const comparison = hasInput ? compareUrduWithEnglish(urduName, englishName) : null;

  // Live transliteration preview
  const liveTranslit = urduName.trim() ? transliterateUrdu(urduName.trim()) : '';

  const getLevel = () => {
    if (!comparison) return 'none';
    if (comparison.isExactTranslit) return 'exact';
    if (comparison.isMatch) return 'match';
    return 'none';
  };

  const level = getLevel();

  const getMatchColor = () => {
    switch (level) {
      case 'exact':  return '#10b981';
      case 'match':  return '#10b981';
      case 'none':   return hasInput ? '#ef4444' : '#94a3b8';
      default:       return '#94a3b8';
    }
  };

  const getMatchEmoji = () => {
    switch (level) {
      case 'exact':  return '✅';
      case 'match':  return '✅';
      case 'none':   return hasInput ? '🔴' : '⚪';
      default:       return '⚪';
    }
  };

  const getDescription = () => {
    switch (level) {
      case 'exact':  return 'Exact transliteration match!';
      case 'match':  return 'Phonetic match — the Urdu name sounds like the English name.';
      case 'none':   return hasInput ? 'No phonetic match found.' : '';
      default:       return '';
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>🔤 Urdu ↔ English Name Comparison</h2>
        <p>
          Enter an Urdu name and its expected English equivalent. The Urdu text
          is transliterated to Latin script, then compared phonetically using
          Double Metaphone.
        </p>
      </div>

      <div className="compare-inputs">
        {/* Urdu input */}
        <div className="compare-field">
          <label>Urdu Name</label>
          <input
            type="text"
            className="search-input urdu-input"
            dir="rtl"
            lang="ur"
            placeholder="مثال: محمد"
            value={urduName}
            onChange={(e) => setUrduName(e.target.value)}
          />
          {liveTranslit && (
            <div className="compare-codes-multi">
              <div className="algo-code-row">
                <span className="algo-label">Transliteration</span>
                <span className="code translit sm">{liveTranslit}</span>
              </div>
              {comparison && (
                <>
                  <div className="algo-code-row">
                    <span className="algo-label">Primary</span>
                    <span className="code primary sm">{comparison.codesTranslit.primary}</span>
                  </div>
                  <div className="algo-code-row">
                    <span className="algo-label">Secondary</span>
                    <span className="code secondary sm">{comparison.codesTranslit.secondary}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="compare-vs">VS</div>

        {/* English input */}
        <div className="compare-field">
          <label>English Name</label>
          <input
            type="text"
            className="search-input"
            placeholder="e.g. Muhammad"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
          />
          {comparison && (
            <div className="compare-codes-multi">
              <div className="algo-code-row">
                <span className="algo-label">Primary</span>
                <span className="code primary sm">{comparison.codesEnglish.primary}</span>
              </div>
              <div className="algo-code-row">
                <span className="algo-label">Secondary</span>
                <span className="code secondary sm">{comparison.codesEnglish.secondary}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result card */}
      {hasInput && comparison && (
        <div className="compare-result" style={{ borderColor: getMatchColor() }}>
          <div className="compare-result-header">
            <span className="match-emoji">{getMatchEmoji()}</span>
            <div>
              <h3 style={{ color: getMatchColor() }}>
                {comparison.isMatch ? 'Match Found' : 'No Match'}
              </h3>
              <p>{getDescription()}</p>
            </div>
            <div className="score-ring" style={{ borderColor: getMatchColor() }}>
              {comparison.isMatch ? '✓' : '✗'}
            </div>
          </div>

          <div className="compare-detail">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Detail</th>
                  <th>Urdu (transliterated)</th>
                  <th>English</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Transliteration</td>
                  <td><span className="code translit sm">{comparison.transliteration}</span></td>
                  <td><span className="code translit sm">{comparison.english}</span></td>
                  <td>
                    {comparison.isExactTranslit ? (
                      <span className="check yes">✓ Exact</span>
                    ) : (
                      <span className="check no">✗ Differs</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="row-label">Consonants Only</td>
                  <td><span className="code translit sm">{comparison.skelTranslit}</span></td>
                  <td><span className="code translit sm">{comparison.skelEnglish}</span></td>
                  <td>
                    {comparison.isSkeletonExact ? (
                      <span className="check yes">✓ Exact</span>
                    ) : comparison.isMatchSkeleton ? (
                      <span className="check yes">✓ Phonetic</span>
                    ) : (
                      <span className="check no">✗ Differs</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="row-label">Primary Code</td>
                  <td><span className="code primary sm">{comparison.codesTranslit.primary}</span></td>
                  <td><span className="code primary sm">{comparison.codesEnglish.primary}</span></td>
                  <td>
                    {comparison.codesTranslit.primary === comparison.codesEnglish.primary ? (
                      <span className="check yes">✓ Match</span>
                    ) : (
                      <span className="check no">✗ No Match</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="row-label">Consonant Code</td>
                  <td><span className="code primary sm">{comparison.codesSkelTranslit?.primary || '—'}</span></td>
                  <td><span className="code primary sm">{comparison.codesSkelEnglish?.primary || '—'}</span></td>
                  <td>
                    {comparison.isMatchSkeleton ? (
                      <span className="check yes">✓ Match</span>
                    ) : (
                      <span className="check no">✗ No Match</span>
                    )}
                  </td>
                </tr>
                {comparison.transliterationNorm !== comparison.transliteration && (
                  <tr>
                    <td className="row-label">Normalised</td>
                    <td><span className="code translit sm">{comparison.transliterationNorm}</span></td>
                    <td><span className="code translit sm">{comparison.english}</span></td>
                    <td>
                      {comparison.isMatchNorm ? (
                        <span className="check yes">✓ Match</span>
                      ) : (
                        <span className="check no">✗ No Match</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suggestion chips */}
      {!hasInput && (
        <div className="suggestions">
          <p className="suggestions-label">Try these Urdu ↔ English pairs:</p>
          <div className="suggestion-chips">
            {[
              ['محمد', 'Muhammad'],
              ['احمد', 'Ahmad'],
              ['عائشہ', 'Aisha'],
              ['فاطمہ', 'Fatima'],
              ['عمر', 'Umar'],
              ['خالد', 'Khalid'],
              ['ابراہیم', 'Ibrahim'],
              ['بلال', 'Bilal'],
              ['یوسف', 'Yusuf'],
              ['حسن', 'Hassan'],
            ].map(([u, e]) => (
              <button
                key={u + e}
                className="chip"
                onClick={() => {
                  setUrduName(u);
                  setEnglishName(e);
                }}
              >
                {u} ↔ {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default UrduCompare;
