import { newSilhouetteGrid, stroke, polyline, blob } from '../dotpad/silhouette';
import { boolGridToHex } from '../dotpad/tactileGen';

// 절차적 실루엣은 머리가 오른쪽(x 큰 쪽)을 향하도록 통일. 가장자리 2~3핀 여백 확보.
// 브라키오사우루스는 사용자가 제공한 DotPad 320 DTMS 원본 그래픽을 그대로 사용한다.

const BRACHIOSAURUS_DTMS_HEX =
  '000000000000C8AE4608000000000000000000000000000000000000000000000000000033220EE100000000000000000000000000000000000000000000000000000000E1300C000000000000000000000000000000000000000000000000000000F00087000000000000000000000000000000000000000000000000000000F00010C6888888080000000000000000000000000000000000000000000000C300000000001021C6080000000000000000000000000000000000000000300C8000800080000031C608000000000000000000000000000000000000001FF20CF0CCF400F0448498224480080000000000000000000000000000C08B9E8FF0FCF88FF8000000111111000000000000000000000000000000101111110110011111000000000000000000000000';

function velociraptor(): string {
  const g = newSilhouetteGrid();
  stroke(g, 24, 27, 34, 27, 5);                 // 작은 몸통
  polyline(g, [[27, 26], [16, 22], [5, 18]], 3); // 길게 뻗은 꼬리 — 대표 특징
  polyline(g, [[34, 26], [40, 21], [44, 19]], 3); // 목~머리
  blob(g, 46, 18, 3);                           // 머리
  stroke(g, 26, 30, 25, 35, 3);                  // 앞다리
  stroke(g, 32, 30, 31, 35, 3);                  // 뒷다리 기둥
  polyline(g, [[31, 35], [27, 35], [23, 32]], 3); // 크게 굽은 낫 발톱 — 대표 특징
  return boolGridToHex(g);
}

function spinosaurus(): string {
  const g = newSilhouetteGrid();
  stroke(g, 17, 28, 37, 28, 6);                  // 몸통
  const sailX = [19, 22, 25, 28, 31, 34];
  const sailH = [6, 10, 14, 13, 9, 6];
  sailX.forEach((x, i) => stroke(g, x, 25, x, 25 - sailH[i], 2)); // 등 돛 — 대표 특징
  polyline(g, [[37, 28], [44, 26], [51, 25]], 3); // 길쭉한 주둥이
  blob(g, 53, 25, 3);
  stroke(g, 21, 31, 21, 37, 3);
  stroke(g, 31, 31, 31, 37, 3);
  stroke(g, 17, 28, 7, 27, 3);
  return boolGridToHex(g);
}

function parasaurolophus(): string {
  const g = newSilhouetteGrid();
  stroke(g, 17, 28, 35, 28, 6);
  polyline(g, [[33, 27], [39, 21], [43, 18]], 4); // 목
  blob(g, 45, 17, 3);
  polyline(g, [[45, 16], [40, 10], [31, 8]], 3);  // 뒤로 길게 휜 볏 — 대표 특징
  stroke(g, 21, 31, 21, 37, 3);
  stroke(g, 31, 31, 31, 37, 4);
  stroke(g, 17, 28, 7, 30, 3);
  return boolGridToHex(g);
}

function ankylosaurus(): string {
  const g = newSilhouetteGrid();
  stroke(g, 13, 31, 39, 31, 8);                  // 낮고 넓은 몸통 — 대표 특징
  blob(g, 44, 30, 3);                             // 머리
  stroke(g, 18, 35, 18, 38, 3);                   // 짧은 다리(낮은 자세)
  stroke(g, 34, 35, 34, 38, 3);
  stroke(g, 13, 31, 6, 31, 4);                    // 꼬리
  blob(g, 5, 31, 4);                              // 꼬리 끝 곤봉 — 대표 특징
  return boolGridToHex(g);
}

export const SILHOUETTES: Record<string, string> = {
  brachiosaurus: BRACHIOSAURUS_DTMS_HEX,
  velociraptor: velociraptor(),
  spinosaurus: spinosaurus(),
  parasaurolophus: parasaurolophus(),
  ankylosaurus: ankylosaurus(),
};

/** 카드 비교 화면에서 세 후보를 구분 짓는 핵심 특징 한 줄. */
export const DINO_FEATURES: Record<string, string> = {
  brachiosaurus: '둥근 몸통 위로 하늘까지 닿을 듯 아주 긴 목',
  velociraptor: '작은 몸, 길게 뻗은 꼬리, 뒷발의 크게 굽은 낫 발톱',
  spinosaurus: '등 위로 부채처럼 솟은 큰 돛, 길쭉한 주둥이',
  parasaurolophus: '머리 뒤로 길게 휘어 뻗은 볏',
  ankylosaurus: '낮고 넓은 몸, 꼬리 끝의 단단한 뼈 곤봉',
};

/** 연구원·고생물학자 난이도용 — 핵심 단서 한두 단어만. */
export const DINO_SHORT_HINTS: Record<string, string> = {
  brachiosaurus: '아주 긴 목',
  velociraptor: '낫 발톱과 긴 꼬리',
  spinosaurus: '등 위 큰 돛',
  parasaurolophus: '휘어진 볏',
  ankylosaurus: '꼬리 곤봉',
};
