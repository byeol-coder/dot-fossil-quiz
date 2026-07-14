import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Progress } from '../progress';
import type { useDotPad } from '../dotpad/useDotPad';
import { useKeys } from '../hooks/useKeys';
import { speak, replay } from '../tts';
import { IS_EMBED, postExit, SHOW_PREVIEW } from '../embed';
import { BADGES, DINO_ORDER, FIELD_TOOLS, LEVEL_NAMES, MISSIONS, NEXT_CLUES, nextActivity } from '../campaign/campaignData';
import { campaignStatusText, dinosaurResearchState, FRAGMENT_KINDS } from '../campaign/selectors';
import { DINOSAUR_FRAGMENTS } from '../data/dinosaurFragments';
import { DINOSAURS } from '../data/dinosaurs';
import { PinPlate } from './PinPlate';
import { buildProgressHex } from '../dotpad/progressPattern';

export type JourneyScreen = 'campaign'|'research'|'training'|'status'|'learn'|'dig'|'formation'|'story'|'expedition'|'quiz1'|'quiz2';

type Pad = ReturnType<typeof useDotPad>;

function Menu({ items, idx }: { items:{label:string;hint:string;run?:()=>void}[]; idx:number }) {
  return <ul className="menu-list journey-menu" role="listbox" aria-label="선택 목록">{items.map((x,i)=><li key={x.label} role="option" aria-selected={i===idx} className={i===idx?'is-active':''} onClick={x.run}><span className="menu-label">{x.label}</span><span className="menu-hint">{x.hint}</span><span className="menu-chevron" aria-hidden="true">›</span></li>)}</ul>;
}

function useLinearMenu(items:{label:string;hint:string;run:()=>void}[], initial=0, onChange?: (i:number)=>void, onF1?:()=>void) {
  const [idx,setIdx] = useState(initial);
  const move = useCallback((d:number)=>{ const n=(idx+d+items.length)%items.length; setIdx(n); onChange?.(n); speak(`${items[n].label}. ${items[n].hint}`); },[idx,items,onChange]);
  useKeys(e=>{ if(e.key==='ArrowDown'||e.key==='ArrowRight')move(1); else if(e.key==='ArrowUp'||e.key==='ArrowLeft')move(-1); else if(e.key==='Enter')items[idx].run(); else if(e.key==='F2')replay(); else if(e.key==='F1')onF1?.(); });
  return idx;
}

export function JourneyHome({pad,progress,onNavigate,initialIndex,onIndex}:{pad:Pad;progress:Progress;onNavigate:(s:JourneyScreen)=>void;initialIndex:number;onIndex:(i:number)=>void}) {
  const items=useMemo(()=>{
    const restored=Object.values(progress.campaign.fragments).filter(x=>x.restored).length;
    const a=[
      {label:'탐험 시작',hint:`${LEVEL_NAMES[progress.campaign.level-1]} · ${progress.campaign.currentMissionId.replace('mission-','')}구역 · 조각 ${Object.values(progress.campaign.fragments).reduce((n,x)=>n+Number(x.body)+Number(x.signature)+Number(x.footprint),0)}/15`,run:()=>onNavigate('campaign')},
      {label:'공룡 연구 도감',hint:`복원 ${restored}/5 · 조각과 배지, 도구를 확인해요`,run:()=>onNavigate('research')},
      {label:'훈련 연구소',hint:'기존 학습·발굴·이야기·퀴즈를 자유롭게 연습해요',run:()=>onNavigate('training')},
    ];
    if(IS_EMBED)a.push({label:'게임 나가기',hint:'택타일 월드로 돌아가요',run:()=>{speak('게임을 마칩니다.');postExit();}});
    return a;
  },[progress,onNavigate]);
  const idx=useLinearMenu(items,initialIndex,onIndex,()=>speak('화살표로 이동하고 엔터로 선택하세요. 에프3은 전체 연구 진행도예요.'));
  useEffect(()=>{speak(`닷 화석 연구소. 연구 레벨 ${progress.campaign.level}. 탐험 시작, 공룡 연구 도감, 훈련 연구소 중 골라 주세요.`);pad.sendText(`연구 레벨 ${progress.campaign.level}`);},[]);// eslint-disable-line
  return <section className="menu-screen" aria-label="메인 메뉴"><p className="eyebrow">FOSSIL JOURNEY · LEVEL {progress.campaign.level}</p><h2 className="screen-title">다음에는 어떤 공룡을 발견할까?</h2><p className="campaign-summary"><strong>{LEVEL_NAMES[progress.campaign.level-1]}</strong> · 연구 점수 {progress.campaign.points} · 현재 임무 {progress.campaign.currentMissionId.replace('mission-','')} / 5</p><Menu items={items} idx={idx}/><p className="key-help">↑↓ 이동 · Enter 선택 · F3 전체 진행도 · F2 다시 듣기</p></section>;
}

export function CampaignMissionScreen({pad,progress,onNavigate,onHome,updateProgress}:{pad:Pad;progress:Progress;onNavigate:(s:JourneyScreen)=>void;onHome:()=>void;updateProgress:(fn:(p:Progress)=>Progress)=>void}) {
  const mission=MISSIONS[progress.campaign.level-1]; const activity=nextActivity(progress);
  const clue=NEXT_CLUES[progress.campaign.level-1];
  const items=useMemo(()=>[
    {label:'현재 임무 이어서 하기',hint:mission.goal,run:()=>onNavigate(activity)},
    {label:'다음 공룡의 단서 만지기',hint:clue,run:()=>{const id=DINO_ORDER[progress.campaign.level-1];pad.sendHex(DINOSAUR_FRAGMENTS[id].signature);pad.sendText('다음 공룡 단서');updateProgress(p=>({...p,campaign:{...p.campaign,viewedNextClueIds:Array.from(new Set([...p.campaign.viewedNextClueIds,`clue-${progress.campaign.level}`]))}}));speak(`다음 공룡의 미스터리 단서. ${clue}`);}},
    {label:'전체 연구 진행도 확인',hint:'등급, 조각 세 칸, 다음 해금 조건을 만져 봐요',run:()=>onNavigate('status')},
    {label:'공룡 연구 도감 보기',hint:'모은 조각과 보상을 확인해요',run:()=>onNavigate('research')},
    {label:'홈으로',hint:'메인 메뉴로 돌아가요',run:onHome},
  ],[mission,activity,clue,pad,progress,onNavigate,onHome,updateProgress]);
  const idx=useLinearMenu(items,0,undefined,onHome);
  useEffect(()=>{speak(`탐험 ${mission.level}단계, ${mission.title}. ${mission.goal} 보상은 ${mission.reward}. ${mission.teaser}`);pad.sendText(mission.title);},[]);// eslint-disable-line
  return <section className="campaign-screen"><p className="eyebrow">탐험 {mission.level} / 5 · 연구 점수 {progress.campaign.points}</p><h2 className="screen-title">{mission.title}</h2><p className="lede">{mission.goal}</p><div className="mission-reward"><strong>이번 보상</strong><span>{mission.reward}</span></div><p className="next-clue"><strong>다음 미스터리</strong> {mission.teaser}</p><Menu items={items} idx={idx}/><p className="key-help">↑↓ 이동 · Enter 선택 · F3 전체 진행도 · F1 홈</p></section>;
}

export function TrainingLabScreen({onNavigate,onHome}:{onNavigate:(s:JourneyScreen)=>void;onHome:()=>void}) {
  const items=useMemo(()=>[
    ['화석 탐색 학습','다섯 화석을 자유롭게 만져 봐요','learn'],['발굴 체험','탐침·붓질·추출을 연습해요','dig'],['화석이 되기까지','화석 형성 과정을 들어요','formation'],['공룡 이야기','다섯 공룡의 생태를 연구해요','story'],['화석 신호 추적','난이도를 골라 신호를 쫓아요','expedition'],['퀴즈 1 · 부위','화석 부위를 맞혀요','quiz1'],['퀴즈 2 · 주인','발자국 조각의 주인을 맞혀요','quiz2'],
  ].map(([label,hint,s])=>({label,hint,run:()=>onNavigate(s as JourneyScreen)})).concat([{label:'홈으로',hint:'메인 메뉴로 돌아가요',run:onHome}]),[onNavigate,onHome]);
  const idx=useLinearMenu(items,0,undefined,onHome);
  useEffect(()=>speak('훈련 연구소. 기존 활동을 자유롭게 연습할 수 있어요.'),[]);
  return <section className="menu-screen"><p className="eyebrow">TRAINING LAB</p><h2 className="screen-title">훈련 연구소</h2><Menu items={items} idx={idx}/><p className="key-help">↑↓ 이동 · Enter 선택 · F1 홈</p></section>;
}

export function ResearchCollectionScreen({pad,progress,onHome}:{pad:Pad;progress:Progress;onHome:()=>void}) {
  const [idx,setIdx]=useState(0); const [kindIdx,setKindIdx]=useState(0); const total=DINO_ORDER.length+1;
  const state=idx<DINO_ORDER.length?dinosaurResearchState(progress,DINO_ORDER[idx],FRAGMENT_KINDS[kindIdx]):null;
  const announce=useCallback((i:number,k=kindIdx)=>{if(i===DINO_ORDER.length){speak('홈으로. 엔터를 누르세요.');return;}const s=dinosaurResearchState(progress,DINO_ORDER[i],FRAGMENT_KINDS[k]);pad.sendHex(s.hex);pad.sendText(s.tactileLabel);speak(s.speech);},[progress,pad,kindIdx]);
  useEffect(()=>announce(0),[]);// eslint-disable-line
  useKeys(e=>{if(e.key==='ArrowDown'){const n=(idx+1)%total;setIdx(n);setKindIdx(0);announce(n,0);}else if(e.key==='ArrowUp'){const n=(idx-1+total)%total;setIdx(n);setKindIdx(0);announce(n,0);}else if((e.key==='ArrowRight'||e.key==='ArrowLeft')&&idx<DINO_ORDER.length){const n=(kindIdx+(e.key==='ArrowRight'?1:2))%3;setKindIdx(n);announce(idx,n);}else if(e.key==='Enter'){if(idx===DINO_ORDER.length)onHome();else announce(idx);}else if(e.key==='F1')onHome();else if(e.key==='F2')replay();else if(e.key==='F4'&&state)pad.sendHex(state.hex);});
  const earned=BADGES.filter(b=>progress.campaign.earnedBadges[b.id]); const tools=FIELD_TOOLS.filter(t=>progress.campaign.unlockedToolIds.includes(t.id));
  return <section className="collection-screen"><p className="eyebrow">공룡 연구 도감 · 조각 {kindIdx+1}/3</p><h2 className="screen-title">{state?state.dino.name:'홈으로'}</h2>{state&&<><p className="lede">{state.visualStatus}</p><div className="fragment-row" aria-label="공룡 조각 상태">{FRAGMENT_KINDS.map((k,i)=><span key={k} className={`${state.fragment[k]?'is-owned':'is-locked'} ${i===kindIdx?'is-selected':''}`}>{k==='body'?'몸통':k==='signature'?'대표 특징':'발자국'} {state.fragment[k]?'획득':'잠김'}</span>)}</div>{SHOW_PREVIEW&&<PinPlate hex={state.hex} label={state.tactileLabel}/>}</>}<ul className="research-list" role="listbox" aria-label="공룡 목록">{DINO_ORDER.map((id,i)=>{const s=dinosaurResearchState(progress,id);return <li key={id} role="option" aria-selected={i===idx} className={i===idx?'is-active':''} onClick={()=>{setIdx(i);setKindIdx(0);announce(i,0)}}><strong>{s.dino.name}</strong><span>{s.visualStatus}</span></li>})}<li role="option" aria-selected={idx===DINO_ORDER.length} className={idx===DINO_ORDER.length?'is-active':''} onClick={onHome}>홈으로</li></ul><div className="reward-shelf"><p><strong>도구</strong> {tools.map(x=>x.name).join(' · ')}</p><p><strong>배지</strong> {earned.length?earned.map(x=>`${x.name}(${progress.campaign.earnedBadges[x.id]})`).join(' · '):'아직 없음'}</p></div><p className="key-help">↑↓ 공룡 · ←→ 조각 · F4 다시 출력 · F1 홈</p></section>;
}

export function CampaignStatusScreen({pad,progress,onReturn}:{pad:Pad;progress:Progress;onReturn:()=>void}) {
  const hex=buildProgressHex(progress); const text=campaignStatusText(progress);
  useEffect(()=>{pad.sendHex(hex);pad.sendText(`연구 레벨 ${progress.campaign.level}`);speak(`${text} 위쪽은 연구 레벨 다섯 칸, 가운데는 현재 공룡 조각 세 칸, 아래쪽은 연구 점수 막대예요. 엔터나 에프3으로 돌아가세요.`);const off=window.setTimeout(()=>pad.sendHex('0'.repeat(600)),240);const on=window.setTimeout(()=>pad.sendHex(hex),430);return()=>{clearTimeout(off);clearTimeout(on);};},[]);// eslint-disable-line
  useKeys(e=>{if(e.key==='Enter'||e.key==='F3'||e.key==='Escape')onReturn();else if(e.key==='F2')replay();else if(e.key==='F4')pad.sendHex(hex);});
  return <section className="status-screen"><p className="eyebrow">F3 · 전체 진행도</p><h2 className="screen-title">연구 레벨 {progress.campaign.level}</h2><p className="lede">연구 점수 {progress.campaign.points}점</p><p className="fact">{text}</p>{SHOW_PREVIEW&&<PinPlate hex={hex} label="연구 진행도 촉각 블록"/>}<p className="key-help">Enter / F3 / Escape 이전 화면 · F4 다시 출력</p></section>;
}
