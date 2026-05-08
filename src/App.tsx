import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { Suspense } from 'react';
import { KZScene } from './three/components/KZScene';
import { KLScene } from './three/components/KLScene';
import { ParamPanel } from './ui/ParamPanel';
import { BBSTable } from './ui/BBSTable';
import { useStore } from './store/paramsStore';

export default function App() {
  const mode = useStore((s) => s.mode);
  const kz = useStore((s) => s.kz);
  const kl = useStore((s) => s.kl);
  // 相机距离与目标根据当前构件自适应
  const sizeMM = mode === 'KZ'
    ? Math.max(kz.Hn, kz.b, kz.h)
    : Math.max(kl.L, kl.h, kl.b);
  const camDist = sizeMM * 0.001 * 1.6;
  const target: [number, number, number] = mode === 'KZ'
    ? [0, kz.Hn * 0.001 / 2, 0]
    : [kl.L * 0.001 / 2, kl.h * 0.001 / 2, 0];
  const camPos: [number, number, number] = mode === 'KZ'
    ? [camDist, camDist * 0.8, camDist]
    : [kl.L * 0.001 / 2 + camDist * 0.4, camDist * 0.6, camDist];

  return (
    <div className="w-screen h-screen flex">
      <ParamPanel />
      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: camPos, fov: 35, near: 0.01, far: 100 }}
          gl={{ antialias: true, localClippingEnabled: true }}
        >
          <color attach="background" args={['#1a1d22']} />
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[5, 8, 4]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <Suspense fallback={null}>
            <Environment preset="warehouse" />
            <group position={[0, 0, 0]}>
              {mode === 'KZ' ? <KZScene /> : <KLScene />}
            </group>
            <Grid
              args={[20, 20]}
              cellSize={0.5}
              cellThickness={0.6}
              sectionSize={2}
              sectionThickness={1}
              cellColor="#2a2d33"
              sectionColor="#3a3d44"
              position={[0, -0.3, 0]}
              fadeDistance={25}
              infiniteGrid
            />
          </Suspense>
          <OrbitControls
            target={target}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={0.3}
            maxDistance={30}
          />
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#e76f51', '#a3c585', '#5a9bd5']} labelColor="white" />
          </GizmoHelper>
        </Canvas>

        <div className="absolute top-3 left-3 bg-neutral-950/80 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-300 backdrop-blur">
          <div>左键旋转 · 右键平移 · 滚轮缩放</div>
          <div className="text-neutral-500 mt-1">3D 钢筋平法可视化</div>
        </div>
      </div>
      <BBSTable />
    </div>
  );
}
