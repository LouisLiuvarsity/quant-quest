/*
 * ResearchPanel - Main research task management
 * Two task types: Single Factor (因子挖掘) and Multi Factor (多因子合成)
 * Shows active tasks with real-time step progression
 * Interactive decision points (🔀) pause for CEO input
 */

import { EXPERIMENT_PACK_LIBRARY, useGame, type ThesisGoal, type ThesisType } from '@/contexts/GameContext';
import { useState } from 'react';
import { MultiFactorSetup } from './research/MultiFactorSetup';
import { ProjectConfigSetup } from './research/ProjectConfigSetup';
import { SingleFactorSetup } from './research/SingleFactorSetup';
import { TaskMonitor } from './research/TaskMonitor';

// --- Main Research Panel ---
export function ResearchPanel() {
  const {
    state,
    setProjectConfig,
    setPlayMode,
    createThesis,
    planThesis,
    launchThesis,
    reviewThesis,
    advanceQuarterDay,
  } = useGame();
  const [view, setView] = useState<'main' | 'config' | 'single_factor' | 'multi_factor'>('main');
  const [selectedResearcherId, setSelectedResearcherId] = useState<string>('');
  const [thesisType, setThesisType] = useState<ThesisType>('factor');
  const [thesisGoal, setThesisGoal] = useState<ThesisGoal>('robustness');
  const [thesisHypothesis, setThesisHypothesis] = useState('');

  const idleResearchers = state.researchers.filter(r => r.status === 'idle');
  const leadIdleResearcher = idleResearchers[0];
  const activeTasks = state.activeTasks.filter(t => t.status !== 'completed');
  const completedTasks = state.activeTasks.filter(t => t.status === 'completed').slice(0, 5);
  const waitingTasks = state.activeTasks.filter(t => t.status === 'paused').length
    + state.theses.filter(item => item.status === 'needs_review').length;
  const passedFactors = state.factorCards.filter(f => f.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(p => p.status === 'adopted').length;
  const runningTheses = state.theses.filter(item => ['running', 'oos_locked', 'oos_running'].includes(item.status)).length;
  const reviewableTheses = state.theses.filter(item => item.status === 'needs_review').length;
  const isGuidedMode = state.playMode === 'guided';
  const hasThreeWaySplit = state.projectConfig?.splitMode === 'three_way';
  const canStartMulti = passedFactors >= 2 && hasThreeWaySplit;
  const quarter = state.quarter;
  const targetMix = quarter.objective.targetMix;
  const activeEvent = quarter.activeEvent;

  const createThesisFromForm = () => {
    const hypothesis = thesisHypothesis.trim();
    if (!hypothesis) return;
    createThesis({
      type: thesisType,
      goal: thesisGoal,
      hypothesis,
      selectedFactorIds: thesisType === 'portfolio'
        ? state.factorCards.filter(card => card.status === 'passed').slice(0, 3).map(card => card.id)
        : undefined,
    });
    setThesisHypothesis('');
  };

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

      <div className="border-2 border-[oklch(0.26_0.03_260)] bg-[oklch(0.1_0.016_260)] p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">📅 季度经营层</p>
            <p className="font-display text-[11px] text-[oklch(0.82_0.02_260)] mt-1">{quarter.objective.title}</p>
            <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)] mt-1 leading-relaxed">{quarter.objective.summary}</p>
          </div>
          <div className="text-right">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">季度进度</p>
            <p className="font-mono-data text-sm text-[oklch(0.72_0.19_155)]">Q{quarter.quarterNo} · {quarter.dayInQuarter}/{quarter.totalDays}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">收益权重</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)]">{targetMix.return}%</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">回撤权重</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)]">{targetMix.drawdown}%</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">稳健权重</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.75_0.12_200)]">{targetMix.robustness}%</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">信任权重</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)]">{targetMix.trust}%</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.015_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">收益</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)]">{quarter.currentScore.return}</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.015_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">回撤</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)]">{quarter.currentScore.drawdown}</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.015_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">稳健</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.75_0.12_200)]">{quarter.currentScore.robustness}</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.015_260)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">信任</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)]">{quarter.currentScore.trust}</p>
          </div>
          <div className="border border-[oklch(0.3_0.03_260)] bg-[oklch(0.82_0.15_85_/_0.08)] p-1.5 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">总分</p>
            <p className="font-mono-data text-[11px] text-[oklch(0.82_0.15_85)]">{quarter.currentScore.total}</p>
          </div>
        </div>

        {activeEvent ? (
          <div className="border border-[oklch(0.63_0.22_25_/_0.4)] bg-[oklch(0.63_0.22_25_/_0.08)] p-2.5">
            <p className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">⚠️ 活动事件：{activeEvent.title}（剩余 {activeEvent.remainingDays} 天）</p>
            <p className="font-display text-[10px] text-[oklch(0.72_0.02_260)] mt-1 leading-relaxed">{activeEvent.description}</p>
          </div>
        ) : (
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2.5">
            <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)]">当前无市场扰动事件，环境平稳。</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => advanceQuarterDay('manual')}
            className="font-pixel text-[7px] px-3 py-2 border border-[oklch(0.75_0.12_200_/_0.55)] text-[oklch(0.75_0.12_200)] bg-[oklch(0.75_0.12_200_/_0.12)] hover:brightness-110 transition-all"
          >
            ⏭ 推进 1 天（经营结算）
          </button>
          {quarter.lastSettlement ? (
            <p className="font-display text-[9px] text-[oklch(0.55_0.02_260)]">
              上季结算：{quarter.lastSettlement.total} 分
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-2 border-[oklch(0.3_0.04_260)] bg-[oklch(0.11_0.016_260)] p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.75_0.12_200)]">🧩 V3 命题工作台</p>
            <p className="font-display text-[10px] text-[oklch(0.62_0.02_260)] mt-1 leading-relaxed">
              用命题驱动研究：先立题，再规划实验，再派单执行，最后做证据裁决。
            </p>
          </div>
          <div className="text-right">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">待裁决命题</p>
            <p className={`font-mono-data text-sm font-bold ${reviewableTheses > 0 ? 'text-[oklch(0.82_0.15_85)]' : 'text-[oklch(0.72_0.19_155)]'}`}>
              {reviewableTheses}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.13_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">研究预算</p>
            <p className="font-mono-data text-sm text-[oklch(0.82_0.15_85)]">🪙 {Math.round(state.resources.researchBudget / 1000)}K</p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.13_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">命题并发</p>
            <p className="font-mono-data text-sm text-[oklch(0.72_0.19_155)]">{runningTheses}/{state.resources.maxConcurrentTheses}</p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.13_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">OOS 审判券</p>
            <p className={`font-mono-data text-sm ${state.resources.oosTickets > 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
              🎟️ {state.resources.oosTickets}
            </p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.13_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">信任分</p>
            <p className="font-mono-data text-sm text-[oklch(0.75_0.12_200)]">{state.resources.trustScore}</p>
          </div>
        </div>

        <div className="border border-[oklch(0.26_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2.5 space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: 'factor', label: '单因子命题' },
              { key: 'portfolio', label: '组合命题' },
            ] as const).map(item => (
              <button
                key={item.key}
                onClick={() => setThesisType(item.key)}
                className={`font-display text-[10px] py-1.5 border transition-all ${
                  thesisType === item.key
                    ? 'border-[oklch(0.72_0.19_155)] text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.12)]'
                    : 'border-[oklch(0.25_0.03_260)] text-[oklch(0.58_0.02_260)]'
                }`}
              >
                {item.label}
              </button>
            ))}
            {([
              { key: 'return', label: '收益' },
              { key: 'drawdown', label: '回撤' },
              { key: 'robustness', label: '稳健' },
            ] as const).map(item => (
              <button
                key={item.key}
                onClick={() => setThesisGoal(item.key)}
                className={`font-display text-[10px] py-1.5 border transition-all ${
                  thesisGoal === item.key
                    ? 'border-[oklch(0.55_0.2_265)] text-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.12)]'
                    : 'border-[oklch(0.25_0.03_260)] text-[oklch(0.58_0.02_260)]'
                }`}
              >
                目标:{item.label}
              </button>
            ))}
          </div>
          <textarea
            value={thesisHypothesis}
            onChange={(e) => setThesisHypothesis(e.target.value)}
            placeholder="写一句可检验的命题，例如：趋势中高成交量突破更容易延续，目标是降低回撤..."
            className="w-full h-16 bg-[oklch(0.11_0.02_260)] border border-[oklch(0.25_0.03_260)] text-[oklch(0.85_0.01_260)] font-display text-[11px] p-2 resize-none focus:border-[oklch(0.72_0.19_155)] focus:outline-none"
          />
          <button
            onClick={createThesisFromForm}
            disabled={!thesisHypothesis.trim()}
            className={`w-full font-pixel text-[7px] py-2 border-2 transition-all ${
              thesisHypothesis.trim()
                ? 'bg-[oklch(0.75_0.12_200_/_0.18)] border-[oklch(0.75_0.12_200)] text-[oklch(0.85_0.06_200)] hover:brightness-110'
                : 'bg-[oklch(0.15_0.02_260)] border-[oklch(0.22_0.025_260)] text-[oklch(0.35_0.02_260)] cursor-not-allowed'
            }`}
          >
            ➕ 创建命题
          </button>
        </div>

        {state.theses.length === 0 ? (
          <div className="border border-dashed border-[oklch(0.26_0.03_260)] p-3 text-center">
            <p className="font-display text-[10px] text-[oklch(0.55_0.02_260)]">暂无命题，先创建第一条研究命题。</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {state.theses.slice(0, 8).map(thesis => {
              const statusColorMap: Record<string, string> = {
                draft: 'text-[oklch(0.75_0.12_200)]',
                planned: 'text-[oklch(0.82_0.15_85)]',
                running: 'text-[oklch(0.72_0.19_155)]',
                oos_locked: 'text-[oklch(0.82_0.15_85)]',
                oos_running: 'text-[oklch(0.63_0.22_25)]',
                needs_review: 'text-[oklch(0.82_0.15_85)]',
                passed: 'text-[oklch(0.72_0.19_155)]',
                adopted: 'text-[oklch(0.72_0.19_155)]',
                hold: 'text-[oklch(0.82_0.15_85)]',
                failed: 'text-[oklch(0.63_0.22_25)]',
                rejected: 'text-[oklch(0.63_0.22_25)]',
                parked: 'text-[oklch(0.58_0.02_260)]',
              };
              const statusColor = statusColorMap[thesis.status] || 'text-[oklch(0.58_0.02_260)]';
              const reviewOptions = thesis.type === 'factor'
                ? ([
                  { key: 'passed' as const, label: '通过' },
                  { key: 'failed' as const, label: '失败' },
                  { key: 'parked' as const, label: '暂缓' },
                ])
                : ([
                  { key: 'adopted' as const, label: '采纳' },
                  { key: 'hold' as const, label: '观察' },
                  { key: 'rejected' as const, label: '拒绝' },
                ]);
              return (
                <div key={thesis.id} className="border border-[oklch(0.25_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-[11px] text-[oklch(0.86_0.01_260)] truncate">{thesis.title}</p>
                    <span className={`font-pixel text-[6px] ${statusColor}`}>{thesis.status}</span>
                  </div>
                  <p className="font-display text-[9px] text-[oklch(0.55_0.02_260)] leading-relaxed">{thesis.hypothesis}</p>
                  <div className="flex flex-wrap gap-1">
                    {thesis.experimentPacks.map(pack => (
                      <span key={pack} className="font-pixel text-[5px] px-1.5 py-1 border border-[oklch(0.28_0.03_260)] text-[oklch(0.72_0.19_155)]">
                        {EXPERIMENT_PACK_LIBRARY[pack].label}
                      </span>
                    ))}
                  </div>
                  {thesis.status === 'draft' || thesis.status === 'parked' ? (
                    <button
                      onClick={() => planThesis(thesis.id)}
                      className="w-full font-pixel text-[6px] py-1.5 border border-[oklch(0.82_0.15_85_/_0.55)] text-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.08)]"
                    >
                      规划实验并扣预算
                    </button>
                  ) : null}
                  {thesis.status === 'planned' ? (
                    <button
                      onClick={() => leadIdleResearcher && launchThesis(thesis.id, leadIdleResearcher.id)}
                      disabled={!leadIdleResearcher}
                      className={`w-full font-pixel text-[6px] py-1.5 border ${
                        leadIdleResearcher
                          ? 'border-[oklch(0.72_0.19_155_/_0.55)] text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.08)]'
                          : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.35_0.02_260)] bg-[oklch(0.15_0.02_260)] cursor-not-allowed'
                      }`}
                    >
                      {leadIdleResearcher ? `派给 ${leadIdleResearcher.skin.name} 执行` : '无空闲研究员'}
                    </button>
                  ) : null}
                  {thesis.status === 'needs_review' ? (
                    <div className="grid grid-cols-3 gap-1">
                      {reviewOptions.map(option => (
                        <button
                          key={option.key}
                          onClick={() => reviewThesis(thesis.id, option.key, `${option.label}：来自命题工作台裁决`)}
                          className="font-pixel text-[6px] py-1 border border-[oklch(0.75_0.12_200_/_0.45)] text-[oklch(0.75_0.12_200)]"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
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
