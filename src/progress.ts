const STORAGE_KEY = 'dot-fossil-quiz.progress.v2';

export interface Progress {
  learned: Record<string, boolean>;                          // 부위 탐색 학습 완료
  correct: Record<string, { lv1?: boolean; lv2?: boolean }>; // 퀴즈 정답 경험
  best: { lv1: number; lv2: number };                        // 최고 점수 (5점 만점)
  storyRead: Record<string, boolean>;                        // 공룡 이야기 완독
  digDone: Record<string, boolean>;                          // 발굴 체험 완료
  formationDone: boolean;                                    // 화석이 되기까지 완주
  expeditionFound: Record<string, boolean>;                  // 신호 추적으로 발견
  expeditionRounds: number;                                  // 신호 추적 발견 횟수
  restored: Record<string, boolean>;                         // 공룡 복원 완료 (탐사 모드)
}

function defaults(): Progress {
  return {
    learned: {}, correct: {}, best: { lv1: 0, lv2: 0 },
    storyRead: {}, digDone: {}, formationDone: false,
    expeditionFound: {}, expeditionRounds: 0, restored: {},
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch { /* 손상 시 초기화 */ }
  return defaults();
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* 저장 실패 무시 */ }
}
