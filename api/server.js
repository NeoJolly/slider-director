const express = require('express');
const path = require('path'); // Import the 'path' module
const fs = require('fs').promises; // Use the promises API for cleaner async/await
const axios = require('axios'); // For making HTTP requests
const helmet = require('helmet'); // For securing HTTP headers
const rateLimit = require('express-rate-limit'); // For rate limiting
const app = express();
const port = 3000; // You can choose a different port
const logFilePath = path.join(__dirname, 'log.txt'); // Define the log file path

app.use(helmet()); // Use helmet middleware for security

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/slides', limiter); // Apply rate limiting to the /slides endpoint

// Endpoint to handle logging
app.get('/slides', async (req, res) => {
  const url = req.query.url;
  const poolFilePath = path.join(__dirname, 'pool.txt'); // Define the pool file path
  const vrcurlFolderPath = path.join(__dirname, 'vrcurl'); // Define the redirects folder path

  if (url) {
    try {
      console.log(`Fetching CSV from: ${url}`);
      const response = await axios.get(url);
      const csvData = response.data;
      const lines = csvData.trim().split('\n');
      const lineCount = csvData.trim().split('\n').length;
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] CSV from ${url} has ${lineCount} lines.\n`;

      // Append to the log file
      await fs.appendFile(logFilePath, logEntry, 'utf8');

      // Write each URL to a file in the redirects folder
      for (let i = 0; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length >= 2) {
          const vrcurl = columns[1].trim(); // Extract the URL
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
        currentTotal = parseInt(poolData, 10) || 0; // Parse the total or default to 0
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err; // Rethrow if it's not a "file not found" error
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
    res.status(400).send('No URL provided.');
  }
});

// Middleware to handle dynamic redirects
app.use(async (req, res, next) => {
  // If the URL starts with '/vrcurl', remove it
  if (req.url.startsWith('/vrcurl')) {
    req.url = req.url.replace('/vrcurl', '');
  }

  const vrcurlFilePath = path.join(__dirname, 'vrcurl', `${req.url}.txt`); // Construct the file path

  try {
      // Read the URL from the corresponding file
      const targetUrl = await fs.readFile(vrcurlFilePath, 'utf8');
      const trimmedUrl = targetUrl.trim(); // Trim any extra whitespace or newlines

      if (trimmedUrl) {
          console.log(`Redirecting ${req.url} to ${trimmedUrl}`);
          res.setHeader('Cache-Control', 'no-store'); // Prevent caching
          res.redirect(301, trimmedUrl); // 301 is a permanent redirect
      } else {
          console.warn(`Redirect file for ${req.url} is empty.`);
          res.status(404).send('Redirect file is empty.');
      }
  } catch (err) {
      if (err.code === 'ENOENT') {
          // File not found, pass to the next middleware
          next();
      } else {
          // Log other errors and respond with a 500 status
          console.error(`Error reading redirect file for ${req.url}:`, err);
          res.status(500).send('Internal Server Error.');
      }
  }
});

// Serve static files from a specific directory
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Handle 404 for non-redirected and non-static requests
app.use((req, res) => {
  res.status(404).send('Lost and Not Found');
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});