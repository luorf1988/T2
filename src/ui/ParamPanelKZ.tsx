import { useStore } from '@/store/paramsStore';
import type { KZParams } from '@/domain/kz';
import { NotationInput } from './NotationInput';
import { NumberSlider, SelectInput } from './controls';

interface NumberRow {
  label: string;
  key: keyof KZParams;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

const ROWS: NumberRow[] = [
  { label: '截面宽 b', key: 'b', min: 300, max: 1500, step: 50, unit: 'mm' },
  { label: '截面高 h', key: 'h', min: 300, max: 1500, step: 50, unit: 'mm' },
  { label: '柱净高 Hn', key: 'Hn', min: 1500, max: 6000, step: 100, unit: 'mm' },
  { label: '保护层 c', key: 'cover', min: 15, max: 50, step: 5, unit: 'mm' },
  { label: '纵筋直径', key: 'longD', min: 14, max: 32, step: 2, unit: 'mm' },
  { label: 'b 边纵筋根数', key: 'nB', min: 2, max: 10, step: 1 },
  { label: 'h 边纵筋根数', key: 'nH', min: 2, max: 10, step: 1 },
  { label: '箍筋直径', key: 'stirD', min: 6, max: 16, step: 2, unit: 'mm' },
  { label: '加密区间距 s1', key: 's1', min: 50, max: 200, step: 25, unit: 'mm' },
  { label: '非加密区间距 s2', key: 's2', min: 100, max: 300, step: 25, unit: 'mm' },
];

export function ParamPanelKZ() {
  const kz = useStore((s) => s.kz);
  const setKZ = useStore((s) => s.setKZ);

  return (
    <div className="flex flex-col gap-md">
      <NotationInput />
      <div className="flex flex-col gap-md">
        {ROWS.map((r) => (
          <NumberSlider
            key={r.key as string}
            label={r.label}
            value={kz[r.key] as number}
            min={r.min}
            max={r.max}
            step={r.step ?? 1}
            unit={r.unit}
            onChange={(v) => setKZ({ [r.key]: v } as Partial<KZParams>)}
          />
        ))}

        <div className="grid grid-cols-2 gap-md">
          <SelectInput
            label="纵筋等级"
            value={kz.longGrade}
            options={[['A', 'HPB300'], ['B', 'HRB400'], ['C', 'HRB400'], ['D', 'HRB500']]}
            onChange={(v) => setKZ({ longGrade: v as any })}
          />
          <SelectInput
            label="箍筋等级"
            value={kz.stirGrade}
            options={[['A', 'HPB300'], ['B', 'HRB400'], ['C', 'HRB400'], ['D', 'HRB500']]}
            onChange={(v) => setKZ({ stirGrade: v as any })}
          />
          <SelectInput
            label="混凝土"
            value={kz.conc}
            options={[['C25', 'C25'], ['C30', 'C30'], ['C35', 'C35'], ['C40', 'C40'], ['C45', 'C45'], ['C50', 'C50']]}
            onChange={(v) => setKZ({ conc: v as any })}
          />
          <SelectInput
            label="抗震等级"
            value={kz.seismic}
            options={[['1', '一级'], ['2', '二级'], ['3', '三级'], ['4', '四级'], ['NA', '非抗震']]}
            onChange={(v) => setKZ({ seismic: v as any })}
          />
        </div>
      </div>
    </div>
  );
}
