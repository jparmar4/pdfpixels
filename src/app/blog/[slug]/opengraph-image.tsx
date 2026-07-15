import { ImageResponse } from 'next/og';
import { getBlogPostBySlug } from '@/config/blog';

export const runtime = 'edge';

export const alt = 'Blog Post by PdfPixels';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return new Response('Not Found', { status: 404 });
  }

  // Format date
  const date = new Date(post.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          backgroundImage: 'radial-gradient(circle at 100% 0%, #e0f2fe 0%, #ffffff 50%)',
          padding: '80px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header/Logo area */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '60px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #0284c7 100%)',
                marginRight: '16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '-0.5px' }}>
              PdfPixels Blog
            </span>
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: '76px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-2px',
              marginBottom: '32px',
              maxWidth: '1000px',
            }}
          >
            {post.title}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#0f172a', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              {post.author}
            </div>
            <div style={{ color: '#64748b', fontSize: '22px' }}>
              {date} · {post.readTime}
            </div>
          </div>
          <div style={{ display: 'flex', color: '#64748b', fontSize: '24px', fontWeight: '500' }}>
            pdfpixels.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
