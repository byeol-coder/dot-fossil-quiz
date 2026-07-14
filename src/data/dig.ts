export interface DigPhase {
  id: 'probe' | 'brush' | 'extract';
  label: string;
  narration: string; // 행동 직후 안내
  method: string;    // 실제 고생물학자의 방법론 지식
}

export const DIG_PHASES: DigPhase[] = [
  {
    id: 'probe',
    label: '1. 표면 조사',
    narration: '땅을 아주 살살 두드리며 안쪽에 무언가 있는지 확인해요. 손끝에 뭔가 걸리는 느낌이 나기 시작해요.',
    method: '실제 발굴 현장에서는 망치나 삽 대신, 작은 대나무 꼬챙이로 아주 천천히 흙을 두드려 화석의 위치를 먼저 확인해요. 서두르면 화석에 금이 갈 수 있거든요.',
  },
  {
    id: 'brush',
    label: '2. 붓질',
    narration: '부드러운 붓으로 흙을 조금씩 걷어내요. 화석의 윤곽이 점점 더 뚜렷해져요.',
    method: '고운 붓과 이쑤시개 같은 도구로 한 번에 아주 조금씩만 흙을 걷어내요. 한 화석을 완전히 드러내는 데 며칠에서 몇 주가 걸리기도 해요.',
  },
  {
    id: 'extract',
    label: '3. 정밀 추출',
    narration: '드디어 화석 전체가 드러났어요! 발견 성공이에요.',
    method: '화석이 다 드러나면 석고 붕대로 감싸 보호한 뒤 통째로 실험실로 옮겨요. 실험실에서 더 정밀하게 나머지 흙을 제거하고 연구해요.',
  },
];
