import { boolGridToHex, emptyGrid } from '../dotpad/tactileGen';
import type { BoolGrid } from '../dotpad/tactileGen';

export interface DinoLife {
  id: string;
  name: string;
  era: string;          // 시대
  eraOrder: number;      // 1=트라이아스기 2=쥐라기 3=백악기 (시대 순서 감각용)
  diet: '초식' | '육식';
  habitat: string;
  lengthM: number;
  behavior: string;      // 생애·행동 한 줄 지식
  hook: string;          // 흥미를 끄는 도입 문장
}

export const DINOSAURS: DinoLife[] = [
  {
    id: 'brachiosaurus',
    name: '브라키오사우루스',
    era: '쥐라기 후기',
    eraOrder: 2,
    diet: '초식',
    habitat: '숲과 강가의 넓은 평원',
    lengthM: 23,
    behavior: '앞다리가 뒷다리보다 길어서 몸이 앞으로 살짝 기울어져 있었고, 그 덕분에 긴 목을 세워 나무 꼭대기의 잎을 먹을 수 있었어요.',
    hook: '목이 4층 건물 높이까지 닿는 초식 공룡이에요.',
  },
  {
    id: 'velociraptor',
    name: '벨로키랍토르',
    era: '백악기 후기',
    eraOrder: 3,
    diet: '육식',
    habitat: '몽골 고비 사막 같은 건조한 모래땅',
    lengthM: 2,
    behavior: '영화 속 모습과 달리 실제로는 칠면조만 한 크기였고, 온몸에 깃털이 나 있었을 것으로 추정돼요. 무리를 지어 사냥했을 가능성이 있어요.',
    hook: '작지만 재빠르고 영리했던 사냥꾼이에요.',
  },
  {
    id: 'spinosaurus',
    name: '스피노사우루스',
    era: '백악기 중기',
    eraOrder: 3,
    diet: '육식',
    habitat: '북아프리카의 강과 늪지대',
    lengthM: 15,
    behavior: '지금까지 알려진 육식 공룡 중 가장 몸집이 커요. 노처럼 생긴 긴 꼬리로 헤엄쳤고, 주로 물고기를 잡아먹은 반수생 공룡이었어요.',
    hook: '땅보다 물속에서 더 많은 시간을 보낸 공룡이에요.',
  },
  {
    id: 'parasaurolophus',
    name: '파라사우롤로푸스',
    era: '백악기 후기',
    eraOrder: 3,
    diet: '초식',
    habitat: '강가의 울창한 숲',
    lengthM: 10,
    behavior: '머리 위로 길게 뻗은 볏 속이 관악기처럼 비어 있어서, 숨을 내쉬면 트롬본과 비슷한 낮은 소리가 났어요. 이 소리로 무리와 신호를 주고받았을 거예요.',
    hook: '머리에 자연이 만든 나팔을 달고 다닌 공룡이에요.',
  },
  {
    id: 'ankylosaurus',
    name: '안킬로사우루스',
    era: '백악기 말기',
    eraOrder: 3,
    diet: '초식',
    habitat: '탁 트인 평원',
    lengthM: 7,
    behavior: '등 전체가 딱딱한 뼈판 갑옷으로 덮여 있고, 꼬리 끝에는 뼈로 된 커다란 곤봉이 달려 있었어요. 위협을 느끼면 몸을 낮추고 꼬리를 무기처럼 휘둘렀어요.',
    hook: '온몸이 갑옷이고 꼬리는 망치인 공룡이에요.',
  },
];

export const ERA_ORDER = ['트라이아스기', '쥐라기', '백악기'];

const REFERENCE_M = 12; // 스쿨버스 한 대 기준
const MAX_M = 25;       // 막대 스케일 상한
const BAR_MAX_COLS = 54;
const BAR_START_COL = 3;

function fillBar(grid: BoolGrid, rowStart: number, rowEnd: number, cols: number) {
  for (let y = rowStart; y < rowEnd; y++) {
    for (let x = BAR_START_COL; x < BAR_START_COL + cols; x++) {
      if (x < 60) grid[y][x] = true;
    }
  }
}

/**
 * 공룡 길이 vs 스쿨버스(12m) 비교 촉각 막대.
 * 위쪽 막대 = 공룡 길이, 아래쪽 막대 = 스쿨버스(항상 동일 길이) — 두 막대 길이를
 * 손끝으로 비교하면 "몇 배 더 긴지"를 직접 느낄 수 있다.
 */
export function buildSizeCompareHex(lengthM: number): string {
  const grid = emptyGrid();
  const dinoCols = Math.max(2, Math.round((Math.min(lengthM, MAX_M) / MAX_M) * BAR_MAX_COLS));
  const busCols = Math.round((REFERENCE_M / MAX_M) * BAR_MAX_COLS);

  fillBar(grid, 8, 16, dinoCols);   // 공룡 막대 (위)
  fillBar(grid, 24, 32, busCols);   // 스쿨버스 막대 (아래, 항상 동일)

  return boolGridToHex(grid);
}

export function sizeCompareSentence(d: DinoLife): string {
  const times = (d.lengthM / REFERENCE_M).toFixed(1).replace(/\.0$/, '');
  if (d.lengthM >= REFERENCE_M) {
    return `길이는 약 ${d.lengthM}미터로, 스쿨버스 한 대(12미터)의 약 ${times}배예요.`;
  }
  return `길이는 약 ${d.lengthM}미터로, 스쿨버스 한 대(12미터)보다 짧아요.`;
}
