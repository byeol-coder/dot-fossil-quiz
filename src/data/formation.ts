import { boolGridToHex, emptyGrid } from '../dotpad/tactileGen';
import type { BoolGrid } from '../dotpad/tactileGen';

export interface FormationStep {
  id: number;
  title: string;
  narration: string; // 음성 안내
  feel: string;       // 손끝으로 느껴야 할 것 (화면 텍스트)
}

export const FORMATION_STEPS: FormationStep[] = [
  {
    id: 1,
    title: '1. 동물이 죽고 강가에 묻혀요',
    narration: '공룡이 죽으면 시체가 강이나 호수 바닥에 가라앉고, 그 위로 고운 모래와 진흙이 덮여요. 아직은 흙만 얇게 덮인 상태예요.',
    feel: '판 위쪽에 아주 얇게 흩뿌려진 흙 알갱이만 느껴져요. 아직 뼈는 만져지지 않아요.',
  },
  {
    id: 2,
    title: '2. 모래와 진흙이 겹겹이 쌓여요',
    narration: '수백 년, 수천 년에 걸쳐 그 위로 또 다른 모래와 진흙이 쌓여요. 층이 점점 두꺼워지고 있어요.',
    feel: '위쪽 흙 층이 훨씬 두꺼워졌어요. 층의 아래쪽 경계선을 손끝으로 따라가 보세요.',
  },
  {
    id: 3,
    title: '3. 뼈의 성분이 돌처럼 굳어요',
    narration: '수백만 년이 지나면 압력과 시간 때문에 뼈의 성분이 서서히 광물로 바뀌어요. 물렁했던 뼈가 단단한 돌처럼 변하는 거예요. 이 과정을 화석화라고 해요.',
    feel: '흙 층이 더 두껍고 단단하게 느껴져요. 여전히 뼈는 만져지지 않지만, 바로 이 순간 화석이 만들어지고 있어요.',
  },
  {
    id: 4,
    title: '4. 땅이 움직이며 솟아올라요',
    narration: '땅속 힘에 의해 지층 전체가 서서히 밀려 올라와요. 이걸 융기라고 해요. 깊은 땅속에 있던 화석이 조금씩 지표면 가까이 다가와요.',
    feel: '흙 층이 조금 얇아졌어요. 아주 희미하게, 뼈의 가장자리 몇 개가 만져지기 시작해요.',
  },
  {
    id: 5,
    title: '5. 비바람이 지층을 깎아요',
    narration: '오랜 세월 비와 바람이 지표면을 깎아 내요. 이걸 침식이라고 해요. 침식이 계속되면서 화석을 덮고 있던 흙이 점점 벗겨져요.',
    feel: '흙이 많이 옅어졌어요. 뼈의 윤곽이 절반 정도 뚜렷하게 만져져요.',
  },
  {
    id: 6,
    title: '6. 화석이 드러나요!',
    narration: '드디어 화석이 땅 위로 완전히 드러났어요! 이때 고생물학자가 화석을 발견하고 조심스럽게 발굴을 시작해요.',
    feel: '흙은 사라지고, 화석 전체가 선명하게 만져져요. 발굴 체험에서 이 순간을 직접 경험해 볼 수 있어요.',
  },
];

// 침식 전 최대 매몰(3단계) → 융기·침식으로 다시 얕아짐(4~6단계).
const COVERAGE_ROWS: number[] = [4, 14, 26, 18, 8, 0];
// 화석 노출 밀도 — hidden(0) / faint(1) / partial(2) / full(3)
const BONE_REVEAL: number[] = [0, 0, 0, 1, 2, 3];

function sedimentAt(x: number, y: number, hardened: boolean): boolean {
  if (hardened) return ((x * 7 + y * 11) % 4) < 3;   // 암석질 — 밀도 높음
  return ((x * 17 + y * 31) % 7) < 3;                 // 흙질 — 밀도 낮음
}

function boneCurve(x: number, y: number): boolean {
  // 완만하게 휜 일반 '뼈' 실루엣 (특정 종이 아닌, 화석화 과정 설명용 도식)
  const bandY = y - 32;
  if (bandY < -3 || bandY > 3) return false;
  const wave = Math.sin(x / 7) * 2.4;
  return Math.abs(bandY - wave) < 1.4;
}

export function buildFormationHex(stepId: number): string {
  const idx = Math.max(1, Math.min(6, stepId)) - 1;
  const grid: BoolGrid = emptyGrid();
  const coverage = COVERAGE_ROWS[idx];
  const bone = BONE_REVEAL[idx];
  const hardened = idx >= 2 && idx <= 3; // 3~4단계: 광물화·압축으로 조직이 조밀해짐

  // 지층 텍스처
  for (let y = 0; y < coverage; y++) {
    for (let x = 0; x < 60; x++) {
      if (idx === 4) { // 침식 단계 — 성글게, 구멍 나듯이
        if ((x + y) % 3 !== 0 && sedimentAt(x, y, true)) grid[y][x] = true;
      } else if (sedimentAt(x, y, hardened)) {
        grid[y][x] = true;
      }
    }
  }
  // 지층 경계선 — 층의 끝을 손끝으로 뚜렷하게 확인
  if (coverage > 0 && coverage < 40) {
    for (let x = 0; x < 60; x++) grid[coverage - 1][x] = true;
  }

  // 화석 노출
  if (bone > 0) {
    for (let y = 28; y < 37; y++) {
      for (let x = 4; x < 56; x++) {
        if (!boneCurve(x, y)) continue;
        if (bone === 1 && x % 4 !== 0) continue;       // faint: 성긴 샘플링
        if (bone === 2 && x % 2 !== 0) continue;       // partial: 절반 밀도
        grid[y][x] = true;                             // full: 전체
      }
    }
  }

  return boolGridToHex(grid);
}
