# Dot Fossil Lab — 공룡 화석 부위 맞추기

닷패드(DotPad 320, 60×40) 촉각 학습 게임. dot-fossil의 실측 DTMS 화석 패턴 5종을
**탐색 학습 → 퀴즈(부위 맞추기 / 주인 찾기) → 도감**의 3단 학습 루프로 재구성했다.
React + Vite + TypeScript, 독립 폴더 빌드.

## 게임 구성

| 모드 | 내용 |
|---|---|
| 화석 탐색 학습 | 부위 5종(갈비뼈·발톱·척추뼈·다리와 발·부분 골격)을 닷패드로 출력, 촉각 힌트·공룡 지식 음성 안내 |
| 퀴즈 1 · 부위 맞추기 | 패턴을 만지고 4지선다로 부위 이름 맞추기 (형태 변별) |
| 퀴즈 2 · 주인 찾기 | 부위 → 주인 공룡 연결 (공룡 10종 보기 풀) |
| 화석 도감 | 학습/정답 배지, 패턴 재출력, 진행도 localStorage 저장 |

## 임베드 규격 (Embed Spec) 준수

- **1. `?embed=1`** — 브랜딩 헤더 숨김, 게임 보드·핵심 컨트롤만. 홈 메뉴에 "게임 나가기" → `postMessage {type:'exit'}` (Back 대체)
- **2. `?preview=0`** — 핀 플레이트(화면 시뮬레이션) 미렌더. `embed=1`이면 기본 off, `?preview=1`로 강제 표시 가능. 실제 닷패드 출력은 항상 유지
- **3. 반응형** — 고정 픽셀 레이아웃 없음, 보드 중앙 배치, 좁은 창/낮은 창 대응
- **4. postMessage** — `{source:'dotarcade', type:'ready'|'resize'|'exit'}`. resize는 ResizeObserver로 높이 통지
- **5. 독립 폴더** — `vite.config`의 `base:'./'`, 모든 자산 상대경로. `games/<game>/index.html?embed=1&preview=0` 형태로 임베드 가능
- **6. 닷패드 키 표준** — F1/F2 행 이동 · Pan L/R 열 이동 · F3 선택 · F4 표시 · Pan All 음성 재생. 하드웨어 키를 DOM keydown으로 재발행해 키보드 핸들러와 단일화
- **7. 음성/접근성** — 공용 표준 `TW_TTS`(dot-games-host tts.js) 사용, speechSynthesis는 오프라인 개발 폴백만. 키보드는 방향키·Enter·F1~F4만으로 전 기능 조작. 모든 화면 순환 목록 끝에 "홈으로" 항목 → 닷패드 단독으로도 전 화면 이동 가능

## 키 매핑

| 동작 | 키보드 | 닷패드 |
|---|---|---|
| 항목/보기 이동 | ↑ ↓ ← → | F1/F2 (행), Pan L/R (열) |
| 선택·확정 | Enter | F3 |
| 촉각 패턴 다시 출력 | F4 | F4 |
| 마지막 음성 다시 듣기 | F2 | Pan All |
| 진행도 읽기 | F3 | — |
| 홈으로 / 도움말(홈에서) | F1 | 목록 끝 "홈으로" 항목 |

## 개발·배포

```bash
npm install
npm run dev       # 로컬 개발 (Web Bluetooth는 localhost에서 동작)
npm run build     # dist/ 생성 — 이 폴더를 그대로 배포
```

- Web Bluetooth는 **HTTPS 필수** (GitHub Pages / Vercel OK). iframe 임베드 시 부모가 `allow="bluetooth"` 부여(TW가 처리).
- 점자 텍스트 라인: braillify.kr 점역 API(약자 포함) 우선, 실패 시 로컬 기본 테이블 폴백.
- 제출 전 확인: 실행 주소 끝에 `?embed=1` 붙여 음성·키보드 조작 점검.

## 촉각 패턴 출처

`src/data/parts.ts`의 600-hex 패턴은 dot-fossil 저장소의 실측 `.dtms` 자산
(rib / claw / vertebra / legfoot / partialSkeleton). 별칭 패턴(shell=rib, tooth=vertebra,
fish=partialSkeleton)은 촉각 변별이 불가능하므로 문항에서 제외했다.
