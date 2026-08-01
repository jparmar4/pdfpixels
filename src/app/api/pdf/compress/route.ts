import { loadPdfWithTimeout, readAndValidatePdfFile, validatePdfUpload } from '@/lib/pdf-api';
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
    timeoutMs: 45_000,
    timeoutMessage: 'Compression timed out. Please try a smaller PDF.',
  })
  return fs.readFileSync(outputPath)
}

function toSavedPercent(before: number, after: number) {
  if (before <= 0) return 0
  return Math.max(0, Math.round((1 - after / before) * 1000) / 10)
}

async function compressWithPdfLibFallback(originalBuffer: Buffer) {
  // pdf-lib fallback: rebuilds the PDF structure with object streams
  // This removes unused objects, deduplicates resources, and optimizes the cross-reference table
  const srcDoc = await loadPdfWithTimeout(originalBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  })
  const outDoc = await PDFDocument.create()

  const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices())
  for (const page of pages) {
    outDoc.addPage(page)
  }

  // Copy metadata from source
  const srcTitle = srcDoc.getTitle()
  const srcAuthor = srcDoc.getAuthor()
  const srcSubject = srcDoc.getSubject()
  const srcCreator = srcDoc.getCreator()
  const srcProducer = srcDoc.getProducer()
  const srcCreationDate = srcDoc.getCreationDate()
  const srcModDate = srcDoc.getModificationDate()
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
    const levelStr = (form.get('level') as string) || 'recommended'
    // force=1 returns the best attempt even if savings are small (user choice)
    const force = String(form.get('force') || '') === '1' || String(form.get('force') || '') === 'true'
    const profile = getCompressionProfile(levelStr)

    const validation = validatePdfUpload(file)
    if (!validation.ok) {
      return validation.response
    }
    const upload = file as File
    const uploadName = upload.name || 'input.pdf'

    const read = await readAndValidatePdfFile(upload)
    if (!read.ok) {
      return read.response
    }
    const originalBuffer = read.buffer
    const originalBytes = new Uint8Array(originalBuffer)

    const strict = !force

    const remoteUrl = process.env.PDF_COMPRESSOR_URL
    const remoteToken = process.env.PDF_COMPRESSOR_TOKEN

    if (remoteUrl && remoteToken) {
      const remoteForm = new FormData()
      remoteForm.append('file', new Blob([originalBytes], { type: 'application/pdf' }), uploadName)
      remoteForm.append('level', levelStr)
      if (force) remoteForm.append('force', '1')

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 58_000);

      try {
        const remoteResp = await fetch(`${remoteUrl.replace(/\/$/, '')}/compress`, {
          method: 'POST',
          headers: { 'x-api-token': remoteToken },
          body: remoteForm,
          signal: controller.signal
        })
        clearTimeout(timeoutId);

        if (remoteResp.ok) {
          const ab = await remoteResp.arrayBuffer()
          const out = Buffer.from(ab)
          const savedPercent = toSavedPercent(originalBuffer.length, out.length)

          if (!strict || savedPercent >= profile.minimumReduction * 100) {
            return new Response(new Uint8Array(out), {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="compressed.pdf"',
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

        // Explicit remote 422: pass through to client
        if (remoteResp.status === 422) {
          const body = await remoteResp.text()
          return new Response(body, {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        console.error('Remote compressor failed:', remoteResp.status, await remoteResp.text())
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
    fs.writeFileSync(inputPath, originalBuffer)

    let compressed: Buffer | null = null
    let engine = 'ghostscript'

    try {
      compressed = await compressWithGhostscript(inputPath, outputPath, profile)
    } catch (error) {
      const message = `${(error as Error)?.message || ''}`
      if (isGhostscriptMissingError(error) || message.toLowerCase().includes('ghostscript')) {
        compressed = await compressWithPdfLibFallback(originalBuffer)
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
    if (compressed.length >= originalBuffer.length && engine === 'local-fallback') {
      finalBytes = originalBuffer
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
        'Content-Disposition': 'attachment; filename="compressed.pdf"',
        'x-compress-engine': engine,
        'x-compress-level': levelStr,
        'x-size-before': String(originalBuffer.length),
        'x-size-after': String(finalBytes.length),
        'x-saved-percent': String(savedPercent),
      },
    })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Compression failed'
    const status = message.includes('timed out') ? 408 : 500
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  } finally {
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
  }
}