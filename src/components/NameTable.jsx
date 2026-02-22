import React, { useState, useMemo } from 'react';

function NameTable({ nameData }) {
  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let data = [...nameData];
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      data = data.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.primary.toLowerCase().includes(q) ||
          n.secondary.toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const valA = a[sortField].toLowerCase();
      const valB = b[sortField].toLowerCase();
      return sortDir === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
    return data;
  }, [nameData, filter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '⇅';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>📋 Complete Name Table</h2>
        <p>All {nameData.length} names with their phonetic codes</p>
      </div>

      <div className="table-toolbar">
        <input
          type="text"
          className="search-input table-filter"
          placeholder="Filter by name or code..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="table-count">
          Showing {filtered.length} of {nameData.length}
        </span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th className="sortable" onClick={() => handleSort('name')}>
                Name {getSortIcon('name')}
              </th>
              <th className="sortable" onClick={() => handleSort('primary')}>
                Primary Code {getSortIcon('primary')}
              </th>
              <th className="sortable" onClick={() => handleSort('secondary')}>
                Secondary Code {getSortIcon('secondary')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr key={i}>
                <td className="td-num">{i + 1}</td>
                <td className="td-name">{entry.name}</td>
                <td>
                  <span className="code primary sm">{entry.primary}</span>
                </td>
                <td>
                  <span className="code secondary sm">{entry.secondary}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default NameTable;
