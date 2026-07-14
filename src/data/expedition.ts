import { boolGridToHex, emptyGrid } from '../dotpad/tactileGen';

// 원래 dot-fossil의 발굴 스테이지 크기(20×14)를 그대로 가져와 기존 세계관과 연속성을 준다.
export const FIELD_W = 20;
export const FIELD_H = 14;
const MAX_DIST = Math.hypot(FIELD_W, FIELD_H); // ≈ 24.4

export interface Pos { x: number; y: number; }

/** 시작 지점에서 최소 6칸 이상 떨어진 곳에 신호원을 무작위 배치 — 너무 쉽게 바로 옆에서 시작하지 않도록. */
export function randomTarget(avoid: Pos): Pos {
  let t: Pos;
  let guard = 0;
  do {
    t = { x: Math.floor(Math.random() * FIELD_W), y: Math.floor(Math.random() * FIELD_H) };
    guard++;
  } while (Math.hypot(t.x - avoid.x, t.y - avoid.y) < 6 && guard < 50);
  return t;
}

export function distanceOf(p: Pos, t: Pos): number {
  return Math.hypot(t.x - p.x, t.y - p.y);
}

/** 0(아주 멀다) ~ 1(바로 위) — 오디오 음높이·레이더 반지름에 함께 쓰는 근접도. */
export function closenessOf(dist: number): number {
  return Math.max(0, Math.min(1, 1 - dist / MAX_DIST));
}

const CATEGORIES: { max: number; label: string }[] = [
  { max: 1, label: '바로 근처' },
  { max: 3, label: '아주 가까움' },
  { max: 7, label: '가까움' },
  { max: 13, label: '보통' },
  { max: Infinity, label: '멀음' },
];

export function distanceCategory(dist: number): string {
  return CATEGORIES.find(c => dist <= c.max)!.label;
}

/**
 * 신호 레이더 — 거리 고리 + 방향 마커.
 * 고리 반지름은 근접도(가까울수록 좁아짐)를, 좌/우·상/하 가장자리의 작은 덩어리는
 * 목표가 있는 방향을 알려준다(스테레오 음향 대신 촉각 위치로 방향을 전달 — 헤드폰 없이도 동일하게 작동).
 */
export function buildRadarHex(closeness: number, dx = 0, dy = 0): string {
  const grid = emptyGrid();
  const cx = 30, cy = 20;
  const radius = 3 + (1 - closeness) * 15;
  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 60; x++) {
      const nx = (x - cx) / 1.5;
      const ny = y - cy;
      const r = Math.sqrt(nx * nx + ny * ny);
      if (Math.abs(r - radius) < 1.3) grid[y][x] = true;
    }
  }
  // 방향 마커 — 목표가 있는 쪽 가장자리에 3×5 덩어리
  const markBlock = (x0: number, y0: number) => {
    for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + 3; x++) {
      if (y >= 0 && y < 40 && x >= 0 && x < 60) grid[y][x] = true;
    }
  };
  if (dx < -0.5) markBlock(1, 17);       // 왼쪽
  else if (dx > 0.5) markBlock(56, 17);  // 오른쪽
  if (dy < -0.5) markBlock(28, 1);       // 위쪽
  else if (dy > 0.5) markBlock(28, 34);  // 아래쪽
  return boolGridToHex(grid);
}

/** 더 많이 벌어진 축(가로/세로)을 우선해 한 방향만 짚어주는 음성 힌트. */
export function directionHint(dx: number, dy: number): string {
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx === 0) return '';
    return `${dx > 0 ? '오른쪽' : '왼쪽'}으로 ${Math.round(Math.abs(dx))}칸 더 가 보세요.`;
  }
  if (dy === 0) return '';
  return `${dy > 0 ? '아래' : '위'}로 ${Math.round(Math.abs(dy))}칸 더 가 보세요.`;
}
