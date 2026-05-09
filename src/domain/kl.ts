// KL 框架梁：参数化生成钢筋轨迹
// 坐标约定：梁沿 X 轴布置，x ∈ [0, L]；截面在 Y-Z 平面，y ∈ [0, h]（梁底→梁顶），z ∈ [-b/2, b/2]
import * as THREE from 'three';
import type { RebarSpec } from './types';
import type { RebarGrade, ConcreteGrade, SeismicGrade } from './codes';

export interface KLParams {
  /** 跨度（mm），梁全长 */
  L: number;
  /** 截面宽 b（mm，沿 Z） */
  b: number;
  /** 截面高 h（mm，沿 Y） */
  h: number;
  /** 保护层（mm） */
  cover: number;
  /** 上部通长筋根数 */
  nTop: number;
  /** 下部通长筋根数 */
  nBot: number;
  /** 上部通长筋直径 */
  longDTop: number;
  /** 下部通长筋直径 */
  longDBot: number;
  longGrade: RebarGrade;
  /** 箍筋直径 */
  stirD: number;
  stirGrade: RebarGrade;
  /** 加密区间距 */
  s1: number;
  /** 非加密区间距 */
  s2: number;
  conc: ConcreteGrade;
  seismic: SeismicGrade;
}

export const DEFAULT_KL: KLParams = {
  L: 6000,
  b: 300,
  h: 600,
  cover: 25,
  nTop: 2,
  nBot: 4,
  longDTop: 22,
  longDBot: 22,
  longGrade: 'C',
  stirD: 8,
  stirGrade: 'B',
  s1: 100,
  s2: 200,
  conc: 'C30',
  seismic: '2',
};

/** 通长筋在截面上的 Z 坐标列表（n 根均匀分布） */
function zPositions(n: number, b: number, cover: number, stirD: number, longD: number): number[] {
  const inset = cover + stirD + longD / 2;
  const z0 = -b / 2 + inset;
  const z1 = b / 2 - inset;
  if (n <= 1) return [0];
  const arr: number[] = [];
  for (let i = 0; i < n; i++) arr.push(z0 + (z1 - z0) * (i / (n - 1)));
  return arr;
}

/**
 * 上下通长筋：沿 X 方向贯通，两端做 90° 弯锚（22G101 端支座）。
 * 弯钩平直段 15d：上部筋两端朝下弯，下部筋两端朝上弯（均朝梁内）。
 * 上部、下部纵筋直径可分别设置（longDTop / longDBot）。
 */
function buildLongitudinals(p: KLParams): RebarSpec[] {
  const insetTop = p.cover + p.stirD + p.longDTop / 2;
  const insetBot = p.cover + p.stirD + p.longDBot / 2;
  const yTop = p.h - insetTop;
  const yBot = insetBot;
  const zsTop = zPositions(p.nTop, p.b, p.cover, p.stirD, p.longDTop);
  const zsBot = zPositions(p.nBot, p.b, p.cover, p.stirD, p.longDBot);
  // 22G101：端支座 90° 弯锚平直段 15d
  const hookLenTop = Math.max(15 * p.longDTop, 150);
  const hookLenBot = Math.max(15 * p.longDBot, 150);
  // 下部筋两端整体内移 2d，与上部筋的竖向钩尾在 X 方向错开，避免视觉重叠
  const xStaggerBot = 2 * p.longDBot;
  const specs: RebarSpec[] = [];
  zsTop.forEach((z, i) => {
    const left = new THREE.Vector3(0, yTop, z);
    const right = new THREE.Vector3(p.L, yTop, z);
    // 上部筋：钩尾朝下（向梁内），y = yTop − hookLen
    const leftHook = new THREE.Vector3(0, yTop - hookLenTop, z);
    const rightHook = new THREE.Vector3(p.L, yTop - hookLenTop, z);
    specs.push({
      id: `kl-top-${i}`,
      kind: 'longitudinal',
      diameter: p.longDTop,
      grade: p.longGrade,
      points: [leftHook, left, right, rightHook],
    });
  });
  zsBot.forEach((z, i) => {
    const xL = xStaggerBot;
    const xR = p.L - xStaggerBot;
    const left = new THREE.Vector3(xL, yBot, z);
    const right = new THREE.Vector3(xR, yBot, z);
    // 下部筋：钩尾朝上（向梁内），y = yBot + hookLen
    const leftHook = new THREE.Vector3(xL, yBot + hookLenBot, z);
    const rightHook = new THREE.Vector3(xR, yBot + hookLenBot, z);
    specs.push({
      id: `kl-bot-${i}`,
      kind: 'longitudinal',
      diameter: p.longDBot,
      grade: p.longGrade,
      points: [leftHook, left, right, rightHook],
    });
  });
  return specs;
}

/** 箍筋加密区长度：抗震 1/2 级取 max(2h, 500)；3/4 级取 max(1.5h, 500)；非抗震退化为 500 */
function beamStirrupDenseLen(h: number, seismic: SeismicGrade): number {
  if (seismic === '1' || seismic === '2') return Math.max(2 * h, 500);
  if (seismic === '3' || seismic === '4') return Math.max(1.5 * h, 500);
  return 500;
}

/**
 * 箍筋（矩形封闭，截面方向 Y-Z），按加密区/非加密区间距沿 X 排布。
 * 两端加密区长度取自 beamStirrupDenseLen。
 */
function buildStirrups(p: KLParams): RebarSpec[] {
  const inY = p.cover + p.stirD / 2;
  const inZ = p.cover + p.stirD / 2;
  const y0 = inY;
  const y1 = p.h - inY;
  const z0 = -p.b / 2 + inZ;
  const z1 = p.b / 2 - inZ;
  // 截面矩形 4 角点（位于 Y-Z 平面），按 [TL, TR, BR, BL] 顺序，TL 为弯钩开口角
  const ringRel: Array<[number, number]> = [
    [y1, z0], // TL（高 y，左 z）
    [y1, z1], // TR
    [y0, z1], // BR
    [y0, z0], // BL
  ];

  const denseLen = beamStirrupDenseLen(p.h, p.seismic);
  const xs: number[] = [];
  // 起点：距支座 50mm（习惯起步距离），保持在加密区内
  const start = 50;
  // 左加密区
  for (let x = start; x <= denseLen; x += p.s1) xs.push(x);
  // 中间非加密
  for (let x = denseLen + p.s2; x <= p.L - denseLen; x += p.s2) xs.push(x);
  // 右加密区
  for (let x = p.L - denseLen; x <= p.L - start; x += p.s1) xs.push(x);

  return xs.map((x, i) => ({
    id: `kl-stir-${i}`,
    kind: 'stirrup' as const,
    diameter: p.stirD,
    grade: p.stirGrade,
    points: ringRel.map(([y, z]) => new THREE.Vector3(x, y, z)),
    closed: true,
    hookStart: '135' as const,
    hookEnd: '135' as const,
  }));
}

export function generateKLRebars(p: KLParams): RebarSpec[] {
  return [...buildLongitudinals(p), ...buildStirrups(p)];
}
