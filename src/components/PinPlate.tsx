import { useMemo } from 'react';

// 600-hex → 60×40 boolean 그리드.
// 브라유 셀 배치: 10행 × 30열, 셀 = 4×2핀 (왼쪽 열 bit0-3, 오른쪽 열 bit4-7).
export function hexToDots(hex: string): boolean[][] {
  const ROWS = 40, COLS = 60;
  const dots: boolean[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
  const byteCount = Math.min(hex.length >> 1, 300);
  for (let i = 0; i < byteCount; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (!byte) continue;
    const bRow = Math.floor(i / 30);
    const bCol = i % 30;
    for (let pin = 0; pin < 8; pin++) {
      if ((byte >> pin) & 1) {
        const r = bRow * 4 + (pin & 3);
        const c = bCol * 2 + (pin >> 2);
        if (r < ROWS && c < COLS) dots[r][c] = true;
      }
    }
  }
  return dots;
}

/**
 * 발굴 플레이트 — 닷패드 320(60×40) 핀 상태의 화면 시뮬레이션.
 * 실제 닷패드 출력과 별개인 순수 시각 확인용(교사/검수자).
 * 규격 2번: ?preview=0 또는 embed 기본값에서는 이 컴포넌트 자체를 렌더하지 않는다.
 */
export function PinPlate({ hex, label }: { hex: string; label: string }) {
  const dots = useMemo(() => hexToDots(hex), [hex]);
  const CELL = 10;
  const W = 60 * CELL, H = 40 * CELL;

  const circles: JSX.Element[] = [];
  for (let r = 0; r < 40; r++) {
    for (let c = 0; c < 60; c++) {
      if (dots[r][c]) {
        circles.push(
          <circle key={`${r}-${c}`} cx={c * CELL + CELL / 2} cy={r * CELL + CELL / 2} r={CELL * 0.36} />,
        );
      }
    }
  }

  return (
    <figure className="pin-plate" aria-hidden="true">
      <figcaption>
        <span className="plate-eyebrow">DotPad 320 · 60×40</span>
        <span className="plate-label">{label}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} 촉각 패턴 미리보기`}>
        <g className="plate-grid">
          {Array.from({ length: 40 }, (_, r) =>
            Array.from({ length: 60 }, (_, c) => (
              <circle key={`g${r}-${c}`} cx={c * CELL + CELL / 2} cy={r * CELL + CELL / 2} r={1.4} />
            )),
          )}
        </g>
        <g className="plate-pins">{circles}</g>
      </svg>
    </figure>
  );
}
