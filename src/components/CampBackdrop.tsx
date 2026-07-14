/**
 * 앱 전체 뒤에 고정되는 장식용 배경 장면.
 * 시각장애 학생의 실제 플레이(오디오+촉각)에는 전혀 영향을 주지 않는 순수 시각 레이어 —
 * 화면을 지켜보는 교사·보호자·검수자에게 "진짜 게임" 같은 분위기를 준다.
 * 텍스트 대비를 해치지 않도록 낮은 명도로 두고, aria-hidden 처리.
 */
export function CampBackdrop() {
  return (
    <svg
      className="camp-backdrop"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="moonGlow" cx="82%" cy="18%" r="45%">
          <stop offset="0%" stopColor="#f2a93b" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#f2a93b" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f2a93b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="skyFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d150e" stopOpacity="0" />
          <stop offset="100%" stopColor="#1d150e" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#moonGlow)" />

      {/* 별 */}
      <g fill="#f0e7d5" opacity="0.5">
        <circle cx="120" cy="70" r="1.6" />
        <circle cx="260" cy="130" r="1.2" />
        <circle cx="410" cy="60" r="1.8" />
        <circle cx="560" cy="110" r="1.3" />
        <circle cx="700" cy="50" r="1.5" />
        <circle cx="880" cy="90" r="1.2" />
        <circle cx="980" cy="140" r="1.7" />
        <circle cx="1080" cy="60" r="1.3" />
        <circle cx="180" cy="200" r="1.1" />
        <circle cx="640" cy="180" r="1.1" />
      </g>

      {/* 달 (작업등처럼) */}
      <circle cx="985" cy="145" r="46" fill="#f2a93b" opacity="0.85" />

      {/* 먼 능선 */}
      <path
        d="M0,430 Q120,395 260,420 T520,410 T780,428 T1050,405 L1200,420 L1200,800 L0,800 Z"
        fill="#2a2013"
        opacity="0.9"
      />

      {/* 멀리서 지켜보는 공룡 실루엣 — 아주 낮은 명도로, 정말 배경에 녹아들게 */}
      <g fill="#241b12" opacity="0.85">
        <path d="M760,470
                 C 762,440 772,405 800,380
                 C 812,368 826,362 836,362
                 C 828,368 822,378 822,388
                 C 838,384 852,390 858,402
                 C 848,400 840,404 836,412
                 C 850,420 858,438 856,458
                 L 856,470
                 C 840,466 826,466 812,470
                 C 800,462 786,460 774,466
                 Z"
        />
      </g>

      {/* 가까운 언덕 겸 발굴지 능선 */}
      <path
        d="M0,560 Q150,520 320,548 T640,540 T960,556 T1200,540 L1200,800 L0,800 Z"
        fill="#221a12"
      />

      {/* 발굴 텐트 실루엣 */}
      <g fill="#1d150e">
        <path d="M120,560 L165,500 L210,560 Z" />
        <rect x="150" y="545" width="30" height="15" />
      </g>

      {/* 앞쪽 어둠 그라디언트로 전경 텍스트와 자연스럽게 겹치게 */}
      <rect x="0" y="0" width="1200" height="800" fill="url(#skyFade)" />
    </svg>
  );
}
