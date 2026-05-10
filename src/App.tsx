import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { Suspense } from 'react';
import { KZScene } from './three/components/KZScene';
import { KLScene } from './three/components/KLScene';
import { LocalEnvironment } from './three/components/LocalEnvironment';
import { Inspector } from './ui/ParamPanel';
import { BBSTable } from './ui/BBSTable';
import { TopNav } from './ui/TopNav';
import { SideNav } from './ui/SideNav';
import { SectionView } from './ui/SectionView';
import { AICopilot } from './ui/AICopilot';
import { Card, IconButton } from './ui/controls';
import { useStore } from './store/paramsStore';

export default function App() {
  const mode = useStore((s) => s.mode);
  const kz = useStore((s) => s.kz);
  const kl = useStore((s) => s.kl);
  // 相机距离与目标根据当前构件自适应
  const sizeMM = mode === 'KZ' ? Math.max(kz.Hn, kz.b, kz.h) : Math.max(kl.L, kl.h, kl.b);
  const camDist = sizeMM * 0.001 * 1.6;
  const target: [number, number, number] =
    mode === 'KZ' ? [0, (kz.Hn * 0.001) / 2, 0] : [(kl.L * 0.001) / 2, (kl.h * 0.001) / 2, 0];
  const camPos: [number, number, number] =
    mode === 'KZ'
      ? [camDist, camDist * 0.8, camDist]
      : [(kl.L * 0.001) / 2 + camDist * 0.4, camDist * 0.6, camDist];

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-on-background overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />

        {/* 主区：中间 (视口 + 底部 SectionView/BBS) + 右栏 (Inspector + AI) */}
        <main className="flex-1 flex overflow-hidden bg-background p-lg gap-lg">
          {/* 中间列 */}
          <div className="flex-1 flex flex-col gap-lg min-w-0">
            {/* 3D 视口卡片 */}
            <Card className="flex-[2] relative">
              {/* 顶部工具条（叠加在 Canvas 上） */}
              <div className="absolute top-0 left-0 w-full p-sm flex justify-between items-center z-10 bg-gradient-to-b from-white/90 to-transparent pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                  <span className="bg-surface-container-lowest border border-outline-variant text-on-surface-variant px-3 py-1.5 rounded shadow-level-1 text-label-sm uppercase tracking-wider">
                    3D 模型
                  </span>
                  <span className="text-label-sm uppercase tracking-wider px-3 py-1.5 rounded text-secondary border border-transparent">
                    平面图
                  </span>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                  <IconButton icon="zoom_in" title="放大" variant="outline" />
                  <IconButton icon="zoom_out" title="缩小" variant="outline" />
                  <IconButton icon="360" title="复位视角" variant="outline" />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 border border-outline-variant rounded px-3 py-2 text-label-sm text-on-surface-variant backdrop-blur z-10 pointer-events-none">
                <div className="font-semibold uppercase tracking-wider">视口操作</div>
                <div className="text-secondary mt-1 normal-case tracking-normal text-[11px]">
                  左键旋转 · 右键平移 · 滚轮缩放
                </div>
              </div>

              <div className="flex-1 w-full h-full bg-surface-container-low">
                <Canvas
                  shadows
                  camera={{ position: camPos, fov: 35, near: 0.01, far: 100 }}
                  gl={{ antialias: true, localClippingEnabled: true }}
                >
                  <color attach="background" args={['#f2f4f6']} />
                  {/* 本地灯光（不依赖外网 HDR）：环境光 + 主光 + 两个补光 */}
                  <ambientLight intensity={0.6} />
                  <hemisphereLight color="#ffffff" groundColor="#c4c5d5" intensity={0.7} />
                  <directionalLight
                    position={[5, 8, 4]}
                    intensity={1.0}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-left={-5}
                    shadow-camera-right={5}
                    shadow-camera-top={5}
                    shadow-camera-bottom={-5}
                  />
                  <directionalLight position={[-6, 4, -3]} intensity={0.4} color="#bcd0e6" />
                  <directionalLight position={[0, -4, 6]} intensity={0.2} color="#ffd9a6" />
                  <LocalEnvironment />
                  <Suspense fallback={null}>
                    <group position={[0, 0, 0]}>
                      {mode === 'KZ' ? <KZScene /> : <KLScene />}
                    </group>
                    <Grid
                      args={[20, 20]}
                      cellSize={0.5}
                      cellThickness={0.6}
                      sectionSize={2}
                      sectionThickness={1}
                      cellColor="#d8dadc"
                      sectionColor="#c4c5d5"
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
                    <GizmoViewport
                      axisColors={['#ba1a1a', '#1e40af', '#505f76']}
                      labelColor="#191c1e"
                    />
                  </GizmoHelper>
                </Canvas>
              </div>
            </Card>

            {/* 底部：剖切面 + BBS 并排 */}
            <div className="flex-1 flex gap-lg min-h-[260px]">
              <SectionView />
              <BBSTable />
            </div>
          </div>

          {/* 右栏 */}
          <div className="w-[340px] flex flex-col gap-lg shrink-0 overflow-y-auto">
            <Inspector />
            <AICopilot />
          </div>
        </main>
      </div>
    </div>
  );
}
