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
}

// 全局共享材质（按等级/直径不需要分，外观一致即可）
let _sharedMat: THREE.MeshStandardMaterial | null = null;
let _highlightMat: THREE.MeshStandardMaterial | null = null;
function getMat(ribStrength: number) {
  if (!_sharedMat) {
    _sharedMat = createRibbedRebarMaterial({ ribStrength });
  } else {
    const u = (_sharedMat as any).userData.ribUniforms;
    if (u) u.uRibStrength.value = ribStrength;
  }
  return _sharedMat;
}
function getHighlightMat() {
  if (!_highlightMat) {
    _highlightMat = createRibbedRebarMaterial({ color: '#ffb84a', ribStrength: 0.55 });
  }
  return _highlightMat;
}

export function Rebar({ spec, scale = 0.001, ribStrength = 0.55, highlight }: Props) {
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
    <mesh ref={ref} geometry={geom} material={highlight ? getHighlightMat() : getMat(ribStrength)} castShadow />
  );
}
