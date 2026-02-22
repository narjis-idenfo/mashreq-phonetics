import React from 'react';
import { doubleMetaphone } from 'double-metaphone';

function SearchBar({ searchTerm, setSearchTerm, searchResults, nameData }) {
  const inputCodes = searchTerm.trim()
    ? doubleMetaphone(searchTerm.trim())
    : [null, null];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>🔍 Phonetic Name Search</h2>
        <p>Type a name to find all phonetically similar names from the database</p>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Type a name... (e.g. Smith, Johnson, Reid)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        {searchTerm.trim() && (
          <div className="search-codes">
            <span className="code-label">Your input codes:</span>
            <span className="code primary">{inputCodes[0]}</span>
            <span className="code secondary">{inputCodes[1]}</span>
          </div>
        )}
      </div>

      {searchTerm.trim() && (
        <div className="results-section">
          <div className="results-header">
            <h3>
              {searchResults.length} match{searchResults.length !== 1 && 'es'} found
            </h3>
          </div>

          {searchResults.length > 0 ? (
            <div className="results-grid">
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  className={`result-card match-${result.matchType}`}
                >
                  <div className="result-name">{result.name}</div>
                  <div className="result-codes">
                    <span className="code primary">{result.primary}</span>
                    <span className="code secondary">{result.secondary}</span>
                  </div>
                  <span className={`match-badge ${result.matchType}`}>
                    {result.matchType === 'exact'
                      ? '✓ Exact'
                      : result.matchType === 'primary'
                      ? '● Primary'
                      : '○ Secondary'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span className="no-results-icon">🔇</span>
              <p>No phonetic matches found for "{searchTerm}"</p>
              <p className="hint">Try common names like "Smith", "Johnson", or "Reid"</p>
            </div>
          )}
        </div>
      )}

      {!searchTerm.trim() && (
        <div className="suggestions">
          <p className="suggestions-label">Try these examples:</p>
          <div className="suggestion-chips">
            {['Smith', 'Johnson', 'Reid', 'Clark', 'Stuart', 'Gray', 'Knox', 'Allen'].map(
              (name) => (
                <button
                  key={name}
                  className="chip"
                  onClick={() => setSearchTerm(name)}
                >
                  {name}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default SearchBar;
