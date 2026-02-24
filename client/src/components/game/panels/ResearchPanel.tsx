/*
 * ResearchPanel - Main research task management
 * Two task types: Single Factor (因子挖掘) and Multi Factor (多因子合成)
 * Shows active tasks with real-time step progression
 * Interactive decision points (🔀) pause for CEO input
 */

import { useGame, SINGLE_FACTOR_STEPS, MULTI_FACTOR_STEPS, KLINE_PERIODS, FACTOR_TYPES, UNIVERSES, TOKEN_COSTS, getDecisionOptions, type ResearchTask, type SingleFactorConfig, type MultiFactorConfig, type ProjectConfig, type TaskDecisionOption, type TaskType } from '@/contexts/GameContext';
import { useState, useEffect, useRef } from 'react';

// --- Project Config Setup (Step 0) ---
function ProjectConfigSetup({ onSave }: { onSave: (config: ProjectConfig) => void }) {
  const [barSize, setBarSize] = useState('1d');
  const [universe, setUniverse] = useState('crypto_top100');
  const [splitMode, setSplitMode] = useState<'three_way' | 'two_way'>('three_way');

  return (
    <div className="p-4 space-y-4">
      <div className="border-2 border-[oklch(0.82_0.15_85_/_0.3)] bg-[oklch(0.82_0.15_85_/_0.05)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-1">⚠️ 项目配置</p>
        <p className="font-display text-[11px] text-[oklch(0.6_0.02_260)] leading-relaxed">
          首次研究需要设定项目配置。此配置将被所有后续因子研究继承。
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <div className="border border-[oklch(0.32_0.03_260)] bg-[oklch(0.14_0.02_260)] p-1.5">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">作用 1</p>
            <p className="font-display text-[9px] text-[oklch(0.75_0.01_260)] mt-0.5">统一回测口径</p>
          </div>
          <div className="border border-[oklch(0.32_0.03_260)] bg-[oklch(0.14_0.02_260)] p-1.5">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">作用 2</p>
            <p className="font-display text-[9px] text-[oklch(0.75_0.01_260)] mt-0.5">固定训练/验证分层</p>
          </div>
          <div className="border border-[oklch(0.32_0.03_260)] bg-[oklch(0.14_0.02_260)] p-1.5">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">作用 3</p>
            <p className="font-display text-[9px] text-[oklch(0.75_0.01_260)] mt-0.5">解锁任务指派</p>
          </div>
        </div>
      </div>

      {/* K-line Period */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">K线级别</label>
        <div className="grid grid-cols-3 gap-1.5">
          {KLINE_PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setBarSize(p.value)}
              className={`font-display text-[11px] py-2 border-2 transition-all ${
                barSize === p.value
                  ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)]'
                  : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Universe */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">资产池</label>
        <div className="space-y-1.5">
          {UNIVERSES.map(u => (
            <button
              key={u.value}
              onClick={() => setUniverse(u.value)}
              className={`w-full text-left font-display text-[11px] px-3 py-2.5 border-2 transition-all ${
                universe === u.value
                  ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)]'
                  : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Split */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">数据切分</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setSplitMode('three_way')}
            className={`font-display text-[11px] py-2.5 border-2 transition-all ${
              splitMode === 'three_way'
                ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)] text-[oklch(0.72_0.19_155)]'
                : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
            }`}
          >
            三段切分 (IS/VAL/OOS)
          </button>
          <button
            onClick={() => setSplitMode('two_way')}
            className={`font-display text-[11px] py-2.5 border-2 transition-all ${
              splitMode === 'two_way'
                ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)] text-[oklch(0.72_0.19_155)]'
                : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
            }`}
          >
            两段切分 (IS/TEST)
          </button>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex gap-1">
            <div className="flex-1 h-3 bg-[oklch(0.55_0.2_265_/_0.3)] flex items-center justify-center">
              <span className="font-pixel text-[5px] text-[oklch(0.55_0.2_265)]">IS 2020-01~2022-06</span>
            </div>
            <div className="flex-1 h-3 bg-[oklch(0.72_0.19_155_/_0.3)] flex items-center justify-center">
              <span className="font-pixel text-[5px] text-[oklch(0.72_0.19_155)]">VAL 2022-06~2024-06</span>
            </div>
            {splitMode === 'three_way' && (
              <div className="flex-1 h-3 bg-[oklch(0.82_0.15_85_/_0.3)] flex items-center justify-center">
                <span className="font-pixel text-[5px] text-[oklch(0.82_0.15_85)]">OOS 2024-06~2026-01</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave({
          barSize,
          universeFilter: UNIVERSES.find(u => u.value === universe)?.label || universe,
          universeRebalance: '每月初',
          splitMode,
          isRange: '2020-01 ~ 2022-06',
          valRange: '2022-06 ~ 2024-06',
          oosRange: splitMode === 'three_way' ? '2024-06 ~ 2026-01' : 'N/A',
          regimeCheck: { bull: 38, bear: 32, sideways: 30 },
        })}
        className="w-full font-pixel text-[9px] py-3 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.65_0.22_265)] hover:brightness-110 transition-all"
        style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.15)' }}
      >
        ✅ 确认项目配置
      </button>
    </div>
  );
}

// --- Single Factor Task Config ---
function SingleFactorSetup({ researcherId, onBack }: { researcherId: string; onBack: () => void }) {
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

// --- Multi Factor Task Config ---
function MultiFactorSetup({ researcherId, onBack }: { researcherId: string; onBack: () => void }) {
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

interface DecisionPointCopy {
  headline: string;
  what: string;
  why: string;
  pitfall: string;
  cta: string;
}

const DECISION_POINT_COPIES: Record<string, DecisionPointCopy> = {
  S4: {
    headline: '描述你的交易直觉',
    what: '把信号逻辑定义清楚，确保可复现。',
    why: 'S4 决定了后续整个因子链路的方向与可解释性。',
    pitfall: '常见误区是逻辑过于复杂，导致验证阶段难以复盘。',
    cta: '生成因子草案并继续',
  },
  S10: {
    headline: '训练集参数搜索',
    what: '在 IS 里确定候选参数区间与优先方案。',
    why: '这是筛选参数的唯一训练阶段，影响后续泛化质量。',
    pitfall: '常见误区是搜索空间过宽，容易导致过拟合。',
    cta: '确认 Top 参数方案',
  },
  S11: {
    headline: '验证集独立检验',
    what: '在 VAL 上检验 IS 方案是否仍稳定有效。',
    why: 'VAL 是过拟合防线，能直接揭示泛化能力。',
    pitfall: '常见误区是只看收益不看回撤和换手。',
    cta: '确认验证结论',
  },
  S16: {
    headline: '输出因子档案卡',
    what: '给出采纳/淘汰结论并归档参数区间。',
    why: '档案卡是后续多因子与策略复用的入口资产。',
    pitfall: '常见误区是结论只看单一指标，忽视稳定性。',
    cta: '确认因子结论',
  },
  M2: {
    headline: '去冗余筛选',
    what: '移除高相关因子，保留独立贡献更强的候选。',
    why: '去冗余能降低重复下注，提升组合稳健性。',
    pitfall: '常见误区是保留过多相关因子导致回撤放大。',
    cta: '应用去冗余结果',
  },
  M3: {
    headline: '选择合成层级',
    what: '在信号层与仓位层中选定当前合成方式。',
    why: '合成层级决定后续风控和调参复杂度。',
    pitfall: '常见误区是忽略执行复杂度，只追求理论收益。',
    cta: '确认合成方式',
  },
  M4: {
    headline: '确定权重方案',
    what: '在等权、表现加权、滚动动态中选择权重策略。',
    why: '权重方案直接影响组合稳定性和换手水平。',
    pitfall: '常见误区是过度动态调权，导致成本上升。',
    cta: '确认权重方案',
  },
  M11: {
    headline: '与最优单因子对比',
    what: '对比多因子与单因子在 OOS 的核心指标。',
    why: '只有显著优于最优单因子，合成才有价值。',
    pitfall: '常见误区是只比较 Sharpe，不比较回撤和成本。',
    cta: '确认对比结论',
  },
  M12: {
    headline: '输出组合档案卡',
    what: '形成最终采纳决策并沉淀组合资产。',
    why: '组合档案卡将直接用于策略部署与复盘。',
    pitfall: '常见误区是 OOS 后继续回调参，污染测试结论。',
    cta: '确认组合结论',
  },
};

const DEFAULT_DECISION_COPY: DecisionPointCopy = {
  headline: '研究关键决策点',
  what: '选择当前步骤的推进方案并确认执行。',
  why: '该决策会影响后续质量、风险、效率与成本。',
  pitfall: '常见误区是忽略成本与稳定性，只看短期速度。',
  cta: '应用决策并继续',
};

function getDecisionPointCopy(stepId?: string): DecisionPointCopy {
  if (!stepId) return DEFAULT_DECISION_COPY;
  return DECISION_POINT_COPIES[stepId] || DEFAULT_DECISION_COPY;
}

function DecisionPointModal({
  open,
  onClose,
  taskType,
  stepId,
  stepName,
  decisionOptions,
  selectedDecisionId,
  onSelectDecision,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  taskType: TaskType;
  stepId?: string;
  stepName?: string;
  decisionOptions: TaskDecisionOption[];
  selectedDecisionId: string;
  onSelectDecision: (id: string) => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const copy = getDecisionPointCopy(stepId);
  const selectedOption = decisionOptions.find(option => option.id === selectedDecisionId);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[oklch(0.06_0.015_260_/_0.82)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[680px] max-h-[85vh] overflow-y-auto border-2 border-[oklch(0.82_0.15_85_/_0.5)] bg-[oklch(0.1_0.015_260_/_0.98)] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
              🔀 {taskType === 'single_factor' ? '单因子' : '多因子'}关键决策点
            </p>
            <p className="font-display text-[13px] font-semibold text-[oklch(0.92_0.01_260)] mt-1">
              {stepId} · {stepName}
            </p>
            <p className="font-display text-[11px] text-[oklch(0.72_0.19_155)] mt-1">{copy.headline}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 font-pixel text-[7px] border border-[oklch(0.3_0.03_260)] text-[oklch(0.52_0.02_260)] px-2 py-1 hover:border-[oklch(0.82_0.15_85)] hover:text-[oklch(0.82_0.15_85)] transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">做什么</p>
            <p className="font-display text-[10px] text-[oklch(0.78_0.02_260)] mt-1 leading-relaxed">{copy.what}</p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">为什么</p>
            <p className="font-display text-[10px] text-[oklch(0.78_0.02_260)] mt-1 leading-relaxed">{copy.why}</p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">常见误区</p>
            <p className="font-display text-[10px] text-[oklch(0.78_0.02_260)] mt-1 leading-relaxed">{copy.pitfall}</p>
          </div>
        </div>

        <div className="space-y-2">
          {decisionOptions.map(option => {
            const isSelected = option.id === selectedDecisionId;
            const costPct = Math.round(option.impact.costMultiplier * 100);
            return (
              <button
                key={option.id}
                onClick={() => onSelectDecision(option.id)}
                className={`w-full text-left border-2 px-3 py-2.5 transition-all ${
                  isSelected
                    ? 'border-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.12)]'
                    : 'border-[oklch(0.3_0.03_260)] bg-[oklch(0.14_0.02_260)] hover:border-[oklch(0.5_0.04_260)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-display text-xs font-semibold ${isSelected ? 'text-[oklch(0.9_0.08_85)]' : 'text-[oklch(0.82_0.02_260)]'}`}>{option.label}</span>
                  <span className="font-mono-data text-[10px] text-[oklch(0.55_0.02_260)]">
                    质{option.impact.quality >= 0 ? '+' : ''}{option.impact.quality} 风{option.impact.risk >= 0 ? '+' : ''}{option.impact.risk} 速{option.impact.efficiency >= 0 ? '+' : ''}{option.impact.efficiency} 成本{costPct >= 0 ? '+' : ''}{costPct}%
                  </span>
                </div>
                <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)] mt-1.5 leading-relaxed">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.018_260)] p-2">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">当前选择</p>
          <p className="font-display text-[11px] text-[oklch(0.82_0.02_260)] mt-1">
            {selectedOption ? selectedOption.label : '请选择一个方案'}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="font-pixel text-[7px] px-3 py-2 border border-[oklch(0.28_0.03_260)] text-[oklch(0.55_0.02_260)] hover:text-[oklch(0.82_0.15_85)] hover:border-[oklch(0.82_0.15_85)] transition-colors"
          >
            稍后处理
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedOption}
            className={`font-pixel text-[7px] px-3 py-2 border-2 transition-all ${
              selectedOption
                ? 'bg-[oklch(0.82_0.15_85)] text-[oklch(0.12_0.02_260)] border-[oklch(0.88_0.16_85)] hover:brightness-110'
                : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
            }`}
          >
            ✅ {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Active Task Monitor ---
function TaskMonitor({ task }: { task: ResearchTask }) {
  const { resumeTask, setActivePanel, setSelectedReport, state } = useGame();
  const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
  const currentStep = steps[task.currentStepIndex];
  const logsEndRef = useRef<HTMLDivElement>(null);
  const decisionOptions = currentStep ? getDecisionOptions(task.type, currentStep.id) : [];
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.logs.length]);

  useEffect(() => {
    if (task.status !== 'paused') return;
    if (decisionOptions.length === 0) return;
    if (decisionOptions.some(option => option.id === selectedDecisionId)) return;
    setSelectedDecisionId(decisionOptions[1]?.id || decisionOptions[0].id);
  }, [task.status, task.currentStepIndex, task.type, decisionOptions, selectedDecisionId]);

  useEffect(() => {
    if (task.status !== 'paused') {
      setShowDecisionModal(false);
    }
  }, [task.status]);

  const handleViewReport = () => {
    const report = state.reports.find(r => r.taskId === task.id);
    if (report) {
      setSelectedReport(report);
      setActivePanel('report-viewer');
    }
  };

  const selectedOption = decisionOptions.find(option => option.id === selectedDecisionId);

  const profileCards = [
    { key: 'quality', label: '质量', value: task.qualityScore, color: 'oklch(0.75 0.12 200)' },
    { key: 'risk', label: '风险', value: task.riskScore, color: 'oklch(0.82 0.15 85)' },
    { key: 'efficiency', label: '效率', value: task.efficiencyScore, color: 'oklch(0.72 0.19 155)' },
  ];

  const statusText = task.status === 'paused'
    ? '🔀 等待决策'
    : task.status === 'completed'
      ? '✅ 完成'
      : '⏳ 运行中';

  const statusClass = task.status === 'paused'
    ? 'text-[oklch(0.82_0.15_85)] animate-pulse'
    : task.status === 'completed'
      ? 'text-[oklch(0.72_0.19_155)]'
      : 'text-[oklch(0.55_0.2_265)]';

  return (
    <div className="border-2 border-[oklch(0.25_0.03_260)] bg-[oklch(0.1_0.015_260)] p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
            {task.type === 'single_factor' ? '🔬 因子挖掘' : '🧬 多因子合成'}
          </p>
          <p className="font-display text-[11px] text-[oklch(0.8_0.01_260)] mt-0.5">
            {state.researchers.find(r => r.id === task.researcherId)?.skin.name} · Step {task.currentStepIndex + 1}/{steps.length}
          </p>
          <p className="font-display text-[10px] text-[oklch(0.52_0.02_260)] mt-1 leading-relaxed">
            {currentStep?.id} {currentStep?.name}：{currentStep?.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono-data text-[11px] text-[oklch(0.55_0.2_265)]">
            🪙 {(task.tokenCost / 1000).toFixed(0)}K
          </p>
          <p className={`font-pixel text-[6px] ${statusClass}`}>
            {statusText}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">工作流进度</span>
          <span className="font-mono-data text-[10px] text-[oklch(0.78_0.03_260)]">{task.overallProgress}%</span>
        </div>
        <div className="flex gap-0.5">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="flex-1 h-2 border border-[oklch(0.2_0.02_260)]"
              title={`${step.id}: ${step.name}`}
              style={{
                backgroundColor: i < task.currentStepIndex
                  ? 'oklch(0.55 0.2 265)'
                  : i === task.currentStepIndex
                    ? task.status === 'paused' ? 'oklch(0.82 0.15 85)' : 'oklch(0.55 0.2 265 / 0.5)'
                    : 'oklch(0.15 0.02 260)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {profileCards.map(profile => (
          <div key={profile.key} className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.08_0.015_260)] p-2">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)] mb-1">{profile.label}</p>
            <p className="font-mono-data text-[11px] font-bold mb-1" style={{ color: profile.color }}>{profile.value}</p>
            <div className="h-1.5 bg-[oklch(0.16_0.02_260)] border border-[oklch(0.2_0.02_260)]">
              <div className="h-full" style={{ width: `${profile.value}%`, backgroundColor: profile.color }} />
            </div>
          </div>
        ))}
      </div>

      {task.decisionHistory.length > 0 && (
        <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.015_260)] p-2">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] mb-1.5">最近决策</p>
          <div className="space-y-1">
            {task.decisionHistory.slice(-2).map(item => (
              <div key={`${item.stepId}-${item.timestamp}`} className="flex items-start justify-between gap-2">
                <span className="font-display text-[10px] text-[oklch(0.72_0.19_155)]">{item.stepId} · {item.optionLabel}</span>
                <span className="font-display text-[9px] text-[oklch(0.5_0.02_260)] text-right">{item.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] max-h-36 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-0.5">
          {task.logs.slice(-14).map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-mono-data text-[8px] text-[oklch(0.35_0.02_260)] shrink-0">{log.timestamp}</span>
              <span className={`font-display text-[10px] leading-relaxed ${
                log.type === 'success'
                  ? 'text-[oklch(0.72_0.19_155)]'
                  : log.type === 'warning'
                    ? 'text-[oklch(0.82_0.15_85)]'
                    : log.type === 'decision'
                      ? 'text-[oklch(0.82_0.15_85)] font-semibold'
                      : 'text-[oklch(0.6_0.02_260)]'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {task.status === 'paused' && (
        <div className="border-2 border-[oklch(0.82_0.15_85_/_0.45)] bg-[oklch(0.82_0.15_85_/_0.05)] p-3 space-y-2.5">
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">
            🔀 CEO 决策点：{currentStep?.name}
          </p>
          <p className="font-display text-[10px] text-[oklch(0.62_0.02_260)] leading-relaxed">
            此步骤使用统一决策弹窗，支持步骤解说、影响对比和结果确认。
          </p>
          <button
            onClick={() => setShowDecisionModal(true)}
            className="w-full font-pixel text-[7px] py-2 border border-[oklch(0.82_0.15_85_/_0.7)] bg-[oklch(0.82_0.15_85_/_0.12)] text-[oklch(0.9_0.08_85)] hover:bg-[oklch(0.82_0.15_85_/_0.2)] transition-colors"
          >
            打开决策弹窗
          </button>
          <button
            onClick={() => {
              if (!selectedOption) return;
              resumeTask(task.id, { optionId: selectedOption.id });
            }}
            disabled={!selectedOption}
            className={`w-full font-pixel text-[8px] py-2.5 border-2 transition-all ${
              selectedOption
                ? 'bg-[oklch(0.82_0.15_85)] text-[oklch(0.12_0.02_260)] border-[oklch(0.88_0.16_85)] hover:brightness-110'
                : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
            }`}
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)' }}
          >
            ✅ 应用决策并继续
          </button>
        </div>
      )}

      {task.status === 'completed' && (
        <button
          onClick={handleViewReport}
          className="w-full font-pixel text-[8px] py-2.5 bg-[oklch(0.72_0.19_155)] text-white border-2 border-[oklch(0.8_0.2_155)] hover:brightness-110 transition-all"
        >
          📄 查看研究报告
        </button>
      )}

      <DecisionPointModal
        open={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        taskType={task.type}
        stepId={currentStep?.id}
        stepName={currentStep?.name}
        decisionOptions={decisionOptions}
        selectedDecisionId={selectedDecisionId}
        onSelectDecision={setSelectedDecisionId}
        onConfirm={() => {
          if (!selectedOption) return;
          resumeTask(task.id, { optionId: selectedOption.id });
          setShowDecisionModal(false);
        }}
      />
    </div>
  );
}

// --- Main Research Panel ---
export function ResearchPanel() {
  const { state, setProjectConfig, setPlayMode } = useGame();
  const [view, setView] = useState<'main' | 'config' | 'single_factor' | 'multi_factor'>('main');
  const [selectedResearcherId, setSelectedResearcherId] = useState<string>('');

  const idleResearchers = state.researchers.filter(r => r.status === 'idle');
  const leadIdleResearcher = idleResearchers[0];
  const activeTasks = state.activeTasks.filter(t => t.status !== 'completed');
  const completedTasks = state.activeTasks.filter(t => t.status === 'completed').slice(0, 5);
  const waitingTasks = state.activeTasks.filter(t => t.status === 'paused').length;
  const passedFactors = state.factorCards.filter(f => f.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(p => p.status === 'adopted').length;
  const isGuidedMode = state.playMode === 'guided';
  const hasThreeWaySplit = state.projectConfig?.splitMode === 'three_way';
  const canStartMulti = passedFactors >= 2 && hasThreeWaySplit;

  const stageHint = !state.projectConfig
    ? '先完成项目配置，再启动第一条单因子研究链路。'
    : !hasThreeWaySplit
      ? '当前是两段切分 (IS/TEST)。请先改为三段切分 (IS/VAL/OOS)，再开启多因子与 OOS 终评。'
    : isGuidedMode
      ? passedFactors < 2
        ? '新手模式：先用单因子任务凑齐 2 个通过因子，再进入多因子。'
        : adoptedPortfolios === 0
          ? '新手模式：用已通过因子发起一次多因子合成，拿到首个可部署组合。'
          : '新手模式：你已跑通完整链路，可切到专业模式进行批量派单。'
      : passedFactors < 2
        ? '专业模式：直接给研究员派单，优先快速扩展通过因子数量。'
        : adoptedPortfolios === 0
          ? '专业模式：立即推进多因子合成，验证组合相对单因子提升。'
          : '专业模式：并行运行研究任务，持续优化组合与策略池。';

  const guidedChecklist = [
    {
      id: 'project',
      title: '完成项目配置',
      detail: '统一 K 线级别、资产池和切分方式，建立全局研究基线',
      done: Boolean(state.projectConfig),
      progressText: state.projectConfig ? '已完成' : '未完成',
    },
    {
      id: 'single',
      title: '产出 2 个通过因子',
      detail: '优先使用单因子任务积累候选，学习研究闭环',
      done: passedFactors >= 2,
      progressText: `${Math.min(passedFactors, 2)}/2`,
    },
    {
      id: 'multi',
      title: '产出 1 个可部署组合',
      detail: hasThreeWaySplit
        ? '把通过因子合成为组合，并观察是否优于最优单因子'
        : '先在项目配置切换到三段切分，再执行多因子合成',
      done: hasThreeWaySplit && adoptedPortfolios >= 1,
      progressText: hasThreeWaySplit ? `${Math.min(adoptedPortfolios, 1)}/1` : '需切分',
    },
  ] as const;

  const nextGuidedStep = guidedChecklist.find(step => !step.done) ?? null;
  const guidedRecommendedTask = nextGuidedStep?.id === 'single' || (nextGuidedStep?.id === 'multi' && hasThreeWaySplit)
    ? (nextGuidedStep.id === 'single' ? 'single_factor' : hasThreeWaySplit ? 'multi_factor' : null)
    : null;
  const requiresResearcherForGuidedAction = Boolean(
    nextGuidedStep && (nextGuidedStep.id === 'single' || (nextGuidedStep.id === 'multi' && hasThreeWaySplit)),
  );

  const handleGuidedAction = () => {
    if (!nextGuidedStep) return;
    if (nextGuidedStep.id === 'project') {
      setView('config');
      return;
    }
    if (nextGuidedStep.id === 'multi' && !hasThreeWaySplit) {
      setView('config');
      return;
    }
    if (!leadIdleResearcher) return;
    setSelectedResearcherId(leadIdleResearcher.id);
    setView(nextGuidedStep.id === 'single' ? 'single_factor' : 'multi_factor');
  };

  if (!state.projectConfig && view === 'main') {
    return <ProjectConfigSetup onSave={setProjectConfig} />;
  }

  if (view === 'config') {
    return <ProjectConfigSetup onSave={(config) => { setProjectConfig(config); setView('main'); }} />;
  }

  if (view === 'single_factor' && selectedResearcherId) {
    return <SingleFactorSetup researcherId={selectedResearcherId} onBack={() => setView('main')} />;
  }

  if (view === 'multi_factor' && selectedResearcherId) {
    return <MultiFactorSetup researcherId={selectedResearcherId} onBack={() => setView('main')} />;
  }

  return (
    <div className="p-4 space-y-4">
      <div
        className="border-2 border-[oklch(0.35_0.04_260)] p-3.5"
        style={{ background: 'linear-gradient(135deg, oklch(0.13 0.025 260), oklch(0.11 0.02 260))' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">🧭 研究指挥台</p>
            <p className="font-display text-[11px] text-[oklch(0.6_0.02_260)] mt-1 leading-relaxed">{stageHint}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">待处理决策</p>
            <p className={`font-mono-data text-sm font-bold ${waitingTasks > 0 ? 'text-[oklch(0.82_0.15_85)]' : 'text-[oklch(0.72_0.19_155)]'}`}>{waitingTasks}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setPlayMode('guided')}
            className={`text-left border-2 px-2.5 py-2 transition-all ${
              isGuidedMode
                ? 'border-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.12)]'
                : 'border-[oklch(0.3_0.03_260)] bg-[oklch(0.14_0.02_260)] hover:border-[oklch(0.45_0.04_260)]'
            }`}
          >
            <p className={`font-pixel text-[7px] ${isGuidedMode ? 'text-[oklch(0.82_0.15_85)]' : 'text-[oklch(0.55_0.02_260)]'}`}>🎓 新手引导模式</p>
            <p className="font-display text-[10px] text-[oklch(0.62_0.02_260)] mt-1 leading-relaxed">
              给你下一步建议，按里程碑边做边学。
            </p>
          </button>
          <button
            onClick={() => setPlayMode('expert')}
            className={`text-left border-2 px-2.5 py-2 transition-all ${
              !isGuidedMode
                ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.12)]'
                : 'border-[oklch(0.3_0.03_260)] bg-[oklch(0.14_0.02_260)] hover:border-[oklch(0.45_0.04_260)]'
            }`}
          >
            <p className={`font-pixel text-[7px] ${!isGuidedMode ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.55_0.02_260)]'}`}>🧠 专业直达模式</p>
            <p className="font-display text-[10px] text-[oklch(0.62_0.02_260)] mt-1 leading-relaxed">
              直接指派研究员任务，快速推进并行流水线。
            </p>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.22_0.025_260)] p-2 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">通过因子</p>
            <p className="font-mono-data text-sm font-bold text-[oklch(0.55_0.2_265)]">{passedFactors}</p>
          </div>
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.22_0.025_260)] p-2 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">采纳组合</p>
            <p className="font-mono-data text-sm font-bold text-[oklch(0.72_0.19_155)]">{adoptedPortfolios}</p>
          </div>
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.22_0.025_260)] p-2 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">活跃任务</p>
            <p className="font-mono-data text-sm font-bold text-[oklch(0.82_0.15_85)]">{activeTasks.length}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['招募研究员', '单因子挖掘', '决策推进', '多因子合成', '部署策略'].map((item, index) => (
            <span
              key={item}
              className="font-pixel text-[6px] px-2 py-1 border border-[oklch(0.28_0.03_260)] bg-[oklch(0.15_0.02_260)] text-[oklch(0.6_0.02_260)]"
            >
              {index + 1}. {item}
            </span>
          ))}
        </div>
      </div>

      {isGuidedMode ? (
        <div className="border-2 border-[oklch(0.82_0.15_85_/_0.4)] bg-[oklch(0.82_0.15_85_/_0.06)] p-3 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">🎯 新手下一步</p>
              <p className="font-display text-[11px] text-[oklch(0.78_0.02_260)] mt-1">
                {nextGuidedStep ? nextGuidedStep.title : '基础教学链路已完成'}
              </p>
              <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)] mt-1 leading-relaxed">
                {nextGuidedStep ? nextGuidedStep.detail : '你已跑通配置 → 单因子 → 多因子，可切换专业模式按策略目标直接派单。'}
              </p>
            </div>
            <button
              onClick={handleGuidedAction}
              disabled={!nextGuidedStep || (requiresResearcherForGuidedAction && !leadIdleResearcher)}
              className={`shrink-0 font-pixel text-[7px] px-2.5 py-2 border-2 transition-all ${
                nextGuidedStep && (!requiresResearcherForGuidedAction || leadIdleResearcher)
                  ? 'bg-[oklch(0.82_0.15_85)] text-[oklch(0.12_0.02_260)] border-[oklch(0.88_0.16_85)] hover:brightness-110'
                  : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
              }`}
            >
              {nextGuidedStep
                ? nextGuidedStep.id === 'project'
                  ? '去配置'
                  : nextGuidedStep.id === 'multi' && !hasThreeWaySplit
                    ? '先改切分'
                  : leadIdleResearcher
                    ? `派给 ${leadIdleResearcher.skin.name}`
                    : '暂无空闲研究员'
                : '已完成'}
            </button>
          </div>
          <div className="space-y-1.5">
            {guidedChecklist.map(step => (
              <div key={step.id} className="flex items-center justify-between gap-2 border border-[oklch(0.28_0.03_260)] bg-[oklch(0.12_0.02_260)] px-2.5 py-2">
                <div>
                  <p className={`font-display text-[11px] ${step.done ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.82_0.02_260)]'}`}>
                    {step.done ? '✅' : '▫️'} {step.title}
                  </p>
                  <p className="font-display text-[9px] text-[oklch(0.52_0.02_260)] mt-0.5">{step.detail}</p>
                </div>
                <span className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)]">{step.progressText}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-2 border-[oklch(0.72_0.19_155_/_0.35)] bg-[oklch(0.72_0.19_155_/_0.06)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)]">⚡ 专业模式提示</p>
          <p className="font-display text-[10px] text-[oklch(0.62_0.02_260)] mt-1 leading-relaxed">
            你可以直接给空闲研究员分配单因子或多因子任务；系统仍会强制要求先完成项目配置，避免口径不一致。
          </p>
        </div>
      )}

      {/* Project Config Summary */}
      {state.projectConfig && (
        <div className="border-2 border-[oklch(0.25_0.03_260)] bg-[oklch(0.1_0.015_260)] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)]">📋 项目配置</p>
            <button
              onClick={() => setView('config')}
              className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] hover:text-[oklch(0.82_0.15_85)] transition-colors"
            >
              修改
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">K线</p>
              <p className="font-mono-data text-xs text-[oklch(0.85_0.01_260)]">{state.projectConfig.barSize}</p>
            </div>
            <div>
              <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">切分</p>
              <p className="font-mono-data text-xs text-[oklch(0.85_0.01_260)]">{state.projectConfig.splitMode === 'three_way' ? 'IS/VAL/OOS' : 'IS/TEST'}</p>
            </div>
            <div>
              <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">调仓</p>
              <p className="font-mono-data text-xs text-[oklch(0.85_0.01_260)]">{state.projectConfig.universeRebalance}</p>
            </div>
          </div>
        </div>
      )}

      {/* New Task */}
      <div>
        <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-2">📝 发起新研究</p>

        {idleResearchers.length === 0 ? (
          <div className="border-2 border-dashed border-[oklch(0.25_0.03_260)] p-4 text-center">
            <p className="font-display text-xs text-[oklch(0.5_0.02_260)]">所有研究员都在忙碌中</p>
          </div>
        ) : (
          <div className="space-y-2">
            {idleResearchers.map(r => {
              const isRecommendedOwner = isGuidedMode && Boolean(guidedRecommendedTask) && r.id === leadIdleResearcher?.id;
              return (
                <div
                  key={r.id}
                  className={`border-2 p-3 ${
                    isRecommendedOwner
                      ? 'border-[oklch(0.82_0.15_85_/_0.5)] bg-[oklch(0.82_0.15_85_/_0.06)]'
                      : 'border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.skin.avatar}</span>
                      <div>
                        <p className="font-display text-xs text-[oklch(0.85_0.01_260)]">{r.skin.name}</p>
                        <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">{r.role} | 💤 空闲</p>
                      </div>
                    </div>
                    {isRecommendedOwner && (
                      <span className="font-pixel text-[6px] px-1.5 py-1 border border-[oklch(0.82_0.15_85_/_0.5)] bg-[oklch(0.82_0.15_85_/_0.15)] text-[oklch(0.82_0.15_85)]">
                        引导推荐
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedResearcherId(r.id); setView('single_factor'); }}
                      className={`flex-1 font-pixel text-[7px] py-2 border-2 transition-all ${
                        isRecommendedOwner && guidedRecommendedTask === 'single_factor'
                          ? 'bg-[oklch(0.82_0.15_85_/_0.2)] text-[oklch(0.9_0.08_85)] border-[oklch(0.82_0.15_85)]'
                          : 'bg-[oklch(0.55_0.2_265_/_0.15)] text-[oklch(0.55_0.2_265)] border-[oklch(0.55_0.2_265_/_0.3)] hover:bg-[oklch(0.55_0.2_265_/_0.25)]'
                      }`}
                    >
                      🔬 因子挖掘
                    </button>
                    <button
                      onClick={() => { setSelectedResearcherId(r.id); setView('multi_factor'); }}
                      className={`flex-1 font-pixel text-[7px] py-2 border-2 transition-all ${
                        canStartMulti
                          ? isRecommendedOwner && guidedRecommendedTask === 'multi_factor'
                            ? 'bg-[oklch(0.82_0.15_85_/_0.2)] text-[oklch(0.9_0.08_85)] border-[oklch(0.82_0.15_85)]'
                            : 'bg-[oklch(0.72_0.19_155_/_0.15)] text-[oklch(0.72_0.19_155)] border-[oklch(0.72_0.19_155_/_0.3)] hover:bg-[oklch(0.72_0.19_155_/_0.25)]'
                          : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.3_0.02_260)] border-[oklch(0.2_0.02_260)] cursor-not-allowed'
                      }`}
                      disabled={!canStartMulti}
                    >
                      🧬 多因子合成
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {passedFactors >= 2 && !hasThreeWaySplit && (
          <div className="mt-2 border border-[oklch(0.63_0.22_25_/_0.35)] bg-[oklch(0.63_0.22_25_/_0.08)] px-2.5 py-2">
            <p className="font-display text-[10px] text-[oklch(0.82_0.15_85)]">
              已满足因子数量，但当前切分为 IS/TEST。请先在「项目配置」改为 IS/VAL/OOS 才能发起多因子。
            </p>
          </div>
        )}
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)] mb-2">⏳ 进行中的研究</p>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <TaskMonitor key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.72_0.19_155)] mb-2">✅ 最近完成</p>
          <div className="space-y-1.5">
            {completedTasks.map(task => (
              <TaskMonitor key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
