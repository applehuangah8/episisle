/**
 * The Wild 標題下方小型原野裝飾（低調、不重複佔版面）。
 */
export function WildGrassMark() {
  return (
    <div
      className="pointer-events-none h-[22px] w-full max-w-[min(100%,280px)] opacity-[0.42]"
      aria-hidden
    >
      <svg viewBox="0 0 200 22" className="h-full w-full" preserveAspectRatio="xMinYMid meet">
        <defs>
          <linearGradient id="wild-grass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(120, 148, 132, 0.55)" />
            <stop offset="50%" stopColor="rgba(90, 124, 108, 0.45)" />
            <stop offset="100%" stopColor="rgba(140, 168, 152, 0.4)" />
          </linearGradient>
        </defs>
        <path
          d="M0 20 Q24 8 38 18 Q52 4 66 16 Q80 6 94 17 Q108 5 122 16 Q136 7 150 15 Q164 6 178 14 Q188 8 200 12"
          fill="none"
          stroke="url(#wild-grass)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M8 21 Q14 12 20 19 M22 21 Q28 10 36 18 M44 20 Q50 11 58 17 M72 20 Q78 9 86 16 M98 21 Q104 11 112 18 M124 20 Q130 10 138 17 M152 21 Q158 12 166 18"
          fill="none"
          stroke="rgba(72, 108, 92, 0.35)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <ellipse cx="168" cy="19" rx="10" ry="2.5" fill="rgba(189, 204, 196, 0.22)" />
      </svg>
    </div>
  );
}
