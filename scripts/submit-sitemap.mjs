import https from 'https';

// Canonical host (must match SITE_URL in src/lib/seo.ts)
const SITE_URL = 'https://www.pdfpixels.com';
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const INDEXNOW_KEY = 'a3f81c6d9b2e47f5a0c4d8e6b1f3a7c9';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

// Bing's IndexNow endpoint shares submissions across the IndexNow network.
// Note: api.indexnow.org 301-redirects batch POSTs to its marketing site,
// so Bing's endpoint is the reliable one for urlList submissions.
const ENDPOINT = 'https://www.bing.com/indexnow';
const BATCH_SIZE = 40;

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

function postJson(url, payload, redirectsLeft = 3) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const { hostname, path } = new URL(url);
    const req = https.request(
      { hostname, path, method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }, timeout: 30000 },
      (res) => {
        const status = res.statusCode;
        const location = res.headers.location;
        res.resume();
        res.on('end', () => {
          if ([301, 302, 303, 307, 308].includes(status) && location && redirectsLeft > 0) {
            resolve(postJson(new URL(location, url).toString(), payload, redirectsLeft - 1));
          } else {
            resolve(status);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
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
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    try {
      const status = await postJson(ENDPOINT, {
        host: 'www.pdfpixels.com',
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: batch,
      });
      if (status === 200 || status === 202) {
        ok += batch.length;
        console.log(`✅ batch ${Math.floor(i / BATCH_SIZE) + 1}: submitted ${batch.length} URLs (status ${status})`);
      } else {
        failed += batch.length;
        console.error(`❌ batch ${Math.floor(i / BATCH_SIZE) + 1}: status ${status}`);
      }
    } catch (e) {
      failed += batch.length;
      console.error(`❌ batch ${Math.floor(i / BATCH_SIZE) + 1}: ${e.message}`);
    }
  }

  console.log(`\nDone: ${ok} submitted, ${failed} failed.`);
  console.log('\nℹ️  For Google: open Search Console → Sitemaps → submit https://www.pdfpixels.com/sitemap.xml');
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exitCode = 1;
});
