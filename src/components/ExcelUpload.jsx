import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

function ExcelUpload({ onDataLoaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        console.error('Upload failed:', data.error);
      } else {
        console.log('File saved to backend:', data.file);
      }
    } catch (err) {
      console.error('Backend upload error:', err);
    }
  };

  const parseFile = (file) => {
    setError('');
    setFileName(file.name);

    // Send file to backend for storage
    uploadToBackend(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Skip empty rows and header
        const rows = [];
        let startIdx = 0;

        // Detect if first row is a header
        if (json.length > 0) {
          const firstCell = String(json[0][0] || '').toLowerCase();
          if (
            firstCell.includes('name') ||
            firstCell.includes('primary') ||
            firstCell.includes('base') ||
            firstCell === '#' ||
            firstCell === 'no'
          ) {
            startIdx = 1;
          }
        }

        for (let i = startIdx; i < json.length; i++) {
          const row = json[i];
          if (!row || !row[0] || !String(row[0]).trim()) continue;

          const primary = String(row[0]).trim();
          const variations = [];
          for (let j = 1; j < row.length; j++) {
            const val = String(row[j] || '').trim();
            if (val) {
              // Support comma-separated variations in a single cell
              val.split(',').forEach(v => {
                const trimmed = v.trim();
                if (trimmed) variations.push(trimmed);
              });
            }
          }

          if (variations.length > 0) {
            rows.push({ primary, variations });
          }
        }

        if (rows.length === 0) {
          setError(
            'No valid data found. Expected format: Column A = Base Name, Column B = Phonetic Variations (comma-separated)'
          );
          return;
        }

        setPreview({
          totalRows: rows.length,
          totalComparisons: rows.reduce((sum, r) => sum + r.variations.length, 0),
          sample: rows.slice(0, 3),
        });

        try {
          onDataLoaded(rows);
        } catch (processErr) {
          setError('Failed to process names: ' + processErr.message);
          console.error('Processing error:', processErr);
        }
      } catch (err) {
        setError('Failed to parse Excel file: ' + err.message);
        console.error('Parse error:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ['Primary Name', 'Variations'],
      ['Muhammad', 'Mohammad, Muhammed, Muhamad, Mahomet, Mohamad, Mohd'],
      ['Ahmad', 'Ahmed, Ahamed, Ahmat'],
      ['Ali', 'Aly, Aliy'],
      ['Hasan', 'Hassan, Hassen, Husan'],
      ['Husain', 'Hussein, Hussain, Hossein, Husein'],
      ['Tariq', 'Tarik, Tareq, Tareck'],
      ['Usman', 'Osman, Othman, Usmaan, Ousmane'],
      ['Umar', 'Omar, Omer'],
      ['Abu Bakr', 'Abubakar, Abu Bakar, Aboubacar'],
      ['Abdullah', 'Abdulla, Abdallah, Abdullahu'],
      ['Abdul Rahman', 'Abdurahman, Abdur Rehman, Abdulrahman'],
      ['Ismail', 'Ismael, Ismayil, Smail'],
      ['Ibrahim', 'Ebrahim, Ibraheem'],
      ['Yusuf', 'Yousef, Yousuf, Youssef, Yusef, Yosif'],
      ['Sulaiman', 'Suleiman, Soliman, Suleman, Sulayman'],
      ['Dawood', 'Dawud, Daud, Daoud'],
      ['Yahya', 'Yehia, Yahiya, Yahia'],
      ['Zaid', 'Zayed, Zeid, Zayd'],
      ['Saeed', 'Said, Sayid, Saied, Sayeed'],
      ['Khalid', 'Khaled, Khalide, Halid'],
      ['Bilal', 'Bilaal, Belal'],
      ['Hamza', 'Hamzah, Hamzeh'],
      ['Abbas', 'Abass'],
      ['Mustafa', 'Moustafa, Moustapha, Mostafa'],
      ['Mahmud', 'Mahmood, Mahmoud, Mehmood'],
      ['Qasim', 'Kasim, Qaseem, Kassim, Qassim'],
      ['Faruq', 'Farooq, Farouk, Faruk'],
      ['Jafar', 'Jaffar, Jaffer, Jaafar'],
      ['Imran', 'Emran, Imraan, Omran'],
      ['Rizwan', 'Rezwan, Ridwan, Redouane'],
      ['Fatima', 'Fatmah, Fatema, Fatimata, Fatma'],
      ['Aisha', 'Ayesha, Aishah, Aysha, Ayisha'],
      ['Khadija', 'Khadijah, Khadeeja, Khadijeh'],
      ['Maryam', 'Mariam, Meryem, Meriam'],
      ['Zainab', 'Zaynab, Zeinab, Zeynep'],
      ['Ruqayya', 'Ruqaiyah, Rukiye, Roqayya'],
      ['Hafsa', 'Hafsah, Hafza, Hafza'],
      ['Asma', 'Asmaa, Asmah'],
      ['Safiyya', 'Safia, Safiyah, Safiya'],
      ['Sumayya', 'Sumaya, Sumayyah, Soumaya'],
      ['Amina', 'Aminah, Ameena, Amine'],
      ['Halima', 'Halimah, Haleema, Halime, Halimatu'],
      ['Sana', 'Sanaa, Sanna'],
      ['Hira', 'Heera, Hirah'],
      ['Rabia', 'Rabeea, Rabiya, Rabiah'],
      ['Salma', 'Salmah, Selma'],
      ['Yasmin', 'Yasmeen, Yasmine, Yazmin'],
      ['Laila', 'Layla, Leyla, Leila'],
      ['Noor', 'Nur, Noura, Noora, Nura'],
      ['Huda', 'Houda, Hudah'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    ws['!cols'] = [{ wch: 20 }, { wch: 55 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Muslim Names Phonetic Test Case');
    XLSX.writeFile(wb, 'phonetics_template.xlsx');
  };

  return (
    <div className="upload-section">
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''} ${fileName ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          hidden
        />
        {fileName ? (
          <div className="file-loaded">
            <span className="file-icon">📄</span>
            <div>
              <p className="file-name">{fileName}</p>
              <p className="file-hint">Click or drop to replace</p>
            </div>
          </div>
        ) : (
          <div className="drop-prompt">
            <span className="upload-icon">📁</span>
            <p className="drop-title">Drop your Excel file here</p>
            <p className="drop-hint">or click to browse — supports .xlsx, .xls, .csv</p>
          </div>
        )}
      </div>

      {error && <div className="upload-error">{error}</div>}

      {preview && (
        <div className="upload-preview">
          <div className="preview-stats">
            <span className="preview-stat">
              <strong>{preview.totalRows}</strong> primary names
            </span>
            <span className="preview-stat">
              <strong>{preview.totalComparisons}</strong> comparisons to run
            </span>
          </div>
          <div className="preview-sample">
            <p className="preview-label">Preview:</p>
            {preview.sample.map((row, i) => (
              <div key={i} className="preview-row">
                <span className="preview-primary">{row.primary}</span>
                <span className="preview-arrow">→</span>
                <span className="preview-variations">
                  {row.variations.join(', ')}
                </span>
              </div>
            ))}
            {preview.totalRows > 3 && (
              <p className="preview-more">...and {preview.totalRows - 3} more</p>
            )}
          </div>
        </div>
      )}

      <div className="template-section">
        <p className="template-text">
          Need a template? Column A = Primary Name, Column B = Variations (comma-separated)
        </p>
        <button className="btn-template" onClick={handleDownloadTemplate}>
          ⬇ Download Template
        </button>
      </div>

      <div className="format-guide">
        <h4>Expected Excel Format:</h4>
        <div className="format-table-wrapper">
          <table className="format-table">
            <thead>
              <tr>
                <th>A (Primary Name)</th>
                <th>B (Variations)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Muhammad</td>
                <td>Mohammad, Muhammed, Muhamad, Mohamad</td>
              </tr>
              <tr>
                <td>Ahmad</td>
                <td>Ahmed, Ahamed, Ahmat</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ExcelUpload;
