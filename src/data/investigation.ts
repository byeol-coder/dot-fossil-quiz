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
    prompt: '굽은 방향을 골라 보세요.',
    options: ['위로 굽음', '아래로 굽음', '곧게 뻗음'],
    correctIndex: 1,
    correctFeedback: '맞아요, 아래로 크게 굽어 있어요. 낫처럼 생긴 이유예요.',
    wrongFeedback: '다시 만져 보세요 — 이 화석은 아래쪽으로 굽어 있어요.',
  },
  vertebra: {
    prompt: '뾰족한 끝은 어느 쪽일까요?',
    options: ['왼쪽 끝', '오른쪽 끝'],
    correctIndex: 0,
    correctFeedback: '맞아요, 왼쪽 끝이 더 가늘고 뾰족해요.',
    wrongFeedback: '다시 만져 보세요 — 왼쪽으로 갈수록 더 가늘어져요.',
  },
  legfoot: {
    prompt: '더 넓게 퍼진 쪽은 위쪽일까요, 아래쪽일까요?',
    options: ['위쪽', '아래쪽'],
    correctIndex: 1,
    correctFeedback: '맞아요, 아래쪽이 발처럼 넓게 퍼져 있어요.',
    wrongFeedback: '다시 만져 보세요 — 아래쪽으로 갈수록 옆으로 더 넓게 퍼져요.',
  },
  partialSkeleton: {
    prompt: '이 화석은 하나로 이어져 있을까요, 여러 조각으로 나뉘어 있을까요?',
    options: ['하나로 이어짐', '여러 조각으로 나뉨'],
    correctIndex: 1,
    correctFeedback: '맞아요, 여러 뼈 조각이 흩어져 있어요. 그래서 이름이 부분 골격이에요.',
    wrongFeedback: '다시 만져 보세요 — 군데군데 끊어진 뼈 조각들이 느껴질 거예요.',
  },
};
