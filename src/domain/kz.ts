// KZ 框架柱：根据参数生成所有钢筋的轨迹点集
import * as THREE from 'three';
import type { RebarSpec } from './types';
import { Lae, columnStirrupDenseLen, type RebarGrade, type ConcreteGrade, type SeismicGrade } from './codes';

export interface KZParams {
  /** 截面宽 b（mm，沿 X） */
  b: number;
  /** 截面高 h（mm，沿 Z） */
  h: number;
  /** 柱净高 Hn（mm，沿 Y）：上下楼板之间的净高 */
  Hn: number;
  /** 保护层 c（mm） */
  cover: number;
  /** 纵筋直径（mm） */
  longD: number;
  /** 纵筋等级 */
  longGrade: RebarGrade;
  /** b 边纵筋根数（每边，含角筋）：例如 5 表示 b 方向每边 5 根 */
  nB: number;
  /** h 边纵筋根数（每边，含角筋） */
  nH: number;
  /** 箍筋直径 */
  stirD: number;
  /** 箍筋等级 */
  stirGrade: RebarGrade;
  /** 加密区间距（mm） */
  s1: number;
  /** 非加密区间距（mm） */
  s2: number;
  /** 混凝土强度等级 */
  conc: ConcreteGrade;
  /** 抗震等级 */
  seismic: SeismicGrade;
  /** 柱顶外露端外伸长度（用于显示插筋/锚固，简化处理） */
  topExtra?: number;
}

export const DEFAULT_KZ: KZParams = {
  b: 600,
  h: 600,
  Hn: 3000,
  cover: 25,
  longD: 22,
  longGrade: 'C',
  nB: 4,
  nH: 4,
  stirD: 10,
  stirGrade: 'B',
  s1: 100,
  s2: 200,
  conc: 'C30',
  seismic: '2',
  topExtra: 0,
};

/**
 * 计算柱内纵筋在截面上的中心位置（X-Z 平面）。
 * 角筋 + b 边/h 边非角筋按等距分布在保护层内边线上。
 * 返回 [x, z] 数组，单位 mm，原点在柱截面中心。
 */
export function longitudinalSectionPositions(p: KZParams): Array<[number, number]> {
  const { b, h, cover, longD, stirD, nB, nH } = p;
  // 纵筋中心到截面外边的距离 = cover + 箍筋直径 + 纵筋半径
  const inset = cover + stirD + longD / 2;
  const x0 = -b / 2 + inset;
  const x1 = b / 2 - inset;
  const z0 = -h / 2 + inset;
  const z1 = h / 2 - inset;
  const pts: Array<[number, number]> = [];

  // b 边（顶部 z = z1，与底部 z = z0）：每边 nB 根，含角筋
  // h 边（左 x = x0，与右 x = x1）：每边 nH 根，含角筋
  // 为避免角筋重复：b 边取 nB 根（含角），h 边取从 1..nH-2 的中间根（去掉两端角筋）

  // 顶部 b 边
  for (let i = 0; i < nB; i++) {
    const t = nB === 1 ? 0.5 : i / (nB - 1);
    pts.push([x0 + (x1 - x0) * t, z1]);
  }
  // 底部 b 边
  for (let i = 0; i < nB; i++) {
    const t = nB === 1 ? 0.5 : i / (nB - 1);
    pts.push([x0 + (x1 - x0) * t, z0]);
  }
  // 左 h 边（去掉两端角筋）
  for (let i = 1; i < nH - 1; i++) {
    const t = i / (nH - 1);
    pts.push([x0, z0 + (z1 - z0) * t]);
  }
  // 右 h 边（去掉两端角筋）
  for (let i = 1; i < nH - 1; i++) {
    const t = i / (nH - 1);
    pts.push([x1, z0 + (z1 - z0) * t]);
  }
  return pts;
}

/**
 * 生成纵筋（沿 Y 轴方向，简化为直线 + 柱顶弯锚 12d 向内、柱底插筋伸入基础 Lae）。
 * 柱底 y=0，柱顶 y=Hn。
 */
function buildLongitudinals(p: KZParams): RebarSpec[] {
  const positions = longitudinalSectionPositions(p);
  const yBottom = 0; // 与柱底齐平（无插筋弯钩）
  const yTop = p.Hn; // 与柱顶齐平（直锚，无弯钩）
  const specs: RebarSpec[] = [];
  positions.forEach(([x, z], idx) => {
    const pts = [
      new THREE.Vector3(x, yBottom, z),
      new THREE.Vector3(x, yTop, z),
    ];
    specs.push({
      id: `kz-long-${idx}`,
      kind: 'longitudinal',
      diameter: p.longD,
      grade: p.longGrade,
      points: pts,
      hookStart: 'none',
      hookEnd: 'none',
    });
  });
  return specs;
}

/**
 * 生成箍筋（封闭矩形 + 135° 弯钩），按加密区/非加密区间距沿 Y 排布。
 * 加密区：底部 max(Hn/6, hc, 500) 与顶部同样长度；中间为非加密区。
 */
function buildStirrups(p: KZParams): RebarSpec[] {
  const hc = Math.max(p.b, p.h);
  const denseLen = columnStirrupDenseLen(p.Hn, hc);
  const insetX = p.cover + p.stirD / 2;
  const insetZ = p.cover + p.stirD / 2;
  const x0 = -p.b / 2 + insetX;
  const x1 = p.b / 2 - insetX;
  const z0 = -p.h / 2 + insetZ;
  const z1 = p.h / 2 - insetZ;

  // 矩形 4 角点（X-Z 平面），按 [TL, TR, BR, BL] 顺序，TL 为弯钩开口角
  const rect = [
    new THREE.Vector3(x0, 0, z1), // TL（-X, +Z）
    new THREE.Vector3(x1, 0, z1), // TR
    new THREE.Vector3(x1, 0, z0), // BR
    new THREE.Vector3(x0, 0, z0), // BL
  ];

  const ys: number[] = [];
  // 底部加密区
  for (let y = p.cover + p.stirD / 2; y <= denseLen; y += p.s1) ys.push(y);
  // 中间非加密
  const midStart = denseLen + p.s2;
  const midEnd = p.Hn - denseLen;
  for (let y = midStart; y <= midEnd; y += p.s2) ys.push(y);
  // 顶部加密区
  for (let y = p.Hn - denseLen; y <= p.Hn - p.cover - p.stirD / 2; y += p.s1) ys.push(y);

  return ys.map((y, i) => ({
    id: `kz-stir-${i}`,
    kind: 'stirrup' as const,
    diameter: p.stirD,
    grade: p.stirGrade,
    points: rect.map((v) => new THREE.Vector3(v.x, y, v.z)),
    closed: true,
  }));
}

export function generateKZRebars(p: KZParams): RebarSpec[] {
  return [...buildLongitudinals(p), ...buildStirrups(p)];
}
