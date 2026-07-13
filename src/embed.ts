// ── Dot Games 임베드 규격 (Embed Spec) 구현 ─────────────────────────────────
// 1. ?embed=1  → 임베드 미니멀 모드 (크롬 최소화, Back은 postMessage exit)
// 2. ?preview=0 → DOT PAD PREVIEW 스트립 미렌더 (embed=1이면 기본 off)
// 4. postMessage: { source:'dotarcade', type:'ready'|'resize'|'exit', ... }

const params = new URLSearchParams(window.location.search);

export const IS_EMBED = params.get('embed') === '1';

// preview: 명시값 우선, 없으면 embed에서는 off / 일반에서는 on
export const SHOW_PREVIEW = params.has('preview')
  ? params.get('preview') !== '0'
  : !IS_EMBED;

function post(msg: Record<string, unknown>) {
  try {
    // 부모 origin allowlist는 TW쪽 수신부에서 검증. 송신은 규격 형식('*') 그대로.
    window.parent.postMessage({ source: 'dotarcade', ...msg }, '*');
  } catch {
    /* top-level 실행 시 무시 */
  }
}

let readySent = false;
export function postReady() {
  if (readySent) return;
  readySent = true;
  post({ type: 'ready' });
}

export function postExit() {
  post({ type: 'exit' });
}

// resize — 콘텐츠 높이 변경 시 부모에 통지 (자동 높이 조정용)
let lastHeight = 0;
export function watchResize() {
  if (window.self === window.top) return; // 임베드가 아니면 불필요
  const report = () => {
    const h = Math.ceil(document.documentElement.scrollHeight);
    if (h !== lastHeight) {
      lastHeight = h;
      post({ type: 'resize', height: h });
    }
  };
  const ro = new ResizeObserver(report);
  ro.observe(document.body);
  report();
}
