import * as THREE from 'three';

/**
 * 带肋钢筋材质：扩展 MeshStandardMaterial，通过 onBeforeCompile 注入
 * "双螺旋月牙肋" 法线扰动 + 沿轴向纵肋。
 *
 * 原理：
 * - TubeGeometry 的 UV 中：u 沿弧长方向（轴向），v 沿周向（0..1）。
 * - 用两条反向螺旋 sin(k*u + n*v*2π) ± sin(k*u - n*v*2π) 形成月牙肋
 * - 在切线空间中扰动法线（rib 的梯度作用到 tangent/bitangent 平面）
 * - 加 2 条与 v 对应的"纵肋"凸起（HRB 标准带肋钢筋特征）
 */
export interface RibbedRebarOptions {
  color?: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  /** 沿轴向单位长度内的肋数（uv.u 单位取决于 TubeGeometry 长度，一般取较大值） */
  ribFreq?: number;
  /** 月牙肋强度 */
  ribStrength?: number;
  /** 纵肋强度 */
  longitudinalStrength?: number;
}

export function createRibbedRebarMaterial(opts: RibbedRebarOptions = {}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color ?? '#7a8694',
    roughness: opts.roughness ?? 0.45,
    metalness: opts.metalness ?? 0.85,
  });

  const uniforms = {
    uRibFreq: { value: opts.ribFreq ?? 220.0 },
    uRibStrength: { value: opts.ribStrength ?? 0.55 },
    uLongStrength: { value: opts.longitudinalStrength ?? 0.35 },
  };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRibFreq = uniforms.uRibFreq;
    shader.uniforms.uRibStrength = uniforms.uRibStrength;
    shader.uniforms.uLongStrength = uniforms.uLongStrength;

    // 顶点着色器：把 uv 透传（默认就有）。
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec2 vRebarUv;`
    ).replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
      vRebarUv = uv;`
    );

    // 片段着色器：在 normal_fragment_maps 之后扰动法线
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec2 vRebarUv;
      uniform float uRibFreq;
      uniform float uRibStrength;
      uniform float uLongStrength;

      // 计算肋纹高度场 h(u,v) 与其梯度
      // 月牙肋：两条反向螺旋的"和"形成菱形/月牙状凸起
      // 纵肋：cos(2*v*2π) 形成 2 条对称纵肋
      float ribHeight(vec2 uv, out vec2 grad) {
        float u = uv.x * uRibFreq;       // 轴向相位
        float v = uv.y * 6.2831853;      // 周向相位
        float n = 1.0;                   // 螺旋密度（每圈 1 圈）

        float a = sin(u + n * v);
        float b = sin(u - n * v);
        // 月牙肋：将 sin 的正半部分加强（凸起为正、凹陷柔化）
        float ribA = max(a, 0.0);
        float ribB = max(b, 0.0);
        float crescent = (ribA + ribB) * 0.5;

        // 纵肋（2 条对称纵向凸起）
        float longRib = pow(max(cos(v * 2.0), 0.0), 8.0);

        // 梯度（解析）
        // d(crescent)/du ≈ 0.5 * (cos(u+nv) * step(a) + cos(u-nv) * step(b)) * uRibFreq
        float dA_du = (a > 0.0 ? cos(u + n * v) : 0.0);
        float dB_du = (b > 0.0 ? cos(u - n * v) : 0.0);
        float dCres_du = 0.5 * (dA_du + dB_du) * uRibFreq;

        float dA_dv = (a > 0.0 ?  n * cos(u + n * v) : 0.0);
        float dB_dv = (b > 0.0 ? -n * cos(u - n * v) : 0.0);
        float dCres_dv = 0.5 * (dA_dv + dB_dv) * 6.2831853;

        float dLong_dv = -8.0 * pow(max(cos(v * 2.0), 0.0), 7.0) * sin(v * 2.0) * 2.0 * 6.2831853;

        grad = vec2(dCres_du * uRibStrength,
                    dCres_dv * uRibStrength + dLong_dv * uLongStrength);
        return crescent * uRibStrength + longRib * uLongStrength;
      }`
    ).replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
      {
        vec2 grad;
        ribHeight(vRebarUv, grad);
        // 在切线空间扰动法线：tangent ≈ dPos/du, bitangent ≈ dPos/dv
        // 这里没显式 tangent，用屏幕空间近似：法线沿屏幕扰动
        // 改用法线偏移：把高度场梯度直接当成法线 xy 分量加到 normal
        vec3 perturb = vec3(-grad.x, -grad.y, 0.0) * 0.012;
        normal = normalize(normal + perturb);
      }`
    ).replace(
      // 在颜色上加一点 AO（凹陷处变暗）以增强肋纹可见性
      '#include <color_fragment>',
      `#include <color_fragment>
      {
        vec2 _g;
        float h = ribHeight(vRebarUv, _g);
        diffuseColor.rgb *= mix(0.78, 1.05, clamp(h, 0.0, 1.0));
      }`
    );
  };

  // 暴露 uniforms 用于动态调参
  (mat as any).userData.ribUniforms = uniforms;
  return mat;
}
