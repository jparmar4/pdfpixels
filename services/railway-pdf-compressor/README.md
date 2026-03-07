# Railway PDF Compressor Service

Ghostscript-powered PDF compression microservice for use with Vercel frontend.

## Deploy on Railway

1. Create a new Railway project from this folder.
2. Ensure Docker deployment is enabled (Dockerfile present).
3. Set env vars:
   - `PDF_COMPRESSOR_TOKEN` = strong random secret
4. Deploy and copy service URL (e.g. `https://pdf-compressor.up.railway.app`).

## Endpoints

- `GET /health`
- `POST /compress` (multipart/form-data, field: `file`)
  - header: `x-api-token: <PDF_COMPRESSOR_TOKEN>`

## Test

```bash
curl -X POST "https://<railway-url>/compress" \
  -H "x-api-token: <token>" \
  -F "file=@sample.pdf" \
  --output compressed.pdf
```
