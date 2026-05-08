// 钢筋下料表（BBS - Bar Bending Schedule）
import type { RebarSpec } from './types';
import { rebarWeightPerMeter, GRADE_NAME } from './codes';

export interface BBSRow {
  no: number;
  /** 类别：纵筋 / 箍筋 / ... */
  kindLabel: string;
  /** 钢筋符号，如 C22 */
  symbol: string;
  /** 钢筋等级 HPB300/HRB400/HRB500 */
  gradeName: string;
  diameter: number;
  /** 形状描述 */
  shape: string;
  /** 单根下料长度（mm） */
  singleLen: number;
  /** 根数 */
  count: number;
  /** 总长（m） */
  totalLenM: number;
  /** 总重（kg） */
  totalKg: number;
}

const KIND_LABEL: Record<RebarSpec['kind'], string> = {
  longitudinal: '纵筋',
  stirrup: '箍筋',
  tie: '拉筋',
  erection: '架立筋',
};

/** 计算折线总长（mm） */
function polylineLength(pts: RebarSpec['points'], closed?: boolean): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
  if (closed && pts.length > 1) len += pts[0].distanceTo(pts[pts.length - 1]);
  return len;
}

function shapeOf(spec: RebarSpec): string {
  if (spec.kind === 'stirrup') return '矩形箍';
  if (spec.kind === 'longitudinal') return '直筋';
  return '—';
}

/**
 * 把所有 spec 按 (kind, diameter, grade, shape, singleLen) 聚合统计。
 * 若 specs 数组里很多箍筋长度一致，会合并成一行。
 */
export function buildBBS(specs: RebarSpec[]): BBSRow[] {
  type Key = string;
  const map = new Map<Key, { sample: RebarSpec; singleLen: number; count: number }>();
  for (const s of specs) {
    const len = Math.round(polylineLength(s.points, s.closed));
    const key = `${s.kind}|${s.diameter}|${s.grade}|${len}|${s.closed ? 'c' : 'o'}`;
    const cur = map.get(key);
    if (cur) cur.count++;
    else map.set(key, { sample: s, singleLen: len, count: 1 });
  }
  const rows: BBSRow[] = [];
  let no = 1;
  for (const { sample, singleLen, count } of map.values()) {
    const totalLenM = (singleLen * count) / 1000;
    rows.push({
      no: no++,
      kindLabel: KIND_LABEL[sample.kind],
      symbol: `${sample.grade}${sample.diameter}`,
      gradeName: GRADE_NAME[sample.grade],
      diameter: sample.diameter,
      shape: shapeOf(sample),
      singleLen,
      count,
      totalLenM: +totalLenM.toFixed(2),
      totalKg: +(totalLenM * rebarWeightPerMeter(sample.diameter)).toFixed(2),
    });
  }
  // 排序：先纵筋后箍筋，再按直径降序
  rows.sort((a, b) => {
    if (a.kindLabel !== b.kindLabel) return a.kindLabel === '纵筋' ? -1 : 1;
    return b.diameter - a.diameter;
  });
  rows.forEach((r, i) => (r.no = i + 1));
  return rows;
}

export function bbsTotals(rows: BBSRow[]): { totalLenM: number; totalKg: number } {
  return {
    totalLenM: +rows.reduce((s, r) => s + r.totalLenM, 0).toFixed(2),
    totalKg: +rows.reduce((s, r) => s + r.totalKg, 0).toFixed(2),
  };
}
