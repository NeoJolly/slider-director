const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  // Extract the dynamic part of the URL (e.g., /vrcurl/0 -> 0)
  const vrcurlId = req.url.replace('/vrcurl/', '');
  const vrcurlFilePath = path.join(__dirname, 'vrcurl', `${vrcurlId}.txt`);

  try {
    // Read the target URL from the corresponding file
    const targetUrl = await fs.readFile(vrcurlFilePath, 'utf8');
    const trimmedUrl = targetUrl.trim(); // Remove any extra whitespace or newlines

    if (trimmedUrl) {
      console.log(`Redirecting /vrcurl/${vrcurlId} to ${trimmedUrl}`);
      res.setHeader('Cache-Control', 'no-store'); // Prevent caching
      res.redirect(301, trimmedUrl); // 301 is a permanent redirect
    } else {
      console.warn(`Redirect file for /vrcurl/${vrcurlId} is empty.`);
      res.status(404).send('Redirect file is empty.');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File not found
      console.warn(`Redirect file for /vrcurl/${vrcurlId} not found.`);
      res.status(404).send('Redirect file not found.');
    } else {
      // Log other errors and respond with a 500 status
      console.error(`Error reading redirect file for /vrcurl/${vrcurlId}:`, err);
      res.status(500).send('Internal Server Error.');
    }
  }
};