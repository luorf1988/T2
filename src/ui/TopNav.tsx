import { IconButton } from './controls';

/**
 * 顶部导航栏：品牌名 + 搜索（占位） + 工具按钮 + 头像。
 * 高度固定 56px，遵 DESIGN.md 浅色 CAD 风格。
 */
export function TopNav() {
  return (
    <header className="bg-surface-container-lowest w-full h-14 border-b border-outline-variant flex items-center justify-between px-gutter shrink-0">
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            architecture
          </span>
          <span className="text-headline-md font-bold text-primary tracking-tight">SteelEngine CAD</span>
        </div>
        <div className="w-64 ml-lg relative">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-base">
            search
          </span>
          <input
            type="text"
            placeholder="搜索组件..."
            className="w-full bg-surface-container-low border border-outline-variant rounded pl-8 pr-3 py-1.5 text-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-sm">
        <IconButton icon="settings" title="设置" />
        <IconButton icon="help" title="帮助" />
        <button
          type="button"
          className="relative w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="通知"
        >
          <span className="material-symbols-outlined text-base">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-secondary-container border border-outline-variant ml-sm flex items-center justify-center text-on-secondary-container font-semibold text-sm">
          E
        </div>
      </div>
    </header>
  );
}
