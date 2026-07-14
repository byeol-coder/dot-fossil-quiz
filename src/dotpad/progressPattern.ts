import { boolGridToHex, emptyGrid } from './tactileGen';
import type { Progress } from '../progress';

function box(g: boolean[][], x: number, y: number, w: number, h: number, filled: boolean) {
  for (let yy=y; yy<y+h; yy++) for (let xx=x; xx<x+w; xx++) {
    const edge = yy===y || yy===y+h-1 || xx===x || xx===x+w-1;
    if (edge || (filled && (xx+yy)%2===0)) g[yy][xx] = true;
  }
}

export function buildProgressHex(p: Progress): string {
  const g = emptyGrid();
  for (let i=0;i<5;i++) box(g, 2+i*11, 2, 9, 8, i < p.campaign.level);
  const target = Object.values(p.campaign.fragments).find(x => !x.restored) ?? { body:true, signature:true, footprint:true, restored:true };
  [target.body,target.signature,target.footprint].forEach((v,i) => box(g, 5+i*18, 15, 14, 10, v));
  const gauge = Math.min(52, Math.round((p.campaign.points / 500) * 52));
  box(g, 4, 30, 52, 7, false);
  for (let y=32;y<35;y++) for (let x=6;x<6+gauge;x++) g[y][x]=true;
  return boolGridToHex(g);
}
