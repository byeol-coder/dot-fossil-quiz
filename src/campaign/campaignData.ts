import type { Progress } from '../progress';

export const DINO_ORDER = ['brachiosaurus', 'velociraptor', 'spinosaurus', 'parasaurolophus', 'ankylosaurus'] as const;
export const LEVEL_NAMES = ['견습 발굴가', '현장 탐험가', '화석 복원가', '고생물 탐정', '박물관 수석 연구원'] as const;

export const FIELD_TOOLS = [
  { id: 'probe', level: 1, name: '탐침', desc: '흙 속의 단단한 화석 신호를 찾는 도구' },
  { id: 'brush', level: 2, name: '작은 붓', desc: '화석을 다치지 않게 흙을 털어 내는 도구' },
  { id: 'restore-kit', level: 3, name: '복원 키트', desc: '모은 조각을 하나의 공룡으로 잇는 도구' },
  { id: 'magnifier', level: 4, name: '확대경', desc: '아주 작은 발자국과 뼈 자국을 비교하는 도구' },
  { id: 'museum-case', level: 5, name: '연구 전시대', desc: '완성한 연구 기록을 안전하게 보관하는 도구' },
] as const;

export const BADGES = [
  { id: 'shape-detective', name: '모양 탐정', desc: '화석 5종을 모두 탐색했어요.' },
  { id: 'careful-digger', name: '꼼꼼한 발굴가', desc: '처음으로 화석을 안전하게 발굴했어요.' },
  { id: 'strata-researcher', name: '지층 연구자', desc: '화석이 만들어지는 과정을 끝까지 살폈어요.' },
  { id: 'footprint-tracker', name: '발자국 추적자', desc: '처음으로 발자국 조각의 주인을 찾았어요.' },
  { id: 'restoration-expert', name: '복원 전문가', desc: '공룡 3마리를 완전히 복원했어요.' },
  { id: 'tactile-paleontologist', name: '촉각 고생물학자', desc: '고생물학자 난이도에서 3연속 정답을 기록했어요.' },
] as const;

export const MISSIONS = [
  { id: 'mission-1', level: 1, title: '첫 화석 신호', goal: '화석 3개를 탐색하고 1개를 발굴하세요.', reward: '탐침과 첫 몸통 조각', teaser: '다음 흔적은 아주 긴 목을 가진 공룡을 가리켜요.' },
  { id: 'mission-2', level: 2, title: '뼈의 주인 찾기', goal: '신호 추적에서 대표 특징 조각 3개를 찾으세요.', reward: '작은 붓과 새로운 후보 카드', teaser: '모래 위에 낫처럼 굽은 발톱 자국이 남아 있어요.' },
  { id: 'mission-3', level: 3, title: '세 조각의 비밀', goal: '몸통·대표 특징·발자국을 모아 공룡 1마리를 복원하세요.', reward: '복원 키트와 복원 기록', teaser: '물가 가까이에서 등 위로 솟은 돛의 흔적이 보여요.' },
  { id: 'mission-4', level: 4, title: '생태 연구 보고서', goal: '공룡 이야기 3개를 읽고 주인 찾기 정답 3개를 기록하세요.', reward: '확대경과 고급 연구 노트', teaser: '멀리서 낮은 나팔 소리 같은 울림이 들려요.' },
  { id: 'mission-5', level: 5, title: '박물관의 밤', goal: '공룡 3마리를 완전히 복원하세요.', reward: '연구 전시대와 복원 전문가 배지', teaser: '아직 이름 없는 세 개의 뿔 자국이 다음 탐사를 기다려요.' },
] as const;

export const NEXT_CLUES = [
  '아주 긴 목이 높은 나뭇잎 쪽으로 이어져 있어요.',
  '모래 위에 낫처럼 굽은 발톱 자국이 남아 있어요.',
  '물가에서 등 위로 크게 솟은 돛의 흔적이 보여요.',
  '머리 뒤로 길게 휜 볏에서 낮은 울림이 들려요.',
  '아직 도감에 없는 세 개의 뿔 자국이 발견됐어요.',
] as const;

export function missionComplete(level: number, p: Progress): boolean {
  const learned = Object.values(p.learned).filter(Boolean).length;
  const dug = Object.values(p.digDone).filter(Boolean).length;
  const found = Object.values(p.expeditionFound).filter(Boolean).length;
  const stories = Object.values(p.storyRead).filter(Boolean).length;
  const ownerAnswers = Object.values(p.correct).filter(x => x?.lv2).length;
  const restored = Object.values(p.campaign.fragments).filter(x => x.restored).length;
  if (level === 1) return learned >= 3 && dug >= 1;
  if (level === 2) return found >= 3;
  if (level === 3) return restored >= 1;
  if (level === 4) return stories >= 3 && ownerAnswers >= 3;
  return restored >= 3;
}

export function nextActivity(p: Progress): 'learn' | 'dig' | 'expedition' | 'quiz2' | 'story' | 'research' {
  const level = p.campaign.level;
  if (level === 1) return Object.values(p.learned).filter(Boolean).length < 3 ? 'learn' : 'dig';
  if (level === 2) return 'expedition';
  if (level === 3) {
    const target = DINO_ORDER.find(id => !p.campaign.fragments[id]?.restored);
    if (!target) return 'research';
    const f = p.campaign.fragments[target];
    if (!f?.body) return 'dig';
    if (!f?.signature) return 'expedition';
    return 'quiz2';
  }
  if (level === 4) return Object.values(p.storyRead).filter(Boolean).length < 3 ? 'story' : 'quiz2';
  return Object.values(p.campaign.fragments).filter(x => x.restored).length >= 3 ? 'research' : 'expedition';
}
