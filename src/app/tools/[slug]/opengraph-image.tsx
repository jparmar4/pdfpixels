import { ImageResponse } from 'next/og';
import { getToolBySlug } from '@/lib/tools-data';

export const runtime = 'edge';

// Route segment config
export const alt = 'Tool by PdfPixels';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    return new Response('Not Found', { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000000',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #000000 70%)',
          padding: '80px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header/Logo area */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                marginRight: '20px',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', letterSpacing: '-1px' }}>
              PdfPixels
            </span>
            {tool.badge && (
              <span style={{ 
                marginLeft: '24px', 
                padding: '6px 16px', 
                background: 'rgba(139, 92, 246, 0.2)', 
                color: '#c4b5fd',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                {tool.badge}
              </span>
            )}
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: '84px',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-2px',
              marginBottom: '32px',
              maxWidth: '900px',
            }}
          >
            {tool.name}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '32px',
              color: '#9ca3af',
              lineHeight: 1.5,
              maxWidth: '850px',
            }}
          >
            {tool.description}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#60a5fa', fontSize: '24px', fontWeight: 'bold' }}>
            {tool.processing === 'client' ? 'Secure Browser Processing' : 'Fast Cloud Processing'}
          </div>
          <div style={{ display: 'flex', color: '#9ca3af', fontSize: '24px' }}>
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
