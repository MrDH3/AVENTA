'use client'

/**
 * Pure CSS/SVG animated coastline used behind the home hero.
 * Sky → sun → clouds → seagulls → sea band → sun-glints → wave layers →
 * beach → foam → swaying palm. No video, no libraries.
 */
export default function CoastlineScene() {
  return (
    <>
      {/* sun */}
      <div
        style={{
          position: 'absolute',
          top: 84,
          right: '11%',
          width: 118,
          height: 118,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%,#FFE49B 0%,#FFD56B 55%,#FFC24D 100%)',
          boxShadow: '0 0 80px 30px rgba(255,213,107,.55)',
          animation: 'av-sun 6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 70,
          right: '9.5%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,.4)',
          opacity: 0.5,
        }}
      />

      {/* clouds */}
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 0,
          width: 150,
          height: 42,
          background: '#fff',
          borderRadius: 40,
          opacity: 0.85,
          filter: 'blur(1px)',
          animation: 'av-cloud 46s linear infinite',
          boxShadow: '36px 8px 0 -6px #fff,-30px 6px 0 -8px #fff',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 160,
          left: 0,
          width: 110,
          height: 32,
          background: '#fff',
          borderRadius: 40,
          opacity: 0.7,
          filter: 'blur(1px)',
          animation: 'av-cloud 64s linear infinite',
          animationDelay: '-20s',
          boxShadow: '28px 6px 0 -5px #fff',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 54,
          left: 0,
          width: 90,
          height: 26,
          background: '#fff',
          borderRadius: 40,
          opacity: 0.6,
          filter: 'blur(1px)',
          animation: 'av-cloud 80s linear infinite',
          animationDelay: '-50s',
        }}
      />

      {/* seagulls */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: '30%',
          color: 'rgba(12,59,69,.4)',
          animation: 'av-gull 3.4s ease-in-out infinite',
        }}
      >
        <svg width="30" height="12" viewBox="0 0 30 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 8 Q8 1 15 7 Q22 1 28 8" />
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: '38%',
          color: 'rgba(12,59,69,.3)',
          animation: 'av-gull 3.4s ease-in-out infinite',
          animationDelay: '-1.2s',
        }}
      >
        <svg width="22" height="9" viewBox="0 0 30 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 8 Q8 1 15 7 Q22 1 28 8" />
        </svg>
      </div>

      {/* SEA band */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 90,
          height: 220,
          background: 'linear-gradient(180deg,#3FB7CA 0%,#1C9DB3 45%,#0E7E90 100%)',
        }}
      />

      {/* sun glints */}
      <div style={{ position: 'absolute', bottom: 168, right: '14%', width: 64, height: 4, borderRadius: 3, background: '#FFE49B', animation: 'av-shimmer 3s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: 150, right: '18%', width: 44, height: 4, borderRadius: 3, background: '#FFE49B', animation: 'av-shimmer 3s ease-in-out infinite', animationDelay: '-1s' }} />
      <div style={{ position: 'absolute', bottom: 188, right: '22%', width: 30, height: 3, borderRadius: 3, background: '#FFEFC2', animation: 'av-shimmer 3s ease-in-out infinite', animationDelay: '-2s' }} />

      {/* wave layers (each svg 2 tiles wide, translateX -50% loops) */}
      <div style={{ position: 'absolute', left: 0, bottom: 150, width: '200%', height: 54, animation: 'av-wave 14s linear infinite', opacity: 0.5 }}>
        <svg width="100%" height="54" viewBox="0 0 2880 54" preserveAspectRatio="none" fill="#BFEAF0">
          <path d="M0,28 C240,6 480,6 720,28 C960,50 1200,50 1440,28 C1680,6 1920,6 2160,28 C2400,50 2640,50 2880,28 L2880,54 L0,54 Z" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 124, width: '200%', height: 60, animation: 'av-wave 10s linear infinite', opacity: 0.8 }}>
        <svg width="100%" height="60" viewBox="0 0 2880 60" preserveAspectRatio="none" fill="#6FD0DD">
          <path d="M0,30 C240,8 480,8 720,30 C960,52 1200,52 1440,30 C1680,8 1920,8 2160,30 C2400,52 2640,52 2880,30 L2880,60 L0,60 Z" />
        </svg>
      </div>

      {/* beach (sand) */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 104, background: 'linear-gradient(180deg,#F6E7C4 0%,#EFD9AC 55%,#E7CD9A 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 92, height: 20, background: 'linear-gradient(180deg,rgba(14,126,144,.16),rgba(231,205,154,0))' }} />

      {/* foam lapping the sand */}
      <div style={{ position: 'absolute', left: 0, bottom: 92, width: '200%', height: 48, animation: 'av-wave 7s linear infinite' }}>
        <svg width="100%" height="48" viewBox="0 0 2880 48" preserveAspectRatio="none" fill="#ffffff">
          <path d="M0,28 C240,10 480,10 720,28 C960,46 1200,46 1440,28 C1680,10 1920,10 2160,28 C2400,46 2640,46 2880,28 L2880,48 L0,48 Z" opacity="0.92" />
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 88, width: '200%', height: 10, animation: 'av-wave 9s linear infinite', opacity: 0.65 }}>
        <svg width="100%" height="10" viewBox="0 0 2880 10" preserveAspectRatio="none" fill="#ffffff">
          <path d="M0,6 C360,2 720,2 1440,6 C2160,2 2520,2 2880,6 L2880,10 L0,10 Z" />
        </svg>
      </div>

      {/* palm planted on the beach, swaying */}
      <div style={{ position: 'absolute', bottom: 16, left: 44, width: 210, height: 20, borderRadius: '50%', background: 'radial-gradient(ellipse at center,rgba(90,66,28,.26),rgba(90,66,28,0) 70%)' }} />
      <div style={{ position: 'absolute', bottom: 24, left: 64, transformOrigin: 'bottom left', animation: 'av-sway 6.5s ease-in-out infinite' }}>
        <svg width="176" height="244" viewBox="0 0 200 280" fill="none">
          <path d="M40 280 C40 200 36 120 30 60" stroke="#0E5A52" strokeWidth="9" strokeLinecap="round" />
          <g fill="#1F9E7A">
            <path d="M30 58 C-6 40 -28 58 -40 86 C0 70 22 70 34 78 Z" />
            <path d="M30 58 C8 22 -10 8 -42 6 C-6 18 12 36 30 66 Z" />
            <path d="M30 58 C58 30 92 24 120 36 C84 36 56 48 36 72 Z" />
            <path d="M30 58 C66 50 100 64 120 92 C86 70 54 66 34 76 Z" />
            <path d="M30 58 C30 22 44 -4 70 -16 C50 14 40 38 36 64 Z" />
          </g>
          <g fill="#16876A">
            <circle cx="30" cy="60" r="8" />
            <circle cx="22" cy="64" r="5" />
            <circle cx="38" cy="64" r="5" />
          </g>
          <g fill="#C77B33">
            <ellipse cx="23" cy="71" rx="4" ry="6" />
            <ellipse cx="37" cy="71" rx="4" ry="6" />
          </g>
        </svg>
      </div>
    </>
  )
}
