import { useCallback, useEffect, useMemo, useState } from 'react';
import { PARTS } from '../data/parts';
import type { PartDef } from '../data/parts';
import { DIG_PHASES } from '../data/dig';
import type { useDotPad } from '../dotpad/useDotPad';
import { PinPlate } from './PinPlate';
import { speak, replay } from '../tts';
import { SHOW_PREVIEW } from '../embed';
import { useKeys } from '../hooks/useKeys';
import { boolGridToHex, hexToBoolGrid, quarterDensity, partialOf, soilNoiseGrid } from '../dotpad/tactileGen';
import type { Progress } from '../progress';

function hexForPhase(part: PartDef, phase: number): string {
  if (phase <= 0) return boolGridToHex(soilNoiseGrid());
  if (phase === 1) return boolGridToHex(quarterDensity(hexToBoolGrid(part.hex)));
  if (phase === 2) return boolGridToHex(partialOf(hexToBoolGrid(part.hex)));
  return part.hex;
}

export function DigExperienceScreen({
  pad, onHome, updateProgress,
}: {
  pad: ReturnType<typeof useDotPad>;
  onHome: () => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
}) {
  const total = PARTS.length + 1;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(0); // 0=아직 시작 전, 1=탐침, 2=붓질, 3=추출 완료
  const isHomeItem = idx === PARTS.length;
  const part = isHomeItem ? null : PARTS[idx];

  const hex = useMemo(() => (part ? hexForPhase(part, phase) : ''), [part, phase]);

  const startFossil = useCallback((i: number, withIntro = false) => {
    setPhase(0);
    if (i === PARTS.length) {
      speak('홈으로 돌아가기. 엔터를 누르면 메뉴로 돌아가요.');
      return;
    }
    const p = PARTS[i];
    pad.sendHex(boolGridToHex(soilNoiseGrid()));
    pad.sendText('발굴 시작');
    speak(
      `${withIntro ? '발굴 체험. 좌우 화살표로 화석을 바꾸고, 엔터를 눌러 한 단계씩 발굴해요. ' : ''}` +
      `${i + 1}번째 발굴지. 아직 흙만 만져져요. 엔터를 눌러 표면 조사를 시작하세요.`,
    );
  }, [pad]);

  useEffect(() => { startFossil(0, true); }, [startFossil]);

  const advance = useCallback(() => {
    if (!part) return;
    const next = Math.min(3, phase + 1);
    setPhase(next);
    pad.sendHex(hexForPhase(part, next));
    if (next === 0) return;
    const ph = DIG_PHASES[next - 1];
    pad.sendText(ph.label);
    if (next === 3) {
      updateProgress(prev => ({ ...prev, digDone: { ...prev.digDone, [part.id]: true } }));
      speak(`${ph.narration} ${ph.method} 이 화석은 ${part.name}, 주인은 ${part.dinosaurName}이에요. ${part.dinosaurFact} 오른쪽 화살표로 다음 발굴지로 가 보세요.`);
    } else {
      speak(`${ph.narration} ${ph.method} 엔터를 눌러 다음 단계로 가세요.`);
    }
  }, [part, phase, pad, updateProgress]);

  useKeys(e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const n = (idx + 1) % total; setIdx(n); startFossil(n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const n = (idx - 1 + total) % total; setIdx(n); startFossil(n);
    } else if (e.key === 'Enter') {
      if (isHomeItem) { onHome(); speak('메뉴로 돌아왔어요.'); return; }
      advance();
    } else if (e.key === 'F1') {
      onHome(); speak('메뉴로 돌아왔어요.');
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F3') {
      speak(isHomeItem ? '마지막, 홈으로 돌아가기.' : `발굴지 ${PARTS.length}곳 중 ${idx + 1}번째, 단계 ${phase} / 3.`);
    } else if (e.key === 'F4') {
      if (part) { pad.sendHex(hex); speak('지금 단계의 촉각 패턴을 다시 보냈어요.'); }
    }
  });

  const phaseLabel = phase === 0 ? '발굴 전' : DIG_PHASES[phase - 1].label;

  return (
    <section className="learn-screen" aria-label="발굴 체험">
      <p className="eyebrow">발굴 체험 · {isHomeItem ? '끝' : `${idx + 1} / ${PARTS.length} · ${phaseLabel}`}</p>
      {part ? (
        <>
          <h2 className="screen-title">발굴지 {idx + 1}</h2>
          <p className="lede">
            {phase === 0 && '아직 흙만 만져져요. 엔터를 눌러 표면 조사를 시작하세요.'}
            {phase > 0 && phase < 3 && DIG_PHASES[phase - 1].narration}
            {phase === 3 && `발견 성공! ${part.name} · ${part.dinosaurName}`}
          </p>
          {phase > 0 && <p className="fact">{DIG_PHASES[phase - 1].method}</p>}
          {SHOW_PREVIEW && <PinPlate hex={hex} label={phase === 3 ? part.name : phaseLabel} />}
        </>
      ) : (
        <>
          <h2 className="screen-title">홈으로 돌아가기</h2>
          <p className="lede">엔터를 누르면 메뉴로 돌아가요.</p>
        </>
      )}
      <p className="key-help">←→ 발굴지 바꾸기 · Enter 다음 단계 발굴 · F4 패턴 다시 출력 · F1 홈</p>
    </section>
  );
}
