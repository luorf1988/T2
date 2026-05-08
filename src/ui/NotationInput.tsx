import { useState } from 'react';
import { useStore } from '@/store/paramsStore';
import { parseKZNotation, splitLongCount } from '@/domain/parser';

export function NotationInput() {
  const setKZ = useStore((s) => s.setKZ);
  const [text, setText] = useState('KZ1 600×600 16C22 C10@100/200');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const apply = () => {
    const res = parseKZNotation(text);
    if ('error' in res) {
      setError(res.error);
      setOk(null);
      return;
    }
    const { nB, nH } = splitLongCount(res.longTotal, res.b, res.h);
    setKZ({
      b: res.b,
      h: res.h,
      longD: res.longD,
      longGrade: res.longGrade,
      nB,
      nH,
      stirD: res.stirD,
      stirGrade: res.stirGrade,
      s1: res.s1,
      s2: res.s2,
    });
    setError(null);
    setOk(`已解析${res.id ? ` ${res.id}` : ''}：${res.b}×${res.h} ${res.longTotal}${res.longGrade}${res.longD} ${res.stirGrade}${res.stirD}@${res.s1}/${res.s2} → b边${nB} 根 / h边${nH} 根`);
  };

  return (
    <div className="mb-4 border border-neutral-800 rounded p-3 bg-neutral-900/60">
      <div className="text-neutral-300 mb-1 text-xs">平法标注（按 Enter 应用）</div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100 text-sm font-mono"
        placeholder="KZ1 700×700 20C22 C10@100/200"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={apply} className="text-xs px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950">
          应用
        </button>
        <button
          onClick={() => setText('KZ1 700×700 20C22 C10@100/200')}
          className="text-xs px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          示例
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-400 whitespace-pre-line">{error}</div>}
      {ok && <div className="mt-2 text-xs text-green-400">{ok}</div>}
    </div>
  );
}
