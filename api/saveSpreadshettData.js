// /api/saveSpreadsheetData.js
const xlsx = require('xlsx');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const jsonData = req.body.data;

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty data provided.' });
    }

    const headers = Object.keys(jsonData[0]);
    const dataArray = jsonData.map(row => headers.map(header => row[header] || ''));

    const worksheet = xlsx.utils.aoa_to_sheet([...dataArray]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    const EXCEL_FILE_PATH = path.join(__dirname, '../Book1.xlsx');
    xlsx.writeFile(workbook, EXCEL_FILE_PATH);

    res.status(200).json({ success: true, message: 'Data saved successfully.' });
  } catch (error) {
    console.error('Error saving Excel file:', error);
    res.status(500).json({ error: 'Error saving Excel file.' });
  }
};
