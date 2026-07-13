// ── Text → DotPad braille-cell bytes ─────────────────────────────────────────
// Produces one byte per braille cell in STANDARD 6-dot order (dot1→bit0 …
// dot6→bit5). The SDK's displayTextData() applies its own braille→graphic pin
// remap for the text line, so we just supply standard braille bytes here.
//
// ⚠️ BASIC 한글 점자 only — initial/medial/final jamo + ASCII/digits/space.
// 약자(abbreviations), 약어, and a few complex vowels/된소리 use a documented
// approximation (decomposition into base parts). For production braille, replace
// the CHO/JUNG/JONG tables (or the whole textToBrailleCells function) with Dot's
// official translation table — this is the single integration point.

const dots = (s: string): number => {
  let b = 0;
  for (const ch of s) { const d = ch.charCodeAt(0) - 48; if (d >= 1 && d <= 6) b |= 1 << (d - 1); }
  return b;
};

// 초성 19: ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ  ('' = ㅇ, no symbol)
// 된소리(ㄲㄸㅃㅆㅉ) approximated as 된소리표(6점) + base initial.
const CHO: string[][] = [
  ['4'], ['6', '4'], ['14'], ['24'], ['6', '24'], ['5'], ['15'], ['45'],
  ['6', '45'], ['6'], ['6', '6'], [''], ['46'], ['6', '46'], ['56'],
  ['124'], ['125'], ['145'], ['245'],
];

// 중성 21: ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ
// complex vowels approximated as base-vowel combinations.
const JUNG: string[][] = [
  ['126'], ['1235'], ['345'], ['345', '1235'], ['234'], ['1345'], ['156'], ['156', '1235'],
  ['136'], ['136', '126'], ['136', '1235'], ['136', '135'], ['346'], ['134'], ['134', '234'],
  ['134', '1345'], ['134', '135'], ['146'], ['246'], ['246', '135'], ['135'],
];

// 종성 28: ''(none)ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ
// 겹받침은 두 받침의 결합으로 표기.
const JONG: string[][] = [
  [], ['1'], ['1', '1'], ['1', '3'], ['25'], ['25', '13'], ['25', '356'], ['35'],
  ['2'], ['2', '1'], ['2', '26'], ['2', '12'], ['2', '3'], ['2', '236'], ['2', '256'], ['2', '356'],
  ['26'], ['12'], ['12', '3'], ['3'], ['3', '3'], ['2356'], ['13'], ['23'], ['236'], ['1346'], ['256'], ['356'],
];

// ASCII Grade-1 braille (dots) for letters a–z and the number sign / digits.
const LATIN: Record<string, string> = {
  a: '1', b: '12', c: '14', d: '145', e: '15', f: '124', g: '1245', h: '125',
  i: '24', j: '245', k: '13', l: '123', m: '134', n: '1345', o: '135', p: '1234',
  q: '12345', r: '1235', s: '234', t: '2345', u: '136', v: '1236', w: '2456',
  x: '1346', y: '13456', z: '1356',
};
const NUM_SIGN = dots('3456');
const DIGIT = ['245', '1', '12', '14', '145', '15', '124', '1245', '125', '24']; // 0-9 = j,a–i

function pushCells(out: number[], patterns: string[]): void {
  for (const p of patterns) if (p !== '') out.push(dots(p)); // '' (초성 ㅇ) emits nothing
}

/** Convert text to an array of braille-cell bytes (standard 6-dot order). */
export function textToBrailleCells(text: string): number[] {
  const out: number[] = [];
  let inNumber = false;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch >= '가' && ch <= '힣') {
      inNumber = false;
      const s = code - 0xac00;
      pushCells(out, CHO[Math.floor(s / 588)]);
      pushCells(out, JUNG[Math.floor((s % 588) / 28)]);
      pushCells(out, JONG[s % 28]);
    } else if (ch >= '0' && ch <= '9') {
      if (!inNumber) { out.push(NUM_SIGN); inNumber = true; }
      out.push(dots(DIGIT[code - 48]));
    } else if (LATIN[ch.toLowerCase()]) {
      inNumber = false;
      out.push(dots(LATIN[ch.toLowerCase()]));
    } else if (ch === ' ') {
      inNumber = false;
      out.push(0); // blank cell
    }
    // other punctuation skipped (kept minimal)
  }
  return out;
}

/** Convert text to a 20-cell DotPad text-line hex string (pads/truncates). */
export function textToBrailleHex(text: string, cells = 20): string {
  const bytes = textToBrailleCells(text).slice(0, cells);
  while (bytes.length < cells) bytes.push(0);
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}
