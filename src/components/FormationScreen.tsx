import { useCallback, useEffect, useState } from 'react';
import { FORMATION_STEPS, buildFormationHex } from '../data/formation';
import type { useDotPad } from '../dotpad/useDotPad';
import { PinPlate } from './PinPlate';
import { speak, replay } from '../tts';
import { SHOW_PREVIEW } from '../embed';
import { useKeys } from '../hooks/useKeys';
import type { Progress } from '../progress';

export function FormationScreen({
  pad, onHome, updateProgress,
}: {
  pad: ReturnType<typeof useDotPad>;
  onHome: () => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
}) {
  const total = FORMATION_STEPS.length + 1;
  const [idx, setIdx] = useState(0);
  const isHomeItem = idx === FORMATION_STEPS.length;
  const step = isHomeItem ? null : FORMATION_STEPS[idx];

  const announce = useCallback((i: number, withIntro = false) => {
    if (i === FORMATION_STEPS.length) {
      speak('홈으로 돌아가기. 엔터를 누르면 메뉴로 돌아가요.');
      return;
    }
    const s = FORMATION_STEPS[i];
    pad.sendHex(buildFormationHex(s.id));
    pad.sendText(s.title);
    speak(
      `${withIntro ? '화석이 되기까지, 여섯 단계예요. 오른쪽 화살표로 다음 단계로 넘어가요. ' : ''}` +
      `${s.title}. ${s.narration}`,
    );
    if (i === FORMATION_STEPS.length - 1) {
      updateProgress(prev => ({ ...prev, formationDone: true }));
    }
  }, [pad, updateProgress]);

  useEffect(() => { announce(0, true); }, [announce]);

  useKeys(e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const n = (idx + 1) % total; setIdx(n); announce(n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const n = (idx - 1 + total) % total; setIdx(n); announce(n);
    } else if (e.key === 'Enter') {
      if (isHomeItem) { onHome(); speak('메뉴로 돌아왔어요.'); return; }
      speak(`${step!.narration} ${step!.feel}`);
    } else if (e.key === 'F1') {
      onHome(); speak('메뉴로 돌아왔어요.');
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F3') {
      speak(isHomeItem ? '마지막, 홈으로 돌아가기.' : `여섯 단계 중 ${idx + 1}번째.`);
    } else if (e.key === 'F4') {
      if (!isHomeItem) { pad.sendHex(buildFormationHex(step!.id)); speak('촉각 패턴을 다시 보냈어요.'); }
    }
  });

  return (
    <section className="learn-screen" aria-label="화석이 되기까지">
      <p className="eyebrow">화석이 되기까지 · {isHomeItem ? '끝' : `${idx + 1} / ${FORMATION_STEPS.length}`}</p>
      {step ? (
        <>
          <h2 className="screen-title">{step.title}</h2>
          <p className="lede">{step.narration}</p>
          <p className="fact">{step.feel}</p>
          {SHOW_PREVIEW && <PinPlate hex={buildFormationHex(step.id)} label={step.title} />}
        </>
      ) : (
        <>
          <h2 className="screen-title">홈으로 돌아가기</h2>
          <p className="lede">엔터를 누르면 메뉴로 돌아가요.</p>
        </>
      )}
      <p className="key-help">←→ 단계 넘기기 · Enter 다시 설명 듣기 · F4 패턴 다시 출력 · F1 홈</p>
    </section>
  );
}
