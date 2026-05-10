import { useStore, type Mode } from '@/store/paramsStore';

interface NavItem {
  mode?: Mode;
  label: string;
  icon: string;
  filled?: boolean;
  disabled?: boolean;
}

const ITEMS: NavItem[] = [
  { label: 'Projects', icon: 'folder_open', disabled: true },
  { mode: 'KL', label: 'Beams 框架梁', icon: 'horizontal_rule', filled: true },
  { mode: 'KZ', label: 'Columns 框架柱', icon: 'vertical_align_top' },
  { label: 'Walls', icon: 'layers', disabled: true },
  { label: 'Library', icon: 'inventory_2', disabled: true },
];

/**
 * 左侧导航：项目信息 + 构件类型导航（KL / KZ） + 底部 Export/Feedback。
 * 与 DESIGN.md 一致，宽度 256px，浅色风格。
 */
export function SideNav() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const reset = useStore((s) => s.reset);

  return (
    <nav className="bg-surface-container-low h-full w-64 flex flex-col border-r border-outline-variant shrink-0 py-md gap-sm">
      <div className="px-gutter mb-sm">
        <h2 className="text-headline-lg font-bold text-primary truncate leading-tight">Project REBAR-701</h2>
        <p className="text-body-md text-secondary truncate mt-1">22G101 · 钢筋平法</p>
      </div>

      <div className="px-gutter mb-sm">
        <button
          type="button"
          onClick={reset}
          className="w-full bg-primary-container text-on-primary text-label-sm uppercase tracking-wider py-2 rounded shadow-level-2 hover:bg-primary transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            restart_alt
          </span>
          重置参数
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-1 px-sm">
        {ITEMS.map((it) => {
          const active = it.mode && mode === it.mode;
          const clickable = !it.disabled && it.mode;
          return (
            <button
              key={it.label}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setMode(it.mode!)}
              className={
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ' +
                (active
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : it.disabled
                    ? 'text-outline cursor-not-allowed'
                    : 'text-on-surface-variant hover:bg-surface-container-highest')
              }
            >
              <span
                className="material-symbols-outlined text-lg"
                style={active && it.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {it.icon}
              </span>
              <span className="text-label-sm uppercase tracking-wider">{it.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto px-sm border-t border-outline-variant pt-sm flex flex-col gap-1">
        <button className="text-secondary hover:bg-surface-container-highest flex items-center gap-3 px-3 py-2 rounded-md transition-colors">
          <span className="material-symbols-outlined text-base">ios_share</span>
          <span className="text-label-sm uppercase tracking-wider">Export</span>
        </button>
        <button className="text-secondary hover:bg-surface-container-highest flex items-center gap-3 px-3 py-2 rounded-md transition-colors">
          <span className="material-symbols-outlined text-base">rate_review</span>
          <span className="text-label-sm uppercase tracking-wider">Feedback</span>
        </button>
      </div>
    </nav>
  );
}
