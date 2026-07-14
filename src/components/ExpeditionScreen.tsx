import { useCallback, useEffect, useRef, useState } from 'react';
import { PARTS, shuffle } from '../data/parts';
import type { PartDef } from '../data/parts';
import { DINOSAURS } from '../data/dinosaurs';
import { SILHOUETTES, DINO_FEATURES, DINO_SHORT_HINTS } from '../data/dinoSilhouettes';
import { INVESTIGATION_TASKS } from '../data/investigation';
import { TIERS } from '../data/difficulty';
import type { TierConfig } from '../data/difficulty';
import {
  FIELD_W, FIELD_H, randomTarget, distanceOf, closenessOf, distanceCategory,
  buildRadarHex, directionHint,
} from '../data/expedition';
import type { Pos } from '../data/expedition';
import { resumeAudio, playPing, playFound, playBump, playSignature, playRestoreTick } from '../audio/beacon';
import type { useDotPad } from '../dotpad/useDotPad';
import { PinPlate } from './PinPlate';
import { speak, replay } from '../tts';
import { SHOW_PREVIEW } from '../embed';
import { useKeys } from '../hooks/useKeys';
import type { Progress } from '../progress';

const CENTER: Pos = { x: Math.floor(FIELD_W / 2), y: Math.floor(FIELD_H / 2) };
const OWNER_IDS = DINOSAURS.map(d => d.id); // 실루엣·특징 자산이 있는 5종만 카드 후보로 사용

type Phase = 'difficulty' | 'searching' | 'inspect' | 'cards' | 'restore' | 'reward';

function pickCandidates(correctId: string): string[] {
  const others = shuffle(OWNER_IDS.filter(id => id !== correctId)).slice(0, 2);
  return shuffle([correctId, ...others]);
}

export function ExpeditionScreen({
  pad, onHome, updateProgress,
}: {
  pad: ReturnType<typeof useDotPad>;
  onHome: () => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
}) {
  const [pos, setPos] = useState<Pos>(CENTER);
  const [target, setTarget] = useState<Pos>(() => randomTarget(CENTER));
  const [phase, setPhase] = useState<Phase>('difficulty');
  const [rounds, setRounds] = useState(0);
  const pool = useRef(shuffle(PARTS));
  const poolIdx = useRef(0);
  const prevCategory = useRef('');
  const announcedAdjacent = useRef(false);

  const [tierIdx, setTierIdx] = useState(0);
  const tier = useRef<TierConfig>(TIERS[0]);
  const [combo, setCombo] = useState(0);

  const [taskChoice, setTaskChoice] = useState(0);
  const [taskLocked, setTaskLocked] = useState(false);
  const [taskWrongHint, setTaskWrongHint] = useState<string | null>(null);
  const [inspectAttemptsLeft, setInspectAttemptsLeft] = useState<number | null>(null);

  const [candidates, setCandidates] = useState<string[]>([]);
  const [cardIdx, setCardIdx] = useState(0);
  const [cardWrongHint, setCardWrongHint] = useState<string | null>(null);

  const ticksPlayed = useRef(0);
  const restoreTimers = useRef<number[]>([]);

  const dist = distanceOf(pos, target);
  const closeness = closenessOf(dist);
  const fossil: PartDef = pool.current[poolIdx.current];

  const sendRadar = useCallback((c: number, d: number, dx: number, dy: number) => {
    pad.sendHex(buildRadarHex(c, dx, dy));
    pad.sendText(distanceCategory(d));
  }, [pad]);

  useEffect(() => {
    speak(
      '화석 신호 추적. 먼저 난이도를 골라 주세요. 위아래 화살표로 이동하고 엔터로 선택해요. ' +
      `${TIERS[0].label}. ${TIERS[0].desc}`,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startSearching = useCallback(() => {
    setPhase('searching');
    speak(
      '방향키로 발굴지를 돌아다니며 화석 신호를 찾아요. ' +
      '소리가 높을수록, 닷패드의 원이 작아질수록 가까워요. 신호가 있는 쪽 가장자리에는 핀이 따로 반응해요. ' +
      '엔터를 누르면 지금 신호를 다시 확인해요. 바로 근처에 오면 엔터로 발굴하세요.',
    );
    const t0 = target;
    const d0 = distanceOf(CENTER, t0);
    sendRadar(closenessOf(d0), d0, t0.x - CENTER.x, t0.y - CENTER.y);
  }, [target, sendRadar]);

  useEffect(() => () => { restoreTimers.current.forEach(clearTimeout); }, []);

  const move = useCallback((dx: number, dy: number) => {
    resumeAudio();
    const nx = Math.max(0, Math.min(FIELD_W - 1, pos.x + dx));
    const ny = Math.max(0, Math.min(FIELD_H - 1, pos.y + dy));
    if (nx === pos.x && ny === pos.y) { playBump(); return; }
    const np = { x: nx, y: ny };
    setPos(np);
    const d = distanceOf(np, target);
    const c = closenessOf(d);
    const ddx = target.x - np.x, ddy = target.y - np.y;
    playPing(c);
    sendRadar(c, d, ddx, ddy);
    const cat = distanceCategory(d);
    if (cat !== prevCategory.current) {
      prevCategory.current = cat;
      if (d <= 1 && !announcedAdjacent.current) {
        announcedAdjacent.current = true;
        speak('신호가 아주 강해요! 바로 근처예요. 엔터를 눌러 발굴하세요.');
      } else if (d > 1) {
        speak(`${cat}. ${directionHint(ddx, ddy)}`);
      }
    }
  }, [pos, target, sendRadar]);

  const startInspect = useCallback(() => {
    playFound();
    pad.sendHex(fossil.hex);
    pad.sendText(fossil.name);
    setTaskChoice(0);
    setTaskLocked(false);
    setTaskWrongHint(null);
    setInspectAttemptsLeft(tier.current.maxInspectAttempts);
    setPhase('inspect');
    const task = INVESTIGATION_TASKS[fossil.id];
    speak(
      `땅속에서 화석이 솟아올랐어요! ${fossil.feel} ` +
      `${task.prompt} 보기, ${task.options.map((o, i) => `${i + 1}번 ${o}`).join(', ')}. ` +
      '위아래 화살표로 고르고 엔터로 확인하세요.',
    );
  }, [fossil, pad]);

  const attemptExcavate = useCallback(() => {
    resumeAudio();
    if (dist > 1) {
      playPing(closeness);
      sendRadar(closeness, dist, target.x - pos.x, target.y - pos.y);
      speak(`${distanceCategory(dist)}. ${directionHint(target.x - pos.x, target.y - pos.y)}`);
      return;
    }
    startInspect();
  }, [dist, closeness, sendRadar, pos, target, startInspect]);

  const featureText = useCallback((id: string) => (
    tier.current.showFullFeature ? DINO_FEATURES[id] : DINO_SHORT_HINTS[id]
  ), []);

  const startCards = useCallback(() => {
    const cands = pickCandidates(fossil.dinosaurId);
    setCandidates(cands);
    setCardIdx(0);
    setCardWrongHint(null);
    setPhase('cards');
    const first = DINOSAURS.find(d => d.id === cands[0])!;
    playSignature(first.id);
    pad.sendHex(SILHOUETTES[first.id]);
    pad.sendText(first.name);
    speak(
      '이 화석의 주인은 셋 중 하나예요. 좌우 화살표로 후보를 넘기고, 엔터로 이 공룡이라고 골라 보세요. ' +
      `후보 3마리 중 1번째, ${first.name}. ${featureText(first.id)}.`,
    );
  }, [fossil, featureText]);

  const confirmTask = useCallback(() => {
    if (taskLocked) return;
    const task = INVESTIGATION_TASKS[fossil.id];
    if (taskChoice === task.correctIndex) {
      setTaskLocked(true);
      setTaskWrongHint(null);
      speak(`${task.correctFeedback} 이제 이 화석의 주인을 찾아볼게요.`);
      window.setTimeout(startCards, 900);
    } else if (inspectAttemptsLeft !== null && inspectAttemptsLeft <= 1) {
      // 시도 횟수 소진 — 실패로 끝내지 않고 정답을 알려준 뒤 진행
      setTaskLocked(true);
      setTaskWrongHint(null);
      speak(`괜찮아요, 정답은 ${task.options[task.correctIndex]}였어요. ${task.correctFeedback} 이제 이 화석의 주인을 찾아볼게요.`);
      window.setTimeout(startCards, 1100);
    } else {
      setInspectAttemptsLeft(prev => (prev === null ? null : prev - 1));
      setTaskWrongHint(task.wrongFeedback);
      speak(task.wrongFeedback);
    }
  }, [taskChoice, taskLocked, fossil, startCards, inspectAttemptsLeft]);

  const showCard = useCallback((i: number) => {
    const id = candidates[i];
    const d = DINOSAURS.find(x => x.id === id)!;
    setCardWrongHint(null);
    playSignature(id);
    pad.sendHex(SILHOUETTES[id]);
    pad.sendText(d.name);
    speak(`후보 3마리 중 ${i + 1}번째, ${d.name}. ${featureText(id)}.`);
  }, [candidates, pad, featureText]);

  const startRestore = useCallback(() => {
    setPhase('restore');
    ticksPlayed.current = 0;
    pad.sendHex(buildRadarHex(0));
    speak('에너지가 모이고 있어요. 준비되면 엔터를 눌러 복원하세요.');
    [500, 1000, 1500].forEach((t, i) => {
      const id = window.setTimeout(() => {
        ticksPlayed.current = i + 1;
        playRestoreTick(i + 1, 3);
        pad.sendHex(buildRadarHex((i + 1) / 3));
      }, t);
      restoreTimers.current.push(id);
    });
  }, [pad]);

  const attemptMatch = useCallback(() => {
    const chosenId = candidates[cardIdx];
    const dino = DINOSAURS.find(d => d.id === chosenId)!;
    if (chosenId === fossil.dinosaurId) {
      let comboMsg = '';
      if (tier.current.combo) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        updateProgress(prev => ({ ...prev, expeditionBestCombo: Math.max(prev.expeditionBestCombo, nextCombo) }));
        if (nextCombo === 3 || nextCombo === 5 || nextCombo === 10) {
          comboMsg = ` ${nextCombo}연속 정답 콤보!`;
        }
      }
      speak(`화석과 ${dino.name}의 특징이 일치해요! 복원을 시작할게요.${comboMsg}`);
      startRestore();
    } else {
      if (tier.current.combo) setCombo(0);
      const hint = `${dino.name}은(는) ${featureText(chosenId)} — 이 화석과는 달라요. 화석의 특징을 다시 떠올리며 다른 후보를 골라 보세요.`;
      setCardWrongHint(hint);
      speak(hint);
    }
  }, [candidates, cardIdx, fossil, startRestore, featureText, combo]);

  const confirmRestore = useCallback(() => {
    restoreTimers.current.forEach(clearTimeout);
    restoreTimers.current = [];
    playFound();
    const bonus = ticksPlayed.current >= 2;
    pad.sendHex(SILHOUETTES[fossil.dinosaurId]);
    pad.sendText(fossil.dinosaurName);
    setPhase('reward');
    setRounds(r => r + 1);
    updateProgress(prev => ({
      ...prev,
      expeditionFound: { ...prev.expeditionFound, [fossil.id]: true },
      expeditionRounds: prev.expeditionRounds + 1,
    }));
    speak(
      `${bonus ? '타이밍이 좋았어요! ' : ''}${fossil.dinosaurName}의 대표 특징 조각을 찾았어요. ` +
      `몸통, 대표 특징, 발자국 세 조각이 모두 모이면 전체 실루엣이 복원돼요. ${fossil.dinosaurFact} 엔터를 누르면 다음 발굴지로 가요.`,
    );
  }, [fossil, updateProgress]);

  const startNextRound = useCallback(() => {
    poolIdx.current = (poolIdx.current + 1) % pool.current.length;
    if (poolIdx.current === 0) pool.current = shuffle(PARTS);
    const p0 = CENTER;
    const t = randomTarget(p0);
    setPos(p0);
    setTarget(t);
    setPhase('searching');
    announcedAdjacent.current = false;
    prevCategory.current = '';
    const d0 = distanceOf(p0, t);
    sendRadar(closenessOf(d0), d0, t.x - p0.x, t.y - p0.y);
    speak('새로운 발굴지예요. 신호를 찾아 움직여 보세요.');
  }, [sendRadar]);

  useKeys(e => {
    if (e.key === 'F1') { onHome(); speak('메뉴로 돌아왔어요.'); return; }
    if (e.key === 'F2') { replay(); return; }

    if (phase === 'difficulty') {
      if (e.key === 'F3') { speak(`난이도 3개 중 ${tierIdx + 1}번째, ${TIERS[tierIdx].label}.`); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const n = (tierIdx - 1 + TIERS.length) % TIERS.length;
        setTierIdx(n); speak(`${TIERS[n].label}. ${TIERS[n].desc}`);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const n = (tierIdx + 1) % TIERS.length;
        setTierIdx(n); speak(`${TIERS[n].label}. ${TIERS[n].desc}`);
      } else if (e.key === 'Enter') {
        tier.current = TIERS[tierIdx];
        setCombo(0);
        speak(`${tier.current.label} 난이도를 선택했어요.`);
        startSearching();
      }
      return;
    }

    if (phase === 'searching') {
      if (e.key === 'F3') { speak(`지금 신호 상태, ${distanceCategory(dist)}. 지금까지 ${rounds}마리 복원.`); return; }
      if (e.key === 'F4') { pad.sendHex(buildRadarHex(closeness, target.x - pos.x, target.y - pos.y)); speak('신호 패턴을 다시 보냈어요.'); return; }
      if (e.key === 'ArrowUp') move(0, -1);
      else if (e.key === 'ArrowDown') move(0, 1);
      else if (e.key === 'ArrowLeft') move(-1, 0);
      else if (e.key === 'ArrowRight') move(1, 0);
      else if (e.key === 'Enter') attemptExcavate();
      return;
    }

    if (phase === 'inspect') {
      const task = INVESTIGATION_TASKS[fossil.id];
      if (e.key === 'F3') { speak(`보기 ${task.options.length}개 중 ${taskChoice + 1}번째, ${task.options[taskChoice]}.`); return; }
      if (e.key === 'F4') { pad.sendHex(fossil.hex); speak('화석 패턴을 다시 보냈어요.'); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const n = (taskChoice - 1 + task.options.length) % task.options.length;
        setTaskChoice(n); setTaskWrongHint(null); speak(`${n + 1}번, ${task.options[n]}`);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const n = (taskChoice + 1) % task.options.length;
        setTaskChoice(n); setTaskWrongHint(null); speak(`${n + 1}번, ${task.options[n]}`);
      } else if (e.key === 'Enter') {
        confirmTask();
      }
      return;
    }

    if (phase === 'cards') {
      if (e.key === 'F3') { speak(`후보 3마리 중 ${cardIdx + 1}번째.`); return; }
      if (e.key === 'F4') { pad.sendHex(SILHOUETTES[candidates[cardIdx]]); speak('공룡 모양을 다시 출력했어요.'); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const n = (cardIdx - 1 + candidates.length) % candidates.length;
        setCardIdx(n); showCard(n);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const n = (cardIdx + 1) % candidates.length;
        setCardIdx(n); showCard(n);
      } else if (e.key === 'Enter') {
        attemptMatch();
      }
      return;
    }

    if (phase === 'restore') {
      if (e.key === 'Enter') confirmRestore();
      return;
    }

    if (phase === 'reward') {
      if (e.key === 'Enter') startNextRound();
    }
  });

  const task = phase === 'inspect' ? INVESTIGATION_TASKS[fossil.id] : null;

  return (
    <section className="learn-screen" aria-label="화석 신호 추적">
      <p className="eyebrow">
        화석 신호 추적 · 지금까지 {rounds}마리 복원
        {phase !== 'difficulty' && ` · ${tier.current.label}`}
        {tier.current.combo && combo > 0 && ` · 콤보 ${combo}`}
      </p>

      {phase === 'difficulty' && (
        <>
          <h2 className="screen-title">난이도를 골라 주세요</h2>
          <ul className="menu-list" role="listbox" aria-label="난이도">
            {TIERS.map((t, i) => (
              <li key={t.id} role="option" aria-selected={i === tierIdx} className={i === tierIdx ? 'is-active' : ''}>
                <span className="menu-label">{t.label}</span>
                <span className="menu-hint">{t.desc}</span>
              </li>
            ))}
          </ul>
          <p className="key-help">↑↓ 이동 · Enter 선택 · F1 홈</p>
        </>
      )}

      {phase === 'searching' && (
        <>
          <h2 className="screen-title">신호를 따라가 보세요</h2>
          <p className="lede">지금 신호: <strong>{distanceCategory(dist)}</strong></p>
          <p className="fact">방향키로 이동 · 소리가 높아지고 닷패드 원이 좁아질수록 가까워요. 신호 방향의 가장자리 핀도 함께 반응해요.</p>
          {SHOW_PREVIEW && <PinPlate hex={buildRadarHex(closeness, target.x - pos.x, target.y - pos.y)} label={`신호 세기 · ${distanceCategory(dist)}`} />}
          <p className="key-help">↑↓←→ 이동 · Enter 발굴(근처일 때)/신호 재확인 · F3 신호 상태 · F1 홈</p>
        </>
      )}

      {phase === 'inspect' && task && (
        <>
          <h2 className="screen-title">화석 조사 — {fossil.name}</h2>
          <p className="lede">{fossil.feel}</p>
          <p className="fact">{task.prompt}</p>
          {inspectAttemptsLeft !== null && <p className="fact">남은 시도: {inspectAttemptsLeft}번</p>}
          <ol className="choice-list" role="listbox" aria-label="보기">
            {task.options.map((o, i) => (
              <li key={o} role="option" aria-selected={i === taskChoice} className={i === taskChoice ? 'is-active' : ''}>
                <span className="choice-num">{i + 1}</span><span>{o}</span>
              </li>
            ))}
          </ol>
          {taskWrongHint && <p className="feedback feedback--no">{taskWrongHint}</p>}
          {SHOW_PREVIEW && <PinPlate hex={fossil.hex} label={fossil.name} />}
          <p className="key-help">↑↓ 보기 고르기 · Enter 확인 · F4 패턴 다시 출력 · F1 홈</p>
        </>
      )}

      {phase === 'cards' && (
        <>
          <h2 className="screen-title">주인을 찾아라 — 후보 {cardIdx + 1}/3</h2>
          <p className="lede"><strong>{DINOSAURS.find(d => d.id === candidates[cardIdx])?.name}</strong></p>
          <p className="fact">{featureText(candidates[cardIdx])}</p>
          <p className="fact">화석 단서: {fossil.feel}</p>
          {cardWrongHint && <p className="feedback feedback--no">{cardWrongHint}</p>}
          {SHOW_PREVIEW && <PinPlate hex={SILHOUETTES[candidates[cardIdx]]} label={DINOSAURS.find(d => d.id === candidates[cardIdx])?.name ?? ''} />}
          <p className="key-help">←→ 후보 넘기기 · Enter 이 공룡으로 확정 · F4 모양 다시 출력 · F1 홈</p>
        </>
      )}

      {phase === 'restore' && (
        <>
          <h2 className="screen-title">복원 중…</h2>
          <p className="lede">에너지가 모이고 있어요. 준비되면 엔터를 눌러 복원하세요.</p>
          {SHOW_PREVIEW && <PinPlate hex={buildRadarHex(ticksPlayed.current / 3)} label="복원 에너지" />}
          <p className="key-help">Enter 복원 확정 · F1 홈</p>
        </>
      )}

      {phase === 'reward' && (
        <>
          <div className="reward-burst" aria-hidden="true">
            <span /><span /><span />
          </div>
          <h2 className="screen-title">대표 특징 조각 발견! {fossil.dinosaurName}</h2>
          <p className="lede">{fossil.name} · 주인은 <strong>{fossil.dinosaurName}</strong></p>
          <p className="fact">{fossil.dinosaurFact}</p>
          {SHOW_PREVIEW && <PinPlate hex={SILHOUETTES[fossil.dinosaurId]} label={fossil.dinosaurName} />}
          <p className="key-help">Enter 다음 발굴지 · F1 홈</p>
        </>
      )}
    </section>
  );
}
