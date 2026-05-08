import * as THREE from 'three';
import type { RebarGrade } from './codes';

export interface RebarSpec {
  id: string;
  /** 钢筋类别：用于分组、爆炸视图、BBS */
  kind: 'longitudinal' | 'stirrup' | 'tie' | 'erection';
  diameter: number; // mm
  grade: RebarGrade;
  /** 钢筋中心线控制点（世界坐标，mm） */
  points: THREE.Vector3[];
  /** 是否闭合（箍筋为 true） */
  closed?: boolean;
  /** 端部弯钩：'135' | '90' | 'none'（闭合时忽略） */
  hookStart?: '135' | '90' | 'none';
  hookEnd?: '135' | '90' | 'none';
}

export interface ConcreteSpec {
  /** 立方体三向尺寸（mm）：x=b, y=h(高), z=h2 */
  size: { x: number; y: number; z: number };
  /** 中心位置（mm） */
  position?: THREE.Vector3;
}
