const axios = require('axios');
const sharp = require('sharp'); 
const { put, get } = require('@vercel/blob');

module.exports = async (req, res) => {
  // Base URL for Vercel Blob Storage
  const baseBlobUrl = 'https://pjottwnmhn5d9djs.public.blob.vercel-storage.com/'; 

  const url = req.query.url;

  if (!url) {
    console.warn('No URL provided in the query parameter.');
    return res.status(400).send('No URL provided.');
  }

  try {
    console.log(`Fetching CSV from: ${url}`);
    const response = await axios.get(url);
    const csvData = response.data;
    const lines = csvData.trim().split('\n');
    const lineCount = lines.length;
    const timestamp = new Date().toISOString();
    // var indexedCSV = '';

    // Prepare JSON slowslide structure
    var slideshowJson = {
      header: {
        name: "Slide Director Deck",
        date: timestamp,
        version: "1.0.0"
      },
      slides: []
    };

    // Read in Slides JSON
    const slidesKey = 'slides.json';
    const slidesUrl = `${baseBlobUrl}${slidesKey}`;
    let slidesJson = {};
    try {
      const slidesResponse = await axios.get(slidesUrl);
      slidesJson = slidesResponse.data;
      console.log(`Successfully fetched slides JSON from: ${slidesUrl}`);
    } catch (err) {
      console.warn(`Failed to fetch slides JSON from ${slidesUrl}. Initializing with an empty structure.`);
      slidesJson = {
        header: {
          name: "Slide Director Slides",
          date: timestamp,
          version: "1.0.0"
        },
        slides: []
      };
    }

    // Store each URL as a blob
    for (let i = 0; i < lines.length; i++) {
      // Split at the first comma to handle cases where the URL contains commas
      const columns = lines[i].split(/,(.+)/); 
      if (columns.length >= 2) {
        const vrcurl = columns[1].trim();

        // Search for vrcurl in the slides JSON
        const existingSlideIndex = slidesJson.slides.findIndex(slide => slide.imageUrl === vrcurl);

        if (existingSlideIndex === -1) {
          // Not found, add a new slide
          console.log(`zzz Adding new slide for ${vrcurl}`);

          const headResponse = await axios.head(vrcurl);
          const contentType = headResponse.headers['content-type'];     
          
          // console.log(`zzz Content-Type: ${contentType} for ${vrcurl}`);

          const imageResponse = await axios.get(vrcurl, { responseType: 'arraybuffer' });
          var imageBuffer = Buffer.from(imageResponse.data);

          // Use sharp to get image metadata
          const metadata = await sharp(imageBuffer).metadata();
          const aspectRatio = metadata.width / metadata.height; //

          // Calculate new width and height while keeping the aspect ratio
          const maxDimension = 2024; // Maximum allowed dimension
          var newWidth = metadata.width;
          var newHeight = metadata.height;

          if (metadata.width > maxDimension || metadata.height > maxDimension) {
            if (metadata.width > metadata.height) {
              newWidth = maxDimension;
              newHeight = Math.round((metadata.height / metadata.width) * maxDimension);
            } else {
              newHeight = maxDimension;
              newWidth = Math.round((metadata.width / metadata.height) * maxDimension);
            }
          }

          if (newWidth !== metadata.width || newHeight !== metadata.height) {
            console.log(`zzz Resizing image from ${metadata.width}x${metadata.height} to ${newWidth}x${newHeight}`);
            // Resize the image to the new dimensions
            const resizedImageBuffer = await sharp(imageBuffer)
            .resize({ width: newWidth, height: newHeight }) // Resize to the calculated dimensions
            .toBuffer(); // Convert the resized image back to a buffer
            imageBuffer = resizedImageBuffer;
            metadata.width = newWidth;
            metadata.height = newHeight;
          }

          const resourceBlobKey = `images/${i}`;
          await put(resourceBlobKey, imageBuffer, {
            access: 'public',
            contentType: contentType,
            allowOverwrite: true,
          });

          // Add a new entry to the slidesJson slides array
          slidesJson.slides.push({
            imageUrl: vrcurl,
            width: metadata.width,
            height: metadata.height,
            title: columns[0].trim(),
            caption: `Slide ${i}`,
            credit: "Unknown"
          });

          // Search for vrcurl in the slides JSON
          const newSlideIndex = slidesJson.slides.findIndex(slide => slide.imageUrl === vrcurl);

          if (newSlideIndex !== -1) {
            slideshowJson.slides.push({
              imageUrl: vrcurl,
              cachedImageUrl: `${baseBlobUrl}images/${newSlideIndex}`,
              cachedImageIndex: newSlideIndex,
              width: metadata.width,
              height: metadata.height,
              title: columns[0].trim(),
              caption: `Slide ${i}`,
              credit: "Unknown"
            });

          } else {
            console.warn(`Failed to find newly added slide for ${vrcurl}`);
          }
        } else {
          console.log(`zzz Reuse existing slide for ${vrcurl}`);
          // Found, update the existing slide
          slideshowJson.slides.push({
            imageUrl: vrcurl,
            cachedImageUrl: `${baseBlobUrl}images/${existingSlideIndex}`,
            cachedImageIndex: existingSlideIndex,
            width: slidesJson.slides[existingSlideIndex].width,
            height: slidesJson.slides[existingSlideIndex].height,
            title: columns[0].trim(),
            caption: `Slide ${i}`,
            credit: "Unknown"
          });
        }
      } else {
        console.warn(`Invalid CSV line at index ${i}: ${lines[i]}`);
        
      }
    }

    // Save the updated slides JSON back to the blob
    await put(slidesKey, JSON.stringify(slidesJson, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });

    // Update the total count in a blob
    const poolKey = 'pool.txt';
    const poolUrl = `${baseBlobUrl}${poolKey}`;
    let currentTotal = 0;

    try {
      const response = await axios.get(poolUrl);
      const poolBlob = response.data;
      if (poolBlob) {
        currentTotal = parseInt(await poolBlob, 10) || 0;
      }
    } catch (err) {
      console.warn(`${poolKey} not found, initializing to 0. : ${err}`);
    }

    const newTotal = currentTotal + lineCount;

    await put(poolKey, newTotal.toString(), { 
      access: 'public' ,
      contentType: 'text/plain',
      allowOverwrite: true
    });

    console.log(`Updated total count saved to blob: ${poolKey}`);

    // Return the VRChat Slide Director Slideshow JSON
    res.send(JSON.stringify(slideshowJson, null, 2));

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
};