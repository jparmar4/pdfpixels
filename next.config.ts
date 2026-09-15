import type { NextConfig } from "next";

const allowedImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'www.pdfpixels.com')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Output standalone to optimize memory on Hostinger
  output: 'standalone',

  // Enable React strict mode for better development
  reactStrictMode: true,

  // TypeScript config
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: allowedImageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas', 'heic-convert', 'heic-decode', 'libheif-js', 'jpeg-js', 'pngjs'],

  outputFileTracingIncludes: {
    '/api/pdf/*': [
      './node_modules/pdfjs-dist/legacy/build/*.mjs',
      './node_modules/pdfjs-dist/standard_fonts/**/*',
      './node_modules/pdfjs-dist/cmaps/**/*',
      // pdfjs-dist's Node polyfill loads DOMMatrix/Path2D/ImageData from
      // @napi-rs/canvas; without these files traced into the standalone build,
      // module init crashes with "ReferenceError: DOMMatrix is not defined"
      // (canvas-<platform> entries carry the optional platform binaries).
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-*/**',
      // Ghostscript's sRGB profile, bundled for PDF/A OutputIntents (to-pdfa).
      './iccprofiles/**',
    ],
    // Image + AI routes need the same natives (sharp/onnx/heic) in standalone.
    '/api/image/*': [
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-*/**',
      './node_modules/sharp/**',
      './node_modules/heic-convert/**',
    ],
    '/api/ai': [
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-*/**',
      './node_modules/sharp/**',
      './node_modules/onnxruntime-node/**',
    ],
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },

  // Headers for caching, security, and SEO
  async headers() {
    return [
      // Security headers for all pages
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // Referrer Policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permissions Policy (Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://adservice.google.com https://www.googleadservices.com https://fundingchoicesmessages.google.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com blob: data:; frame-src https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';",
          },
          // X-Powered-By is already disabled via poweredByHeader: false
        ],
      },
      // Static images - long cache
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // JS and CSS - long cache
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Fonts - long cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Well-known files (AI plugin, etc.)
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // OpenAPI spec
      {
        source: '/openapi.yaml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // LLM.txt files for AI crawlers
      {
        source: '/llms.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      // Robots.txt
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      // HTML pages - keep CDN cache short so content updates and new posts
      // are visible to crawlers and users quickly (default for prerendered
      // pages is s-maxage=31536000, which pins stale HTML for a year)
      {
        source: '/((?!_next/static|_next/image|api|.*\\..*).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=604800',
          },
        ],
      },
      // Sitemap
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
        ],
      },
      // Humans.txt
      {
        source: '/humans.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
        ],
      },
      // Manifest
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // Redirects for common paths
  async redirects() {
    return [
      // Canonicalize host: non-www -> www (must be first to win evaluation order).
      // Without this, both hosts serve full 200 copies and Google sees two duplicate sites.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'pdfpixels.com' }],
        destination: 'https://www.pdfpixels.com/:path*',
        permanent: true,
      },
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
        permanent: true,
      },
      // Redirect standalone tool pages to dynamic slug pages
      { source: '/compress-image', destination: '/tools/compress-image', permanent: true },
      { source: '/resize-image', destination: '/tools/resize-image', permanent: true },
      { source: '/remove-image-background', destination: '/tools/remove-image-background', permanent: true },
      { source: '/passport-size-photo', destination: '/tools/passport-size-photo', permanent: true },
      { source: '/image-to-pdf', destination: '/tools/image-to-pdf', permanent: true },
      { source: '/increase-image-size-in-kb', destination: '/tools/increase-image-size-in-kb', permanent: true },
      { source: '/increase-image-quality', destination: '/tools/increase-image-quality', permanent: true },
      { source: '/crop-image', destination: '/tools/crop-image', permanent: true },
      { source: '/circle-crop', destination: '/tools/circle-crop', permanent: true },
      { source: '/square-image-cropper', destination: '/tools/square-image-cropper', permanent: true },
      { source: '/freehand-crop', destination: '/tools/freehand-crop', permanent: true },
      { source: '/rotate-image', destination: '/tools/rotate-image', permanent: true },
      { source: '/flip-image', destination: '/tools/flip-image', permanent: true },
      { source: '/watermark-image', destination: '/tools/watermark-image', permanent: true },
      { source: '/add-text-to-image', destination: '/tools/add-text-to-image', permanent: true },
      { source: '/add-logo-to-image', destination: '/tools/add-logo-to-image', permanent: true },
      { source: '/join-images-online', destination: '/tools/join-images-online', permanent: true },
      { source: '/image-splitter', destination: '/tools/image-splitter', permanent: true },
      { source: '/color-code-from-image', destination: '/tools/color-code-from-image', permanent: true },
      { source: '/blur-image', destination: '/tools/blur-image', permanent: true },
      { source: '/blur-background', destination: '/tools/blur-background', permanent: true },
      { source: '/blur-face', destination: '/tools/blur-face', permanent: true },
      { source: '/pixelate-image', destination: '/tools/pixelate-image', permanent: true },
      { source: '/grayscale-image', destination: '/tools/grayscale-image', permanent: true },
      { source: '/turn-image-to-black-and-white', destination: '/tools/turn-image-to-black-and-white', permanent: true },
      { source: '/sepia-filter', destination: '/tools/sepia-filter', permanent: true },
      { source: '/invert-image-colors', destination: '/tools/invert-image-colors', permanent: true },
      { source: '/motion-blur', destination: '/tools/motion-blur', permanent: true },
      { source: '/censor-photo', destination: '/tools/censor-photo', permanent: true },
      { source: '/picture-to-pixel-art', destination: '/tools/picture-to-pixel-art', permanent: true },
      { source: '/beautify-image', destination: '/tools/beautify-image', permanent: true },
      { source: '/retouch-photo', destination: '/tools/retouch-photo', permanent: true },
      { source: '/convert-dpi', destination: '/tools/convert-dpi', permanent: true },
      { source: '/upscale-image', destination: '/tools/upscale-image', permanent: true },
      { source: '/png-to-jpeg', destination: '/tools/png-to-jpeg', permanent: true },
      { source: '/jpeg-to-png', destination: '/tools/jpeg-to-png', permanent: true },
      { source: '/webp-to-jpg', destination: '/tools/webp-to-jpg', permanent: true },
      { source: '/heic-to-jpg', destination: '/tools/heic-to-jpg', permanent: true },
      { source: '/image-to-text', destination: '/tools/image-to-text', permanent: true },
      { source: '/generate-signature', destination: '/tools/generate-signature', permanent: true },
      { source: '/resize-signature', destination: '/tools/resize-signature', permanent: true },
      { source: '/merge-photo-and-signature', destination: '/tools/merge-photo-and-signature', permanent: true },
      { source: '/photo-metadata-viewer', destination: '/tools/photo-metadata-viewer', permanent: true },
      { source: '/photo-exif-editor', destination: '/tools/photo-exif-editor', permanent: true },
      { source: '/remove-image-metadata', destination: '/tools/remove-image-metadata', permanent: true },
      { source: '/compress-pdf', destination: '/tools/compress-pdf', permanent: true },
      { source: '/merge-pdf', destination: '/tools/merge-pdf', permanent: true },
      { source: '/split-pdf', destination: '/tools/split-pdf', permanent: true },
      { source: '/pdf-to-jpg', destination: '/tools/pdf-to-jpg', permanent: true },
      { source: '/rotate-pdf', destination: '/tools/rotate-pdf', permanent: true },
      { source: '/add-watermark-pdf', destination: '/tools/add-watermark-pdf', permanent: true },
      { source: '/watermark-pdf', destination: '/tools/add-watermark-pdf', permanent: true },
      { source: '/tools/watermark-pdf', destination: '/tools/add-watermark-pdf', permanent: true },
      { source: '/protect-pdf', destination: '/tools/protect-pdf', permanent: true },
      { source: '/unlock-pdf', destination: '/tools/unlock-pdf', permanent: true },
      { source: '/reorder-pdf-pages', destination: '/tools/reorder-pdf-pages', permanent: true },
      { source: '/delete-pdf-pages', destination: '/tools/delete-pdf-pages', permanent: true },
      // Legacy short URLs
      { source: '/png-to-jpg', destination: '/tools/png-to-jpeg', permanent: true },
      { source: '/jpg-to-png', destination: '/tools/jpeg-to-png', permanent: true },
      { source: '/pdf-compress', destination: '/tools/compress-pdf', permanent: true },
      { source: '/svg-to-png', destination: '/tools/svg-to-png', permanent: true },
      { source: '/svg-to-jpg', destination: '/tools/svg-to-jpg', permanent: true },
      { source: '/webp-to-png', destination: '/tools/webp-to-png', permanent: true },
      { source: '/linearize-pdf', destination: '/tools/linearize-pdf', permanent: true },
      { source: '/add-page-numbers-pdf', destination: '/tools/add-page-numbers-to-pdf', permanent: true },
      { source: '/sign-pdf', destination: '/tools/sign-pdf', permanent: true },
      { source: '/redact-pdf', destination: '/tools/redact-pdf', permanent: true },
      { source: '/flatten-pdf', destination: '/tools/flatten-pdf', permanent: true },
      { source: '/crop-pdf', destination: '/tools/crop-pdf', permanent: true },
      { source: '/extract-pdf-pages', destination: '/tools/extract-pdf-pages', permanent: true },
      { source: '/fill-pdf', destination: '/tools/fill-pdf', permanent: true },
      { source: '/grayscale-pdf', destination: '/tools/grayscale-pdf', permanent: true },
      { source: '/pdf-to-text', destination: '/tools/pdf-to-text', permanent: true },
      { source: '/pdf-to-pdfa', destination: '/tools/pdf-to-pdfa', permanent: true },
      { source: '/word-to-pdf', destination: '/tools/word-to-pdf', permanent: true },
      { source: '/pdf-to-word', destination: '/tools/pdf-to-word', permanent: true },
      { source: '/pdf-to-excel', destination: '/tools/pdf-to-excel', permanent: true },
      { source: '/pdf-sign', destination: '/tools/sign-pdf', permanent: true },
      { source: '/pdf-redact', destination: '/tools/redact-pdf', permanent: true },
      { source: '/pdf-flatten', destination: '/tools/flatten-pdf', permanent: true },
      { source: '/pdf-crop', destination: '/tools/crop-pdf', permanent: true },
      { source: '/extract-pdf', destination: '/tools/extract-pdf-pages', permanent: true },
      { source: '/pdf-form-filler', destination: '/tools/fill-pdf', permanent: true },
      { source: '/pdf-grayscale', destination: '/tools/grayscale-pdf', permanent: true },
      { source: '/pdf-to-doc', destination: '/tools/pdf-to-word', permanent: true },
      { source: '/pdf-to-docx', destination: '/tools/pdf-to-word', permanent: true },
      { source: '/docx-to-pdf', destination: '/tools/word-to-pdf', permanent: true },
      { source: '/pdf-to-xlsx', destination: '/tools/pdf-to-excel', permanent: true },
      { source: '/pdf-to-csv', destination: '/tools/pdf-to-excel', permanent: true },
      { source: '/bank-statement-to-excel', destination: '/tools/bank-statement-to-excel', permanent: true },
      { source: '/bank-statement-to-csv', destination: '/tools/bank-statement-to-excel', permanent: true },
      { source: '/bates-numbering-pdf', destination: '/tools/bates-numbering-pdf', permanent: true },
      { source: '/bates-numbering', destination: '/tools/bates-numbering-pdf', permanent: true },
      { source: '/bates-stamp', destination: '/tools/bates-numbering-pdf', permanent: true },
      { source: '/sanitize-pdf', destination: '/tools/sanitize-pdf', permanent: true },
      { source: '/remove-pdf-metadata', destination: '/tools/sanitize-pdf', permanent: true },
      { source: '/compare-pdf', destination: '/tools/compare-pdf', permanent: true },
      { source: '/pdf-diff', destination: '/tools/compare-pdf', permanent: true },
      { source: '/cmyk-pdf-converter', destination: '/tools/cmyk-pdf-converter', permanent: true },
      { source: '/cmyk-pdf', destination: '/tools/cmyk-pdf-converter', permanent: true },
      { source: '/pdf-to-cmyk', destination: '/tools/cmyk-pdf-converter', permanent: true },
      { source: '/heic-to-pdf', destination: '/tools/heic-to-pdf', permanent: true },
      { source: '/iphone-photo-to-pdf', destination: '/tools/heic-to-pdf', permanent: true },
      { source: '/compress-pdf-to-100kb', destination: '/tools/compress-pdf-to-100kb', permanent: true },
      { source: '/compress-pdf-to-200kb', destination: '/tools/compress-pdf-to-200kb', permanent: true },
      { source: '/compress-pdf-to-300kb', destination: '/tools/compress-pdf-to-300kb', permanent: true },
      { source: '/compress-pdf-to-500kb', destination: '/tools/compress-pdf-to-500kb', permanent: true },
      { source: '/compress-pdf-under-1mb', destination: '/tools/compress-pdf-under-1mb', permanent: true },
      
      // Deleted root /api route (was removed in Phase 6, still indexed by Google)
      { source: '/api', destination: '/api-docs', permanent: true },
      // Missing root redirect for full tool slug
      { source: '/add-page-numbers-to-pdf', destination: '/tools/add-page-numbers-to-pdf', permanent: true },
      // Common RSS/feed discovery paths
      { source: '/feed.xml', destination: '/feed', permanent: true },
      { source: '/rss.xml', destination: '/feed', permanent: true },
      { source: '/rss', destination: '/feed', permanent: true },
      { source: '/atom.xml', destination: '/feed', permanent: true },
      // Old sitemap redirects
      { source: '/sitemap-0.xml', destination: '/sitemap.xml', permanent: true },
      { source: '/sitemap-images.xml', destination: '/image-sitemap.xml', permanent: true },
      { source: '/sitemap-news.xml', destination: '/sitemap.xml', permanent: true },
      // Consolidated duplicate blog posts (merged into their canonical posts)
      { source: '/blog/heic-to-jpg-converter-guide', destination: '/blog/heic-to-jpg-convert-iphone-photos', permanent: true },
      { source: '/blog/reduce-pdf-file-size-for-email', destination: '/blog/reduce-pdf-size-for-email', permanent: true },
      { source: '/blog/compress-pdf-to-200kb-guide', destination: '/blog/compress-pdf-to-200kb-email-attachment', permanent: true },
    ];
  },

  // Compress responses
  compress: true,

  // Power by header (security - hide framework)
  poweredByHeader: false,

  // Generate ETags for caching
  generateEtags: true,
};

export default nextConfig;
