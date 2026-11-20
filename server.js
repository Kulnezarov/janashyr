import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const root = import.meta.dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp'};
http.createServer(async (req,res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = ['/assets/digital-assistance.webp','/assets/community-organizers.webp','/desktop.css','/profiles.js','/cleanup.js','/home-chat.js','/education-hub.js','/education-hub.css','/digital-hub.js','/digital-hub.css','/donor-hub.css','/project-info.js','/project-info.css','/landing-sections.js','/assets/support-portraits.webp','/assets/support-evening.webp','/assets/volunteer-evening.webp','/app.js','/content.js','/support.js','/support-content.js','/donor.js','/donor-content.js','/access.js','/access-content.js','/city.js','/city-content.js','/ui.js','/styles.css','/design-system.css','/navbar-hero.css','/assets/hero-kazakhstan.png','/assets/kitten-logo.png','/assets/care-logo.png','/assets/community-portraits.png','/assets/card-support.png','/assets/card-donation.png','/assets/card-access.png','/assets/card-city.png'].includes(path) ? path.slice(1) : 'index.html';
  try { const data = await readFile(join(root,file)); res.writeHead(200,{'Content-Type':types[extname(file)],'X-Content-Type-Options':'nosniff'}); res.end(data); }
  catch { res.writeHead(404); res.end('Not found'); }
}).listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`JANASHYR: http://localhost:${process.env.PORT || 3000}`));
