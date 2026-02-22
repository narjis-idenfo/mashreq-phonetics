import React from 'react';
import { getPhoneticCodes, compareNames } from '../utils/phonetics';

function PhoneticCompare({ name1, name2, setName1, setName2 }) {
  const codes1 = getPhoneticCodes(name1);
  const codes2 = getPhoneticCodes(name2);

  const hasInput = name1.trim() && name2.trim();
  const comparison = hasInput ? compareNames(name1.trim(), name2.trim()) : null;

  const getOverallLevel = () => {
    if (!comparison) return 'none';
    if (name1.trim().toLowerCase() === name2.trim().toLowerCase()) return 'exact';
    if (comparison.isMatch) return 'match';
    return 'none';
  };

  const level = getOverallLevel();

  const getMatchColor = () => {
    switch (level) {
      case 'exact': return '#10b981';
      case 'match': return '#10b981';
      case 'none': return hasInput ? '#ef4444' : '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const getMatchEmoji = () => {
    switch (level) {
      case 'exact': return '✅';
      case 'match': return '✅';
      case 'none': return hasInput ? '🔴' : '⚪';
      default: return '⚪';
    }
  };

  const getDescription = () => {
    switch (level) {
      case 'exact': return 'Identical names!';
      case 'match': return 'Phonetic match — these names sound the same.';
      case 'none': return hasInput ? 'No phonetic match found.' : '';
      default: return '';
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>⚖️ Compare Two Names</h2>
        <p>Analyze phonetic similarity between two names</p>
      </div>

      <div className="compare-inputs">
        <div className="compare-field">
          <label>First Name</label>
          <input
            type="text"
            className="search-input"
            placeholder="e.g. Smith"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
          />
          {codes1 && (
            <div className="compare-codes-multi">
              <div className="algo-code-row">
                <span className="algo-label">Primary</span>
                <span className="code primary sm">{codes1.primary}</span>
              </div>
              <div className="algo-code-row">
                <span className="algo-label">Secondary</span>
                <span className="code secondary sm">{codes1.secondary}</span>
              </div>
            </div>
          )}
        </div>

        <div className="compare-vs">VS</div>

        <div className="compare-field">
          <label>Second Name</label>
          <input
            type="text"
            className="search-input"
            placeholder="e.g. Smythe"
            value={name2}
            onChange={(e) => setName2(e.target.value)}
          />
          {codes2 && (
            <div className="compare-codes-multi">
              <div className="algo-code-row">
                <span className="algo-label">Primary</span>
                <span className="code primary sm">{codes2.primary}</span>
              </div>
              <div className="algo-code-row">
                <span className="algo-label">Secondary</span>
                <span className="code secondary sm">{codes2.secondary}</span>
              </div>
            </div>
          )}
        </div>
      </div>

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
                  <th>Code</th>
                  <th>{name1}</th>
                  <th>{name2}</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="row-label">Primary Code</td>
                  <td><span className="code primary sm">{codes1.primary}</span></td>
                  <td><span className="code primary sm">{codes2.primary}</span></td>
                  <td>
                    {codes1.primary === codes2.primary ? (
                      <span className="check yes">✓ Match</span>
                    ) : (
                      <span className="check no">✗ No Match</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="row-label">Secondary Code</td>
                  <td><span className="code secondary sm">{codes1.secondary}</span></td>
                  <td><span className="code secondary sm">{codes2.secondary}</span></td>
                  <td>
                    {comparison.isMatch ? (
                      <span className="check yes">✓ Match</span>
                    ) : (
                      <span className="check no">✗ No Match</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hasInput && (
        <div className="suggestions">
          <p className="suggestions-label">Try these pairs:</p>
          <div className="suggestion-chips">
            {[
              ['Muhammad', 'Mohammad'],
              ['Ahmad', 'Ahmed'],
              ['Usman', 'Osman'],
              ['Fatima', 'Fatma'],
              ['Yusuf', 'Yousef'],
              ['Khalid', 'Khaled'],
            ].map(([a, b]) => (
              <button
                key={a + b}
                className="chip"
                onClick={() => {
                  setName1(a);
                  setName2(b);
                }}
              >
                {a} ↔ {b}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default PhoneticCompare;
