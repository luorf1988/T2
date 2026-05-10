import { Card, CardHeader, IconButton } from './controls';
import { useStore } from '@/store/paramsStore';

/**
 * 剖切面视图（占位）：根据当前构件几何画 SVG 截面示意图。
 * KL：宽 b × 高 h；KZ：宽 b × 高 h（沿构件中部剖切）。
 */
export function SectionView() {
  const mode = useStore((s) => s.mode);
  const kz = useStore((s) => s.kz);
  const kl = useStore((s) => s.kl);
  const b = mode === 'KZ' ? kz.b : kl.b;
  const h = mode === 'KZ' ? kz.h : kl.h;
  const cover = mode === 'KZ' ? kz.cover : kl.cover;
  const stirD = mode === 'KZ' ? kz.stirD : kl.stirD;

  // SVG 视口：保留 16px 边距
  const padding = 16;
  const vbW = 240;
  const vbH = 200;
  const scale = Math.min((vbW - 2 * padding) / b, (vbH - 2 * padding) / h);
  const drawW = b * scale;
  const drawH = h * scale;
  const x0 = (vbW - drawW) / 2;
  const y0 = (vbH - drawH) / 2;
  const inset = (cover + stirD) * scale;

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader
        title={mode === 'KZ' ? '剖切面 (KZ 截面)' : '剖切面 (B-B)'}
        subtitle={`${b} × ${h} mm`}
        action={<IconButton icon="open_in_full" title="放大" />}
      />
      <div className="flex-1 p-md bg-surface flex items-center justify-center">
        <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full h-full max-h-[220px]">
          {/* 混凝土外轮廓 */}
          <rect
            x={x0}
            y={y0}
            width={drawW}
            height={drawH}
            fill="#eceef0"
            stroke="#444653"
            strokeWidth={1.2}
          />
          {/* 箍筋（保护层 + 箍筋直径）矩形 */}
          <rect
            x={x0 + inset}
            y={y0 + inset}
            width={drawW - 2 * inset}
            height={drawH - 2 * inset}
            fill="none"
            stroke="#1e40af"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
          {/* 标注尺寸 */}
          <text x={vbW / 2} y={y0 + drawH + 14} textAnchor="middle" fontSize="10" fill="#444653" fontFamily="JetBrains Mono">
            b = {b}
          </text>
          <text
            x={x0 - 6}
            y={vbH / 2}
            textAnchor="end"
            fontSize="10"
            fill="#444653"
            fontFamily="JetBrains Mono"
            transform={`rotate(-90 ${x0 - 6} ${vbH / 2})`}
          >
            h = {h}
          </text>
        </svg>
      </div>
    </Card>
  );
}
