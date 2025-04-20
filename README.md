# NeoJolly - Slide Director

A node.js server to redirect urls from VRChat to desired endpoints. Configured from a text file.

## Tech

- Vercel Serverless Functions
  - Reads a csv file that describes the slideshow
  - Cachies images as Blob
  - Downsized images to 2048x2048 or less while maintaining aspect ratio
  - Records cache metadata to help revent excess work
- Vercel Blob Storage
  - Caches images for use by VRChat

## Slideshow CSV Text File

Each row represents one slide

- Caption
- URL of Image
  - URL can include commas in it's path

### vercel dev (local)

vercel dev

http://localhost:3000/assets/slide-director.jpg
http://localhost:3000/vrcurl/0
http://localhost:3000/assets/images/0
http://localhost:3000/assets/slide-director.jpg
http://localhost:3000/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv

### vercel --prod (remote)

vercel --prod

https://slide-director.vercel.app/assets/slide-director.jpg
https://slide-director.vercel.app/vrcurl/0
https://slide-director.vercel.app/assets/slide-director.jpg
https://slide-director.vercel.app/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv

## Tasks

- Fix: pool allocation for images. Preserve already loaded, allocate round-robin style

- Feature: Change slideshow text file form CSV to JSON
  - Add richer metadata
    - Credit
    - Title
    - Caption
    - InfoURL
- Feature: add multi-client pooling
- Feature: re-add image redirects if/when VRChat allows redirects on images
