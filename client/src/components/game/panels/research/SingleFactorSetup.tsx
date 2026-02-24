import { FACTOR_TYPES, SINGLE_FACTOR_STEPS, TOKEN_COSTS, useGame, type SingleFactorConfig } from '@/contexts/GameContext';
import { useState } from 'react';

export function SingleFactorSetup({ researcherId, onBack }: { researcherId: string; onBack: () => void }) {
  const { state, startSingleFactorTask, setActivePanel } = useGame();
  const [factorType, setFactorType] = useState('momentum');
  const [factorDescription, setFactorDescription] = useState('');
  const [fwdPeriod, setFwdPeriod] = useState(5);

  const estimatedTokens = TOKEN_COSTS.single_factor.base + TOKEN_COSTS.single_factor.perStep * SINGLE_FACTOR_STEPS.length;
  const canAfford = state.credits >= estimatedTokens;
  const researcher = state.researchers.find(r => r.id === researcherId);

  const handleStart = () => {
    if (!factorDescription.trim() || !canAfford) return;
    const config: SingleFactorConfig = {
      factorDescription: factorDescription.trim(),
      factorType,
      fwdPeriod,
    };
    startSingleFactorTask(researcherId, config);
    setActivePanel(null);
  };

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="font-pixel text-[7px] text-[oklch(0.5_0.02_260)] hover:text-[oklch(0.82_0.15_85)] transition-colors">
        ← 返回
      </button>

      <div className="border-2 border-[oklch(0.55_0.2_265_/_0.3)] bg-[oklch(0.55_0.2_265_/_0.05)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)]">🔬 因子挖掘任务</p>
        <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-1">
          研究员: {researcher?.skin.name} | {SINGLE_FACTOR_STEPS.length} 步工作流
        </p>
      </div>

      {/* Factor Type */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">因子类型</label>
        <div className="grid grid-cols-2 gap-1.5">
          {FACTOR_TYPES.map(ft => (
            <button
              key={ft.value}
              onClick={() => setFactorType(ft.value)}
              className={`text-left px-2.5 py-2 border-2 transition-all ${
                factorType === ft.value
                  ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.1)]'
                  : 'border-[oklch(0.22_0.025_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              <p className={`font-display text-[11px] font-medium ${factorType === ft.value ? 'text-[oklch(0.55_0.2_265)]' : 'text-[oklch(0.7_0.02_260)]'}`}>
                {ft.label}
              </p>
              <p className="font-display text-[9px] text-[oklch(0.45_0.02_260)]">{ft.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Factor Description (Natural Language) */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">
          因子描述 (自然语言)
        </label>
        <textarea
          value={factorDescription}
          onChange={(e) => setFactorDescription(e.target.value)}
          placeholder="例如: 基于过去20日收盘价动量，计算价格相对于20日均线的偏离程度，偏离越大信号越强..."
          className="w-full h-24 bg-[oklch(0.12_0.02_260)] border-2 border-[oklch(0.25_0.03_260)] text-[oklch(0.85_0.01_260)] font-display text-[11px] p-3 resize-none focus:border-[oklch(0.55_0.2_265)] focus:outline-none transition-colors placeholder:text-[oklch(0.35_0.02_260)]"
        />
        <p className="font-display text-[9px] text-[oklch(0.4_0.02_260)] mt-1">
          Agent 会根据你的描述自动构造因子信号 (Step 4)
        </p>
      </div>

      {/* Forward Period */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">
          预测窗口 (fwd_period)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={30}
            value={fwdPeriod}
            onChange={(e) => setFwdPeriod(Number(e.target.value))}
            className="flex-1 accent-[oklch(0.55_0.2_265)]"
          />
          <span className="font-mono-data text-sm font-bold text-[oklch(0.55_0.2_265)] w-10 text-center">
            {fwdPeriod}
          </span>
        </div>
        <p className="font-display text-[9px] text-[oklch(0.4_0.02_260)] mt-1">
          预测未来 {fwdPeriod} 期收益率 | K线: {state.projectConfig?.barSize || '1d'}
        </p>
      </div>

      {/* Token Cost Estimate */}
      <div className="border-2 border-[oklch(0.28_0.03_260)] bg-[oklch(0.1_0.015_260)] p-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[7px] text-[oklch(0.45_0.02_260)]">预估消耗</span>
          <span className="font-mono-data text-sm font-bold text-[oklch(0.82_0.15_85)]">
            🪙 ~{(estimatedTokens / 1000).toFixed(0)}K
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-pixel text-[7px] text-[oklch(0.45_0.02_260)]">当前余额</span>
          <span className={`font-mono-data text-xs ${canAfford ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
            🪙 {(state.credits / 1_000_000).toFixed(2)}M
          </span>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!factorDescription.trim() || !canAfford}
        className={`w-full font-pixel text-[9px] py-3 border-2 transition-all ${
          factorDescription.trim() && canAfford
            ? 'bg-[oklch(0.55_0.2_265)] text-white border-[oklch(0.65_0.22_265)] hover:brightness-110'
            : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
        }`}
        style={{ boxShadow: factorDescription.trim() && canAfford ? 'inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.15)' : 'none' }}
      >
        🚀 开始因子挖掘 ({SINGLE_FACTOR_STEPS.length} 步)
      </button>
    </div>
  );
}

