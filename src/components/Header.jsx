import React from 'react';
import logo from '../utils/logo.png';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo-img" />
          <div>
            <h1>Phonetics Demo</h1>
            <p className="subtitle">Phonetic Name Matching Engine</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
