import React, { useState, useEffect, useRef } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import { HyperFormula } from "hyperformula";
import "handsontable/dist/handsontable.full.min.css";
import "./App.css";
import { useNavigate } from "react-router-dom";
import * as Papa from "papaparse";

registerAllModules();

const initialHighlightRows = [
  35, 47, 54, 55, 57, 68, 78, 79, 81, 83, 90, 104, 134, 136, 147, 158, 170,
  183, 197, 212, 224, 235, 247, 267, 269,
];

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
  const [popupContent, setPopupContent] = useState("");
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [row29Sum, setRow29Sum] = useState(0);
  const [hyperformulaInstance] = useState(() =>
    HyperFormula.buildEmpty({ licenseKey: "internal-use-in-handsontable" })
  );
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [highlightRows, setHighlightRows] = useState(initialHighlightRows);
  const [userBrand, setUserBrand] = useState(""); // Added for brand classification
  const navigate = useNavigate();

  // Helper functions (unchanged)
  const getColumnLetter = (colIndex) => {
    let letter = "";
    let temp = colIndex;
    while (temp >= 0) {
      const remainder = temp % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const parseFieldKey = (field_key) => {
    const match = field_key.match(/([A-Z]+)(\d+)/);
    if (match) {
      const colLetter = match[1];
      const rowNum = parseInt(match[2], 10) - 1;
      let colIndex = 0;
      for (let i = 0; i < colLetter.length; i++) {
        colIndex = colIndex * 26 + (colLetter.charCodeAt(i) - 64);
      }
      colIndex -= 1;
      return { row: rowNum, col: colIndex };
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchUserDetails(token);
      fetchYears();
      createNewPBUTemplate();
    }
  }, [navigate]);

  const fetchUserDetails = async (token) => {
    try {
      const response = await fetch("https://vwgbackend.onrender.com/api/getUserDetails", {
        headers: {
          Authorization: token,
        },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const result = await response.json();
      if (response.ok) {
        setUserBrand(result.brand); // Set the brand from backend response
      } else {
        alert(result.error || "Error fetching user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("Error fetching user details");
    }
  };

  const fetchYears = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        "https://vwgbackend.onrender.com/api/getYears",
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const result = await response.json();
      if (response.ok) {
        setYears(result.years);
      } else {
        alert(result.error || "Error fetching years");
      }
    } catch (error) {
      console.error("Error fetching years:", error);
      setYears([]);
    }
  };

  const fetchFiles = async (year) => {
    setSelectedYear(year);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://vwgbackend.onrender.com/api/getFiles/${year}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const result = await response.json();
      if (response.ok) {
        const sortedFiles = result.files.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        const filesWithVersion = sortedFiles.map((file, index) => ({
          ...file,
          displayName: `${year}_version_${index + 1}`,
        }));
        setFiles(filesWithVersion);
      } else {
        alert(result.error || "Error fetching files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      alert("Error fetching files");
    }
    
  };

  const fetchPBUData = async (file) => {
    setSelectedFile(file);
    setIsEditable(false);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `https://vwgbackend.onrender.com/api/getPBUData/${file}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const result = await response.json();
      if (response.ok) {
        const cellData = result.data
          .map((item) => {
            const pos = parseFieldKey(item.field_key);
            if (pos) {
              return { row: pos.row, col: pos.col, value: item.field_value };
            }
            return null;
          })
          .filter((item) => item !== null);

        if (cellData.length > 0) {
          const maxRow = Math.max(...cellData.map((cell) => cell.row)) + 1;
          const maxCol = Math.max(...cellData.map((cell) => cell.col)) + 1;
          const initialData = Array.from({ length: maxRow }, () =>
            Array(maxCol).fill("")
          );
          cellData.forEach((cell) => {
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

          const parsedHighlightRows = Array.isArray(result.highlightRows)
            ? result.highlightRows
            : JSON.parse(result.highlightRows);
          setHighlightRows(parsedHighlightRows || initialHighlightRows);
          setTimeout(() => {
            hotTableRef.current?.hotInstance?.render();
          }, 0);
        } else {
          setDataRows([]);
          setHeaders([]);
          setHighlightRows(initialHighlightRows);
        }
      } else {
        alert(result.error || "Error fetching PBU data");
      }
    } catch (error) {
      console.error("Error fetching PBU data:", error);
      alert("Error fetching PBU data");
    }

  };

  const createNewPBUTemplate = async () => {
    try {
      const response = await fetch(
        "https://vwgbackend.onrender.com/api/getSpreadsheetData"
      );
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
        const initialData = result.data.map((row) =>
          newHeaders.map((header, i) => row[`Column${i + 1}`] || "")
        );
        setDataRows(initialData);
        setHighlightRows(initialHighlightRows);
      } else {
        alert(result.error || "Error fetching template data");
      }
    } catch (error) {
      console.error("Error fetching template data:", error);
      alert("Error fetching template data");
    }

  };

  const saveData = async () => {
    if (row29Sum > 100) {
      alert("Cannot save: Sum of percentages in row 29 exceeds 100");
      return;
    }
    const token = localStorage.getItem("token");
    const jsonData = [];
    dataRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const field_key = getColumnLetter(colIndex) + (rowIndex + 1);
        jsonData.push({ field_key, field_value: cell });
      });
    });
    try {
      const payload = { data: jsonData, highlightRows };
      const response = await fetch("https://vwgbackend.onrender.com/api/saveFiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        if (result.newToken) localStorage.setItem("token", result.newToken);
        fetchYears();
        setIsDraftOpen(false);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert(result.error || "Error saving file");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data");
    }
  };

  const exportCSV = () => {
    const dataToExport = dataRows.map((row) =>
      headers.reduce((obj, header, i) => {
        obj[header] = row[i] || "";
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "https://vwg-frontend-alpha.vercel.app/login";
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

  const handleRowAddition = (index, amount) => {
    setHighlightRows((prevRows) => {
      const updatedRows = prevRows.map((row) =>
        row >= index ? row + amount : row
      );
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
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          backgroundColor: "white",
          border: "1px solid #ccc",
          padding: "5px",
          borderRadius: "3px",
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

  const calculateRow29Sum = () => {
    const hot = hotTableRef.current?.hotInstance;
    if (!hot) return;
    let sum = 0;
    for (let col = 2; col < hot.countCols(); col++) {
      const cellValue = hyperformulaInstance.getCellValue({
        sheet: 0,
        row: 28,
        col,
      });
      if (typeof cellValue === "number") {
        sum += cellValue;
      }
    }
    setRow29Sum(sum);
  };

  const toggleFiles = (year) => {
    if (selectedYear === year) {
      setSelectedYear(null);
    } else {
      fetchFiles(year);
    }
  };

  const saveDraft = async () => {
    const token = localStorage.getItem("token");
    const jsonData = [];
    dataRows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const field_key = getColumnLetter(colIndex) + (rowIndex + 1);
        jsonData.push({ field_key, field_value: cell });
      });
    });
    try {
      const payload = { data: jsonData, highlightRows };
      const response = await fetch("https://vwgbackend.onrender.com/api/saveDraft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        alert("Draft saved successfully");
      } else {
        alert(result.error || "Error saving draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Error saving draft");
    }
  };

  const openDraft = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("https://vwgbackend.onrender.com/api/getDraft", {
        headers: { Authorization: token },
      });
      if (response.status === 404) {
        alert("No draft found");
        return;
      }
      const result = await response.json();
      if (response.ok) {
        const cellData = result.data
          .map((item) => {
            const pos = parseFieldKey(item.field_key);
            return pos ? { row: pos.row, col: pos.col, value: item.field_value } : null;
          })
          .filter((item) => item !== null);

        if (cellData.length > 0) {
          const maxRow = Math.max(...cellData.map((cell) => cell.row)) + 1;
          const maxCol = Math.max(...cellData.map((cell) => cell.col)) + 1;
          const initialData = Array.from({ length: maxRow }, () => Array(maxCol).fill(""));
          cellData.forEach((cell) => {
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
          const parsedHighlightRows = Array.isArray(result.highlightRows)
            ? result.highlightRows
            : initialHighlightRows;
          setHighlightRows(parsedHighlightRows);
          setIsEditable(true);
          setIsDraftOpen(true);
          setTimeout(() => {
            hotTableRef.current?.hotInstance?.render();
          }, 0);
        }
      } else {
        alert(result.error || "Error fetching draft");
      }
    } catch (error) {
      console.error("Error fetching draft:", error);
      alert("Error fetching draft");
    }
  };

  const hotSettings = {
    data: dataRows,
    colHeaders: headers,
    rowHeaders: dataRows.length > 1,
    height: "auto",
    licenseKey: "non-commercial-and-evaluation",
    contextMenu: {
      items: {
        row_above: {},
        row_below: {},
        remove_row: {},
        highlight_row: {
          name: "Highlight Row",
          callback: (key, selection) => {
            const row = selection[0].start.row;
            handleHighlightRow(row);
          },
        },
        unhighlight_row: {
          name: "Unhighlight Row",
          callback: (key, selection) => {
            const row = selection[0].start.row;
            setHighlightRows((prevRows) => prevRows.filter((r) => r !== row));
            setTimeout(() => {
              hotTableRef.current?.hotInstance?.render();
            }, 0);
          },
        },
        col_left: {},
        col_right: {},
        remove_col: {},
        copy: {},
      },
    },
    formulas: {
      engine: hyperformulaInstance,
      sheetName: "Sheet1",
    },
    afterChange: (changes) => {
      if (changes && isEditable) {
        changes.forEach(([row, col, oldVal, newVal]) => {
          if (row === 28 && col >= 2) {
            const parsedValue = parseFloat(newVal);
            const hot = hotTableRef.current.hotInstance;
            if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
              alert("Invalid input: Only numbers between 0 and 100 are allowed.");
              hot.setDataAtCell(row, col, oldVal);
              return;
            }
            const currentSum = row29Sum - (parseFloat(oldVal) || 0);
            if (currentSum + parsedValue > 100) {
              alert("Sum of percentages in row 29 cannot exceed 100.");
              hot.setDataAtCell(row, col, oldVal);
              return;
            }
          }
          hyperformulaInstance.setCellContents(
            { sheet: 0, row, col },
            [[newVal]]
          );
        });
      }
      calculateRow29Sum();
    },
    afterLoadData: calculateRow29Sum,
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
      const cellProperties = {};
      let className = "";
      if (col === 1) {
        if (highlightRows.includes(row)) {
          className += " highlight-row";
        } else {
          className += " highlight-column";
        }
      } else if (col === 0) {
        className += " highlight-column-a";
      }
      if (row === 28 && col >= 2 && row29Sum > 100) {
        className += " sum-exceeds";
      }
      cellProperties.className = className.trim();
      if (!isEditable) {
        cellProperties.readOnly = true;
      } else {
        cellProperties.readOnly = false;
        if (row === 28 && col >= 2) {
          cellProperties.type = "numeric";
          cellProperties.validator = function (value, callback) {
            const num = parseFloat(value);
            callback(!isNaN(num) && num >= 0 && num <= 100);
          };
          cellProperties.allowInvalid = false;
        }
      }
      return cellProperties;
    },
    afterOnCellMouseOver: (event, coords) => {
      const hot = hotTableRef.current.hotInstance;
      const cell = hot.getCell(coords.row, coords.col);
      if (!cell) return;

      const formula = hyperformulaInstance.getCellFormula({
        sheet: 0,
        row: coords.row,
        col: coords.col,
      });

      let content;
      if (formula) {
        content = formula;
      } else {
        const value = hot.getDataAtCell(coords.row, coords.col);
        content = value !== null && value !== undefined ? value.toString() : "";
      }

      if (content) {
        const cellRect = cell.getBoundingClientRect();
        setPopupContent(content);
        setPopupPosition({
          x: cellRect.left + window.scrollX,
          y: cellRect.top + window.scrollY,
        });
      } else {
        setPopupContent("");
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
      
      {years.length > 0 && (
        <>
          <img src={`/${userBrand}.png`} alt="Brand Logo" className="app-logo" />
          <div className="side-nav">
            <h2>PBU</h2>
            <button onClick={openDraft}>Open Draft</button>
            <ul className="year-list">
              {years.map((year) => (
                <li key={year}>
                  <button onClick={() => toggleFiles(year)}>
                    PBU {year}
                  </button>
                  {selectedYear === year && files.length > 0 && (
                    <ul className="file-list">
                      {files.map((file) => (
                        <li key={file.excel_id}>
                          <button onClick={() => fetchPBUData(file.excel_id)}>
                            {file.displayName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <div className="main-container">
        <div className="menu">
          <button onClick={exportCSV}>Export PBU</button>
          <button onClick={createNewPBUTemplate}>New PBU Template</button>
          <div className="copy-data-container">
            <button onClick={() => setIsDropdownVisible(!isDropdownVisible)}>
              Copy Data
            </button>
            {isDropdownVisible && (
              <div
                className="dropdown-menu"
                onMouseOver={(e) => e.stopPropagation()}
              >
                <select
                  value={modelFrom}
                  onChange={(e) => setModelFrom(Number(e.target.value))}
                >
                  {headers.slice(2).map((_, index) => (
                    <option key={index} value={index + 1}>
                      Model {index + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={modelTo}
                  onChange={(e) => setModelTo(Number(e.target.value))}
                >
                  {headers.slice(2).map((_, index) => (
                    <option key={index} value={index + 1}>
                      Model {index + 1}
                    </option>
                  ))}
                </select>
                <button onClick={handleCopyToNextColumn}>Copy</button>
              </div>
            )}
          </div>
          <button onClick={saveDraft}>Save as Draft</button>
          <button onClick={saveData}>Save</button>
          <button id="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <HotTable ref={hotTableRef} settings={hotSettings} />
        <FormulaPopup content={popupContent} position={popupPosition} />
      </div>
    </div>
  );
};

export default App;
