import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'HustleKE — Kenya\'s #1 Freelance Marketplace'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #047857 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            H
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
            HustleKE
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '32px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            marginBottom: '30px',
          }}
        >
          Kenya&apos;s #1 Freelance Marketplace
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
          }}
        >
          {['M-Pesa Payments', 'Escrow Protection', 'AI-Powered Tools'].map((feature) => (
            <div
              key={feature}
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '18px',
                color: 'white',
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          hustleke.com
        </div>
      </div>
    ),
    { ...size }
  )
}
