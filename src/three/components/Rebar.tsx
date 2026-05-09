import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { RebarSpec } from '@/domain/types';
import * as RebarGeom from '../geometry/buildRebarCurve';
import { createRibbedRebarMaterial } from '../materials/RibbedRebarMaterial';

const { buildRebarTubeGeometry } = RebarGeom;

interface Props {
  spec: RebarSpec;
  /** 用于把 mm 缩放到 three.js 单位（推荐 1mm = 0.001 单位 = 米） */
  scale?: number;
  ribStrength?: number;
  highlight?: boolean;
  /** 钢筋颜色（CSS hex，如 '#7a8694'）。未设置时退回灰色默认 */
  color?: string;
}

// 按颜色缓存材质，颜色相同的钢筋共享同一材质实例
const _matCache = new Map<string, THREE.MeshStandardMaterial>();
let _highlightMat: THREE.MeshStandardMaterial | null = null;
function getMat(color: string, ribStrength: number) {
  let mat = _matCache.get(color);
  if (!mat) {
    mat = createRibbedRebarMaterial({ color, ribStrength });
    _matCache.set(color, mat);
  } else {
    const u = (mat as any).userData.ribUniforms;
    if (u) u.uRibStrength.value = ribStrength;
  }
  return mat;
}
function getHighlightMat() {
  if (!_highlightMat) {
    _highlightMat = createRibbedRebarMaterial({ color: '#ffb84a', ribStrength: 0.55 });
  }
  return _highlightMat;
}

export function Rebar({ spec, scale = 0.001, ribStrength = 0.55, highlight, color = '#7a8694' }: Props) {
  const geom = useMemo(
    () => RebarGeom.buildRebarTubeGeometry(spec, scale),
    [spec, scale, RebarGeom.buildRebarTubeGeometry],
  );
  const ref = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  return (
    <mesh ref={ref} geometry={geom} material={highlight ? getHighlightMat() : getMat(color, ribStrength)} castShadow />
  );
}
