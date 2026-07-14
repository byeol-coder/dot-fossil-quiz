import { PARTS } from './data/parts';
import { BADGES, DINO_ORDER, FIELD_TOOLS, MISSIONS, missionComplete } from './campaign/campaignData';

const STORAGE_KEY = 'dot-fossil-quiz.progress.v3';
const V2_KEY = 'dot-fossil-quiz.progress.v2';

export interface FragmentProgress { body: boolean; signature: boolean; footprint: boolean; restored: boolean }
export interface CampaignProgress {
  version: 3;
  level: number;
  points: number;
  currentMissionId: string;
  completedMissionIds: string[];
  unlockedToolIds: string[];
  earnedBadges: Record<string, string>;
  fragments: Record<string, FragmentProgress>;
  unlockedDinosaurIds: string[];
  viewedNextClueIds: string[];
}

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
  expeditionBestCombo: number;
  campaign: CampaignProgress;
}

function defaults(): Progress {
  const fragments = Object.fromEntries(DINO_ORDER.map(id => [id, { body: false, signature: false, footprint: false, restored: false }]));
  return {
    learned: {}, correct: {}, best: { lv1: 0, lv2: 0 },
    storyRead: {}, digDone: {}, formationDone: false,
    expeditionFound: {}, expeditionRounds: 0, restored: {}, expeditionBestCombo: 0,
    campaign: { version: 3, level: 1, points: 0, currentMissionId: MISSIONS[0].id, completedMissionIds: [], unlockedToolIds: ['probe'], earnedBadges: {}, fragments, unlockedDinosaurIds: [], viewedNextClueIds: [] },
  };
}

function count(v: Record<string, boolean>) { return Object.values(v).filter(Boolean).length; }

export function reconcileProgress(input: Progress): Progress {
  const base = defaults();
  const p: Progress = { ...base, ...input, best: { ...base.best, ...input.best }, campaign: { ...base.campaign, ...input.campaign, fragments: { ...base.campaign.fragments, ...input.campaign?.fragments }, earnedBadges: { ...input.campaign?.earnedBadges } } };
  const fragments = { ...p.campaign.fragments };
  for (const part of PARTS) {
    const old = fragments[part.dinosaurId] ?? { body:false, signature:false, footprint:false, restored:false };
    const allOld = !!p.restored[part.dinosaurId];
    const body = old.body || !!p.digDone[part.id] || allOld;
    const signature = old.signature || !!p.expeditionFound[part.id] || allOld;
    const footprint = old.footprint || !!p.correct[part.id]?.lv2 || allOld;
    fragments[part.dinosaurId] = { body, signature, footprint, restored: body && signature && footprint };
  }
  const completed: string[] = [];
  const probe: Progress = { ...p, campaign: { ...p.campaign, fragments } };
  for (const mission of MISSIONS) { if (missionComplete(mission.level, probe)) completed.push(mission.id); else break; }
  const level = Math.min(5, completed.length + 1);
  const restored = Object.fromEntries(Object.entries(fragments).filter(([,v]) => v.restored).map(([id]) => [id,true]));
  const points = count(p.learned)*10 + count(p.digDone)*15 + count(p.expeditionFound)*15 +
    Object.values(p.correct).filter(x => x?.lv1).length*10 + Object.values(p.correct).filter(x => x?.lv2).length*15 +
    count(p.storyRead)*5 + (p.formationDone ? 20 : 0) + Object.keys(restored).length*30;
  const earned = { ...p.campaign.earnedBadges };
  const now = new Date().toISOString().slice(0,10);
  const award = (id: string, ok: boolean) => { if (ok && !earned[id]) earned[id]=now; };
  award('shape-detective', count(p.learned)>=5); award('careful-digger', count(p.digDone)>=1);
  award('strata-researcher', p.formationDone); award('footprint-tracker', Object.values(fragments).some(x=>x.footprint));
  award('restoration-expert', Object.keys(restored).length>=3); award('tactile-paleontologist', p.expeditionBestCombo>=3);
  const unlockedDinosaurIds = Object.entries(fragments).filter(([,x])=>x.body||x.signature||x.footprint).map(([id])=>id);
  return { ...p, restored: { ...p.restored, ...restored }, campaign: {
    ...p.campaign, version: 3, level, points, fragments, completedMissionIds: completed,
    currentMissionId: MISSIONS[Math.min(completed.length, MISSIONS.length-1)].id,
    unlockedToolIds: FIELD_TOOLS.filter(x=>x.level<=level).map(x=>x.id), earnedBadges: earned, unlockedDinosaurIds,
  } };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(V2_KEY);
    if (raw) {
      const migrated = reconcileProgress({ ...defaults(), ...JSON.parse(raw) });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch { /* 손상 시 초기화 */ }
  return defaults();
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reconcileProgress(p))); } catch { /* 저장 실패 무시 */ }
}

export const PROGRESS_STORAGE_KEY = STORAGE_KEY;
