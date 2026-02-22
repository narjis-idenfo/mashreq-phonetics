import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

function ResultsTable({ results }) {
  const [filter, setFilter] = useState('');
  const [filterMatch, setFilterMatch] = useState('all'); // all, match, mismatch
  const [expandedRow, setExpandedRow] = useState(null);

  const filtered = useMemo(() => {
    let data = [...results];

    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      data = data.filter(
        (r) =>
          r.primary.toLowerCase().includes(q) ||
          r.variation.toLowerCase().includes(q)
      );
    }

    if (filterMatch === 'match') {
      data = data.filter((r) => r.isMatch);
    } else if (filterMatch === 'mismatch') {
      data = data.filter((r) => !r.isMatch);
    }

    return data;
  }, [results, filter, filterMatch]);

  const summary = useMemo(() => {
    const total = results.length;
    const matched = results.filter((r) => r.isMatch).length;
    const noMatch = results.filter((r) => !r.isMatch).length;
    return { total, matched, noMatch };
  }, [results]);

  const handleExportResults = () => {
    const exportData = results.map((r, i) => ({
      '#': i + 1,
      'Primary Name': r.primary,
      'Variation': r.variation,
      'Phonetic Match': r.isMatch ? '✓ Match' : '✗ No Match',
      'Primary Code (Name)': r.codesA.primary,
      'Secondary Code (Name)': r.codesA.secondary,
      'Primary Code (Variation)': r.codesB.primary,
      'Secondary Code (Variation)': r.codesB.secondary,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'phonetics_results.xlsx');
  };

  const getMatchClass = (result) => {
    return result.isMatch ? 'match-full' : 'match-none';
  };

  return (
    <div className="results-section">
      {/* Summary Cards */}
      <div className="summary-bar">
        <div
          className={`summary-card ${filterMatch === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMatch('all')}
        >
          <span className="summary-value">{summary.total}</span>
          <span className="summary-label">Total</span>
        </div>
        <div
          className={`summary-card green ${filterMatch === 'match' ? 'active' : ''}`}
          onClick={() => setFilterMatch('match')}
        >
          <span className="summary-value">{summary.matched}</span>
          <span className="summary-label">Match</span>
        </div>
        <div
          className={`summary-card red ${filterMatch === 'mismatch' ? 'active' : ''}`}
          onClick={() => setFilterMatch('mismatch')}
        >
          <span className="summary-value">{summary.noMatch}</span>
          <span className="summary-label">No Match</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="results-toolbar">
        <input
          type="text"
          className="search-input table-filter"
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="results-count">
          {filtered.length} of {results.length} comparisons
        </span>
        <button className="btn-export" onClick={handleExportResults}>
          📥 Export Results
        </button>
      </div>

      {/* Results Table */}
      <div className="table-wrapper">
        <table className="data-table results-data-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th>Primary Name</th>
              <th>Variation</th>
              <th className="th-algo">Result</th>
              <th className="th-algo">Primary Code</th>
              <th className="th-algo">Primary Code</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((result, i) => {
              const isExpanded = expandedRow === i;
              return (
                <React.Fragment key={i}>
                  <tr
                    className={`result-row ${getMatchClass(result)} ${
                      isExpanded ? 'expanded' : ''
                    }`}
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                  >
                    <td className="td-num">{i + 1}</td>
                    <td className="td-name">{result.primary}</td>
                    <td className="td-name">{result.variation}</td>
                    <td className="td-match">
                      {result.isMatch ? (
                        <span className="match-icon yes">✓</span>
                      ) : (
                        <span className="match-icon no">✗</span>
                      )}
                    </td>
                    <td className="td-match">
                      <span className="code primary sm">{result.codesA.primary}</span>
                    </td>
                    <td className="td-match">
                      <span className="code primary sm">{result.codesB.primary}</span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <div className="detail-content">
                          <div className="detail-grid">
                            <div className="detail-card">
                              <h5>Phonetic Codes</h5>
                              <div className="detail-codes">
                                <div className="detail-code-row">
                                  <span className="detail-label">{result.primary}:</span>
                                  <span className="code primary sm">{result.codesA.primary}</span>
                                  <span className="code secondary sm">{result.codesA.secondary}</span>
                                </div>
                                <div className="detail-code-row">
                                  <span className="detail-label">{result.variation}:</span>
                                  <span className="code primary sm">{result.codesB.primary}</span>
                                  <span className="code secondary sm">{result.codesB.secondary}</span>
                                </div>
                              </div>
                              <div className={`detail-verdict ${result.isMatch ? 'yes' : 'no'}`}>
                                {result.isMatch ? '✓ Match' : '✗ No Match'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="no-results">
          <span className="no-results-icon">📭</span>
          <p>No results match your filter</p>
        </div>
      )}
    </div>
  );
}

export default ResultsTable;
