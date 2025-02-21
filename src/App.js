import React, { useState, useEffect, useRef } from "react";
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import 'handsontable/dist/handsontable.full.min.css';
import './App.css';
import { useNavigate } from 'react-router-dom';
import * as Papa from 'papaparse';

registerAllModules();

const App = () => {
  const hotTableRef = useRef(null);
  const [headers, setHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [years, setYears] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [modelFrom, setModelFrom] = useState(1);
  const [modelTo, setModelTo] = useState(2);
  const [hyperformulaInstance] = useState(() =>
    HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' })
  );
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // To manage dropdown visibility
  const navigate = useNavigate();

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch("https://vwgbackend.onrender.com/api/getYears");
        const result = await response.json();
        if (response.ok) {
          setYears(result.years);
        }
      } catch (error) {
        setYears([2020, 2021, 2022, 2023, 2024, 2025]);
        console.error("Error fetching years:", error);
      }
    };
    fetchYears();
  }, []);

  const fetchFiles = async (year) => {
    setSelectedYear(year);
    try {
      const response = await fetch(`https://vwgbackend.onrender.com/api/getFiles/${year}`);
      const result = await response.json();
      if (response.ok) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      alert("Error fetching files");
    }
  };

  const fetchPBUData = async (file) => {
    setSelectedFile(file);
    setIsEditable(false);
    try {
      const response = await fetch(`https://vwgbackend.onrender.com/api/getPBUData/${file}`);
      const result = await response.json();
      if (response.ok) {
        const newHeaders = ["Code", "Parameters"];
        const numColumns = Object.keys(result.data[0]).length;
        for (let i = 3; i <= numColumns; i++) {
          newHeaders.push(`Model ${i - 2}`);
        }
        setHeaders(newHeaders);
        const initialData = result.data.map(row =>
          newHeaders.map((header, i) => row[`Column${i + 1}`] || '')
        );
        setDataRows(initialData);
      }
    } catch (error) {
      console.error("Error fetching PBU data:", error);
      alert("Error fetching PBU data");
    }
  };

  const exportCSV = () => {
    const dataToExport = dataRows.map(row =>
      headers.reduce((obj, header, i) => {
        obj[header] = row[i] || '';
        return obj;
      }, {})
    );
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "PBU_Data.csv";
    link.click();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      createNewPBUTemplate();
    }
  }, [navigate]); 

  const createNewPBUTemplate = async () => {
    try {
      const response = await fetch(`https://vwgbackend.onrender.com/api/getSpreadsheetData`);
      const result = await response.json();
      if (response.ok) {
        setSelectedFile(null);
        setIsEditable(true);
        const newHeaders = ["Code", "Parameters"];
        const numColumns = Object.keys(result.data[0]).length;
        for (let i = 3; i <= numColumns; i++) {
          newHeaders.push(`Model ${i - 2}`);
        }
        setHeaders(newHeaders);
        const initialData = result.data.map(row =>
          newHeaders.map((header, i) => row[`Column${i + 1}`] || '')
        );
        setDataRows(initialData);
      }
    } catch (error) {
      console.error("Error fetching PBU data:", error);
      alert("Error fetching PBU data");
    }
  };

  const handleCopyToNextColumn = () => {
    const fromColumn = modelFrom + 1;
    const toColumn = modelTo + 1;

    if (fromColumn === toColumn) {
      alert("From and To columns must be different.");
      return;
    }

    const newDataRows = [...dataRows];
    newDataRows.forEach((row) => {
      row[toColumn] = row[fromColumn];
    });

    setDataRows(newDataRows);
  };

  const saveData = async () => {
    try {
      const fileData = { data: dataRows };
      let url = selectedFile
        ? `https://vwgbackend.onrender.com/api/saveFiles/${selectedYear}/${selectedFile}`
        : `https://vwgbackend.onrender.com/api/saveFiles/${selectedYear}/newFile`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fileData)
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
      } else {
        alert(result.error || "Error saving file");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'https://vwg-frontend-alpha.vercel.app/login';
  };

  const highlightRows = [35, 47, 54, 55, 57, 68, 78, 79, 81, 83, 90, 104, 134, 136, 147, 158, 170, 183, 197, 212, 224, 235, 247, 267, 269];

  const hotSettings = {
    data: dataRows,
    colHeaders: headers,
    rowHeaders: dataRows.length > 1,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    contextMenu: true,
    formulas: {
      engine: hyperformulaInstance,
      sheetName: 'Sheet1',
    },
    afterChange: (changes) => {
      if (changes && isEditable) {
        changes.forEach(([row, col, _, newVal]) => {
          hyperformulaInstance.setCellContents({
            sheet: 0,
            row,
            col,
          }, [[newVal]]);
        });
      }
    },
    afterOnCellMouseDown: (event, coords) => {
      const hot = hotTableRef.current.hotInstance;
      hot.selectCell(coords.row, coords.col);
    },
    cells: function (row, col) {
      if (highlightRows.includes(row) && col === 1) {
        return { className: 'highlight-row' };
      }
      if (col === 0) return { className: 'highlight-column-a' };
      if (col === 1) return { className: 'highlight-column' };
      if (!isEditable) {
        return { readOnly: true };
      }
      return { readOnly: false };
    },
    minSpareRows: 1,
    minSpareCols: 0,
    rowHeight: 40,
    manualRowResize: true,
    manualColumnResize: true,
    allowInsertRow: true,
    allowInsertColumn: true,
    allowRemoveRow: true,
    allowRemoveColumn: true,
  };

  return (
    <div className="app-container">
      <img src="/logo.png" alt="Logo" className="app-logo" />
      <div className="side-nav">
        <h2>PBU</h2>
        {years.map((year) => (
          <button key={year} onClick={() => fetchFiles(year)}>PBU {year}</button>
        ))}
        <h3>Files for {selectedYear} PBU</h3>
        {files.map((file) => (
          <button key={file} onClick={() => fetchPBUData(file)}>
            {file.replace('.xlsx', '')}
          </button>
        ))}
      </div>
      <div className="main-container">
        <div className="menu">
          <button onClick={exportCSV}>Export PBU</button>
          <button onClick={createNewPBUTemplate}>New PBU Template</button>

          {/* Show only one button initially, which reveals the dropdowns and copy button */}
          <div className="copy-data-container">
            <button onClick={() => setIsDropdownVisible(!isDropdownVisible)}>
              Copy Data
            </button>

            {/* Dropdown menu only appears when the Copy Data button is clicked */}
            {isDropdownVisible && (
              <div className="dropdown-menu">
                <select 
                  value={modelFrom} 
                  onChange={(e) => setModelFrom(Number(e.target.value))}
                >
                  {headers.slice(2).map((_, index) => (
                    <option key={index} value={index + 1}>Model {index + 1}</option>
                  ))}
                </select>
                <select 
                  value={modelTo} 
                  onChange={(e) => setModelTo(Number(e.target.value))}
                >
                  {headers.slice(2).map((_, index) => (
                    <option key={index} value={index + 1}>Model {index + 1}</option>
                  ))}
                </select>
                <button onClick={handleCopyToNextColumn}>Copy</button>
              </div>
            )}
          </div>

          <button onClick={saveData}>Save</button>
          <button id="logout" onClick={handleLogout}>Logout</button>
        </div>
        <HotTable
          ref={hotTableRef}
          settings={hotSettings}
        />
      </div>
    </div>
  );
};

export default App;
