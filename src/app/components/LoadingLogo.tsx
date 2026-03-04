'use client'

export default function LoadingLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <img 
          src="/icon.png" 
          alt="Loading..." 
          className={`${sizeClasses[size]} animate-pulse`}
          style={{
            animation: 'logoSpin 2s ease-in-out infinite'
          }}
        />
      </div>
      <style jsx>{`
        @keyframes logoSpin {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) scale(1);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
