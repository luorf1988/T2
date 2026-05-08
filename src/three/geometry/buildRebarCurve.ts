import * as THREE from 'three';
import type { RebarSpec } from '@/domain/types';

/**
 * 将折线点集 + 弯钩转化为光滑曲线，再生成 TubeGeometry。
 * - 闭合钢筋（箍筋）：在末端追加 135° 弯钩平直段（双端均带）
 * - 非闭合：在两端按 hookStart/hookEnd 追加弯钩
 *
 * 圆角化策略：在每个内点处沿前后边方向插入两个过渡点（距离 = 2d），
 * 然后用 CatmullRomCurve3('catmullrom', closed) 平滑通过。
 */
export function buildRebarTubeGeometry(spec: RebarSpec, scale = 1): THREE.BufferGeometry {
  const d = spec.diameter * scale;
  const r = d / 2;
  const tubularSegmentsPerUnit = 0.08; // 每 mm 弧长的段数（缩放后）

  let pts = spec.points.map((p) => p.clone().multiplyScalar(scale));

  if (spec.closed) {
    if (spec.hookStart === '135' || spec.hookEnd === '135') {
      return buildClosedStirrupWith135HooksAtCorner(pts, d, r);
    }
    // 闭合箍筋（无弯钩）：CatmullRom 通过 4 个角点形成闭合环
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.0);
    const length = curve.getLength();
    const segments = Math.min(400, Math.max(80, Math.floor(length * 80)));
    return new THREE.TubeGeometry(curve, segments, r, 12, true);
  }

  // 非闭合：处理弯钩
  const addHook = (anchor: THREE.Vector3, prev: THREE.Vector3, type: '135' | '90' | 'none' | undefined): THREE.Vector3 | null => {
    if (!type || type === 'none') return null;
    const dir = new THREE.Vector3().subVectors(anchor, prev).normalize();
    const angle = type === '135' ? (135 * Math.PI) / 180 : Math.PI / 2;
    // 在垂直于 dir 的平面里旋转：取 world Y 作参考构造正交基
    const up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const side = new THREE.Vector3().crossVectors(dir, up).normalize();
    const hookDir = dir.clone().multiplyScalar(Math.cos(angle))
      .add(side.clone().multiplyScalar(Math.sin(angle)));
    const hookLen = Math.max(10 * d, 75 * scale);
    return anchor.clone().add(hookDir.multiplyScalar(hookLen));
  };

  const finalPts: THREE.Vector3[] = [...pts];
  const hs = addHook(pts[0], pts[1], spec.hookStart);
  if (hs) finalPts.unshift(hs);
  const he = addHook(pts[pts.length - 1], pts[pts.length - 2], spec.hookEnd);
  if (he) finalPts.push(he);

  const curve = new THREE.CatmullRomCurve3(finalPts, false, 'catmullrom', 0.2);
  const length = curve.getLength();
  const segments = Math.max(40, Math.floor(length * tubularSegmentsPerUnit));
  return new THREE.TubeGeometry(curve, segments, r, 12, false);
}

/**
 * 箍筋（同角双 135° 弯钩，两根平行钩尾从同一角斜插核心区），依据 16G101。
 *
 * 输入 pts 必须按 [A=TL, B=TR, C=BR, D=BL] 顺序，A 为开钩角。
 *
 * 几何（一根钢筋折成）：
 *   - 主体绕 B、C、D 三个角形成 90° 圆角；A 角处钢筋"开口"。
 *   - 两端弯折点 P1（顶边距 A 为 inset）、P2（左边距 A 为 inset），
 *     从弯折点沿 inward = (u_AB + u_AD)/√2 方向斜插核心区，长度 ≥ max(10d, 75mm)。
 *   - inset = 2.5d，使钩尾平直段距 A 中心 ≈ inset/√2 ≈ 1.77d，
 *     大于角部纵筋半径 + 箍筋半径，不会与纵筋相交；同时视觉上钩尾紧贴角部。
 *
 * 路径（7 点）：tip1 → P1 → B → C → D → P2 → tip2
 *   P1 = A + inset · u_AB        顶边上靠近 A 的弯折点
 *   P2 = A + inset · u_AD        左边上靠近 A 的弯折点
 *   tip1 = P1 + L_hook · inward
 *   tip2 = P2 + L_hook · inward
 *
 * 转角验证：
 *   P1：d_in = −inward, d_out =  u_AB  → cos = −1/√2 → 135° ✓
 *   B、C、D：相邻边正交 → 90° ✓
 *   P2：d_in = −u_AD,  d_out =  inward → cos = −1/√2 → 135° ✓
 *
 * 在所有内点由 makeFilletedCurvePath 自动加 ≈1.5d 圆角。
 */
function buildClosedStirrupWith135HooksAtCorner(
  pts: THREE.Vector3[],
  d: number,
  r: number,
): THREE.BufferGeometry {
  if (pts.length !== 4) {
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.0);
    const length = curve.getLength();
    const segments = Math.min(400, Math.max(80, Math.floor(length * 80)));
    return new THREE.TubeGeometry(curve, segments, r, 12, true);
  }

  // pts = [A=TL, B=TR, C=BR, D=BL]
  const A = pts[0];
  const B = pts[1];
  const C = pts[2];
  const D = pts[3];

  const uAB = new THREE.Vector3().subVectors(B, A).normalize();
  const uAD = new THREE.Vector3().subVectors(D, A).normalize();
  // 钩尾方向：朝核心区 45°（两钩平行）
  const inward = new THREE.Vector3().addVectors(uAB, uAD).normalize();

  // 弯折点距 A 沿边的距离：取 2.5d，使钩尾平直段距 A ≈ 1.77d，
  // 既能避开角部纵筋（>(d_long+d_stir)/2），又让视觉上钩尾紧贴角部。
  const inset = Math.max(2.5 * d, 0.020);
  const P1 = A.clone().add(uAB.clone().multiplyScalar(inset));
  const P2 = A.clone().add(uAD.clone().multiplyScalar(inset));

  const hookLen = Math.max(10 * d, 0.075); // ≥ max(10d, 75mm)
  const tip1 = P1.clone().add(inward.clone().multiplyScalar(hookLen));
  const tip2 = P2.clone().add(inward.clone().multiplyScalar(hookLen));

  // 7 点折线：tip1 → P1 → B → C → D → P2 → tip2
  // 转角：P1 = 135°, B/C/D = 90°, P2 = 135°
  const polyline: THREE.Vector3[] = [tip1, P1, B, C, D, P2, tip2];

  // 倒圆角半径（约 1.5d），makeFilletedCurvePath 自动按转角调整切线长。
  const filletR = Math.max(1.5 * d, 0.004);
  const curve = makeFilletedCurvePath(polyline, filletR);

  const length = curve.getLength();
  const segments = Math.min(600, Math.max(120, Math.floor(length * 100)));
  return new THREE.TubeGeometry(curve, segments, r, 12, false);
}

/**
 * 由折线点构造"直线段 + 角部圆角"的复合曲线（CurvePath）。
 *
 * 在每个内部角 P（前段方向 u、后段方向 v）：
 * - 计算转折角 α = π - acos(u·v)（α 为内角）
 * - 倒角切线长 t = filletR / tan(α/2)，并裁剪 ≤ 相邻边长的 45%
 * - 用二次贝塞尔 (P-u·t, P, P+v·t) 替代尖角，与前后直线 G1 连续
 * - 直线方向不变（不会"突出"），保持纯 90° / 135° 等转折姿态
 */
function makeFilletedCurvePath(
  points: THREE.Vector3[],
  filletR: number,
): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  if (points.length < 2) return path;
  if (points.length === 2) {
    path.add(new THREE.LineCurve3(points[0].clone(), points[1].clone()));
    return path;
  }

  type Corner = { pIn: THREE.Vector3; pOut: THREE.Vector3; corner: THREE.Vector3; straight: boolean };
  const corners: Corner[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const nxt = points[i + 1];
    const u = new THREE.Vector3().subVectors(cur, prev).normalize();
    const v = new THREE.Vector3().subVectors(nxt, cur).normalize();
    const dot = Math.max(-1, Math.min(1, u.dot(v)));
    const turn = Math.acos(dot);
    if (turn < 1e-3) {
      corners.push({ pIn: cur.clone(), pOut: cur.clone(), corner: cur, straight: true });
      continue;
    }
    const interior = Math.PI - turn;
    let t = filletR / Math.tan(interior / 2);
    const lenIn = prev.distanceTo(cur);
    const lenOut = cur.distanceTo(nxt);
    t = Math.min(t, lenIn * 0.45, lenOut * 0.45);
    const pIn = cur.clone().sub(u.multiplyScalar(t));
    const pOut = cur.clone().add(v.multiplyScalar(t));
    corners.push({ pIn, pOut, corner: cur, straight: false });
  }

  let cursor = points[0].clone();
  for (const c of corners) {
    if (c.straight) continue;
    if (cursor.distanceToSquared(c.pIn) > 1e-12) {
      path.add(new THREE.LineCurve3(cursor.clone(), c.pIn.clone()));
    }
    path.add(new THREE.QuadraticBezierCurve3(c.pIn.clone(), c.corner.clone(), c.pOut.clone()));
    cursor = c.pOut.clone();
  }
  const last = points[points.length - 1];
  if (cursor.distanceToSquared(last) > 1e-12) {
    path.add(new THREE.LineCurve3(cursor.clone(), last.clone()));
  }
  return path;
}
