export type Difficulty = 'explorer' | 'researcher' | 'paleontologist';

export interface TierConfig {
  id: Difficulty;
  label: string;
  desc: string;
  showFullFeature: boolean;   // false면 DINO_SHORT_HINTS만 노출
  maxInspectAttempts: number | null; // null = 무제한
  combo: boolean;             // 연속 정답 콤보 안내 여부
}

export const TIERS: TierConfig[] = [
  {
    id: 'explorer',
    label: '탐험가',
    desc: '촉각 특징을 자세히 설명해 줘요. 시간 제한 없이 여러 번 시도할 수 있어요.',
    showFullFeature: true,
    maxInspectAttempts: null,
    combo: false,
  },
  {
    id: 'researcher',
    label: '연구원',
    desc: '핵심 단서만 짧게 줘요. 화석 조사는 두 번까지 시도할 수 있어요.',
    showFullFeature: false,
    maxInspectAttempts: 2,
    combo: false,
  },
  {
    id: 'paleontologist',
    label: '고생물학자',
    desc: '핵심 단서만 짧게 줘요. 화석 조사는 두 번까지, 연속 정답에는 콤보가 붙어요.',
    showFullFeature: false,
    maxInspectAttempts: 2,
    combo: true,
  },
];
