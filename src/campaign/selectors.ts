import { DINOSAURS } from '../data/dinosaurs';
import { DINOSAUR_FRAGMENTS, FRAGMENT_LABELS } from '../data/dinosaurFragments';
import { SILHOUETTES } from '../data/dinoSilhouettes';
import type { Progress } from '../progress';
import { LEVEL_NAMES } from './campaignData';

export const FRAGMENT_KINDS = ['body', 'signature', 'footprint'] as const;
export type FragmentKind = typeof FRAGMENT_KINDS[number];

export function dinosaurResearchState(p: Progress, dinoId: string, selectedKind: FragmentKind = 'body') {
  const dino = DINOSAURS.find(d => d.id === dinoId)!;
  const fragment = p.campaign.fragments[dinoId] ?? { body:false, signature:false, footprint:false, restored:false };
  const owned = FRAGMENT_KINDS.filter(k => fragment[k]);
  const visualStatus = fragment.restored ? '복원 완료' : owned.length ? `${owned.length}/3 조각 수집` : '아직 발견 전';
  const fragmentStatus = FRAGMENT_KINDS.map(k => `${FRAGMENT_LABELS[k]} ${fragment[k] ? '획득' : '미획득'}`).join(', ');
  return {
    dino, fragment, visualStatus,
    speech: `${dino.name}. ${visualStatus}. ${fragmentStatus}. ${fragment.restored ? dino.behavior : '세 조각을 모으면 전체 실루엣이 열려요.'}`,
    hex: fragment.restored ? SILHOUETTES[dinoId] : fragment[selectedKind] ? DINOSAUR_FRAGMENTS[dinoId][selectedKind] : '0'.repeat(600),
    tactileLabel: fragment.restored ? `${dino.name} 전체 실루엣` : `${dino.name} ${FRAGMENT_LABELS[selectedKind]} ${fragment[selectedKind] ? '획득' : '잠김'}`,
  };
}

export function campaignStatusText(p: Progress) {
  const restored = Object.values(p.campaign.fragments).filter(x=>x.restored).length;
  const fragments = Object.values(p.campaign.fragments).reduce((n,x)=>n+Number(x.body)+Number(x.signature)+Number(x.footprint),0);
  const targetId = Object.keys(p.campaign.fragments).find(id=>!p.campaign.fragments[id].restored);
  const target = targetId ? dinosaurResearchState(p,targetId) : null;
  const missing = target ? FRAGMENT_KINDS.filter(k=>!target.fragment[k]).map(k=>FRAGMENT_LABELS[k]).join(', ') : '없음';
  const next = LEVEL_NAMES[Math.min(p.campaign.level,4)];
  return `${LEVEL_NAMES[p.campaign.level-1]} 레벨 ${p.campaign.level}, 연구 점수 ${p.campaign.points}점. 공룡 조각 15개 중 ${fragments}개, 완전 복원 ${restored}마리. ${target ? `${target.dino.name}에게 ${missing}이 남았습니다.` : '다섯 공룡을 모두 복원했습니다.'} 다음 해금은 ${next}입니다.`;
}
