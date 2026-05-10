import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * 本地程序化环境贴图（不依赖外网 HDR）。
 * 使用 three.js 内置的 RoomEnvironment 通过 PMREMGenerator 生成室内反射，
 * 给金属材质（metalness=0.85 的钢筋）提供亮面反射，避免远程 HDR 失败时模型发黑。
 */
export function LocalEnvironment() {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const prev = scene.environment;
    scene.environment = envTex;
    return () => {
      scene.environment = prev;
      envTex.dispose();
      pmrem.dispose();
    };
  }, [scene, gl]);

  return null;
}
