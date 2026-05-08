// 16G101 关键常量与查表（简化版，工程足够使用）
// 单位：mm

/** 钢筋强度等级标识：A=HPB300, B=HRB400, C=HRB400, D=HRB500（与图集"4C25"中的字母对应） */
export type RebarGrade = 'A' | 'B' | 'C' | 'D';

export const GRADE_NAME: Record<RebarGrade, string> = {
  A: 'HPB300',
  B: 'HRB400',
  C: 'HRB400',
  D: 'HRB500',
};

/** 混凝土强度等级 */
export type ConcreteGrade = 'C25' | 'C30' | 'C35' | 'C40' | 'C45' | 'C50';

/**
 * 受拉钢筋基本锚固长度 Lab（倍数 d）。来源：16G101-1 表（非抗震）。
 * 简化：HRB400/500 抗震时再乘 ζaE。返回值为 d 的倍数。
 */
const LAB_TABLE: Record<RebarGrade, Record<ConcreteGrade, number>> = {
  A: { C25: 34, C30: 30, C35: 28, C40: 25, C45: 24, C50: 23 },
  B: { C25: 40, C30: 35, C35: 32, C40: 29, C45: 28, C50: 27 },
  C: { C25: 40, C30: 35, C35: 32, C40: 29, C45: 28, C50: 27 },
  D: { C25: 48, C30: 43, C35: 39, C40: 36, C45: 34, C50: 32 },
};

/** 抗震等级影响系数 ζaE：一二级 1.15，三级 1.05，四级 1.0 */
export type SeismicGrade = '1' | '2' | '3' | '4' | 'NA';
const ZETA_AE: Record<SeismicGrade, number> = {
  '1': 1.15,
  '2': 1.15,
  '3': 1.05,
  '4': 1.0,
  NA: 1.0,
};

/** 锚固长度 Lae（mm） */
export function Lae(d: number, grade: RebarGrade, conc: ConcreteGrade, seismic: SeismicGrade): number {
  const lab = LAB_TABLE[grade][conc] * d;
  return Math.round(lab * ZETA_AE[seismic]);
}

/** 135° 箍筋弯钩平直段长度，取 max(10d, 75) */
export function stirrupHookLen(d: number): number {
  return Math.max(10 * d, 75);
}

/** 柱箍筋加密区高度：取 max(Hn/6, hc, 500)，hc 为柱长边 */
export function columnStirrupDenseLen(Hn: number, hc: number): number {
  return Math.max(Hn / 6, hc, 500);
}

/** 钢筋公称体积重 (kg/m) ≈ 0.00617 * d^2，用于 BBS */
export function rebarWeightPerMeter(d: number): number {
  return 0.00617 * d * d;
}
