const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

module.exports = async (req, res) => {
  const url = req.query.url;
  console.log(`Received request for /slides with URL: ${url}`);
  const logFilePath = path.join(__dirname, 'log.txt');
  const poolFilePath = path.join(__dirname, 'pool.txt');
  const vrcurlFolderPath = path.join(__dirname, 'vrcurl');

  if (url) {
    try {
      console.log(`Fetching CSV from: ${url}`);
      const response = await axios.get(url);
      const csvData = response.data;
      const lines = csvData.trim().split('\n');
      const lineCount = lines.length;
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] CSV from ${url} has ${lineCount} lines.\n`;

      // Append to the log file
      await fs.appendFile(logFilePath, logEntry, 'utf8');

      // Write each URL to a file in the redirects folder
      for (let i = 0; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 2) {
          const vrcurl = columns[1].trim();
          const vrcurlFilePath = path.join(vrcurlFolderPath, `${i}.txt`);
          await fs.writeFile(vrcurlFilePath, vrcurl, 'utf8');
          console.log(`Wrote ${vrcurl} to ${vrcurlFilePath}`);
        } else {
          console.warn(`Invalid CSV line at index ${i}: ${lines[i]}`);
        }
      }

      // Read the current total from pool.txt
      let currentTotal = 0;
      try {
        const poolData = await fs.readFile(poolFilePath, 'utf8');
        currentTotal = parseInt(poolData, 10) || 0;
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }

      // Update the total and write it back to pool.txt
      const newTotal = currentTotal + lineCount;
      await fs.writeFile(poolFilePath, newTotal.toString(), 'utf8');

      res.send(`Successfully fetched CSV, logged the line count (${lineCount}), and updated the running total (${newTotal}).`);
    } catch (error) {
      console.error('Error processing CSV URL:', error);
      let errorMessage = 'Error processing CSV URL.';
      if (error.response) {
        errorMessage += ` Status: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += ' No response received.';
      } else {
        errorMessage += ` Message: ${error.message}`;
      }
      res.status(500).send(errorMessage);
    }
  } else {
    console.warn('No URL provided in the query parameter.');
    res.status(400).send('No URL provided.');
  }
};