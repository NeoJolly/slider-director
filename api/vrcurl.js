const axios = require('axios');

module.exports = async (req, res) => {
  // Base URL for Vercel Blob Storage
  const baseBlobUrl = 'https://pjottwnmhn5d9djs.public.blob.vercel-storage.com/'; 

  // Extract the dynamic part of the URL (e.g., /vrcurl/0 -> 0)
  const vrcurlId = req.url.replace('/vrcurl/', '');
  // const vrcurlIdFind = req.url.match(/\/vrcurl\/(\d+)\.jpg/);

  console.log(`zzz vrcurlId: ${vrcurlId}`);

  const vrcurlKey = `vrcurl/${vrcurlId}.txt`;

  try {
    // Fetch the blob from Vercel Blob Storage
    const vrcurlUrl = `${baseBlobUrl}${vrcurlKey}`;
    const response = await axios.get(vrcurlUrl);
    const targetUrl = response.data.trim();

      if (targetUrl) {
        console.log(`Redirecting /vrcurl/${vrcurlId} to ${targetUrl}`);
        res.setHeader('Cache-Control', 'no-store');
        res.redirect(301, targetUrl);
      } else {
        console.warn(`Blob for /vrcurl/${vrcurlId} is empty.`);
        res.status(404).send('Redirect blob is empty.');
      }
  } catch (err) {
    console.error(`Error fetching blob for /vrcurl/${vrcurlId}:`, err);
    res.status(500).send('Internal Server Error.');
  }
};
