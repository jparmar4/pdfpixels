import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'PdfPixels - Free Online Image & PDF Tools';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          padding: 64,
          color: '#ffffff',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>PdfPixels</div>
        <div style={{ height: 20 }} />
        <div style={{ fontSize: 34, opacity: 0.92 }}>
          Free Online Image &amp; PDF Tools
        </div>
        <div style={{ height: 28 }} />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            'Compress',
            'Resize',
            'Convert',
            'Background Removal',
            'Merge PDF',
            'Split PDF',
          ].map((label) => (
            <div
              key={label}
              style={{
                fontSize: 22,
                padding: '10px 14px',
                borderRadius: 999,
                background: 'rgba(139, 92, 246, 0.18)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 20, opacity: 0.75 }}>www.pdfpixels.com</div>
      </div>
    ),
    {
      ...size,
    }
  );
}
