const xlsx = require('xlsx');
const path = require('path');

const EXCEL_FILE_PATH = path.join(__dirname, '../Book1.xlsx');

module.exports = async (req, res) => {
  try {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      return res.status(404).json({ error: 'Excel file not found.' });
    }

    const workbook = xlsx.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    const jsonData = [];

    for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
      const rowData = {};
      for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
        const cellAddress = xlsx.utils.encode_cell({ r: rowNum, c: colNum });
        const cell = worksheet[cellAddress];
        rowData[`Column${colNum + 1}`] = cell ? cell.v : '';
      }
      jsonData.push(rowData);
    }

    res.status(200).json({ data: jsonData });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    res.status(500).json({ error: 'Error reading Excel file.' });
  }
};
