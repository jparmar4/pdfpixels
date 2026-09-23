import { loadPdfWithTimeout, readAndValidatePdfFile, rejectEncryptedPdf, sanitizeDownloadFileName, validatePdfBuffer, validatePdfUpload } from '@/lib/pdf-api';
import { isGhostscriptMissingError, runGhostscriptWithFallback } from '@/lib/ghostscript';
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

async function compressWithGhostscript(inputPath: string, outputPath: string, profile: CompressionProfile) {
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
    timeoutMs: 30_000,
    timeoutMessage: 'Compression timed out. Please try a smaller PDF.',
  })
  return fs.readFileSync(outputPath)
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
    const srcPdf = await loadPdfWithTimeout(originalBuffer, { ignoreEncryption: true, updateMetadata: false })
    const encrypted = rejectEncryptedPdf(srcPdf)
    if (encrypted) return encrypted
    const originalBytes = new Uint8Array(originalBuffer)

    const strict = !force && !targetKb

    const remoteUrl = process.env.PDF_COMPRESSOR_URL
    const remoteToken = process.env.PDF_COMPRESSOR_TOKEN

    if (remoteUrl && remoteToken) {
      const remoteForm = new FormData()
      remoteForm.append('file', new Blob([originalBytes], { type: 'application/pdf' }), uploadName)
      remoteForm.append('level', levelStr)
      if (force) remoteForm.append('force', '1')

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);

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

          if (!strict || savedPercent >= profile.minimumReduction * 100) {
            return new Response(new Uint8Array(out), {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${downloadName}"`,
                'x-compress-engine': 'railway-gs',
                'x-compress-level': levelStr,
                'x-size-before': String(originalBuffer.length),
                'x-size-after': String(out.length),
                'x-saved-percent': String(savedPercent),
              },
            })
          }

          // Remote succeeded but savings too small — do NOT fall through to local
          return new Response(JSON.stringify({
            error: savedPercent > 0
              ? `Compression only reduced this PDF by ${savedPercent}%. It is likely already optimized. Try a different preset or force download.`
              : 'Compression did not reduce this PDF in a meaningful way. Try Smallest size, or force download the best attempt.',
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
      compressed = await compressWithGhostscript(inputPath, outputPath, profile)
    } catch (error) {
      if (isGhostscriptMissingError(error)) {
        compressed = await compressWithPdfLibFallback(originalBuffer, srcPdf)
        engine = 'local-fallback'
      } else {
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

    if (
      targetKb &&
      engine === 'ghostscript' &&
      levelStr !== 'extreme' &&
      finalBytes.length > targetKb * 1024
    ) {
      try {
        const tighter = await compressWithGhostscript(inputPath, outputPath, compressionProfiles.extreme)
        if (tighter.length < finalBytes.length) {
          finalBytes = tighter.length < originalBuffer.length ? tighter : originalBuffer
          levelStr = 'extreme'
        }
      } catch (retryError) {
        console.error('Target-size recompress failed:', retryError)
      }
    }

    const savedPercent = toSavedPercent(originalBuffer.length, finalBytes.length)
    // For local fallback, always return the file even with minimal savings
    if (strict && savedPercent < profile.minimumReduction * 100 && engine !== 'local-fallback') {
      return new Response(JSON.stringify({
        error: savedPercent > 0
          ? `Compression only reduced this PDF by ${savedPercent}%. It is likely already optimized. Try another preset or force download.`
          : 'Unable to reduce this PDF in a meaningful way. Scanned or image-heavy PDFs compress best with Ghostscript.',
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
        'x-compress-level': levelStr,
        'x-size-before': String(originalBuffer.length),
        'x-size-after': String(finalBytes.length),
        'x-saved-percent': String(savedPercent),
        ...(engine === 'local-fallback'
          ? { 'x-compress-note': 'Ghostscript was unavailable. Images were not recompressed, so a target size could not be met.' }
          : {}),
        ...(targetKb
          ? { 'x-target-kb': String(targetKb), 'x-target-met': String(finalBytes.length <= targetKb * 1024) }
          : {}),
      },
    })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Compression failed'
    if (/timed out|timed-out|timeout|aborted|abort/i.test(message)) {
      return new Response(JSON.stringify({ error: 'Compression timed out. Please try a smaller PDF.' }), {
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
    // Never echo engine internals (Ghostscript stderr, temp paths) to clients.
    return new Response(JSON.stringify({ error: 'Compression failed. Please try a smaller PDF or a different preset.' }), {
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