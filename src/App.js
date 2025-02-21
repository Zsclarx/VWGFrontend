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

    const [hyperformulaInstance] = useState(() =>
      HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' })
    );
    const navigate = useNavigate();

    useEffect(() => {
      const fetchYears = async () => {
        try {
          const response = await fetch("http://localhost:5001/api/getYears");
          const result = await response.json();
          if (response.ok) {
            setYears(result.years); // Assuming response contains an array of years
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
        const response = await fetch(`http://localhost:5001/api/getFiles/${year}`);
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
      setIsEditable(false); // Make the table read-only when a file is selected
      try {
        const response = await fetch(`http://localhost:5001/api/getPBUData/${file}`);
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

    const createNewPBUTemplate = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/getSpreadsheetData`);
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
      const hot = hotTableRef.current.hotInstance;
      const selected = hot.getSelected(); // Get the currently selected cell(s)
      if (!selected || selected.length === 0) {
        alert("No cell selected");
        return;
      }

      const selectedColumn = selected[0][1]; // Get the column index of the selected cell
      if (selectedColumn === undefined) {
        alert("Invalid column selected");
        return;
      }

      const newDataRows = [...dataRows];
      newDataRows.forEach((row) => {
        row[selectedColumn + 1] = row[selectedColumn];
      });
      setDataRows(newDataRows); // Update the table data
    };

    // Save data either in the selected file or a new one
    const saveData = async () => {
      try {
        const fileData = { data: dataRows };
        let url = selectedFile
          ? `http://localhost:5001/api/saveFiles/${selectedYear}/${selectedFile}`
          : `http://localhost:5001/api/saveFiles/${selectedYear}/newFile`;

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
      // Clear localStorage
      localStorage.clear();
      
      // Redirect to the Login page
      navigate('/login');
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
          if (changes && isEditable) { // Only update formulas if editable
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
        // Row highlight logic
        if (highlightRows.includes(row) && col === 1) {
          return { className: 'highlight-row' };
        }
        
        // Column highlight logic
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
          <h3>Files for "{selectedYear}" PBU</h3>
          {files.map((file) => (
            <button key={file} onClick={() => fetchPBUData(file)}>
              {file.replace('.xlsx', '')} {/* Remove .xlsx extension */}
            </button>
          ))}

        </div>

        <div className="main-container">
          <div className="menu">
            <button onClick={exportCSV}>Export PBU</button>
            <button onClick={createNewPBUTemplate}>New PBU Template</button>
            <button onClick={handleCopyToNextColumn}>Copy to Next Column</button>
            <button onClick={saveData}>Save</button> {/* Save button */}
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
