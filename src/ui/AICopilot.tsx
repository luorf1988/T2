import { useState } from 'react';
import { Card } from './controls';

/**
 * AI 助手（占位）：本地仅做 UI 演示，不接入真实模型。
 */
export function AICopilot() {
  const [text, setText] = useState('');
  return (
    <Card className="flex-1 min-h-[280px]">
      <div className="px-md py-sm border-b border-outline-variant bg-surface-bright flex items-center gap-2">
        <span className="material-symbols-outlined text-primary-container text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          smart_toy
        </span>
        <h3 className="text-headline-md font-semibold text-on-surface">AI 助手</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-semibold">
          预览
        </span>
      </div>
      <div className="flex-1 p-md overflow-y-auto flex flex-col gap-3 bg-surface">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg rounded-tl-none p-3 max-w-[90%] self-start shadow-level-1">
          <p className="text-body-md text-on-surface">
            您好，这里是 22G101 钢筋平法可视化助手。可向我询问构件配筋、净距、锚固等规范要求。
          </p>
        </div>
        <div className="bg-primary-fixed text-on-primary-fixed rounded-lg rounded-tr-none p-3 max-w-[90%] self-end shadow-level-1">
          <p className="text-body-md">本期为 UI 占位，后续可接入大模型 API。</p>
        </div>
      </div>
      <div className="p-sm border-t border-outline-variant bg-surface-container-lowest flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入指令..."
          className="flex-1 bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 text-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setText('')}
          className="bg-primary-container text-on-primary w-8 h-8 rounded flex items-center justify-center hover:bg-primary transition-colors"
          title="发送"
        >
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </div>
    </Card>
  );
}
