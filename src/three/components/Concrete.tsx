import * as THREE from 'three';
import { useMemo } from 'react';

interface Props {
  /** 三向尺寸，mm */
  size: { x: number; y: number; z: number };
  /** 中心位置（mm） */
  position?: [number, number, number];
  scale?: number;
  opacity?: number;
  visible?: boolean;
}

export function Concrete({ size, position = [0, 0, 0], scale = 0.001, opacity = 0.22, visible = true }: Props) {
  const mat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#cdd2d6',
      roughness: 0.85,
      metalness: 0.0,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity > 0.95,
      side: THREE.DoubleSide,
    });
  }, [opacity]);

  if (!visible) return null;
  // 注意：柱底 y=0，柱顶 y=Hn，因此立方体中心需在 y=Hn/2
  return (
    <mesh
      position={[position[0] * scale, (position[1] + size.y / 2) * scale, position[2] * scale]}
      material={mat}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[size.x * scale, size.y * scale, size.z * scale]} />
    </mesh>
  );
}
