// ── braillify.kr — Korean braille translation (점역) API client ──────────────
// GET https://api.braillify.kr/braille?text=...  → { text, braille, length }
// `braille` is a Unicode braille string (U+2800 block); each char's
// (codepoint - 0x2800) IS the 8-dot cell byte (dot1→bit0 … dot8→bit7), which is
// exactly what the DotPad text line needs. This gives proper 한글 점역 (약자 등
// 포함) instead of the local basic table — which stays as the offline fallback.

export const BRAILLIFY_BASE = 'https://api.braillify.kr';

// The API rejects (400) some Unicode punctuation — notably the em/en dash used
// in the game's clue messages. Normalise those to a comma so translation still
// succeeds instead of falling back to the local table.
function sanitize(text: string): string {
  return text.replace(/[—–]/g, ', ').replace(/\s+/g, ' ').trim();
}

export async function fetchBrailleUnicode(text: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${BRAILLIFY_BASE}/braille?text=${encodeURIComponent(sanitize(text))}`, { signal });
  if (!res.ok) throw new Error(`braillify ${res.status}`);
  const data = (await res.json()) as { braille?: string };
  if (typeof data.braille !== 'string') throw new Error('braillify: no braille field');
  return data.braille;
}

/** Unicode braille string → DotPad text-line hex (1 byte per cell, padded to `cells`). */
export function unicodeBrailleToHex(braille: string, cells = 20): string {
  const bytes: number[] = [];
  for (const ch of braille) {
    const cp = ch.codePointAt(0) ?? 0;
    bytes.push(cp >= 0x2800 && cp <= 0x28ff ? cp - 0x2800 : 0); // non-braille (e.g. space) → blank cell
  }
  const out = bytes.slice(0, cells);
  while (out.length < cells) out.push(0);
  return out.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}
