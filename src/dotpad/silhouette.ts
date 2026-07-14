import { emptyGrid } from './tactileGen';
import type { BoolGrid } from './tactileGen';

function distToSegment(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x0) * dx + (py - y0) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x0 + t * dx, cy = y0 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** 두꺼운 직선 획 — 최소 2핀 두께 규칙을 지키기 위해 thickness 기본값을 3으로 둔다. */
export function stroke(grid: BoolGrid, x0: number, y0: number, x1: number, y1: number, thickness = 3) {
  const half = thickness / 2;
  const minX = Math.max(0, Math.floor(Math.min(x0, x1) - half));
  const maxX = Math.min(59, Math.ceil(Math.max(x0, x1) + half));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1) - half));
  const maxY = Math.min(39, Math.ceil(Math.max(y0, y1) + half));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (distToSegment(x, y, x0, y0, x1, y1) <= half) grid[y][x] = true;
    }
  }
}

/** 여러 점을 잇는 두꺼운 꺾은선 — 목/볏처럼 완만하게 휘는 부위에 사용. */
export function polyline(grid: BoolGrid, pts: [number, number][], thickness = 3) {
  for (let i = 0; i < pts.length - 1; i++) {
    stroke(grid, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], thickness);
  }
}

/** 채운 원 — 머리, 꼬리 곤봉 등 뭉툭한 말단에 사용. */
export function blob(grid: BoolGrid, cx: number, cy: number, r: number) {
  const minX = Math.max(0, Math.floor(cx - r)), maxX = Math.min(59, Math.ceil(cx + r));
  const minY = Math.max(0, Math.floor(cy - r)), maxY = Math.min(39, Math.ceil(cy + r));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (Math.hypot(x - cx, y - cy) <= r) grid[y][x] = true;
    }
  }
}

export function newSilhouetteGrid(): BoolGrid {
  return emptyGrid();
}
