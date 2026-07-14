// 60×40 binary matrix → 300-byte graphic encoding → 600-char HEX.
// DotPad GRAPHIC 모드 핀 순서는 2×4 셀 기준 컬럼 우선(column-major):
//   왼쪽 열(x0) 0-3행 → bit 0-3, 오른쪽 열(x1) 0-3행 → bit 4-7.
// fossilPatterns/PinPlate의 디코더(hexToDots)와 반드시 대칭이어야 한다.
const BIT_ORDER: { x: number; y: number; bit: number }[] = [
  { x: 0, y: 0, bit: 0 }, { x: 0, y: 1, bit: 1 }, { x: 0, y: 2, bit: 2 }, { x: 0, y: 3, bit: 3 },
  { x: 1, y: 0, bit: 4 }, { x: 1, y: 1, bit: 5 }, { x: 1, y: 2, bit: 6 }, { x: 1, y: 3, bit: 7 },
];

export type BoolGrid = boolean[][]; // 40 rows × 60 cols

export function boolGridToHex(grid: BoolGrid): string {
  const bytes: number[] = [];
  for (let cellY = 0; cellY < 10; cellY++) {
    for (let cellX = 0; cellX < 30; cellX++) {
      const baseX = cellX * 2;
      const baseY = cellY * 4;
      let byte = 0;
      for (const { x, y, bit } of BIT_ORDER) {
        if (grid[baseY + y]?.[baseX + x]) byte |= (1 << bit);
      }
      bytes.push(byte);
    }
  }
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}

export function hexToBoolGrid(hex: string): BoolGrid {
  const ROWS = 40, COLS = 60;
  const dots: BoolGrid = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
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

export function emptyGrid(): BoolGrid {
  return Array.from({ length: 40 }, () => new Array(60).fill(false));
}

/** 원본 영역의 테두리(경계 핀)만 남긴다 — "윤곽만 만져지는" 촉각 상태.
 *  주의: DTMS 실측 패턴은 이미 얇은 선 형태가 많아 outline≈full이 되기 쉽다(검증 결과 80~97%).
 *  발굴 체험처럼 확실한 밀도 차이가 필요한 곳에는 quarterDensity/halfDensity를 사용할 것. */
export function outlineOf(grid: BoolGrid): BoolGrid {
  return grid.map((row, y) => row.map((v, x) => {
    if (!v) return false;
    const up = grid[y - 1]?.[x] ?? false;
    const down = grid[y + 1]?.[x] ?? false;
    const left = grid[y]?.[x - 1] ?? false;
    const right = grid[y]?.[x + 1] ?? false;
    return !(up && down && left && right); // 사방이 모두 채워져 있지 않으면 경계
  }));
}

/** 1/4 밀도 — 가로세로 모두 짝수 좌표만 남겨, 도형 형태와 무관하게 항상 정확히 솎아낸다. */
export function quarterDensity(grid: BoolGrid): BoolGrid {
  return grid.map((row, y) => row.map((v, x) => v && x % 2 === 0 && y % 2 === 0));
}

/** 절반 밀도 — 체스판 형태로 솎아 "반쯤 드러난" 촉각 상태를 만든다. */
export function halfDensity(grid: BoolGrid): BoolGrid {
  return grid.map((row, y) => row.map((v, x) => v && (x + y) % 2 === 0));
}

/** 붓질 단계 — quarterDensity보다 조밀한 중간 밀도(짝수 열만 남김, 약 절반). */
export function partialOf(grid: BoolGrid): BoolGrid {
  return grid.map((row, y) => row.map((v, x) => v && x % 2 === 0));
}

/** 결정적(deterministic) 흙 질감 — 아직 아무것도 드러나지 않은 "그냥 흙" 상태. */
export function soilNoiseGrid(): BoolGrid {
  const g = emptyGrid();
  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 60; x++) {
      g[y][x] = ((x * 17 + y * 31) % 7) < 2;
    }
  }
  return g;
}
