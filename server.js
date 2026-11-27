import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const root = import.meta.dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = ['/assets/digital-assistance.webp','/assets/community-organizers.webp','/desktop.css','/editorial.css','/assets/lora-display.woff2','/profiles.js','/booking.js','/cleanup.js','/city-participation.js','/city-report-data.js','/city-reports.js','/city.css','/home-chat.js','/education-hub.js','/education-data.js','/education-lessons.js','/education-hub.css','/digital-hub.js','/digital-hub.css','/donor-hub.css','/project-info.js','/project-info.css','/landing-sections.js','/assets/support-portraits.webp','/assets/support-evening.webp','/assets/volunteer-evening.webp','/app.js','/content.js','/support.js','/support-content.js','/donor.js','/donor-booking.js','/donor-booking-data.js','/donor-qr.js','/donor-content.js','/access.js','/api-keys.js','/route-core.js','/route-storage.js','/route-copy.js','/route-leaflet.js','/route-planner.js','/route-planner.css','/access-content.js','/city.js','/city-content.js','/ui.js','/styles.css','/design-system.css','/navbar-hero.css','/assets/hero-kazakhstan.webp','/assets/kitten-logo.png','/assets/care-logo.webp','/assets/community-portraits.webp','/assets/card-support.webp','/assets/card-donation.webp','/assets/card-access.webp','/assets/card-city.webp'].includes(path) ? path.slice(1) : 'index.html';
  try { const data = await readFile(join(root,file)); res.writeHead(200,{'Content-Type':types[extname(file)],'X-Content-Type-Options':'nosniff'}); res.end(data); }
  catch { res.writeHead(404); res.end('Not found'); }
}).listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`JANASHYR: http://localhost:${process.env.PORT || 3000}`));
