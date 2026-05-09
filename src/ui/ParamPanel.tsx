import { useStore } from '@/store/paramsStore';
import { ParamPanelKZ } from './ParamPanelKZ';
import { ParamPanelKL } from './ParamPanelKL';

export function ParamPanel() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const ui = useStore((s) => s.ui);
  const setUI = useStore((s) => s.setUI);
  const reset = useStore((s) => s.reset);

  const title = mode === 'KZ' ? 'KZ 框架柱参数' : 'KL 框架梁参数';

  return (
    <div className="w-80 h-full overflow-y-auto bg-neutral-950/90 backdrop-blur border-r border-neutral-800 p-4 text-sm">
      {/* 构件切换 */}
      <div className="mb-3 flex rounded overflow-hidden border border-neutral-800">
        {(['KZ', 'KL'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              'flex-1 px-3 py-1.5 text-sm transition ' +
              (mode === m
                ? 'bg-amber-600 text-neutral-950 font-semibold'
                : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800')
            }
          >
            {m === 'KZ' ? '框架柱 KZ' : '框架梁 KL'}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          onClick={reset}
          className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          重置
        </button>
      </div>

      {mode === 'KZ' ? <ParamPanelKZ /> : <ParamPanelKL />}

      <h2 className="text-base font-semibold mb-2">显示</h2>
      <div className="space-y-2">
        <Toggle label="混凝土" value={ui.showConcrete} onChange={(v) => setUI({ showConcrete: v })} />
        <Slider
          label={`混凝土透明度 ${ui.concreteOpacity.toFixed(2)}`}
          min={0.05}
          max={1}
          step={0.01}
          value={ui.concreteOpacity}
          onChange={(v) => setUI({ concreteOpacity: v })}
        />
        <Toggle label="纵筋" value={ui.showLongitudinal} onChange={(v) => setUI({ showLongitudinal: v })} />
        <Toggle label="箍筋" value={ui.showStirrups} onChange={(v) => setUI({ showStirrups: v })} />
        <Slider label={`爆炸视图 ${ui.explode.toFixed(2)}`} min={0} max={1} step={0.01} value={ui.explode} onChange={(v) => setUI({ explode: v })} />
        <Slider label={`月牙肋强度 ${ui.ribStrength.toFixed(2)}`} min={0} max={1.2} step={0.05} value={ui.ribStrength} onChange={(v) => setUI({ ribStrength: v })} />
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <h2 className="text-base font-semibold">钢筋颜色</h2>
        <button
          onClick={() => setUI({
            colorLongTop: '#7a8694',
            colorLongBot: '#7a8694',
            colorStir: '#7a8694',
          })}
          className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          title="恢复钢筋原色"
        >
          恢复原色
        </button>
      </div>
      <div className="space-y-2">
        <ColorRow label="上部纵筋" value={ui.colorLongTop} onChange={(v) => setUI({ colorLongTop: v })} />
        <ColorRow label="下部纵筋" value={ui.colorLongBot} onChange={(v) => setUI({ colorLongBot: v })} />
        <ColorRow label="箍筋" value={ui.colorStir} onChange={(v) => setUI({ colorStir: v })} />
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-neutral-300">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-6 rounded border border-neutral-700 bg-neutral-900 cursor-pointer"
        />
        <span className="text-xs text-neutral-400 tabular-nums w-16">{value}</span>
      </span>
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-neutral-300">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="accent-amber-500" />
    </label>
  );
}

function Slider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="text-neutral-300 mb-1">{label}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-amber-500" />
    </div>
  );
}
