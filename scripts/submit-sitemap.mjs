import https from 'https';

const SITE_URL = 'https://pdfpixels.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const endpoints = [
  { name: 'Google', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}` },
  { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}` },
];

console.log(`Pinging search engines with sitemap: ${SITEMAP_URL}\n`);

endpoints.forEach((endpoint) => {
  https.get(endpoint.url, (res) => {
    if (res.statusCode === 200) {
      console.log(`✅ ${endpoint.name}: Successfully pinged.`);
    } else {
      console.error(`❌ ${endpoint.name}: Failed to ping. Status Code: ${res.statusCode}`);
    }
  }).on('error', (e) => {
    console.error(`❌ ${endpoint.name}: Error pinging. ${e.message}`);
  });
});
