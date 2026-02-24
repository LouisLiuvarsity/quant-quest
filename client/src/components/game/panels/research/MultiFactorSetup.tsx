import { MULTI_FACTOR_STEPS, TOKEN_COSTS, useGame, type MultiFactorConfig } from '@/contexts/GameContext';
import { useState } from 'react';

export function MultiFactorSetup({ researcherId, onBack }: { researcherId: string; onBack: () => void }) {
  const { state, startMultiFactorTask, setActivePanel } = useGame();
  const [selectedFactorIds, setSelectedFactorIds] = useState<string[]>([]);
  const [blendMode, setBlendMode] = useState<'signal_blend' | 'position_blend'>('signal_blend');
  const [weightMethod, setWeightMethod] = useState<'equal' | 'sharpe_weighted' | 'rolling'>('equal');

  const passedFactors = state.factorCards.filter(f => f.status === 'passed');
  const estimatedTokens = TOKEN_COSTS.multi_factor.base + TOKEN_COSTS.multi_factor.perStep * MULTI_FACTOR_STEPS.length;
  const canAfford = state.credits >= estimatedTokens;
  const hasThreeWaySplit = state.projectConfig?.splitMode === 'three_way';
  const canStart = selectedFactorIds.length >= 2 && canAfford && hasThreeWaySplit;

  const toggleFactor = (id: string) => {
    setSelectedFactorIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    if (!canStart) return;
    const config: MultiFactorConfig = {
      selectedFactorIds,
      blendMode,
      weightMethod,
      correlationThreshold: 0.7,
    };
    startMultiFactorTask(researcherId, config);
    setActivePanel(null);
  };

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="font-pixel text-[7px] text-[oklch(0.5_0.02_260)] hover:text-[oklch(0.82_0.15_85)] transition-colors">
        ← 返回
      </button>

      <div className="border-2 border-[oklch(0.72_0.19_155_/_0.3)] bg-[oklch(0.72_0.19_155_/_0.05)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.72_0.19_155)]">🧬 多因子合成任务</p>
        <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-1">
          需要 ≥2 个已验证因子 + 三段切分 (IS/VAL/OOS) | {MULTI_FACTOR_STEPS.length} 步工作流
        </p>
      </div>

      {!hasThreeWaySplit && (
        <div className="border-2 border-[oklch(0.63_0.22_25_/_0.4)] bg-[oklch(0.63_0.22_25_/_0.08)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">⚠️ 当前项目为两段切分</p>
          <p className="font-display text-[10px] text-[oklch(0.72_0.02_260)] mt-1 leading-relaxed">
            多因子任务会消费 OOS 终评，因此必须先切换到三段切分。请返回上一层，在项目配置里改为 IS/VAL/OOS 后再启动。
          </p>
        </div>
      )}

      {/* Select Factors */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] block mb-2">
          选择因子 ({selectedFactorIds.length} 已选)
        </label>
        {passedFactors.length < 2 ? (
          <div className="border-2 border-[oklch(0.82_0.15_85_/_0.3)] bg-[oklch(0.82_0.15_85_/_0.05)] p-4 text-center">
            <p className="font-display text-xs text-[oklch(0.82_0.15_85)]">
              ⚠️ 需要至少 2 个已验证因子
            </p>
            <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-1">
              当前已验证: {passedFactors.length} 个
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {passedFactors.map(fc => (
              <button
                key={fc.id}
                onClick={() => toggleFactor(fc.id)}
                className={`w-full text-left px-3 py-2 border-2 transition-all ${
                  selectedFactorIds.includes(fc.id)
                    ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)]'
                    : 'border-[oklch(0.22_0.025_260)] hover:border-[oklch(0.35_0.03_260)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[11px] text-[oklch(0.85_0.01_260)]">{fc.factorName}</span>
                  <span className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)]">
                    Sharpe {fc.valPerformance.medianSharpe.toFixed(2)}
                  </span>
                </div>
                <p className="font-display text-[9px] text-[oklch(0.45_0.02_260)] mt-0.5 truncate">{fc.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Blend Mode */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] block mb-2">合成方式</label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 'signal_blend' as const, label: '信号层合成', desc: '先合成信号再映射仓位' },
            { value: 'position_blend' as const, label: '仓位层合成', desc: '各因子独立仓位再加权' },
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => setBlendMode(mode.value)}
              className={`text-left px-2.5 py-2 border-2 transition-all ${
                blendMode === mode.value
                  ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)]'
                  : 'border-[oklch(0.22_0.025_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              <p className={`font-display text-[11px] font-medium ${blendMode === mode.value ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.7_0.02_260)]'}`}>
                {mode.label}
              </p>
              <p className="font-display text-[9px] text-[oklch(0.45_0.02_260)]">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Weight Method */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] block mb-2">权重方案</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: 'equal' as const, label: '等权' },
            { value: 'sharpe_weighted' as const, label: '表现加权' },
            { value: 'rolling' as const, label: '滚动动态' },
          ].map(w => (
            <button
              key={w.value}
              onClick={() => setWeightMethod(w.value)}
              className={`font-display text-[11px] py-2 border-2 transition-all ${
                weightMethod === w.value
                  ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)] text-[oklch(0.72_0.19_155)]'
                  : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Token Cost */}
      <div className="border-2 border-[oklch(0.28_0.03_260)] bg-[oklch(0.1_0.015_260)] p-3">
        <div className="flex items-center justify-between">
          <span className="font-pixel text-[7px] text-[oklch(0.45_0.02_260)]">预估消耗</span>
          <span className="font-mono-data text-sm font-bold text-[oklch(0.82_0.15_85)]">
            🪙 ~{(estimatedTokens / 1000).toFixed(0)}K
          </span>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className={`w-full font-pixel text-[9px] py-3 border-2 transition-all ${
          canStart
            ? 'bg-[oklch(0.72_0.19_155)] text-white border-[oklch(0.8_0.2_155)] hover:brightness-110'
            : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
        }`}
      >
        {hasThreeWaySplit ? `🧬 开始多因子合成 (${MULTI_FACTOR_STEPS.length} 步)` : '🧬 需先切换到三段切分'}
      </button>
    </div>
  );
}
