// 각 과제의 정답은 실제 600-hex 패턴을 분석해 도출했다(연결요소, 상/하·좌/우 핀 밀도,
// 곡선 방향, 가로 폭 비교). 분석 방법은 README의 "조사 과제 정답 산출" 절 참고.

export interface InvestigationTask {
  prompt: string;
  options: string[];
  correctIndex: number;
  correctFeedback: string;
  wrongFeedback: string;
}

export const INVESTIGATION_TASKS: Record<string, InvestigationTask> = {
  rib: {
    prompt: '가장 두꺼운 부분은 어디일까요?',
    options: ['위쪽', '아래쪽'],
    correctIndex: 1,
    correctFeedback: '맞아요, 아래쪽이 더 두꺼워요.',
    wrongFeedback: '다시 만져 보세요 — 아래쪽으로 갈수록 더 두꺼워져요.',
  },
  claw: {
    prompt: '발가락 자국이 뻗은 방향을 골라 보세요.',
    options: ['위로 뻗음', '아래로 뻗음', '곧게 뻗음'],
    correctIndex: 1,
    correctFeedback: '맞아요, 발가락 자국이 아래쪽으로 뻗어 있어요.',
    wrongFeedback: '다시 만져 보세요 — 발가락 자국은 아래쪽으로 뻗어 있어요.',
  },
  vertebra: {
    prompt: '더 가늘고 뾰족한 끝은 어느 쪽일까요?',
    options: ['왼쪽 끝', '오른쪽 끝'],
    correctIndex: 0,
    correctFeedback: '맞아요, 왼쪽 관절 쪽 끝이 더 가늘고 뾰족해요.',
    wrongFeedback: '다시 만져 보세요 — 왼쪽으로 갈수록 더 가늘어져요.',
  },
  legfoot: {
    prompt: '이빨이 더 촘촘하게 벌어진 쪽은 위쪽일까요, 아래쪽일까요?',
    options: ['위쪽', '아래쪽'],
    correctIndex: 1,
    correctFeedback: '맞아요, 아래쪽에 이빨 돌기가 더 넓게 벌어져 있어요.',
    wrongFeedback: '다시 만져 보세요 — 아래쪽으로 갈수록 이빨 돌기가 더 넓게 벌어져요.',
  },
  partialSkeleton: {
    prompt: '머리뼈 몸통이 더 두꺼운 쪽은 위쪽일까요, 아래쪽일까요?',
    options: ['위쪽', '아래쪽'],
    correctIndex: 0,
    correctFeedback: '맞아요, 위쪽 머리뼈 몸통이 더 두꺼워요. 아래쪽은 이빨이 난 얇은 턱선이에요.',
    wrongFeedback: '다시 만져 보세요 — 위쪽이 더 두툼하고, 아래쪽은 이빨이 난 얇은 턱선이에요.',
  },
};
