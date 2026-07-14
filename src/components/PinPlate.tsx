import { useMemo } from 'react';
import { hexToBoolGrid } from '../dotpad/tactileGen';

const hexToDots = hexToBoolGrid;

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
