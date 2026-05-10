import { useStore } from '@/store/paramsStore';
import type { KLParams } from '@/domain/kl';
import { NumberSlider, SelectInput } from './controls';

interface NumberRow {
  label: string;
  key: keyof KLParams;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const ROWS: NumberRow[] = [
  { label: '跨度 L', key: 'L', min: 2000, max: 12000, step: 100, unit: 'mm' },
  { label: '截面宽 b', key: 'b', min: 200, max: 600, step: 25, unit: 'mm' },
  { label: '截面高 h', key: 'h', min: 300, max: 1200, step: 50, unit: 'mm' },
  { label: '保护层 c', key: 'cover', min: 15, max: 40, step: 5, unit: 'mm' },
  { label: '上部通长筋根数', key: 'nTop', min: 2, max: 8, step: 1 },
  { label: '下部通长筋根数', key: 'nBot', min: 2, max: 8, step: 1 },
  { label: '上部通长筋直径', key: 'longDTop', min: 14, max: 32, step: 2, unit: 'mm' },
  { label: '下部通长筋直径', key: 'longDBot', min: 14, max: 32, step: 2, unit: 'mm' },
  { label: '端支座负筋根数（每端）', key: 'nSup', min: 0, max: 6, step: 1 },
  { label: '端支座负筋直径', key: 'supD', min: 14, max: 32, step: 2, unit: 'mm' },
  { label: '负筋伸入跨内比 Ln/x', key: 'supLenRatio', min: 0.2, max: 0.5, step: 0.01 },
  { label: '箍筋直径', key: 'stirD', min: 6, max: 14, step: 2, unit: 'mm' },
  { label: '加密区间距 s1', key: 's1', min: 50, max: 200, step: 25, unit: 'mm' },
  { label: '非加密区间距 s2', key: 's2', min: 100, max: 300, step: 25, unit: 'mm' },
];

export function ParamPanelKL() {
  const kl = useStore((s) => s.kl);
  const setKL = useStore((s) => s.setKL);

  return (
    <div className="flex flex-col gap-md">
      {ROWS.map((r) => (
        <NumberSlider
          key={r.key as string}
          label={r.label}
          value={kl[r.key] as number}
          min={r.min}
          max={r.max}
          step={r.step ?? 1}
          unit={r.unit}
          onChange={(v) => setKL({ [r.key]: v } as Partial<KLParams>)}
        />
      ))}
      <div className="grid grid-cols-2 gap-md">
        <SelectInput
          label="纵筋等级"
          value={kl.longGrade}
          options={[['A', 'HPB300'], ['B', 'HRB400'], ['C', 'HRB400'], ['D', 'HRB500']]}
          onChange={(v) => setKL({ longGrade: v as any })}
        />
        <SelectInput
          label="箍筋等级"
          value={kl.stirGrade}
          options={[['A', 'HPB300'], ['B', 'HRB400'], ['C', 'HRB400'], ['D', 'HRB500']]}
          onChange={(v) => setKL({ stirGrade: v as any })}
        />
        <SelectInput
          label="混凝土"
          value={kl.conc}
          options={[['C25', 'C25'], ['C30', 'C30'], ['C35', 'C35'], ['C40', 'C40'], ['C45', 'C45'], ['C50', 'C50']]}
          onChange={(v) => setKL({ conc: v as any })}
        />
        <SelectInput
          label="抗震等级"
          value={kl.seismic}
          options={[['1', '一级'], ['2', '二级'], ['3', '三级'], ['4', '四级'], ['NA', '非抗震']]}
          onChange={(v) => setKL({ seismic: v as any })}
        />
      </div>
    </div>
  );
}
