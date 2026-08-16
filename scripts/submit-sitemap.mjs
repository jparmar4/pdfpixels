import https from 'https';

// Canonical host (must match SITE_URL in src/lib/seo.ts)
const SITE_URL = 'https://www.pdfpixels.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const INDEXNOW_KEY = 'a3f81c6d9b2e47f5a0c4d8e6b1f3a7c9';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const { hostname, path } = new URL(url);
    const req = https.request(
      { hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }, timeout: 30000 },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`Fetching sitemap: ${SITEMAP_URL}\n`);

  const xml = await fetchText(SITEMAP_URL);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Found ${urls.length} URLs in sitemap.\n`);

  // IndexNow covers Bing, Yandex, Naver, Seznam and other participating engines.
  // Google is NOT part of IndexNow - submit the sitemap in Google Search Console
  // (Sitemaps section) instead; Google retired its public /ping endpoint in 2023.
  try {
    const status = await postJson('https://api.indexnow.org/indexnow', {
      host: 'www.pdfpixels.com',
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList: urls,
    });
    if (status === 200 || status === 202) {
      console.log(`✅ IndexNow: submitted ${urls.length} URLs (Bing, Yandex, and partners). Status ${status}.`);
    } else {
      console.error(`❌ IndexNow: unexpected status ${status}.`);
    }
  } catch (e) {
    console.error(`❌ IndexNow: ${e.message}`);
  }

  console.log('\nℹ️  For Google: open Search Console → Sitemaps → submit https://www.pdfpixels.com/sitemap.xml');
  console.log('   (run this script AFTER deploying so the URLs and key file are live)');
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exitCode = 1;
});
