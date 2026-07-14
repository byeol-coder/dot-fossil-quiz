// 메뉴 항목을 텍스트 목록이 아니라 아이콘 있는 게임 허브처럼 보이게 하는 작은 장식 아이콘.
// 순수 시각 장식(aria-hidden) — 정보는 이미 텍스트/음성으로 전달됨.

type IconId =
  | 'learn' | 'expedition' | 'dig' | 'formation' | 'story'
  | 'quiz1' | 'quiz2' | 'collection' | 'connect' | 'exit';

const PATHS: Record<IconId, string> = {
  learn: 'M10 10a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm7.5 12.5L23 28',
  expedition: 'M16 4a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm0 6l3 6-3 6-3-6 3-6Z',
  dig: 'M6 26l6-6m0 0l12-12 4 4-12 12m-4-4l4 4',
  formation: 'M5 22h22M5 16h22M5 10h22',
  story: 'M13 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm8 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
  quiz1: 'M6 8h20v14H16l-5 5v-5H6z M14 13a2.5 2.5 0 1 1 3 2.4c-.8.3-1 .8-1 1.6 M16 20.2v.1',
  quiz2: 'M8 24c2-8 6-14 10-16m-4 16c1-7 5-13 9-15m-3 15c1-6 4-11 7-13',
  collection: 'M6 8h9a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H6zM26 8h-9a3 3 0 0 0-3 3v15a3 3 0 0 1 3-3h9z',
  connect: 'M12 8l8 6-8 6V8zm0 12l8 6-8 6V20z',
  exit: 'M14 8H8v16h6M20 12l6 4-6 4M12 16h13',
};

export function MenuIcon({ id }: { id: string }) {
  const d = PATHS[id as IconId];
  if (!d) return null;
  return (
    <svg className="menu-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
