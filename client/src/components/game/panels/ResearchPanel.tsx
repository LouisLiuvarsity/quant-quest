/*
 * ResearchPanel - Assign research tasks to researchers
 * User configures: task type, NL description, K-line period, backtest range, universe
 * Token cost shown before starting
 */

import { useGame, TOKEN_COSTS, KLINE_PERIODS, UNIVERSES, ROLE_LABELS, ROLE_COLORS, TASK_TYPE_LABELS, type TaskType, type ResearchTaskConfig, type OptimizationType } from '@/contexts/GameContext';
import { useState } from 'react';
import { toast } from 'sonner';

export function ResearchPanel() {
  const { state, startResearch, setActivePanel, setSelectedResearcher } = useGame();

  const [selectedResearcherId, setSelectedResearcherId] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<TaskType>('factor_mining');
  const [factorDescription, setFactorDescription] = useState('');
  const [klinePeriod, setKlinePeriod] = useState('1d');
  const [backtestStart, setBacktestStart] = useState('2024-01');
  const [backtestEnd, setBacktestEnd] = useState('2025-12');
  const [universe, setUniverse] = useState('crypto_top50');
  const [optimizationType, setOptimizationType] = useState<OptimizationType>('parameter');

  const idleResearchers = state.researchers.filter(r => r.status === 'idle');
  const busyResearchers = state.researchers.filter(r => r.status === 'researching');
  const completedResearchers = state.researchers.filter(r => r.status === 'completed');
  const cost = TOKEN_COSTS[taskType].base;

  const handleStart = () => {
    if (!selectedResearcherId) {
      toast.error('请先选择一位空闲的研究员');
      return;
    }
    if (state.credits < cost) {
      toast.error('Token不足', { description: `需要 ${cost.toLocaleString()} Token` });
      return;
    }
    if (taskType === 'factor_mining' && !factorDescription.trim()) {
      toast.error('请输入因子描述');
      return;
    }

    const config: ResearchTaskConfig = {
      type: taskType,
      factorDescription: factorDescription.trim(),
      klinePeriod,
      backtestRange: { start: backtestStart, end: backtestEnd },
      universe,
      optimizationType,
    };

    startResearch(selectedResearcherId, config);
    setSelectedResearcherId(null);
    setFactorDescription('');
    toast.success('研究任务已启动！');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Active tasks overview */}
      {busyResearchers.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-2">🔬 进行中的研究</p>
          <div className="space-y-2">
            {busyResearchers.map(r => (
              <div
                key={r.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 p-3"
                style={{ borderColor: `${ROLE_COLORS[r.role]}40` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.skin.avatar}</span>
                    <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{r.skin.name}</span>
                  </div>
                  <span className="font-pixel text-[6px]" style={{ color: ROLE_COLORS[r.role] }}>
                    {r.currentTask ? TASK_TYPE_LABELS[r.currentTask.type] : ROLE_LABELS[r.role]}
                  </span>
                </div>
                <div className="w-full h-2 bg-[oklch(0.18_0.02_260)] border border-[oklch(0.25_0.03_260)]">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${r.progress}%`, backgroundColor: ROLE_COLORS[r.role] }}
                  />
                </div>
                <p className="font-mono-data text-[9px] text-[oklch(0.5_0.02_260)] mt-1 text-right">{r.progress}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed tasks */}
      {completedResearchers.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.72_0.19_155)] mb-2">✅ 已完成</p>
          <div className="space-y-2">
            {completedResearchers.map(r => (
              <div
                key={r.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] p-3 cursor-pointer hover:border-[oklch(0.72_0.19_155_/_0.6)] transition-all"
                onClick={() => {
                  setSelectedResearcher(r);
                  setActivePanel('researcher-detail');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.skin.avatar}</span>
                    <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{r.skin.name}</span>
                  </div>
                  <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">点击查看 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New task assignment */}
      <div className="border-t-2 border-[oklch(0.22_0.025_260)] pt-4">
        <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)] mb-3">📋 分配新任务</p>

        {/* Step 1: Select researcher */}
        <div className="mb-4">
          <p className="font-display text-xs font-semibold text-[oklch(0.7_0.02_260)] mb-2">1. 选择研究员</p>
          {idleResearchers.length === 0 ? (
            <p className="font-display text-xs text-[oklch(0.45_0.02_260)] py-3 text-center bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)]">
              暂无空闲研究员 · 等待当前任务完成
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {idleResearchers.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResearcherId(r.id)}
                  className={`p-2.5 border-2 text-center transition-all ${
                    selectedResearcherId === r.id
                      ? 'bg-[oklch(0.55_0.2_265_/_0.08)]'
                      : 'bg-[oklch(0.14_0.02_260)] hover:bg-[oklch(0.16_0.025_260)]'
                  }`}
                  style={{
                    borderColor: selectedResearcherId === r.id ? ROLE_COLORS[r.role] : 'oklch(0.25 0.03 260)',
                  }}
                >
                  <span className="text-lg block">{r.skin.avatar}</span>
                  <span className="font-pixel text-[6px] text-[oklch(0.7_0.02_260)] block mt-1">
                    {r.skin.name.length > 4 ? r.skin.name.slice(0, 4) : r.skin.name}
                  </span>
                  <span className="font-pixel text-[5px] block mt-0.5" style={{ color: ROLE_COLORS[r.role] }}>
                    {ROLE_LABELS[r.role]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Task type */}
        {selectedResearcherId && (
          <div className="mb-4 animate-fade-in-up">
            <p className="font-display text-xs font-semibold text-[oklch(0.7_0.02_260)] mb-2">2. 选择任务类型</p>
            <div className="space-y-1.5">
              {(Object.keys(TOKEN_COSTS) as TaskType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setTaskType(type)}
                  className={`w-full p-2.5 border-2 text-left transition-all flex items-center justify-between ${
                    taskType === type
                      ? 'bg-[oklch(0.18_0.03_260)] border-[oklch(0.55_0.2_265)]'
                      : 'bg-[oklch(0.14_0.02_260)] border-[oklch(0.22_0.025_260)] hover:border-[oklch(0.3_0.03_260)]'
                  }`}
                >
                  <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">
                    {TASK_TYPE_LABELS[type]}
                  </span>
                  <span className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)]">
                    🪙 ~{TOKEN_COSTS[type].base.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Task configuration */}
        {selectedResearcherId && (
          <div className="mb-4 animate-fade-in-up space-y-3">
            <p className="font-display text-xs font-semibold text-[oklch(0.7_0.02_260)]">3. 配置参数</p>

            {taskType === 'factor_mining' && (
              <div>
                <label className="font-pixel text-[6px] text-[oklch(0.55_0.02_260)] block mb-1.5">
                  因子描述（自然语言）
                </label>
                <textarea
                  value={factorDescription}
                  onChange={(e) => setFactorDescription(e.target.value)}
                  placeholder="例如：基于过去5日成交量变化率和价格动量的反转因子..."
                  className="w-full bg-[oklch(0.1_0.015_260)] border-2 border-[oklch(0.25_0.03_260)] px-3 py-2.5 font-display text-xs text-[oklch(0.88_0.01_260)] placeholder:text-[oklch(0.35_0.02_260)] focus:border-[oklch(0.55_0.2_265)] focus:outline-none resize-none h-20"
                />
              </div>
            )}

            {taskType === 'optimization' && (
              <div>
                <label className="font-pixel text-[6px] text-[oklch(0.55_0.02_260)] block mb-1.5">
                  优化类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'parameter' as OptimizationType, label: '参数优化', desc: '网格搜索+贝叶斯' },
                    { value: 'portfolio' as OptimizationType, label: '组合优化', desc: '因子权重+风险预算' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setOptimizationType(opt.value)}
                      className={`p-2.5 border-2 text-center transition-all ${
                        optimizationType === opt.value
                          ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.06)]'
                          : 'border-[oklch(0.22_0.025_260)] bg-[oklch(0.14_0.02_260)]'
                      }`}
                    >
                      <p className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{opt.label}</p>
                      <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="font-pixel text-[6px] text-[oklch(0.55_0.02_260)] block mb-1.5">K线周期</label>
              <div className="flex flex-wrap gap-1.5">
                {KLINE_PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setKlinePeriod(p.value)}
                    className={`px-3 py-1.5 border-2 font-mono-data text-[10px] transition-all ${
                      klinePeriod === p.value
                        ? 'border-[oklch(0.55_0.2_265)] text-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.06)]'
                        : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.55_0.02_260)] hover:border-[oklch(0.3_0.03_260)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-pixel text-[6px] text-[oklch(0.55_0.02_260)] block mb-1.5">标的池</label>
              <div className="space-y-1">
                {UNIVERSES.map(u => (
                  <button
                    key={u.value}
                    onClick={() => setUniverse(u.value)}
                    className={`w-full px-3 py-2 border-2 text-left font-display text-xs transition-all ${
                      universe === u.value
                        ? 'border-[oklch(0.55_0.2_265)] text-[oklch(0.88_0.01_260)] bg-[oklch(0.55_0.2_265_/_0.06)]'
                        : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.55_0.02_260)] hover:border-[oklch(0.3_0.03_260)]'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-pixel text-[6px] text-[oklch(0.55_0.02_260)] block mb-1.5">回测区间</label>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={backtestStart}
                  onChange={(e) => setBacktestStart(e.target.value)}
                  className="flex-1 bg-[oklch(0.1_0.015_260)] border-2 border-[oklch(0.25_0.03_260)] px-2 py-1.5 font-mono-data text-[10px] text-[oklch(0.88_0.01_260)] focus:border-[oklch(0.55_0.2_265)] focus:outline-none"
                />
                <span className="font-display text-xs text-[oklch(0.45_0.02_260)]">至</span>
                <input
                  type="month"
                  value={backtestEnd}
                  onChange={(e) => setBacktestEnd(e.target.value)}
                  className="flex-1 bg-[oklch(0.1_0.015_260)] border-2 border-[oklch(0.25_0.03_260)] px-2 py-1.5 font-mono-data text-[10px] text-[oklch(0.88_0.01_260)] focus:border-[oklch(0.55_0.2_265)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cost summary & Start button */}
        {selectedResearcherId && (
          <div className="animate-fade-in-up space-y-3">
            <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3 flex items-center justify-between">
              <span className="font-display text-xs text-[oklch(0.6_0.02_260)]">预估消耗</span>
              <span className="font-mono-data text-sm font-bold text-[oklch(0.82_0.15_85)]">
                🪙 ~{cost.toLocaleString()} Token
              </span>
            </div>

            <button
              onClick={handleStart}
              disabled={state.credits < cost || (taskType === 'factor_mining' && !factorDescription.trim())}
              className="w-full font-pixel text-[9px] py-3.5 bg-[oklch(0.72_0.19_155)] text-white border-3 border-[oklch(0.55_0.19_155)] hover:bg-[oklch(0.77_0.19_155)] transition-all active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                boxShadow: 'inset -3px -3px 0 oklch(0.5 0.19 155), inset 3px 3px 0 oklch(0.82 0.12 155)',
              }}
            >
              🚀 开始研究
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
