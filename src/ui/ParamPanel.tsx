import { useStore } from '@/store/paramsStore';
import { ParamPanelKZ } from './ParamPanelKZ';
import { ParamPanelKL } from './ParamPanelKL';
import { Card, CardHeader, NumberSlider, Toggle, ColorRow } from './controls';

/**
 * 右侧参数检查器（Inspector）：3 张卡片堆叠 — 几何参数 / 显示 / 颜色。
 * 由 App 渲染在右栏，外部不再需要固定宽度容器。
 */
export function Inspector() {
  const mode = useStore((s) => s.mode);
  const ui = useStore((s) => s.ui);
  const setUI = useStore((s) => s.setUI);

  return (
    <div className="flex flex-col gap-lg">
      <Card>
        <CardHeader
          title="参数检查器"
          subtitle={mode === 'KZ' ? '当前选中: KZ 框架柱' : '当前选中: KL 框架梁'}
          icon="tune"
        />
        <div className="p-md">
          {mode === 'KZ' ? <ParamPanelKZ /> : <ParamPanelKL />}
        </div>
      </Card>

      <Card>
        <CardHeader title="显示" icon="visibility" />
        <div className="p-md flex flex-col gap-md">
          <Toggle label="混凝土" value={ui.showConcrete} onChange={(v) => setUI({ showConcrete: v })} />
          <NumberSlider
            label="混凝土透明度"
            value={ui.concreteOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setUI({ concreteOpacity: v })}
          />
          <Toggle label="纵筋" value={ui.showLongitudinal} onChange={(v) => setUI({ showLongitudinal: v })} />
          <Toggle label="箍筋" value={ui.showStirrups} onChange={(v) => setUI({ showStirrups: v })} />
          <NumberSlider
            label="爆炸视图"
            value={ui.explode}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setUI({ explode: v })}
          />
          <NumberSlider
            label="月牙肋强度"
            value={ui.ribStrength}
            min={0}
            max={1.2}
            step={0.05}
            onChange={(v) => setUI({ ribStrength: v })}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="钢筋颜色"
          icon="palette"
          action={
            <button
              type="button"
              onClick={() =>
                setUI({ colorLongTop: '#7a8694', colorLongBot: '#7a8694', colorStir: '#7a8694' })
              }
              className="text-label-sm uppercase tracking-wider px-2 py-1 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
              title="恢复钢筋原色"
            >
              恢复原色
            </button>
          }
        />
        <div className="p-md flex flex-col gap-sm">
          <ColorRow label="上部纵筋" value={ui.colorLongTop} onChange={(v) => setUI({ colorLongTop: v })} />
          <ColorRow label="下部纵筋" value={ui.colorLongBot} onChange={(v) => setUI({ colorLongBot: v })} />
          <ColorRow label="箍筋" value={ui.colorStir} onChange={(v) => setUI({ colorStir: v })} />
        </div>
      </Card>
    </div>
  );
}

// 兼容旧引用（虽然 App 不再使用），保留一个别名导出
export const ParamPanel = Inspector;
