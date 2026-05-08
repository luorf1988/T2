// 平法标注解析器（KZ 框架柱）
// 支持示例：
//   "KZ1 700×700 20C22 C10@100/200"
//   "700x700 20C22 C10@100"
//   "KZ-1  600*600 16B20 A8@100/200"

import type { RebarGrade } from './codes';

export interface ParsedKZNotation {
  /** 柱编号（如 KZ1），可选 */
  id?: string;
  b: number;
  h: number;
  /** 纵筋总根数 */
  longTotal: number;
  longGrade: RebarGrade;
  longD: number;
  stirGrade: RebarGrade;
  stirD: number;
  s1: number;
  /** 非加密区间距，未给则与 s1 相同 */
  s2: number;
}

/** 主正则：兼容 ×/x/×/* 分隔符与 KZ/KZ-1 编号 */
const RE = new RegExp(
  '^\\s*' +
    '(?:(KZ[-\\s]*\\d+)\\s+)?' + // 1: 柱号
    '(\\d+)\\s*[×x*]\\s*(\\d+)' + // 2,3: b × h
    '\\s+(\\d+)\\s*([ABCD])\\s*(\\d+)' + // 4,5,6: 总根数 + 等级 + 直径
    '\\s+([ABCD])\\s*(\\d+)\\s*@\\s*(\\d+)(?:\\s*/\\s*(\\d+))?' + // 7,8,9,10: 箍筋等级+直径@s1/s2
    '\\s*$',
  'i',
);

export function parseKZNotation(text: string): ParsedKZNotation | { error: string } {
  const t = text.trim().replace(/\u00d7/g, '×'); // 标准化
  const m = t.match(RE);
  if (!m) {
    return {
      error:
        '格式错误。示例："KZ1 700×700 20C22 C10@100/200"\n规则：[KZ编号 ] b×h 总根数+等级+直径 箍筋等级+直径@s1[/s2]',
    };
  }
  const [, id, bStr, hStr, nStr, lg, lDStr, sg, sDStr, s1Str, s2Str] = m;
  const s1 = +s1Str;
  const s2 = s2Str ? +s2Str : s1;
  return {
    id: id?.toUpperCase(),
    b: +bStr,
    h: +hStr,
    longTotal: +nStr,
    longGrade: lg.toUpperCase() as RebarGrade,
    longD: +lDStr,
    stirGrade: sg.toUpperCase() as RebarGrade,
    stirD: +sDStr,
    s1,
    s2,
  };
}

/**
 * 将"总根数"按截面长宽比近似分配到 b 边/h 边的根数。
 * 满足：2*nB + 2*nH - 4 = total，且 nB:nH ≈ b:h。
 */
export function splitLongCount(total: number, b: number, h: number): { nB: number; nH: number } {
  if (total < 4) return { nB: 2, nH: 2 };
  const sum = total / 2 + 2; // = nB + nH
  let nB = Math.round((sum * b) / (b + h));
  nB = Math.max(2, Math.min(sum - 2, nB));
  let nH = sum - nB;
  // 校正使总数严格等于 total
  while (2 * nB + 2 * nH - 4 < total) nH++;
  while (2 * nB + 2 * nH - 4 > total) {
    if (nH > nB) nH--;
    else nB--;
  }
  return { nB: Math.max(2, nB), nH: Math.max(2, nH) };
}
