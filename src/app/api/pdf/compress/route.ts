import { NextRequest } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let inputPath = ''
  let outputPath = ''

  try {
    const form = await req.formData()
    const file = form.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 })
    }

    // size limit 25MB
    if (file.size > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (25MB max)' }), { status: 400 })
    }

    const tempDir = os.tmpdir()

    // SAFE random filenames
    const id = crypto.randomUUID()
    inputPath = path.join(tempDir, `${id}.pdf`)
    outputPath = path.join(tempDir, `${id}-compressed.pdf`)

    // write uploaded file
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(inputPath, buffer)

    // ghostscript args
    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ]

    // run ghostscript
    await new Promise((resolve, reject) => {
      const gs = spawn('gs', args)

      gs.on('close', (code) => {
        if (code === 0) resolve(true)
        else reject(new Error(`Ghostscript failed with exit code ${code}`))
      })

      gs.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') {
          reject(new Error('Ghostscript (gs) is not installed on the server'))
        } else {
          reject(err)
        }
      })
    })

    const compressed = fs.readFileSync(outputPath)

    return new Response(compressed, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="compressed.pdf"'
      }
    })

  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Compression failed'
    const status = message.includes('not installed') ? 503 : 500
    return new Response(JSON.stringify({ error: message }), { status })
  } finally {
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
  }
}
