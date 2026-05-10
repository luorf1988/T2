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
    <div className="mb-md p-md rounded border border-outline-variant bg-surface-container-low">
      <div className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
        平法标注（按 Enter 应用）
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 font-mono text-data-mono text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none"
        placeholder="KZ1 700×700 20C22 C10@100/200"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={apply}
          className="text-label-sm uppercase tracking-wider px-3 py-1.5 rounded bg-primary-container text-on-primary hover:bg-primary transition-colors"
        >
          应用
        </button>
        <button
          onClick={() => setText('KZ1 700×700 20C22 C10@100/200')}
          className="text-label-sm uppercase tracking-wider px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          示例
        </button>
      </div>
      {error && <div className="mt-2 text-label-sm text-on-error-container whitespace-pre-line">{error}</div>}
      {ok && <div className="mt-2 text-label-sm text-primary-container">{ok}</div>}
    </div>
  );
}
