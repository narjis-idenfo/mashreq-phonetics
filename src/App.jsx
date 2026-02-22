import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PhoneticCompare from './components/PhoneticCompare';
import ExcelUpload from './components/ExcelUpload';
import ResultsTable from './components/ResultsTable';
import { processExcelData } from './utils/phonetics';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('compare');
  const [compareName1, setCompareName1] = useState('');
  const [compareName2, setCompareName2] = useState('');
  const [excelResults, setExcelResults] = useState(null);

  const handleExcelData = useCallback((rows) => {
    const results = processExcelData(rows);
    setExcelResults(results);
  }, []);

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  return (
    <div className="app">
      <Header />

      <nav className="tabs">
        {[
          { id: 'compare', label: 'Compare Names', icon: '⚖️' },
          { id: 'excel', label: 'Excel Upload', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'compare' && (
          <PhoneticCompare
            name1={compareName1}
            name2={compareName2}
            setName1={setCompareName1}
            setName2={setCompareName2}
          />
        )}
        {activeTab === 'excel' && (
          <section className="panel">
            <div className="panel-header">
              <h2>📊 Bulk Phonetic Analysis</h2>
              <p>
                Upload an Excel file with primary names and their variations to compare phonetically
              </p>
            </div>
            <ExcelUpload onDataLoaded={handleExcelData} />
            {excelResults && excelResults.length > 0 && (
              <ResultsTable results={excelResults} />
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          Powered by <strong style={{ color: '#672b96' }}>Idenfo</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
