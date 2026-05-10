import { useMemo } from 'react';
import { useStore } from '@/store/paramsStore';
import { generateKZRebars } from '@/domain/kz';
import { generateKLRebars } from '@/domain/kl';
import { buildBBS, bbsTotals } from '@/domain/bbs';
import { Card, CardHeader, IconButton } from './controls';

export function BBSTable() {
  const mode = useStore((s) => s.mode);
  const kz = useStore((s) => s.kz);
  const kl = useStore((s) => s.kl);
  const rows = useMemo(
    () => buildBBS(mode === 'KZ' ? generateKZRebars(kz) : generateKLRebars(kl)),
    [mode, kz, kl],
  );
  const totals = useMemo(() => bbsTotals(rows), [rows]);

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader
        title="钢筋工程量 (BBS)"
        subtitle={`${rows.length} 项 · 总重 ${totals.totalKg.toFixed(1)} kg`}
        icon="table_rows"
        action={<IconButton icon="download" title="导出 CSV" />}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant text-label-sm font-semibold uppercase tracking-wider text-secondary">
            <tr>
              <th className="py-2 px-3 font-semibold">编号</th>
              <th className="py-2 px-3 font-semibold">类别</th>
              <th className="py-2 px-3 font-semibold">符号</th>
              <th className="py-2 px-3 font-semibold">形状</th>
              <th className="py-2 px-3 font-semibold text-right">单根长(mm)</th>
              <th className="py-2 px-3 font-semibold text-right">根数</th>
              <th className="py-2 px-3 font-semibold text-right">总重(kg)</th>
            </tr>
          </thead>
          <tbody className="font-mono text-data-mono text-on-surface-variant">
            {rows.map((r, i) => (
              <tr
                key={r.no}
                className={
                  'border-b border-surface-variant hover:bg-surface-container-low transition-colors ' +
                  (i % 2 === 1 ? 'bg-surface' : '')
                }
              >
                <td className="py-2 px-3">{r.no}</td>
                <td className="py-2 px-3">{r.kindLabel}</td>
                <td className="py-2 px-3 text-primary-container font-semibold">{r.symbol}</td>
                <td className="py-2 px-3 text-secondary">{r.shape}</td>
                <td className="py-2 px-3 text-right tabular-nums">{r.singleLen}</td>
                <td className="py-2 px-3 text-right tabular-nums">{r.count}</td>
                <td className="py-2 px-3 text-right tabular-nums">{r.totalKg.toFixed(1)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-outline-variant bg-surface-container-low text-on-surface">
              <td colSpan={4} className="py-2 px-3 font-sans font-semibold text-label-sm uppercase tracking-wider">
                合计
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-secondary">
                {totals.totalLenM.toFixed(2)} m
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {rows.reduce((s, r) => s + r.count, 0)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums font-semibold text-primary-container">
                {totals.totalKg.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-md py-sm text-label-sm text-secondary border-t border-outline-variant bg-surface-bright">
        说明：长度按几何中心线累加（简化模型，不含弯钩 / 锚固延伸）。重量按 0.00617·d² kg/m 估算。
      </div>
    </Card>
  );
}
