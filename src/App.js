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
  const [isEditable, setIsEditable] = useState(true);
  const [modelFrom, setModelFrom] = useState(1);
  const [modelTo, setModelTo] = useState(2);
  const [popupContent, setPopupContent] = useState('');
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [hyperformulaInstance] = useState(() =>
    HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' })
  );
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const navigate = useNavigate();

  // Helper function to convert column index to letter (e.g., 0 -> "A", 1 -> "B")
  const getColumnLetter = (colIndex) => {
    let letter = '';
    let temp = colIndex;
    while (temp >= 0) {
      const remainder = temp % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Helper function to parse field_key to row and column indices (e.g., "A1" -> {row: 0, col: 0})
  const parseFieldKey = (field_key) => {
    const match = field_key.match(/([A-Z]+)(\d+)/);
    if (match) {
      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10) - 1; // rows are 1-based
      let colIndex = 0;
      for (let i = 0; i < colLetter.length; i++) {
        colIndex = colIndex * 26 + (colLetter.charCodeAt(i) - 64);
      }
      colIndex -= 1; // since A is 0
      return { row: rowNum, col: colIndex };
    }
    return null;
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchYears();
      createNewPBUTemplate();
    }
  }, [navigate]);

  // Fetch years with authentication
  const fetchYears = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch("https://vwgbackend.onrender.com/api/getYears", {
        headers: {
          'Authorization': token
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const result = await response.json();
      if (response.ok) {
        setYears(result.years);
      } else {
        alert(result.error || 'Error fetching years');
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      setYears([2020, 2021, 2022, 2023, 2024, 2025]); // Fallback
    }
  };

  // Fetch files for a specific year with authentication
  const fetchFiles = async (year) => {
    setSelectedYear(year);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://vwgbackend.onrender.com/api/getFiles/${year}`, {
        headers: {
          'Authorization': token
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const result = await response.json();
      if (response.ok) {
        // Sort files by created_at to determine the order
        const sortedFiles = result.files.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Assign a version number to each file
        const filesWithVersion = sortedFiles.map((file, index) => ({
          ...file,
          displayName: `${year}_version_${index + 1}`
        }));
        setFiles(filesWithVersion);
      } else {
        alert(result.error || 'Error fetching files');
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      alert("Error fetching files");
    }
  };

  // Fetch PBU data with authentication and reconstruct 2D array
  const fetchPBUData = async (file) => {
    setSelectedFile(file);
    setIsEditable(false);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://vwgbackend.onrender.com/api/getPBUData/${file}`, {
        headers: {
          'Authorization': token
        }
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const result = await response.json();
      if (response.ok) {
        const cellData = result.data.map(item => {
          const pos = parseFieldKey(item.field_key);
          if (pos) {
            return { row: pos.row, col: pos.col, value: item.field_value };
          }
          return null;
        }).filter(item => item !== null);

        if (cellData.length > 0) {
          const maxRow = Math.max(...cellData.map(cell => cell.row)) + 1;
          const maxCol = Math.max(...cellData.map(cell => cell.col)) + 1;
          const initialData = Array.from({ length: maxRow }, () => Array(maxCol).fill(''));
          cellData.forEach(cell => {
            initialData[cell.row][cell.col] = cell.value;
          });
          setDataRows(initialData);
          const newHeaders = [];
          for (let i = 0; i < maxCol; i++) {
            if (i === 0) newHeaders.push("Code");
            else if (i === 1) newHeaders.push("Parameters");
            else newHeaders.push(`Model ${i - 1}`);
          }
          setHeaders(newHeaders);
        } else {
          setDataRows([]);
          setHeaders([]);
        }
      } else {
        alert(result.error || 'Error fetching PBU data');
      }
    } catch (error) {
      console.error("Error fetching PBU data:", error);
      alert("Error fetching PBU data");
    }
  };

  // Create new PBU template (public endpoint, no auth needed)
  const createNewPBUTemplate = async () => {
    try {
      const response = await fetch("https://vwgbackend.onrender.com/api/getSpreadsheetData");
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
      } else {
        alert(result.error || 'Error fetching template data');
      }
    } catch (error) {
      console.error("Error fetching template data:", error);
      alert("Error fetching template data");
    }
  };

  // Save data with authentication and transform to backend format
  const saveData = async () => {
    const token = localStorage.getItem('token');
    const jsonData = [];
    dataRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const field_key = getColumnLetter(colIndex) + (rowIndex + 1);
        jsonData.push({ field_key, field_value: cell });
      });
    });
    try {
      const response = await fetch("https://vwgbackend.onrender.com/api/saveFiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({ data: jsonData })
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert(result.error || "Error saving file");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data");
    }
  };

  // Export CSV
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

  // Handle logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = 'https://vwg-frontend-alpha.vercel.app/login';
  };

  // Handle copy to next column
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

  const [highlightRows, setHighlightRows] = useState([
    34, 46, 53, 54, 56, 67, 77, 78, 80, 82, 89, 103, 133, 135, 146, 157, 169, 182, 196, 211, 223, 234, 246, 266, 268
  ]);

  const handleRowAddition = (index, amount) => {
    setHighlightRows((prevRows) => {
      const updatedRows = prevRows.map((row) => (row >= index ? row + amount : row));
      setTimeout(() => {
        hotTableRef.current?.hotInstance?.render();
      }, 0);
      return updatedRows;
    });
  };

  const handleRowDeletion = (index, amount) => {
    setHighlightRows((prevRows) => {
      const updatedRows = prevRows
        .map((row) => (row >= index ? row - amount : row))
        .filter((row) => row >= 0);
      setTimeout(() => {
        hotTableRef.current?.hotInstance?.render();
      }, 0);
      return updatedRows;
    });
  };

  const FormulaPopup = ({ content, position }) => {
    if (!content) return null;
    return (
      <div 
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '5px',
          borderRadius: '3px',
          zIndex: 1000,
        }}
      >
        {content}
      </div>
    );
  };

  const handleHighlightRow = (row) => {
    setHighlightRows((prevRows) => {
      if (prevRows.includes(row)) return prevRows;
      return [...prevRows, row];
    });
    setTimeout(() => {
      hotTableRef.current?.hotInstance?.render();
    }, 0);
  };

  const hotSettings = {
    data: dataRows,
    colHeaders: headers,
    rowHeaders: dataRows.length > 1,
    height: 'auto',
    licenseKey: 'non-commercial-and-evaluation',
    contextMenu: {
      items: {
        "row_above": {},
        "row_below": {},
        "remove_row": {},
        "highlight_row": {
          name: 'Highlight Row',
          callback: (key, selection) => {
            const row = selection[0].start.row;
            handleHighlightRow(row);
          }
        },
        "unhighlight_row": {
          name: 'Unhighlight Row',
          callback: (key, selection) => {
            const row = selection[0].start.row;
            setHighlightRows((prevRows) => prevRows.filter(r => r !== row));
            setTimeout(() => {
              hotTableRef.current?.hotInstance?.render();
            }, 0);
          }
        },
        "col_left": {},
        "col_right": {},
        "remove_col": {},
        "copy": {},
      }
    },
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
    afterCreateRow: (index, amount) => {
      handleRowAddition(index, amount);
    },
    afterRemoveRow: (index, amount) => {
      handleRowDeletion(index, amount);
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
    afterOnCellMouseOver: (event, coords) => {
      const hot = hotTableRef.current.hotInstance;
      const cell = hot.getCell(coords.row, coords.col);
      if (!cell) return; // Exit if the cell doesn’t exist
  
      // Get the formula from HyperFormula
      const formula = hyperformulaInstance.getCellFormula({ sheet: 0, row: coords.row, col: coords.col });
  
      let content;
      if (formula) {
        // If a formula exists, use it as the popup content
        content = formula;
      } else {
        // Otherwise, use the cell’s value
        const value = hot.getDataAtCell(coords.row, coords.col);
        content = value !== null && value !== undefined ? value.toString() : '';
      }
  
      // Set popup content and position
      if (content) {
        const cellRect = cell.getBoundingClientRect();
        setPopupContent(content);
        setPopupPosition({ x: cellRect.left + window.scrollX, y: cellRect.bottom + window.scrollY });
      } else {
        setPopupContent(''); // Hide popup if no content
      }
    },
    minSpareRows: 1,
    minSpareCols: 0,
    rowHeight: 25,
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
          <button key={file.excel_id} onClick={() => fetchPBUData(file.excel_id)}>
            {file.displayName}
          </button>
        ))}
      </div>
      <div className="main-container">
        <div className="menu">
          <button onClick={exportCSV}>Export PBU</button>
          <button onClick={createNewPBUTemplate}>New PBU Template</button>
          <div className="copy-data-container">
            <button onClick={() => setIsDropdownVisible(!isDropdownVisible)}>
              Copy Data
            </button>
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
        <FormulaPopup content={popupContent} position={popupPosition} />
      </div>
    </div>
  );
};

export default App;