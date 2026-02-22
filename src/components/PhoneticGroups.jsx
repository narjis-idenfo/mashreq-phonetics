import React, { useState } from 'react';

function PhoneticGroups({ groups }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggle = (code) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(groups.map(([code]) => code)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>👥 Phonetic Groups</h2>
        <p>Names grouped by their primary phonetic code — names in the same group sound alike</p>
      </div>

      <div className="groups-toolbar">
        <span className="groups-count">{groups.length} groups with phonetic matches</span>
        <div>
          <button className="btn-sm" onClick={expandAll}>Expand All</button>
          <button className="btn-sm" onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      <div className="groups-list">
        {groups.map(([code, members]) => {
          const isOpen = expanded.has(code);
          return (
            <div key={code} className={`group-card ${isOpen ? 'open' : ''}`}>
              <button className="group-header" onClick={() => toggle(code)}>
                <div className="group-info">
                  <span className="code primary">{code}</span>
                  <span className="group-count">
                    {members.length} name{members.length !== 1 && 's'}
                  </span>
                  <span className="group-preview">
                    {members.map((m) => m.name).join(', ')}
                  </span>
                </div>
                <span className={`chevron ${isOpen ? 'rotated' : ''}`}>▸</span>
              </button>
              {isOpen && (
                <div className="group-body">
                  <div className="group-names">
                    {members.map((member, i) => (
                      <div key={i} className="group-member">
                        <span className="member-name">{member.name}</span>
                        <div className="member-codes">
                          <span className="code primary sm">{member.primary}</span>
                          <span className="code secondary sm">{member.secondary}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PhoneticGroups;
