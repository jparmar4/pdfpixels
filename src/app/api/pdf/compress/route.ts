import { loadPdfWithTimeout, readAndValidatePdfFile, rejectEncryptedPdf, sanitizeDownloadFileName, validatePdfBuffer, validatePdfUpload } from '@/lib/pdf-api';
import { runGhostscriptWithFallback } from '@/lib/ghostscript';
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'
// Allow the function to run up to 60 seconds (requires Vercel Pro, fallback to 15s on Hobby)
export const maxDuration = 60

type CompressionLevel = 'extreme' | 'recommended' | 'less'

type CompressionProfile = {
  pdfSettings: '/screen' | '/ebook' | '/printer' | '/prepress'
  colorImageResolution: number
  grayImageResolution: number
  monoImageResolution: number
  jpegQuality: number
  colorDownsampleThreshold: number
  grayDownsampleThreshold: number
  minimumReduction: number
}

// Tuned for readable text + photo quality. Mono stays high to keep scanned text sharp.
const compressionProfiles: Record<CompressionLevel, CompressionProfile> = {
  extreme: {
    pdfSettings: '/screen',
    colorImageResolution: 110,
    grayImageResolution: 110,
    monoImageResolution: 300,
    jpegQuality: 58,
    colorDownsampleThreshold: 1.1,
    grayDownsampleThreshold: 1.1,
    minimumReduction: 0.06,
  },
  recommended: {
    pdfSettings: '/ebook',
    colorImageResolution: 150,
    grayImageResolution: 150,
    monoImageResolution: 300,
    jpegQuality: 76,
    colorDownsampleThreshold: 1.2,
    grayDownsampleThreshold: 1.2,
    minimumReduction: 0.04,
  },
  less: {
    // High quality: prefer print-ready image fidelity
    pdfSettings: '/printer',
    colorImageResolution: 220,
    grayImageResolution: 220,
    monoImageResolution: 400,
    jpegQuality: 88,
    colorDownsampleThreshold: 1.5,
    grayDownsampleThreshold: 1.5,
    minimumReduction: 0.02,
  },
}

function getCompressionProfile(level: string): CompressionProfile {
  if (level === 'extreme' || level === 'less' || level === 'recommended') {
    return compressionProfiles[level]
  }

  return compressionProfiles.recommended
}

async function compressWithGhostscript(inputPath: string, outputPath: string, profile: CompressionProfile, timeoutMs = 45_000) {
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    `-dPDFSETTINGS=${profile.pdfSettings}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    '-dSAFER',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dSubsetFonts=true',
    '-dEmbedAllFonts=true',
    '-dAutoRotatePages=/None',
    // Preserve vector text sharpness; only downsample raster images
    '-dDownsampleColorImages=true',
    '-dColorImageDownsampleType=/Bicubic',
    `-dColorImageResolution=${profile.colorImageResolution}`,
    `-dColorImageDownsampleThreshold=${profile.colorDownsampleThreshold}`,
    '-dDownsampleGrayImages=true',
    '-dGrayImageDownsampleType=/Bicubic',
    `-dGrayImageResolution=${profile.grayImageResolution}`,
    `-dGrayImageDownsampleThreshold=${profile.grayDownsampleThreshold}`,
    '-dDownsampleMonoImages=true',
    '-dMonoImageDownsampleType=/Subsample',
    `-dMonoImageResolution=${profile.monoImageResolution}`,
    '-dMonoImageDownsampleThreshold=1.1',
    '-dAutoFilterColorImages=false',
    '-dColorImageFilter=/DCTEncode',
    '-dAutoFilterGrayImages=false',
    '-dGrayImageFilter=/DCTEncode',
    '-dEncodeColorImages=true',
    '-dEncodeGrayImages=true',
    '-dEncodeMonoImages=true',
    `-dJPEGQ=${profile.jpegQuality}`,
    // Prefer quality-preserving DCT for text-heavy docs
    '-dPassThroughJPEGImages=false',
    '-dFastWebView=true',
    '-dOptimize=true',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ]

  await runGhostscriptWithFallback(args, {
    timeoutMs,
    timeoutMessage: 'Compression timed out. Please try a smaller PDF.',
  })
  if (!fs.existsSync(outputPath)) {
    throw new Error('Ghostscript did not produce an output file')
  }
  return fs.readFileSync(outputPath)
}

/** Scale engine budgets with input size; 50MB scans need more headroom than 1MB text PDFs. */
function engineTimeoutMs(byteLength: number, baseMs: number, maxMs: number) {
  const mb = byteLength / (1024 * 1024)
  if (mb <= 5) return baseMs
  if (mb <= 25) return Math.min(maxMs, baseMs + 15_000)
  return maxMs
}

function toSavedPercent(before: number, after: number) {
  if (before <= 0) return 0
  return Math.max(0, Math.round((1 - after / before) * 1000) / 10)
}

// The remote compressor is a separate service, so never trust its response
// size. Stream with a hard cap instead of buffering an unbounded body.
const REMOTE_MAX_RESPONSE_BYTES = 50 * 1024 * 1024
const REMOTE_MAX_TEXT_BYTES = 32 * 1024

function remoteTooLargeError(): Error {
  return new Error('Remote compressor response was too large.')
}

async function readCappedBytes(resp: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(resp.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw remoteTooLargeError()
  }
  if (!resp.body) {
    const ab = await resp.arrayBuffer()
    if (ab.byteLength > maxBytes) throw remoteTooLargeError()
    return Buffer.from(ab)
  }
  const reader = resp.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value && value.byteLength > 0) {
        total += value.byteLength
        if (total > maxBytes) {
          await reader.cancel().catch(() => undefined)
          throw remoteTooLargeError()
        }
        chunks.push(value)
      }
    }
  } finally {
    reader.releaseLock()
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return Buffer.from(out)
}

async function readCappedText(resp: Response, maxBytes: number): Promise<string> {
  const bytes = await readCappedBytes(resp, maxBytes)
  return bytes.toString('utf8')
}

async function compressWithPdfLibFallback(originalBuffer: Buffer, srcDoc?: PDFDocument) {
  // pdf-lib fallback: rebuilds the PDF structure with object streams
  // This removes unused objects, deduplicates resources, and optimizes the cross-reference table
  const src = srcDoc ?? (await loadPdfWithTimeout(originalBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  }))
  const outDoc = await PDFDocument.create()

  const pages = await outDoc.copyPages(src, src.getPageIndices())
  for (const page of pages) {
    outDoc.addPage(page)
  }

  // Copy metadata from source
  const srcTitle = src.getTitle()
  const srcAuthor = src.getAuthor()
  const srcSubject = src.getSubject()
  const srcCreator = src.getCreator()
  const srcProducer = src.getProducer()
  const srcCreationDate = src.getCreationDate()
  const srcModDate = src.getModificationDate()
  if (srcTitle) outDoc.setTitle(srcTitle)
  if (srcAuthor) outDoc.setAuthor(srcAuthor)
  if (srcSubject) outDoc.setSubject(srcSubject)
  if (srcCreator) outDoc.setCreator(srcCreator)
  if (srcProducer) outDoc.setProducer(srcProducer)
  if (srcCreationDate) outDoc.setCreationDate(srcCreationDate)
  if (srcModDate) outDoc.setModificationDate(srcModDate)

  const bytes = await outDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
    objectsPerTick: 100,
  })

  return Buffer.from(bytes)
}

export async function POST(req: NextRequest) {
  let inputPath = ''
  let outputPath = ''

  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const targetKbRaw = Number(form.get('targetKb'))
    const targetKb = Number.isFinite(targetKbRaw) && targetKbRaw >= 50
      ? Math.min(10 * 1024, Math.round(targetKbRaw))
      : 0
    let levelStr = (form.get('level') as string) || 'recommended'
    if (targetKb) {
      levelStr = targetKb <= 300 ? 'extreme' : targetKb <= 1024 ? 'recommended' : 'less'
    }
    // force=1 returns the best attempt even if savings are small (user choice)
    const force = String(form.get('force') || '') === '1' || String(form.get('force') || '') === 'true'
    const profile = getCompressionProfile(levelStr)

    const validation = validatePdfUpload(file)
    if (!validation.ok) {
      return validation.response
    }
    const upload = file as File
    const uploadName = upload.name || 'input.pdf'
    const baseName = uploadName.replace(/\.pdf$/i, '') || 'document'
    const downloadName = `${sanitizeDownloadFileName(baseName)}-compressed.pdf`

    const read = await readAndValidatePdfFile(upload)
    if (!read.ok) {
      return read.response
    }
    const originalBuffer = read.buffer
    const loadTimeoutMs = engineTimeoutMs(originalBuffer.length, 15_000, 40_000)
    const gsTimeoutMs = engineTimeoutMs(originalBuffer.length, 30_000, 55_000)

    // Encrypted check must not block compression on large scans if pdf-lib
    // is slow/OOM — fail open here and let engines reject bad inputs.
    let srcPdf: Awaited<ReturnType<typeof loadPdfWithTimeout>> | null = null
    try {
      srcPdf = await loadPdfWithTimeout(originalBuffer, { ignoreEncryption: true, updateMetadata: false }, loadTimeoutMs)
      const encrypted = rejectEncryptedPdf(srcPdf)
      if (encrypted) return encrypted
    } catch (loadError) {
      console.error('pdf-lib load during compress (continuing with engines):', loadError)
      const msg = loadError instanceof Error ? loadError.message : ''
      if (/password|encrypt/i.test(msg)) {
        return new Response(JSON.stringify({ error: 'This PDF is password-protected. Unlock it first, then try again.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      // Timeout/parse issues: still attempt remote + Ghostscript below.
    }

    const originalBytes = new Uint8Array(originalBuffer)

    const remoteUrl = process.env.PDF_COMPRESSOR_URL
    const remoteToken = process.env.PDF_COMPRESSOR_TOKEN

    if (remoteUrl && remoteToken) {
      const remoteForm = new FormData()
      remoteForm.append('file', new Blob([originalBytes], { type: 'application/pdf' }), uploadName)
      remoteForm.append('level', levelStr)
      if (force) remoteForm.append('force', '1')

      // Large scanned PDFs routinely need >20s on the remote GS worker.
      const remoteTimeoutMs = engineTimeoutMs(originalBuffer.length, 25_000, 55_000)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), remoteTimeoutMs);

      try {
        const remoteResp = await fetch(`${remoteUrl.replace(/\/$/, '')}/compress`, {
          method: 'POST',
          headers: { 'x-api-token': remoteToken },
          body: remoteForm,
          signal: controller.signal
        })
        clearTimeout(timeoutId);

        if (remoteResp.ok) {
          const candidate = await readCappedBytes(remoteResp, REMOTE_MAX_RESPONSE_BYTES)
          const out = candidate.length < originalBuffer.length ? candidate : originalBuffer
          const magic = validatePdfBuffer(out)
          if (!magic.ok) {
            throw new Error('Remote compressor returned a non-PDF response')
          }
          const savedPercent = toSavedPercent(originalBuffer.length, out.length)

          // Already-optimized PDFs: return the best remote bytes instead of a
          // hard error. Block only when a target size was requested and missed.
          if (targetKb && out.length > targetKb * 1024 && !force) {
            return new Response(JSON.stringify({
              error: `Output is ${Math.round(out.length / 1024)} KB — above the ${targetKb} KB target. Try Smallest size or force download.`,
              before: originalBuffer.length,
              after: out.length,
              savedPercent,
              engine: 'railway-gs',
              canForce: true,
            }), {
              status: 422,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          return new Response(new Uint8Array(out), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${downloadName}"`,
              'x-compress-engine': 'railway-gs',
              'x-compress-level': levelStr,
              'x-size-before': String(originalBuffer.length),
              'x-size-after': String(out.length),
              'x-saved-percent': String(savedPercent),
              ...(savedPercent < 1
                ? { 'x-compress-note': 'This PDF appears already optimized — little or no further size reduction was possible.' }
                : {}),
              ...(targetKb
                ? { 'x-target-kb': String(targetKb), 'x-target-met': String(out.length <= targetKb * 1024) }
                : {}),
            },
          })
        }

        // Explicit remote 422: pass through to client (length-capped).
        if (remoteResp.status === 422) {
          const body = await readCappedText(remoteResp, REMOTE_MAX_TEXT_BYTES)
          return new Response(body, {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const failureBody = await readCappedText(remoteResp.clone(), REMOTE_MAX_TEXT_BYTES).catch(() => '[unreadable]')
        console.error('Remote compressor failed:', remoteResp.status, failureBody)
      } catch (remoteError) {
        clearTimeout(timeoutId);
        console.error('Remote compressor error or timeout:', remoteError);
        // Fallthrough to local compression if remote fails or times out
      }
    }

    const tempDir = os.tmpdir()
    const id = crypto.randomUUID()
    inputPath = path.join(tempDir, `${id}.pdf`)
    outputPath = path.join(tempDir, `${id}-compressed.pdf`)
    await fs.promises.writeFile(inputPath, originalBuffer)

    let compressed: Buffer | null = null
    let engine = 'ghostscript'

    try {
      compressed = await compressWithGhostscript(inputPath, outputPath, profile, gsTimeoutMs)
    } catch (error) {
      // Any Ghostscript failure (missing binary, bad exit, no output) falls
      // back to pdf-lib so large/scanned PDFs still return a usable file.
      console.error('Local Ghostscript compress failed:', error)
      try {
        compressed = await compressWithPdfLibFallback(originalBuffer, srcPdf ?? undefined)
        engine = 'local-fallback'
      } catch (fallbackError) {
        console.error('pdf-lib compress fallback failed:', fallbackError)
        throw error
      }
    }

    if (!compressed) {
      throw new Error('Compression failed')
    }

    // Prefer the smaller of compressed vs original when forced
    let finalBytes = compressed
    if (compressed.length >= originalBuffer.length) {
      finalBytes = originalBuffer
    }

    // First pass under-saved: auto-retry Extreme (110 DPI / JPEG 58) before failing.
    // Scanned PDFs already near 150 DPI barely move under Recommended.
    let activeLevel = levelStr
    const minSave = profile.minimumReduction * 100
    if (
      engine === 'ghostscript' &&
      activeLevel !== 'extreme' &&
      toSavedPercent(originalBuffer.length, finalBytes.length) < minSave
    ) {
      try {
        const tighter = await compressWithGhostscript(inputPath, outputPath, compressionProfiles.extreme, gsTimeoutMs)
        if (tighter.length < finalBytes.length) {
          finalBytes = tighter.length < originalBuffer.length ? tighter : originalBuffer
          activeLevel = 'extreme'
        }
      } catch (retryError) {
        console.error('Extreme recompress failed:', retryError)
      }
    }

    if (
      targetKb &&
      engine === 'ghostscript' &&
      activeLevel !== 'extreme' &&
      finalBytes.length > targetKb * 1024
    ) {
      try {
        const tighter = await compressWithGhostscript(inputPath, outputPath, compressionProfiles.extreme, gsTimeoutMs)
        if (tighter.length < finalBytes.length) {
          finalBytes = tighter.length < originalBuffer.length ? tighter : originalBuffer
          activeLevel = 'extreme'
        }
      } catch (retryError) {
        console.error('Target-size recompress failed:', retryError)
      }
    }

    const savedPercent = toSavedPercent(originalBuffer.length, finalBytes.length)
    // Already-optimized PDF: return the best bytes we have instead of a hard
    // error. Client shows a clear "already optimized" toast for <1% savings.
    // Only block when the user asked for a target size and we missed it.
    if (targetKb && finalBytes.length > targetKb * 1024 && !force) {
      return new Response(JSON.stringify({
        error: `Output is ${Math.round(finalBytes.length / 1024)} KB — above the ${targetKb} KB target. Try Smallest size or force download.`,
        before: originalBuffer.length,
        after: finalBytes.length,
        savedPercent,
        engine,
        canForce: true,
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(new Uint8Array(finalBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'x-compress-engine': engine,
        'x-compress-level': activeLevel,
        'x-size-before': String(originalBuffer.length),
        'x-size-after': String(finalBytes.length),
        'x-saved-percent': String(savedPercent),
        ...(engine === 'local-fallback'
          ? { 'x-compress-note': 'Ghostscript was unavailable. Images were not recompressed, so a target size could not be met.' }
          : savedPercent < 1
            ? { 'x-compress-note': 'This PDF appears already optimized — little or no further size reduction was possible.' }
            : {}),
        ...(targetKb
          ? { 'x-target-kb': String(targetKb), 'x-target-met': String(finalBytes.length <= targetKb * 1024) }
          : {}),
      },
    })
  } catch (err) {
    console.error('Compress PDF failed:', err)
    const message = err instanceof Error ? err.message : 'Compression failed'
    if (/timed out|timed-out|timeout|aborted|abort/i.test(message)) {
      return new Response(JSON.stringify({ error: 'Compression timed out. Please try a smaller PDF or Smallest size preset.' }), {
        status: 408,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (/too large/i.test(message)) {
      return new Response(JSON.stringify({ error: message }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (/encrypted|password/i.test(message)) {
      return new Response(JSON.stringify({ error: 'This PDF is password-protected. Unlock it first, then try again.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    // Never echo engine internals (Ghostscript stderr, temp paths) to clients.
    return new Response(JSON.stringify({ error: 'Compression failed. Please try a different preset, or Smallest size for large scans.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    try {
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
    } catch { /* ignore cleanup errors */ }
    try {
      if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    } catch { /* ignore cleanup errors */ }
  }
}