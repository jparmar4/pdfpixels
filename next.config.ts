import type { NextConfig } from "next";

const allowedImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || 'www.pdfpixels.com')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",

  // Enable React strict mode for better development
  reactStrictMode: true,

  // TypeScript config
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://adservice.google.com https://www.googleadservices.com https://fundingchoicesmessages.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com; frame-src https://www.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self';",
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
      { source: '/protect-pdf', destination: '/tools/protect-pdf', permanent: true },
      { source: '/unlock-pdf', destination: '/tools/unlock-pdf', permanent: true },
      { source: '/reorder-pdf-pages', destination: '/tools/reorder-pdf-pages', permanent: true },
      { source: '/delete-pdf-pages', destination: '/tools/delete-pdf-pages', permanent: true },
      // Legacy short URLs
      { source: '/png-to-jpg', destination: '/tools/png-to-jpeg', permanent: true },
      { source: '/jpg-to-png', destination: '/tools/jpeg-to-png', permanent: true },
      { source: '/pdf-compress', destination: '/tools/compress-pdf', permanent: true },
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
