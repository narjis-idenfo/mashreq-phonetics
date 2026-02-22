import React from 'react';

function Stats({ nameData, phoneticGroups }) {
  const uniqueCodes = new Set(nameData.map((n) => n.primary)).size;
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-value">{nameData.length}</span>
        <span className="stat-label">Names Loaded</span>
      </div>
      <div className="stat">
        <span className="stat-value">{uniqueCodes}</span>
        <span className="stat-label">Unique Codes</span>
      </div>
      <div className="stat">
        <span className="stat-value">{phoneticGroups.length}</span>
        <span className="stat-label">Match Groups</span>
      </div>
      <div className="stat">
        <span className="stat-value">
          {nameData.length - uniqueCodes}
        </span>
        <span className="stat-label">Phonetic Overlaps</span>
      </div>
    </div>
  );
}

export default Stats;
