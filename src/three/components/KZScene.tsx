import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store/paramsStore';
import { generateKZRebars } from '@/domain/kz';
import { Rebar } from './Rebar';
import { Concrete } from './Concrete';

export function KZScene() {
  const kz = useStore((s) => s.kz);
  const ui = useStore((s) => s.ui);

  const specs = useMemo(() => generateKZRebars(kz), [kz]);

  // 爆炸：纵筋向外、箍筋向上下分散
  const explode = ui.explode;
  const explodedSpecs = useMemo(() => {
    if (explode <= 0.001) return specs;
    return specs.map((s) => {
      if (s.kind === 'longitudinal') {
        // 沿截面径向外推
        const first = s.points[0];
        const dir = new THREE.Vector3(first.x, 0, first.z).normalize();
        const offset = dir.multiplyScalar(300 * explode);
        return { ...s, points: s.points.map((p) => p.clone().add(offset)) };
      }
      if (s.kind === 'stirrup') {
        // 沿 Y 散开（按高度位置稍微再拉开）
        const y = s.points[0].y;
        const factor = (y / Math.max(kz.Hn, 1) - 0.5) * 600 * explode;
        return { ...s, points: s.points.map((p) => p.clone().add(new THREE.Vector3(0, factor, 0))) };
      }
      return s;
    });
  }, [specs, explode, kz.Hn]);

  const filtered = explodedSpecs.filter((s) => {
    if (s.kind === 'longitudinal') return ui.showLongitudinal;
    if (s.kind === 'stirrup') return ui.showStirrups;
    return true;
  });

  return (
    <group>
      <Concrete
        size={{ x: kz.b, y: kz.Hn, z: kz.h }}
        position={[0, 0, 0]}
        opacity={ui.concreteOpacity}
        visible={ui.showConcrete}
      />
      {filtered.map((s) => {
        const color = s.kind === 'stirrup' ? ui.colorStir : ui.colorLongTop;
        return <Rebar key={s.id} spec={s} ribStrength={ui.ribStrength} color={color} />;
      })}
    </group>
  );
}
