"use client";

export default function ECGLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <svg
        width="120"
        height="60"
        viewBox="0 0 120 60"
        className="ecg-loader"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.1">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="60" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 10} x2="120" y2={i * 10} />
          ))}
        </g>

        {/* ECG Line */}
        <path
          d="M0,30 L15,30 L18,10 L21,50 L24,30 L30,30 L33,25 L36,35 L39,30 L120,30"
          fill="none"
          stroke="url(#ecg-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="d"
            dur="1.2s"
            repeatCount="indefinite"
            values="
              M0,30 L15,30 L18,10 L21,50 L24,30 L30,30 L33,25 L36,35 L39,30 L120,30;
              M0,30 L15,30 L18,15 L21,45 L24,30 L30,30 L33,27 L36,33 L39,30 L120,30;
              M0,30 L15,30 L18,10 L21,50 L24,30 L30,30 L33,25 L36,35 L39,30 L120,30
            "
          />
        </path>

        {/* Moving highlight */}
        <rect
          x="-30"
          y="0"
          width="30"
          height="60"
          fill="url(#ecg-gradient)"
          opacity="0.3"
        >
          <animate
            attributeName="x"
            from="-30"
            to="120"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>

      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}
