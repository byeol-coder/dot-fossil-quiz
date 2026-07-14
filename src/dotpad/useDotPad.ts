import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DotPadSDK, DotPadScanner, DataCodes, KeyCodes } from './DotPadSDK-3_0_0.js';
import type { DotDevice } from './DotPadSDK-3_0_0.js';
import { textToBrailleHex } from './koreanBraille';
import { fetchBrailleUnicode, unicodeBrailleToHex } from './braillify';

export type DotPadStatus = 'disconnected' | 'connecting' | 'connected' | 'unsupported';

// ── 규격 6번 — 닷패드 하드웨어 키 매핑 표준 ─────────────────────────────────
//   F1/F2 = 행 이동 · Pan L/R = 열 이동 · F3 = 선택 · F4 = 표시 · Pan All = 음성 재생
// 하드웨어 키를 DOM keydown으로 재발행해서, 화면별 키보드 핸들러 하나로
// 키보드와 닷패드 버튼을 동시에 지원한다.
const HW_KEY_TO_DOM: Record<string, string> = {
  [KeyCodes.KeyFunction1]: 'ArrowUp',    // 행 위
  [KeyCodes.KeyFunction2]: 'ArrowDown',  // 행 아래
  [KeyCodes.PanningLeft]:  'ArrowLeft',  // 열 왼쪽
  [KeyCodes.PanningRight]: 'ArrowRight', // 열 오른쪽
  [KeyCodes.KeyFunction3]: 'Enter',      // 선택
  [KeyCodes.KeyFunction4]: 'F4',         // 표시 (촉각 패턴 재전송)
  [KeyCodes.PanningAll]:   'F2',         // 음성 재생 (마지막 안내 다시 읽기)
};

export function useDotPad() {
  const sdk = useRef<DotPadSDK | null>(null);
  const device = useRef<DotDevice | null>(null);
  const demo = useRef(false); // 하드웨어 없이 시연/검수용
  const [status, setStatus] = useState<DotPadStatus>('disconnected');

  useEffect(() => {
    const s = new DotPadSDK();
    s.setCallBack(
      (dev, code) => {
        if (code === DataCodes.Connected) { device.current = dev; setStatus('connected'); }
        else if (code === DataCodes.Disconnected) { device.current = null; setStatus('disconnected'); }
      },
      (_dev, key) => {
        const domKey = HW_KEY_TO_DOM[key];
        if (domKey) {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: domKey, bubbles: true, cancelable: true }));
        }
      },
    );
    sdk.current = s;
    return () => { s.disconnect(); };
  }, []);

  const connect = useCallback(async () => {
    // Web Bluetooth: HTTPS + Chrome/Edge 필요. iframe이면 부모 allow="bluetooth" (TW가 부여함).
    if (!('bluetooth' in navigator) || !window.isSecureContext) {
      setStatus('unsupported');
      return;
    }
    if (status === 'connecting' || status === 'connected') return;
    setStatus('connecting');
    try {
      const scanner = new DotPadScanner();
      const ble = await scanner.startBleScan();
      if (!ble) { setStatus('disconnected'); return; }
      const dev = await sdk.current!.connectBleDevice(ble);
      if (!dev) { setStatus('disconnected'); return; }
      device.current = dev;
      setStatus('connected');
    } catch {
      setStatus('disconnected');
    }
  }, [status]);

  const connectDemo = useCallback(() => {
    demo.current = true;
    setStatus('connected');
  }, []);

  const disconnect = useCallback(() => {
    if (!demo.current && sdk.current && device.current) sdk.current.disconnect(device.current);
    demo.current = false;
    device.current = null;
    setStatus('disconnected');
  }, []);

  /** 60×40 촉각그래픽 전송 (600-hex) */
  const sendHex = useCallback((hex: string) => {
    if (status !== 'connected' || !hex) return;
    if (demo.current) { console.info(`[DotPad demo] 촉각 패턴 전송 (${hex.length / 2} bytes)`); return; }
    sdk.current?.displayGraphicData(hex);
  }, [status]);

  // ── 20셀 점자 텍스트 라인 ──────────────────────────────────────────────
  // braillify.kr 점역(약자 포함) 우선, 네트워크 실패 시 로컬 기본 테이블 폴백.
  const cache = useRef<Map<string, string>>(new Map());
  const latest = useRef('');

  const sendText = useCallback((text: string) => {
    if (status !== 'connected' || !text) return;
    latest.current = text;
    const push = (hex: string) => {
      if (latest.current !== text) return; // 최신 메시지가 우선
      if (demo.current) { console.info(`[DotPad demo] 점자 라인: ${text}`); return; }
      sdk.current?.displayTextData(hex);
    };
    const cached = cache.current.get(text);
    if (cached) { push(cached); return; }
    fetchBrailleUnicode(text)
      .then(braille => {
        const hex = unicodeBrailleToHex(braille, 20);
        cache.current.set(text, hex);
        push(hex);
      })
      .catch(() => push(textToBrailleHex(text, 20)));
  }, [status]);

  return useMemo(
    () => ({ status, connect, connectDemo, disconnect, sendHex, sendText }),
    [status, connect, connectDemo, disconnect, sendHex, sendText],
  );
}
