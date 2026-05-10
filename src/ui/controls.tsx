// 通用浅色 CAD 风受控组件：与 DESIGN.md 设计 token 对齐
import type { ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-secondary mt-xs">{hint}</p>}
    </div>
  );
}

export function NumberSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <div className="flex justify-between items-baseline">
        <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <span className="font-mono text-data-mono text-on-surface tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(step < 0.1 ? 3 : 2)}
          {unit ? <span className="text-secondary ml-0.5">{unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary-container h-1.5"
      />
    </div>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={
          'relative w-9 h-5 rounded-full transition-colors ' +
          (value ? 'bg-primary-container' : 'bg-outline-variant')
        }
      >
        <span
          className={
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-level-2 transition-transform ' +
            (value ? 'translate-x-4' : 'translate-x-0.5')
          }
        />
      </button>
    </label>
  );
}

export function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 font-sans text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none transition-colors"
      >
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-6 rounded-sm border border-outline-variant bg-surface-container-lowest cursor-pointer overflow-hidden"
        />
        <span className="font-mono text-[11px] text-secondary tabular-nums w-16">{value}</span>
      </span>
    </label>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-md">
      <h3 className="text-headline-md font-semibold text-on-surface">{children}</h3>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        'bg-surface-container-lowest border border-outline-variant rounded-lg shadow-level-1 flex flex-col overflow-hidden ' +
        className
      }
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-md py-sm border-b border-outline-variant bg-surface-bright flex items-start justify-between gap-md">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="material-symbols-outlined text-primary-container text-base">{icon}</span>}
        <div className="min-w-0">
          <h3 className="text-headline-md font-semibold text-on-surface truncate">{title}</h3>
          {subtitle && <p className="text-label-sm text-secondary mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function IconButton({
  icon,
  onClick,
  title,
  variant = 'ghost',
}: {
  icon: string;
  onClick?: () => void;
  title?: string;
  variant?: 'ghost' | 'outline';
}) {
  const base =
    'w-8 h-8 flex items-center justify-center rounded transition-colors text-on-surface-variant';
  const styles =
    variant === 'outline'
      ? 'bg-surface-container-lowest border border-outline-variant shadow-level-1 hover:bg-surface-container-low'
      : 'hover:bg-surface-container-high';
  return (
    <button type="button" onClick={onClick} title={title} className={`${base} ${styles}`}>
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}
