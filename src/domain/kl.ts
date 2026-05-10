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
  /** 端支座负筋（上部非通长筋）每端根数 */
  nSup: number;
  /** 端支座负筋直径 */
  supD: number;
  /** 端支座负筋伸入跨内长度比（Ln/3 首排 ≈ 0.333，Ln/4 次排 ≈ 0.25） */
  supLenRatio: number;
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
  nSup: 2,
  supD: 22,
  supLenRatio: 1 / 3,
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
 * 上部钢筋排布规划（遵 22G101 净距要求）。
 * - 上部筋净距 ≥ max(30mm, 1.5d)，下部筋净距 ≥ max(25mm, d)。
 * - 负筋优先布在上部第一排中间，与通长筋同一 Y 平面（通长筋占外侧角部位置）。
 * - 第一排装不下的负筋下移一排，紧贴两侧角部向内依次排列。
 */
function planTopLayout(p: KLParams): {
  yRow1: number;
  yRow2: number;
  zsCont: number[]; // 上部通长筋（均在 Row1，取外侧槽位）
  zsSupRow1: number[];
  zsSupRow2: number[];
  cap1: number;
} {
  const dMax = Math.max(p.longDTop, p.supD);
  // 22G101 上部纵筋净距
  const clearMin = Math.max(30, 1.5 * dMax);
  // 可用净宽（箸筋内侧间距）
  const availInside = p.b - 2 * p.cover - 2 * p.stirD;
  // 第一排可容纳最大根数：n*d + (n-1)*s ≤ availInside
  const cap1 = Math.max(2, Math.floor((availInside + clearMin) / (dMax + clearMin)));

  const nTop = Math.max(0, p.nTop);
  const nSup = Math.max(0, p.nSup);
  const nRow1 = Math.min(nTop + nSup, cap1);
  const nContRow1 = Math.min(nTop, nRow1);
  const nSupRow1 = nRow1 - nContRow1;
  const nSupRow2 = nSup - nSupRow1;

  // Row1 z 坐标（以 dMax 为内移基准）
  const zsRow1 = zPositions(nRow1, p.b, p.cover, p.stirD, dMax);
  // 按 |z| 降序取外侧位，前 nContRow1 个留给通长筋
  const idxByOuter = zsRow1
    .map((z, i) => ({ z, i }))
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .map((o) => o.i);
  const contSet = new Set(idxByOuter.slice(0, nContRow1));
  const zsCont = zsRow1.filter((_, i) => contSet.has(i));
  const zsSupRow1 = zsRow1.filter((_, i) => !contSet.has(i));

  // Row2：仅在溢出时使用。两侧对称从角部向内排列，间距 = dMax + clearMin
  const zsSupRow2: number[] = [];
  if (nSupRow2 > 0) {
    const insetCorner = p.cover + p.stirD + dMax / 2;
    const stepC2C = dMax + clearMin;
    const nLeft = Math.ceil(nSupRow2 / 2);
    const nRight = nSupRow2 - nLeft;
    for (let i = 0; i < nLeft; i++) zsSupRow2.push(-p.b / 2 + insetCorner + i * stepC2C);
    for (let i = 0; i < nRight; i++) zsSupRow2.push(p.b / 2 - insetCorner - i * stepC2C);
  }

  // Y 平面：Row1 与上部通长筋同高；Row2 下移（中心距 = dMax + max(25, dMax)）
  const yRow1 = p.h - (p.cover + p.stirD + dMax / 2);
  const rowGap = dMax + Math.max(25, dMax);
  const yRow2 = yRow1 - rowGap;
  return { yRow1, yRow2, zsCont, zsSupRow1, zsSupRow2, cap1 };
}

/**
 * 上下通长筋：沿 X 方向贯通，两端做 90° 弯锚（22G101 端支座）。
 * 弯钩平直段 15d：上部筋两端朝下弯，下部筋两端朝上弯（均朝梁内）。
 * 上部、下部纵筋直径可分别设置（longDTop / longDBot）。
 */
function buildLongitudinals(p: KLParams): RebarSpec[] {
  const insetBot = p.cover + p.stirD + p.longDBot / 2;
  const yBot = insetBot;
  // 上部：使用统一排布规划（与负筋同排布化）
  const layout = planTopLayout(p);
  const yTop = layout.yRow1;
  const zsTop = layout.zsCont;
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

/**
 * 端支座负筋（上部非通长筋）：仅在两端支座附近，从支座边伸入跨内 Ln × ratio。
 * 22G101：首排取 Ln/3，次排取 Ln/4；本实现以 L 近似 Ln。
 * 外端在支座做 90° 弯锚（平直段 15d，钩尾朝下）。
 * 排布：优先与通长筋同排中间位置（yRow1）；溢出时下移一排，两侧对称从角部向内排列。
 */
function buildSupportBars(p: KLParams): RebarSpec[] {
  if (p.nSup <= 0) return [];
  const layout = planTopLayout(p);
  const hookLen = Math.max(15 * p.supD, 150);
  const supLen = Math.max(p.L * p.supLenRatio, 4 * p.supD);
  const specs: RebarSpec[] = [];

  const emitPair = (z: number, y: number, tag: string) => {
    // 左端负筋：x 从 0 伸到 supLen，外端 90° 钩下
    specs.push({
      id: `kl-sup-L-${tag}`,
      kind: 'longitudinal',
      diameter: p.supD,
      grade: p.longGrade,
      points: [
        new THREE.Vector3(0, y - hookLen, z),
        new THREE.Vector3(0, y, z),
        new THREE.Vector3(supLen, y, z),
      ],
    });
    // 右端负筋：镜像
    specs.push({
      id: `kl-sup-R-${tag}`,
      kind: 'longitudinal',
      diameter: p.supD,
      grade: p.longGrade,
      points: [
        new THREE.Vector3(p.L - supLen, y, z),
        new THREE.Vector3(p.L, y, z),
        new THREE.Vector3(p.L, y - hookLen, z),
      ],
    });
  };

  layout.zsSupRow1.forEach((z, i) => emitPair(z, layout.yRow1, `r1-${i}`));
  layout.zsSupRow2.forEach((z, i) => emitPair(z, layout.yRow2, `r2-${i}`));
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
  return [...buildLongitudinals(p), ...buildSupportBars(p), ...buildStirrups(p)];
}
