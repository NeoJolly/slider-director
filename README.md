# NeoJolly - Slide Director

A node.js server to redirect urls from VRChat to desired endpoints. Configured from a text file.

## Slideshow Text File

Each row represents one slide

- Caption
- URL of Image

## Endpoints redirects

/0

https://slide-director.vercel.app/vrcurl/0

### Static Files

/assets/slide-director.jpg

https://slide-director.vercel.app/assets/slide-director.jpg

### Server Functions

/slides/url=https://.txt

http://localhost:3000/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv

https://slide-director.vercel.app/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv

https://slide-director-3ekgh9ocu-neojollys-projects.vercel.app/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv

http://localhost:3000/api/server.js/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv

### vercel dev (local)

http://localhost:3000/vrcurl/0
http://localhost:3000/assets/slide-director.jpg
http://localhost:3000/slides?url=https://neojolly.github.io/home/showtime/paintings/slides.csv


## Start Server Locally

npm install
node server.js

## Storage

This project uses [Vercel Redis](https://vercel.com/docs/redis) for storing:
- Slide URLs (e.g., `vrcurl:0`, `vrcurl:1`, etc.).
- Logs (e.g., `log:<timestamp>`).

### Environment Variables
- `REDIS_URL`: The Redis instance URL.
- `REDIS_TOKEN`: The authentication token for Redis.