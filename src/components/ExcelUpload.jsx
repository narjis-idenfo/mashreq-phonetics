import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { normaliseNameText } from '../utils/phonetics';

const HEADER_HINTS = ['name', 'primary', 'base', '#', 'no', 'variation', 'urdu', 'english', 'نام', 'اردو', 'انگریزی'];
const VARIATION_SPLIT_RE = /[,،;؛\n]+/;
const URDU_CHAR_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;

function areSameEntry(left, right) {
  return normaliseNameText(left).toLowerCase() === normaliseNameText(right).toLowerCase();
}

function toPairKey(primary, variation) {
  return `${normaliseNameText(primary).toLowerCase()}::${normaliseNameText(variation).toLowerCase()}`;
}

function scoreDecodedText(text) {
  const urduCount = (text.match(URDU_CHAR_RE) || []).length;
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const suspiciousQuestionMarks = (text.match(/\?(?=\?)/g) || []).length;

  return (urduCount * 10) - (replacementCount * 20) - suspiciousQuestionMarks;
}

function decodeCsvBuffer(buffer) {
  const bytes = new Uint8Array(buffer);

  const decoders = [
    { encoding: 'utf-8', label: 'UTF-8' },
    { encoding: 'utf-16le', label: 'UTF-16 LE' },
    { encoding: 'utf-16be', label: 'UTF-16 BE' },
    { encoding: 'windows-1256', label: 'Windows-1256' },
    { encoding: 'iso-8859-6', label: 'ISO-8859-6' },
  ];

  let best = { text: '', label: 'unknown', score: Number.NEGATIVE_INFINITY };

  for (const candidate of decoders) {
    try {
      const text = new TextDecoder(candidate.encoding).decode(bytes);
      const score = scoreDecodedText(text);

      if (score > best.score) {
        best = { text, label: candidate.label, score };
      }
    } catch {
      // Ignore unsupported encodings in the current runtime.
    }
  }

  if (!best.text) {
    best = {
      text: new TextDecoder('utf-8').decode(bytes),
      label: 'UTF-8',
      score: scoreDecodedText(new TextDecoder('utf-8').decode(bytes)),
    };
  }

  return best;
}

function readWorkbook(file, buffer) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    const decoded = decodeCsvBuffer(buffer);
    const workbook = XLSX.read(decoded.text, {
      type: 'string',
      raw: false,
      dense: true,
    });

    return { workbook, sourceEncoding: decoded.label };
  }

  const workbook = XLSX.read(new Uint8Array(buffer), {
    type: 'array',
    raw: false,
    dense: true,
    codepage: 65001,
  });

  return { workbook, sourceEncoding: 'binary workbook' };
}

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
        const { workbook, sourceEncoding } = readWorkbook(file, e.target.result);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Skip empty rows and header
        const rows = [];
        const seenPairs = new Set();
        let startIdx = 0;

        // Detect if first row is a header
        if (json.length > 0) {
          const firstRowText = (json[0] || [])
            .map((cell) => normaliseNameText(cell).toLowerCase())
            .join(' ');

          if (HEADER_HINTS.some((hint) => firstRowText.includes(hint))) {
            startIdx = 1;
          }
        }

        for (let i = startIdx; i < json.length; i++) {
          const row = (json[i] || []).map((cell) => normaliseNameText(cell));
          if (!row.length || !row[0]) continue;

          const primary = row[0];
          const variations = [];

          for (let j = 1; j < row.length; j++) {
            const val = row[j];
            if (val) {
              // Support comma / Arabic comma / semicolon / new-line separated variations in a single cell
              val.split(VARIATION_SPLIT_RE).forEach((v) => {
                const trimmed = normaliseNameText(v);
                if (!trimmed || areSameEntry(primary, trimmed)) return;

                const pairKey = toPairKey(primary, trimmed);
                if (seenPairs.has(pairKey)) return;

                seenPairs.add(pairKey);
                variations.push(trimmed);
              });
            }
          }

          if (variations.length > 0) {
            rows.push({ primary, variations: [...new Set(variations)] });
          }
        }

        if (rows.length === 0) {
          setError(
            'No valid data found. Expected format: Column A = Primary Name, Column B = Variations. Urdu and English names are both supported.'
          );
          return;
        }

        const containsQuestionMarks = rows.some((row) =>
          [row.primary, ...row.variations].some((value) => /\?{2,}/.test(value))
        );

        if (containsQuestionMarks && file.name.toLowerCase().endsWith('.csv')) {
          setError(
            `This CSV appears to contain lossy text characters. Save the file as .xlsx or UTF-8 CSV in Excel, then upload again. Detected decoding: ${sourceEncoding}.`
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
      ['محمد', 'Muhammad, Mohammad, Muhammed'],
      ['Ahmad', 'Ahmed, Ahamed, Ahmat'],
      ['عائشہ', 'Aisha, Ayesha, Aishah'],
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
          Need a template? Column A = Primary Name, Column B = Variations. Urdu and English are supported.
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
                <td>محمد</td>
                <td>Muhammad, Mohammad, Muhammed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ExcelUpload;
