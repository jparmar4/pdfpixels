import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
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
  pdfSettings: '/screen' | '/ebook' | '/printer'
  colorImageResolution: number
  grayImageResolution: number
  monoImageResolution: number
  jpegQuality: number
  minimumReduction: number
}

const compressionProfiles: Record<CompressionLevel, CompressionProfile> = {
  extreme: {
    pdfSettings: '/screen',
    colorImageResolution: 96,
    grayImageResolution: 96,
    monoImageResolution: 200,
    jpegQuality: 52,
    minimumReduction: 0.08,
  },
  recommended: {
    pdfSettings: '/ebook',
    colorImageResolution: 144,
    grayImageResolution: 144,
    monoImageResolution: 300,
    jpegQuality: 68,
    minimumReduction: 0.05,
  },
  less: {
    pdfSettings: '/printer',
    colorImageResolution: 200,
    grayImageResolution: 200,
    monoImageResolution: 300,
    jpegQuality: 82,
    minimumReduction: 0.03,
  },
}

function getCompressionProfile(level: string): CompressionProfile {
  if (level === 'extreme' || level === 'less' || level === 'recommended') {
    return compressionProfiles[level]
  }

  return compressionProfiles.recommended
}

function getGhostscriptCandidates() {
  const configured = process.env.GHOSTSCRIPT_PATH?.trim()

  if (os.platform() !== 'win32') {
    return [configured, 'gs'].filter(Boolean) as string[]
  }

  const programFiles = process.env.ProgramFiles || 'C:\\Program Files'
  const gsRoot = path.join(programFiles, 'gs')
  const discovered: string[] = []

  if (fs.existsSync(gsRoot)) {
    for (const dir of fs.readdirSync(gsRoot)) {
      const exePath = path.join(gsRoot, dir, 'bin', 'gswin64c.exe')
      if (fs.existsSync(exePath)) {
        discovered.push(exePath)
      }
    }
  }

  return [
    configured,
    ...discovered.sort().reverse(),
    'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.02.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.01.2\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.01.1\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.00.0\\bin\\gswin64c.exe',
    'gswin64c',
    'gswin32c',
    'gs',
  ].filter(Boolean) as string[]
}

function runGhostscript(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args)
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error('Compression timed out. Please try a smaller PDF.'))
    }, 45_000)

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    proc.on('close', (code) => {
      clearTimeout(timeout)
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Ghostscript failed with exit code ${code}`))
    })
  })
}

async function compressWithGhostscript(inputPath: string, outputPath: string, profile: CompressionProfile) {
  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${profile.pdfSettings}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dSubsetFonts=true',
    '-dAutoRotatePages=/None',
    '-dDownsampleColorImages=true',
    '-dColorImageDownsampleType=/Bicubic',
    `-dColorImageResolution=${profile.colorImageResolution}`,
    '-dDownsampleGrayImages=true',
    '-dGrayImageDownsampleType=/Bicubic',
    `-dGrayImageResolution=${profile.grayImageResolution}`,
    '-dDownsampleMonoImages=true',
    '-dMonoImageDownsampleType=/Subsample',
    `-dMonoImageResolution=${profile.monoImageResolution}`,
    '-dAutoFilterColorImages=false',
    '-dColorImageFilter=/DCTEncode',
    '-dAutoFilterGrayImages=false',
    '-dGrayImageFilter=/DCTEncode',
    `-dJPEGQ=${profile.jpegQuality}`,
    '-dFastWebView=true',
    `-sOutputFile=${outputPath}`,
    inputPath,
  ]

  let lastError: Error | NodeJS.ErrnoException | null = null
  for (const candidate of getGhostscriptCandidates()) {
    try {
      await runGhostscript(candidate, args)
      return fs.readFileSync(outputPath)
    } catch (error) {
      lastError = error as Error | NodeJS.ErrnoException
      const errno = lastError as NodeJS.ErrnoException
      const message = `${lastError.message || ''}`
      if (errno.code === 'ENOENT' || message.includes('spawn') || message.includes('not recognized')) {
        continue
      }

      throw lastError
    }
  }

  throw lastError ?? new Error('Ghostscript is not available in the current environment.')
}

function toSavedPercent(before: number, after: number) {
  if (before <= 0) return 0
  return Math.max(0, Math.round((1 - after / before) * 1000) / 10)
}

async function compressWithPdfLibFallback(originalBuffer: Buffer) {
  // pdf-lib fallback: rebuilds the PDF structure with object streams
  // This removes unused objects, deduplicates resources, and optimizes the cross-reference table
  const srcDoc = await PDFDocument.load(originalBuffer, {
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
    const profile = getCompressionProfile(levelStr)

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (file.type && file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: 'Only PDF files are supported' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (file.size > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (25MB max)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer())
    const strict = true

    const remoteUrl = process.env.PDF_COMPRESSOR_URL
    const remoteToken = process.env.PDF_COMPRESSOR_TOKEN

    if (remoteUrl && remoteToken) {
      const remoteForm = new FormData()
      remoteForm.append('file', new Blob([originalBuffer], { type: 'application/pdf' }), file.name || 'input.pdf')
      remoteForm.append('level', levelStr)

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
                'x-size-before': String(originalBuffer.length),
                'x-size-after': String(out.length),
                'x-saved-percent': String(savedPercent),
              },
            })
          }

          return new Response(JSON.stringify({
            error: savedPercent > 0
              ? `Compression only reduced this PDF by ${savedPercent}%. It is likely already optimized.`
              : 'Compression did not reduce this PDF in a meaningful way.',
            before: originalBuffer.length,
            after: out.length,
            savedPercent,
            engine: 'railway-gs',
          }), {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        console.error('Remote compressor failed:', await remoteResp.text())
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
      const err = error as NodeJS.ErrnoException
      const message = `${err?.message || ''}`
      if (err?.code === 'ENOENT' || message.includes('Ghostscript') || message.includes('spawn')) {
        compressed = await compressWithPdfLibFallback(originalBuffer)
        engine = 'local-fallback'
      } else {
        throw error
      }
    }

    if (!compressed) {
      throw new Error('Compression failed')
    }

    const savedPercent = toSavedPercent(originalBuffer.length, compressed.length)
    // For local fallback, always return the file even with minimal savings
    if (strict && savedPercent < profile.minimumReduction * 100 && engine !== 'local-fallback') {
      return new Response(JSON.stringify({
        error: savedPercent > 0
          ? `Compression only reduced this PDF by ${savedPercent}%. It is likely already optimized.`
          : 'Unable to reduce this PDF in a meaningful way.',
        before: originalBuffer.length,
        after: compressed.length,
        savedPercent,
        engine,
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(new Uint8Array(compressed), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="compressed.pdf"',
        'x-compress-engine': engine,
        'x-size-before': String(originalBuffer.length),
        'x-size-after': String(compressed.length),
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