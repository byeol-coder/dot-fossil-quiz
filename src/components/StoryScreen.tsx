import { useCallback, useEffect, useState } from 'react';
import { DINOSAURS, buildSizeCompareHex, sizeCompareSentence } from '../data/dinosaurs';
import type { useDotPad } from '../dotpad/useDotPad';
import { PinPlate } from './PinPlate';
import { speak, replay } from '../tts';
import { SHOW_PREVIEW } from '../embed';
import { useKeys } from '../hooks/useKeys';
import type { Progress } from '../progress';

export function StoryScreen({
  pad, onHome, updateProgress,
}: {
  pad: ReturnType<typeof useDotPad>;
  onHome: () => void;
  updateProgress: (fn: (p: Progress) => Progress) => void;
}) {
  const total = DINOSAURS.length + 1;
  const [idx, setIdx] = useState(0);
  const isHomeItem = idx === DINOSAURS.length;
  const dino = isHomeItem ? null : DINOSAURS[idx];

  const announce = useCallback((i: number, withIntro = false) => {
    if (i === DINOSAURS.length) {
      speak('홈으로 돌아가기. 엔터를 누르면 메뉴로 돌아가요.');
      return;
    }
    const d = DINOSAURS[i];
    pad.sendHex(buildSizeCompareHex(d.lengthM));
    pad.sendText(d.name);
    speak(
      `${withIntro ? '공룡 이야기. 좌우 화살표로 공룡을 바꿔요. 세 시대, 트라이아스기, 쥐라기, 백악기 순서로 공룡이 등장했어요. ' : ''}` +
      `${i + 1}번, ${d.name}. ${d.hook} 엔터를 누르면 자세한 이야기를 들어요.`,
    );
  }, [pad]);

  useEffect(() => { announce(0, true); }, [announce]);

  useKeys(e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const n = (idx + 1) % total; setIdx(n); announce(n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const n = (idx - 1 + total) % total; setIdx(n); announce(n);
    } else if (e.key === 'Enter') {
      if (isHomeItem) { onHome(); speak('메뉴로 돌아왔어요.'); return; }
      const d = DINOSAURS[idx];
      speak(
        `${d.name}. ${d.era}에 살았고, ${d.diet} 공룡이에요. 서식지는 ${d.habitat}. ` +
        `${sizeCompareSentence(d)} ${d.behavior}`,
      );
      updateProgress(prev => ({ ...prev, storyRead: { ...prev.storyRead, [d.id]: true } }));
    } else if (e.key === 'F1') {
      onHome(); speak('메뉴로 돌아왔어요.');
    } else if (e.key === 'F2') {
      replay();
    } else if (e.key === 'F3') {
      speak(isHomeItem ? '마지막, 홈으로 돌아가기.' : `공룡 ${DINOSAURS.length}마리 중 ${idx + 1}번째.`);
    } else if (e.key === 'F4') {
      if (!isHomeItem) { pad.sendHex(buildSizeCompareHex(DINOSAURS[idx].lengthM)); speak('크기 비교 막대를 다시 보냈어요.'); }
    }
  });

  return (
    <section className="learn-screen" aria-label="공룡 이야기">
      <p className="eyebrow">공룡 이야기 · {isHomeItem ? '끝' : `${idx + 1} / ${DINOSAURS.length}`}</p>
      {dino ? (
        <>
          <h2 className="screen-title">{dino.name}</h2>
          <p className="lede">{dino.hook}</p>
          <p className="fact">
            <strong>{dino.era}</strong> · {dino.diet} · {dino.habitat}<br />
            {sizeCompareSentence(dino)}
          </p>
          <p className="fact">{dino.behavior}</p>
          {SHOW_PREVIEW && <PinPlate hex={buildSizeCompareHex(dino.lengthM)} label={`${dino.name} 길이 비교 (위: 공룡 · 아래: 스쿨버스 12m)`} />}
        </>
      ) : (
        <>
          <h2 className="screen-title">홈으로 돌아가기</h2>
          <p className="lede">엔터를 누르면 메뉴로 돌아가요.</p>
        </>
      )}
      <p className="key-help">←→ 공룡 바꾸기 · Enter 이야기 듣기 · F4 크기 비교 다시 출력 · F1 홈</p>
    </section>
  );
}
