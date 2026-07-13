// ── 음성 안내 — 공용 표준 TW_TTS 우선 ───────────────────────────────────────
// 가이드라인: 게임 맨 위에 dot-games-host tts.js 한 줄 → TW_TTS.speak("문구").
// 브라우저 speechSynthesis 직접 호출은 임베드에서 불안정하므로, TW_TTS가
// 로드되지 않은 예외 상황(오프라인 개발 등)에만 폴백으로 사용한다.

declare global {
  interface Window {
    TW_TTS?: {
      speak: (text: string) => void;
      stop?: () => void;
      cancel?: () => void;
    };
  }
}

let lastSpoken = '';

export function speak(text: string) {
  if (!text) return;
  lastSpoken = text;
  const tts = window.TW_TTS;
  if (tts && typeof tts.speak === 'function') {
    try {
      tts.stop?.();
      tts.cancel?.();
    } catch { /* 표준에 stop이 없을 수 있음 */ }
    tts.speak(text);
    return;
  }
  // 폴백 (개발 환경 전용)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }
}

/** Pan All(음성 재생) — 마지막 안내를 다시 말한다. */
export function replay() {
  if (lastSpoken) speak(lastSpoken);
}
