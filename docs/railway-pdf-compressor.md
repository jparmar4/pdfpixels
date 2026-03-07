# Railway PDF Compressor Integration

Use this when deploying frontend on Vercel but requiring strong Ghostscript compression.

## 1) Deploy compressor service

Service folder:
- `services/railway-pdf-compressor`

Deploy this folder to Railway (Dockerfile included).
Set env var on Railway:
- `PDF_COMPRESSOR_TOKEN=<strong-random-secret>`

## 2) Configure Vercel env vars

In Vercel Project → Settings → Environment Variables:

- `PDF_COMPRESSOR_URL=https://<your-railway-service>.up.railway.app`
- `PDF_COMPRESSOR_TOKEN=<same-secret-as-railway>`

## 3) Runtime flow

`/api/pdf/compress` in Next.js now:
1. Tries Railway compressor first (if env vars exist)
2. If Railway fails, falls back to local Ghostscript
3. If Ghostscript unavailable, falls back to pdf-lib rebuild path

## 4) Verify

- Upload image-heavy PDF (e.g., scanned docs)
- Confirm compressed output is significantly smaller than input
- Check logs for route path used (remote/local)
