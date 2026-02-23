/*
 * ResearchPanel - Main research task management
 * Two task types: Single Factor (因子挖掘) and Multi Factor (多因子合成)
 * Shows active tasks with real-time step progression
 * Interactive decision points (🔀) pause for CEO input
 */

import { useGame, SINGLE_FACTOR_STEPS, MULTI_FACTOR_STEPS, KLINE_PERIODS, FACTOR_TYPES, UNIVERSES, TOKEN_COSTS, type ResearchTask, type SingleFactorConfig, type MultiFactorConfig, type ProjectConfig } from '@/contexts/GameContext';
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
  const canStart = selectedFactorIds.length >= 2 && canAfford;

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
          需要 ≥2 个已验证因子 | {MULTI_FACTOR_STEPS.length} 步工作流
        </p>
      </div>

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
        🧬 开始多因子合成 ({MULTI_FACTOR_STEPS.length} 步)
      </button>
    </div>
  );
}

// --- Active Task Monitor ---
function TaskMonitor({ task }: { task: ResearchTask }) {
  const { resumeTask, setActivePanel, setSelectedReport, state } = useGame();
  const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
  const currentStep = steps[task.currentStepIndex];
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.logs.length]);

  const handleViewReport = () => {
    const report = state.reports.find(r => r.taskId === task.id);
    if (report) {
      setSelectedReport(report);
      setActivePanel('report-viewer');
    }
  };

  return (
    <div className="border-2 border-[oklch(0.25_0.03_260)] bg-[oklch(0.1_0.015_260)] p-3 space-y-3">
      {/* Task header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
            {task.type === 'single_factor' ? '🔬 因子挖掘' : '🧬 多因子合成'}
          </p>
          <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">
            {state.researchers.find(r => r.id === task.researcherId)?.skin.name}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)]">
            🪙 {(task.tokenCost / 1000).toFixed(0)}K
          </p>
          <p className={`font-pixel text-[6px] ${
            task.status === 'paused' ? 'text-[oklch(0.82_0.15_85)] animate-pulse' :
            task.status === 'completed' ? 'text-[oklch(0.72_0.19_155)]' :
            'text-[oklch(0.55_0.2_265)]'
          }`}>
            {task.status === 'paused' ? '🔀 等待决策' : task.status === 'completed' ? '✅ 完成' : '⏳ 运行中'}
          </p>
        </div>
      </div>

      {/* Step progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">
            Step {task.currentStepIndex + 1}/{steps.length}
          </span>
          <span className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">
            {currentStep?.name}
          </span>
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

      {/* Live logs */}
      <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] max-h-32 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-0.5">
          {task.logs.slice(-12).map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-mono-data text-[8px] text-[oklch(0.35_0.02_260)] shrink-0">{log.timestamp}</span>
              <span className={`font-display text-[10px] leading-relaxed ${
                log.type === 'success' ? 'text-[oklch(0.72_0.19_155)]' :
                log.type === 'warning' ? 'text-[oklch(0.82_0.15_85)]' :
                log.type === 'decision' ? 'text-[oklch(0.82_0.15_85)] font-semibold animate-pulse' :
                'text-[oklch(0.6_0.02_260)]'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Decision point action */}
      {task.status === 'paused' && (
        <div className="border-2 border-[oklch(0.82_0.15_85_/_0.4)] bg-[oklch(0.82_0.15_85_/_0.05)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">
            🔀 CEO 决策点: {currentStep?.name}
          </p>
          <p className="font-display text-[10px] text-[oklch(0.6_0.02_260)] mb-3 leading-relaxed">
            {currentStep?.description}
          </p>
          <button
            onClick={() => resumeTask(task.id)}
            className="w-full font-pixel text-[8px] py-2.5 bg-[oklch(0.82_0.15_85)] text-[oklch(0.12_0.02_260)] border-2 border-[oklch(0.88_0.16_85)] hover:brightness-110 transition-all"
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)' }}
          >
            ✅ 确认并继续
          </button>
        </div>
      )}

      {/* Completed action */}
      {task.status === 'completed' && (
        <button
          onClick={handleViewReport}
          className="w-full font-pixel text-[8px] py-2.5 bg-[oklch(0.72_0.19_155)] text-white border-2 border-[oklch(0.8_0.2_155)] hover:brightness-110 transition-all"
        >
          📄 查看研究报告
        </button>
      )}
    </div>
  );
}

// --- Main Research Panel ---
export function ResearchPanel() {
  const { state, setProjectConfig } = useGame();
  const [view, setView] = useState<'main' | 'config' | 'single_factor' | 'multi_factor'>('main');
  const [selectedResearcherId, setSelectedResearcherId] = useState<string>('');

  const idleResearchers = state.researchers.filter(r => r.status === 'idle');
  const activeTasks = state.activeTasks.filter(t => t.status !== 'completed');
  const completedTasks = state.activeTasks.filter(t => t.status === 'completed').slice(0, 5);

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
            {idleResearchers.map(r => (
              <div key={r.id} className="border-2 border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{r.skin.avatar}</span>
                  <div>
                    <p className="font-display text-xs text-[oklch(0.85_0.01_260)]">{r.skin.name}</p>
                    <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">{r.role} | 💤 空闲</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedResearcherId(r.id); setView('single_factor'); }}
                    className="flex-1 font-pixel text-[7px] py-2 bg-[oklch(0.55_0.2_265_/_0.15)] text-[oklch(0.55_0.2_265)] border-2 border-[oklch(0.55_0.2_265_/_0.3)] hover:bg-[oklch(0.55_0.2_265_/_0.25)] transition-all"
                  >
                    🔬 因子挖掘
                  </button>
                  <button
                    onClick={() => { setSelectedResearcherId(r.id); setView('multi_factor'); }}
                    className={`flex-1 font-pixel text-[7px] py-2 border-2 transition-all ${
                      state.factorCards.filter(f => f.status === 'passed').length >= 2
                        ? 'bg-[oklch(0.72_0.19_155_/_0.15)] text-[oklch(0.72_0.19_155)] border-[oklch(0.72_0.19_155_/_0.3)] hover:bg-[oklch(0.72_0.19_155_/_0.25)]'
                        : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.3_0.02_260)] border-[oklch(0.2_0.02_260)] cursor-not-allowed'
                    }`}
                    disabled={state.factorCards.filter(f => f.status === 'passed').length < 2}
                  >
                    🧬 多因子合成
                  </button>
                </div>
              </div>
            ))}
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
