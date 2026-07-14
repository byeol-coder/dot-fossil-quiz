// ── 화석 신호 추적 오디오 엔진 ───────────────────────────────────────────────
// 스테레오 패닝은 의도적으로 사용하지 않는다 — 교실 스피커(헤드폰 아님) 환경에서도
// 동일하게 작동해야 하므로, "방향"이 아닌 "가까움 정도"만 음높이로 전달한다.
// AudioContext 미지원 환경(jsdom 등)에서는 모든 함수가 조용히 아무 일도 하지 않는다.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
    .AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { return null; }
  return ctx;
}

/** 브라우저는 사용자 제스처 후에만 오디오를 재생하므로, 첫 키 입력 시 호출해 재개한다. */
export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

/** 탐색 핑 — closeness(0=아주 멀다 · 1=바로 위)가 높을수록 음이 높고 또렷해진다. */
export function playPing(closeness: number) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 220 + closeness * 660; // 220Hz(멀다) ~ 880Hz(가깝다)
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch { /* 오디오 미지원 환경 무시 */ }
}

/** 발굴 성공 — 상승하는 3음. */
export function playFound() {
  const c = getCtx();
  if (!c) return;
  try {
    [660, 880, 1320].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t0 = c.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    });
  } catch { /* 오디오 미지원 환경 무시 */ }
}

/** 경계에 부딪힘 — 낮고 짧은 둔탁한 음. */
export function playBump() {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = 110;
    const now = c.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch { /* 오디오 미지원 환경 무시 */ }
}

function tone(freq: number, dur: number, type: OscillatorType, t0: number, peak = 0.2) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.03, dur / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** 공룡별 시그니처 사운드 — 카드를 넘길 때 그 공룡다움을 짧게 들려준다. */
export function playSignature(dinoId: string) {
  const c = getCtx();
  if (!c) return;
  try {
    const now = c.currentTime;
    switch (dinoId) {
      case 'brachiosaurus': { // 낮고 긴 울음
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.5);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain).connect(c.destination);
        osc.start(now); osc.stop(now + 0.62);
        break;
      }
      case 'velociraptor': // 빠른 긁는 소리 — 짧은 클릭 연속
        for (let i = 0; i < 4; i++) tone(700 + i * 60, 0.04, 'square', now + i * 0.05, 0.12);
        break;
      case 'spinosaurus': { // 물결치는 소리
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(460, now + 0.25);
        osc.frequency.linearRampToValueAtTime(280, now + 0.5);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.connect(gain).connect(c.destination);
        osc.start(now); osc.stop(now + 0.52);
        break;
      }
      case 'parasaurolophus': { // 트롬본 같은 낮은 관악기 소리
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.4);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.connect(gain).connect(c.destination);
        osc.start(now); osc.stop(now + 0.47);
        break;
      }
      case 'ankylosaurus': // 금속성 충격음 두 번
        tone(520, 0.12, 'square', now, 0.2);
        tone(720, 0.14, 'square', now + 0.16, 0.2);
        break;
      default:
        playPing(0.5);
    }
  } catch { /* 오디오 미지원 환경 무시 */ }
}

/** 복원 미니게임 — 에너지가 모이는 짧은 상승 틱. */
export function playRestoreTick(step: number, total: number) {
  tone(300 + (step / total) * 500, 0.1, 'sine', getCtx()?.currentTime ?? 0, 0.15);
}
