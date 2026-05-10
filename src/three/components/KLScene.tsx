import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '@/store/paramsStore';
import { generateKLRebars } from '@/domain/kl';
import { Rebar } from './Rebar';
import { Concrete } from './Concrete';

export function KLScene() {
  const kl = useStore((s) => s.kl);
  const ui = useStore((s) => s.ui);
  const specs = useMemo(() => generateKLRebars(kl), [kl]);

  const explode = ui.explode;
  const exploded = useMemo(() => {
    if (explode <= 0.001) return specs;
    return specs.map((s) => {
      if (s.kind === 'longitudinal') {
        // 上部筋（含端支座负筋）向上推、下部筋向下推（远离梁中心）。
        const isTop = s.id.startsWith('kl-top-') || s.id.startsWith('kl-sup-');
        const dir = isTop ? 1 : -1;
        const offset = new THREE.Vector3(0, dir * 200 * explode, 0);
        return { ...s, points: s.points.map((p) => p.clone().add(offset)) };
      }
      if (s.kind === 'stirrup') {
        // 沿 X（梁轴方向）拉开
        const x = s.points[0].x;
        const factor = (x / Math.max(kl.L, 1) - 0.5) * 800 * explode;
        return { ...s, points: s.points.map((p) => p.clone().add(new THREE.Vector3(factor, 0, 0))) };
      }
      return s;
    });
  }, [specs, explode, kl.h, kl.L]);

  const filtered = exploded.filter((s) => {
    if (s.kind === 'longitudinal') return ui.showLongitudinal;
    if (s.kind === 'stirrup') return ui.showStirrups;
    return true;
  });

  return (
    <group>
      {/* 混凝土：长 L、高 h、宽 b（z 方向）。中心放在 (L/2, h/2, 0) */}
      <Concrete
        size={{ x: kl.L, y: kl.h, z: kl.b }}
        position={[kl.L / 2, 0, 0]}
        opacity={ui.concreteOpacity}
        visible={ui.showConcrete}
      />
      {filtered.map((s) => {
        const color = s.id.startsWith('kl-top-') || s.id.startsWith('kl-sup-')
          ? ui.colorLongTop
          : s.id.startsWith('kl-bot-')
            ? ui.colorLongBot
            : s.kind === 'stirrup'
              ? ui.colorStir
              : ui.colorLongTop;
        return <Rebar key={s.id} spec={s} ribStrength={ui.ribStrength} color={color} />;
      })}
    </group>
  );
}
