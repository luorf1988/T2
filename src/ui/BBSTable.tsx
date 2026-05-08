import { useMemo } from 'react';
import { useStore } from '@/store/paramsStore';
import { generateKZRebars } from '@/domain/kz';
import { generateKLRebars } from '@/domain/kl';
import { buildBBS, bbsTotals } from '@/domain/bbs';

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
    <div className="w-96 h-full overflow-y-auto bg-neutral-950/90 backdrop-blur border-l border-neutral-800 p-4 text-sm">
      <h2 className="text-base font-semibold mb-3">钢筋下料表（BBS）</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-neutral-400 border-b border-neutral-800">
              <th className="text-left py-2 px-1">编号</th>
              <th className="text-left py-2 px-1">类别</th>
              <th className="text-left py-2 px-1">符号</th>
              <th className="text-left py-2 px-1">形状</th>
              <th className="text-right py-2 px-1">单根长(mm)</th>
              <th className="text-right py-2 px-1">根数</th>
              <th className="text-right py-2 px-1">总重(kg)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no} className="border-b border-neutral-900/60 hover:bg-neutral-900/40">
                <td className="py-1.5 px-1 text-neutral-400">{r.no}</td>
                <td className="py-1.5 px-1">{r.kindLabel}</td>
                <td className="py-1.5 px-1 font-mono text-amber-400">{r.symbol}</td>
                <td className="py-1.5 px-1 text-neutral-400">{r.shape}</td>
                <td className="py-1.5 px-1 text-right tabular-nums">{r.singleLen}</td>
                <td className="py-1.5 px-1 text-right tabular-nums">{r.count}</td>
                <td className="py-1.5 px-1 text-right tabular-nums">{r.totalKg.toFixed(1)}</td>
              </tr>
            ))}
            <tr className="border-t border-neutral-700">
              <td colSpan={4} className="py-2 px-1 font-semibold">合计</td>
              <td className="py-2 px-1 text-right tabular-nums text-neutral-400">{totals.totalLenM.toFixed(2)} m</td>
              <td className="py-2 px-1 text-right tabular-nums">
                {rows.reduce((s, r) => s + r.count, 0)}
              </td>
              <td className="py-2 px-1 text-right tabular-nums font-semibold text-amber-400">
                {totals.totalKg.toFixed(1)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-neutral-500 leading-relaxed">
        说明：长度按几何中心线累加（含简化模型，不含弯钩 / 锚固延伸）。重量按 0.00617·d² kg/m 估算。
      </div>
    </div>
  );
}
