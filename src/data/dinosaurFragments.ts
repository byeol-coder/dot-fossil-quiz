import { boolGridToHex, emptyGrid, halfDensity, hexToBoolGrid } from '../dotpad/tactileGen';
import { blob, polyline, stroke } from '../dotpad/silhouette';
import { SILHOUETTES } from './dinoSilhouettes';

type FragmentKind = 'body' | 'signature' | 'footprint';

function signature(id: string): string {
  const g = emptyGrid();
  if (id === 'brachiosaurus') polyline(g, [[18,34],[24,25],[30,15],[36,5]], 4);
  if (id === 'velociraptor') polyline(g, [[15,10],[28,24],[22,35],[36,29]], 4);
  if (id === 'spinosaurus') [15,21,27,33,39,45].forEach((x,i) => stroke(g,x,29,x,12-Math.abs(2.5-i)*3,2));
  if (id === 'parasaurolophus') polyline(g, [[42,27],[35,18],[27,10],[12,8]], 4);
  if (id === 'ankylosaurus') { stroke(g,12,22,43,22,5); blob(g,9,22,6); }
  return boolGridToHex(g);
}

function footprint(id: string): string {
  const g = emptyGrid();
  const two = id === 'brachiosaurus' || id === 'ankylosaurus';
  const centers = two ? [[20,20],[40,20]] : [[30,22]];
  centers.forEach(([x,y]) => {
    blob(g,x,y,id === 'brachiosaurus' ? 7 : 5);
    const toes = id === 'ankylosaurus' ? [-7,0,7] : [-8,0,8];
    toes.forEach(dx => stroke(g,x,y-4,x+dx,y-12,3));
  });
  if (id === 'velociraptor') polyline(g, [[30,22],[20,8],[27,16]],3);
  if (id === 'parasaurolophus') stroke(g,30,27,30,36,5);
  if (id === 'spinosaurus') stroke(g,19,31,41,31,2);
  return boolGridToHex(g);
}

export const DINOSAUR_FRAGMENTS: Record<string, Record<FragmentKind, string>> = Object.fromEntries(
  Object.keys(SILHOUETTES).map(id => [id, {
    body: boolGridToHex(halfDensity(hexToBoolGrid(SILHOUETTES[id]))),
    signature: signature(id),
    footprint: footprint(id),
  }]),
);

export const FRAGMENT_LABELS: Record<FragmentKind, string> = {
  body: '몸통 조각', signature: '대표 특징 조각', footprint: '발자국 조각',
};
