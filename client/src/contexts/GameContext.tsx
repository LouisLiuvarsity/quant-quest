import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import {
  GAME_EVENT_LIBRARY,
  QUARTER_OBJECTIVE_LIBRARY,
  AVAILABLE_SKINS,
  EXPERIMENT_PACK_LIBRARY,
  MULTI_FACTOR_STEPS,
  SINGLE_FACTOR_STEPS,
  TOKEN_COSTS,
  type ActiveGameEvent,
  type ExperimentPackType,
  type FactorCard,
  type GameNotification,
  type GameState,
  type InsightViewMode,
  type MultiFactorConfig,
  type LearningCard,
  type QuarterObjective,
  type QuarterScoreBreakdown,
  type QuarterTargetMix,
  type Thesis,
  type ThesisGoal,
  type ThesisStatus,
  type ThesisType,
  type PlayMode,
  type PortfolioCard,
  type ProjectConfig,
  type Researcher,
  type ResearchReport,
  type ResearchTask,
  type ResumeDecisionInput,
  type SingleFactorConfig,
  type Strategy,
  type TaskDecisionRecord,
  type TaskLog,
  type TaskType,
} from './game/schema';
import { getDecisionOptions, summarizeDecisionImpact } from './game/decisions';
import {
  buildBlendPlanKey,
  clampCostMultiplier,
  clampNumber,
  clampScore,
  createRunId,
  generateReport,
  generateStepLogs,
  simulateFactorCard,
  simulatePortfolioCard,
  type TaskPerformanceProfile,
} from './game/engine';
import { INITIAL_STATE } from './game/initialState';

export * from './game/schema';
export { getDecisionOptions } from './game/decisions';

type ThesisFinalOutcome = Extract<ThesisStatus, 'passed' | 'failed' | 'parked' | 'adopted' | 'hold' | 'rejected'>;
type QuarterAdvanceReason = 'manual' | 'task_complete' | 'review';

interface CreateThesisInput {
  type: ThesisType;
  hypothesis: string;
  goal: ThesisGoal;
  selectedFactorIds?: string[];
}

const DEFAULT_PACKS_BY_TYPE: Record<ThesisType, ExperimentPackType[]> = {
  factor: ['parameter_sweep', 'robustness_check'],
  portfolio: ['robustness_check', 'cost_shock'],
};

const EMPTY_QUARTER_SCORE: QuarterScoreBreakdown = {
  return: 50,
  drawdown: 50,
  robustness: 50,
  trust: 50,
  total: 50,
};

const nowCN = () => new Date().toLocaleString('zh-CN');

const inferFactorTypeFromHypothesis = (hypothesis: string): string => {
  const normalized = hypothesis.toLowerCase();
  if (normalized.includes('均值') || normalized.includes('回归') || normalized.includes('反转')) return 'mean_revert';
  if (normalized.includes('波动')) return 'volatility';
  if (normalized.includes('成交量') || normalized.includes('量价') || normalized.includes('资金流')) return 'volume';
  if (normalized.includes('趋势') || normalized.includes('突破')) return 'trend';
  return 'momentum';
};

const buildThesisTitle = (type: ThesisType, hypothesis: string) => {
  const prefix = type === 'factor' ? '单因子命题' : '组合命题';
  const core = hypothesis.replace(/\s+/g, ' ').trim().slice(0, 24) || '未命名';
  return `${prefix} · ${core}`;
};

const calcPackBudget = (packs: ExperimentPackType[]) => (
  packs.reduce((sum, pack) => sum + (EXPERIMENT_PACK_LIBRARY[pack]?.cost ?? 0), 0)
);

const pickQuarterObjective = (quarterNo: number): QuarterObjective => (
  QUARTER_OBJECTIVE_LIBRARY[(quarterNo - 1) % QUARTER_OBJECTIVE_LIBRARY.length]
);

const computeQuarterScore = (
  mix: QuarterTargetMix,
  input: {
    totalPnl: number;
    liveStrategies: number;
    passedFactors: number;
    adoptedPortfolios: number;
    passedTheses: number;
    adoptedTheses: number;
    oosConsumed: number;
    trustScore: number;
  },
): QuarterScoreBreakdown => {
  const returnScore = Math.round(clampNumber(
    42 + input.totalPnl / 260 + input.liveStrategies * 6 + input.adoptedPortfolios * 11,
    0,
    100,
  ));
  const drawdownScore = Math.round(clampNumber(
    36 + input.trustScore * 0.58 - Math.max(0, input.liveStrategies - 3) * 4,
    0,
    100,
  ));
  const robustnessScore = Math.round(clampNumber(
    34 + input.passedFactors * 4 + input.passedTheses * 5 + input.adoptedTheses * 8 + input.oosConsumed * 3,
    0,
    100,
  ));
  const trustScore = Math.round(clampNumber(input.trustScore, 0, 100));
  const total = Math.round(
    (returnScore * mix.return + drawdownScore * mix.drawdown + robustnessScore * mix.robustness + trustScore * mix.trust) / 100,
  );
  return {
    return: returnScore,
    drawdown: drawdownScore,
    robustness: robustnessScore,
    trust: trustScore,
    total: Math.round(clampNumber(total, 0, 100)),
  };
};

const buildActiveEvent = (template: typeof GAME_EVENT_LIBRARY[number], dayInQuarter: number): ActiveGameEvent => ({
  ...template,
  startedAt: nowCN(),
  startDay: dayInQuarter,
  remainingDays: template.durationDays,
});

const buildLearningCard = (
  thesis: Thesis,
  outcome: ThesisFinalOutcome,
  reason: string,
): LearningCard => {
  const strongestEvidence = [...thesis.evidenceNodes]
    .sort((a, b) => b.confidence - a.confidence)[0];
  const keyEvidence = strongestEvidence
    ? `${strongestEvidence.label}（置信度 ${Math.round(strongestEvidence.confidence * 100)}%）`
    : '暂无关键证据，请补充一次可解释实验。';

  const lessonByOutcome: Record<ThesisFinalOutcome, string> = {
    passed: 'VAL 证据充分时再归档通过，可显著减少伪阳性。',
    adopted: '组合在 OOS 终审通过后再上线，可信度更高。',
    hold: '证据不充分时先观察，比贸然上线更稳健。',
    parked: '资源紧张时暂缓并不丢分，优先级管理也是能力。',
    failed: '失败命题能帮助你识别过拟合模式，属于有效学习。',
    rejected: '拒绝不达标组合可避免实盘回撤扩散。',
  };

  const avoidByOutcome: Record<ThesisFinalOutcome, string> = {
    passed: '避免只看收益率，忽视回撤和成本可行性。',
    adopted: '避免 OOS 之后再回调参数，破坏可审计性。',
    hold: '避免“有点好就上线”，先补反例和扰动检验。',
    parked: '避免长期搁置，建议设置下一次复盘触发条件。',
    failed: '避免把失败当成浪费，必须记录失效场景。',
    rejected: '避免重复提交同类无增益组合，先修正结构。',
  };

  const nextActionFactor = outcome === 'failed' || outcome === 'parked'
    ? '重写单因子命题，优先补反例验证包。'
    : '把通过因子推进到组合命题池，验证组合增益。';
  const nextActionPortfolio = outcome === 'rejected' || outcome === 'hold'
    ? '回到组合命题阶段，调整去冗余与权重方案后再申请终审。'
    : '将采纳组合提交到策略工坊，先模拟上线观察。';

  return {
    id: `lc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    thesisId: thesis.id,
    thesisType: thesis.type,
    thesisTitle: thesis.title,
    outcome,
    hypothesis: thesis.hypothesis,
    keyEvidence,
    lesson: lessonByOutcome[outcome],
    avoidNextTime: avoidByOutcome[outcome],
    recommendedNextAction: thesis.type === 'factor' ? nextActionFactor : nextActionPortfolio,
    createdAt: nowCN(),
    reviewed: false,
  };
};

const createFactorEvidenceNode = (card: FactorCard, runId: string) => ({
  id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  side: card.status === 'passed' ? 'support' as const : 'oppose' as const,
  label: card.status === 'passed' ? 'VAL 验证通过，具备复用价值' : 'VAL 指标不达标，需要重构命题',
  metricSnapshot: {
    sharpe: Number(card.valPerformance.medianSharpe.toFixed(2)),
    winRate: Number((card.valPerformance.winRate * 100).toFixed(1)),
    maxDrawdown: Number((card.valPerformance.medianMaxDrawdown * 100).toFixed(1)),
    costSharpe1x: Number(card.sensitivity.costSharpe1x.toFixed(2)),
  },
  confidence: card.status === 'passed' ? 0.72 : 0.38,
  sourceRunId: runId,
  createdAt: nowCN(),
});

const createPortfolioEvidenceNode = (card: PortfolioCard, runId: string) => ({
  id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  side: card.status === 'adopted' ? 'support' as const : 'oppose' as const,
  label: card.status === 'adopted' ? 'OOS 审判通过，可进入部署评审' : 'OOS 审判未通过，建议回到命题重构',
  metricSnapshot: {
    oosSharpe: Number(card.oosPerformance.medianSharpe.toFixed(2)),
    bestSingleSharpe: Number(card.bestSingleSharpe.toFixed(2)),
    sharpeImprovement: Number(card.sharpeImprovement.toFixed(2)),
    maxDrawdown: Number((card.oosPerformance.medianMaxDrawdown * 100).toFixed(1)),
  },
  confidence: card.status === 'adopted' ? 0.76 : 0.41,
  sourceRunId: runId,
  createdAt: nowCN(),
});

// ============ Context ============
interface GameContextType {
  state: GameState;
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  selectedResearcher: Researcher | null;
  setSelectedResearcher: (r: Researcher | null) => void;
  selectedReport: ResearchReport | null;
  setSelectedReport: (r: ResearchReport | null) => void;
  selectedFactorCard: FactorCard | null;
  setSelectedFactorCard: (f: FactorCard | null) => void;
  selectedPortfolioCard: PortfolioCard | null;
  setSelectedPortfolioCard: (p: PortfolioCard | null) => void;
  viewingTask: ResearchTask | null;
  setViewingTask: (t: ResearchTask | null) => void;
  hireResearcher: (skinIndex: number, role: string) => void;
  changeRole: (researcherId: string, role: string) => void;
  setProjectConfig: (config: ProjectConfig) => void;
  setPlayMode: (mode: PlayMode) => void;
  setInsightView: (mode: InsightViewMode) => void;
  createThesis: (input: CreateThesisInput) => void;
  planThesis: (thesisId: string, packs?: ExperimentPackType[]) => void;
  launchThesis: (thesisId: string, researcherId: string) => void;
  reviewThesis: (thesisId: string, outcome: ThesisFinalOutcome, reason: string) => void;
  markLearningCardReviewed: (cardId: string) => void;
  advanceQuarterDay: (reason?: QuarterAdvanceReason) => void;
  startSingleFactorTask: (researcherId: string, config: SingleFactorConfig, thesisId?: string) => void;
  startMultiFactorTask: (researcherId: string, config: MultiFactorConfig, thesisId?: string) => void;
  resumeTask: (taskId: string, decision?: ResumeDecisionInput) => void;
  deployStrategy: (sourceType: 'factor' | 'portfolio', sourceId: string, name: string) => void;
  goLive: (strategyId: string) => void;
  upgradePlan: () => void;
  showIntro: boolean;
  setShowIntro: (show: boolean) => void;
  setCompanyName: (name: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [selectedFactorCard, setSelectedFactorCard] = useState<FactorCard | null>(null);
  const [selectedPortfolioCard, setSelectedPortfolioCard] = useState<PortfolioCard | null>(null);
  const [viewingTask, setViewingTask] = useState<ResearchTask | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const taskTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      taskTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const setCompanyName = useCallback((name: string) => {
    setState(prev => {
      const newRankings = prev.rankings.map(r =>
        r.name === prev.companyName ? { ...r, name } : r
      );
      return { ...prev, companyName: name, rankings: newRankings };
    });
  }, []);

  const addNotification = useCallback((type: GameNotification['type'], title: string, message: string) => {
    const notif: GameNotification = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, title, message,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setState(prev => ({
      ...prev,
      notifications: [notif, ...prev.notifications].slice(0, 50),
    }));
  }, []);

  const hireResearcher = useCallback((skinIndex: number, role: string) => {
    const skin = AVAILABLE_SKINS[skinIndex];
    if (!skin) return;
    const hireCost = 200000;
    setState(prev => {
      if (prev.credits < hireCost) return prev;
      if (prev.researchers.length >= 6) return prev;
      if (prev.researchers.some(r => r.skin.name === skin.name)) return prev;
      const newResearcher: Researcher = {
        id: `r-${Date.now()}`,
        skin,
        role,
        status: 'idle',
        progress: 0,
        totalTokensUsed: 0,
        tasksCompleted: 0,
      };
      return { ...prev, researchers: [...prev.researchers, newResearcher], credits: prev.credits - hireCost };
    });
    addNotification('success', '新员工入职', `${skin.name} 已加入团队，分工：${role}`);
  }, [addNotification]);

  const changeRole = useCallback((researcherId: string, role: string) => {
    setState(prev => ({
      ...prev,
      researchers: prev.researchers.map(r =>
        r.id === researcherId && r.status === 'idle' ? { ...r, role } : r
      ),
    }));
  }, []);

  const setProjectConfig = useCallback((config: ProjectConfig) => {
    setState(prev => ({ ...prev, projectConfig: config }));
    addNotification('success', '项目配置完成', `K线: ${config.barSize}, 资产池: ${config.universeFilter}`);
  }, [addNotification]);

  const setPlayMode = useCallback((mode: PlayMode) => {
    setState(prev => ({ ...prev, playMode: mode }));
  }, []);

  const setInsightView = useCallback((mode: InsightViewMode) => {
    setState(prev => ({ ...prev, insightView: mode }));
  }, []);

  const advanceQuarterDay = useCallback((reason: QuarterAdvanceReason = 'manual') => {
    const queuedNotifications: Array<{ type: GameNotification['type']; title: string; message: string }> = [];

    setState(prev => {
      let resources = prev.resources;
      let credits = prev.credits;
      let totalCredits = prev.totalCredits;
      let strategies = prev.strategies;
      const hasLiveStrategies = prev.strategies.some(strategy => strategy.status === 'live');
      const marketBias = prev.quarter.activeEvent?.effect.marketPnlBias ?? 0;

      if (hasLiveStrategies) {
        const objectiveBias = (prev.quarter.objective.targetMix.return - prev.quarter.objective.targetMix.drawdown) / 100;
        strategies = prev.strategies.map(strategy => {
          if (strategy.status !== 'live' || !strategy.liveResult) return strategy;
          const baseNoise = (Math.random() - 0.46) * 120;
          const drift = objectiveBias * 12 + marketBias * 45;
          const trustAmplifier = 1 + ((prev.resources.trustScore - 50) / 260);
          const todayPnl = Math.round((baseNoise + drift) * trustAmplifier);
          const pnl = Number((strategy.liveResult.pnl + todayPnl).toFixed(2));
          return {
            ...strategy,
            liveResult: {
              ...strategy.liveResult,
              todayPnl,
              pnl,
              pnlPercent: Number((pnl / 1000).toFixed(4)),
              runningDays: strategy.liveResult.runningDays + 1,
            },
          };
        });
      }

      const totalPnl = hasLiveStrategies
        ? Number(strategies
          .filter(strategy => strategy.status === 'live')
          .reduce((sum, strategy) => sum + (strategy.liveResult?.pnl ?? 0), 0)
          .toFixed(2))
        : prev.totalPnl;

      if (prev.quarter.activeEvent) {
        resources = {
          ...resources,
          researchBudget: Math.max(0, resources.researchBudget + prev.quarter.activeEvent.effect.dailyBudgetDelta),
          trustScore: clampScore(resources.trustScore + prev.quarter.activeEvent.effect.dailyTrustDelta),
        };
      }

      let dayInQuarter = prev.quarter.dayInQuarter + 1;
      let activeEvent = prev.quarter.activeEvent ? { ...prev.quarter.activeEvent } : null;
      if (activeEvent) {
        activeEvent.remainingDays -= 1;
        if (activeEvent.remainingDays <= 0) {
          queuedNotifications.push({
            type: 'info',
            title: '市场事件结束',
            message: `${activeEvent.title} 已结束，市场恢复常态波动。`,
          });
          activeEvent = null;
        }
      }

      if (!activeEvent && dayInQuarter >= 4 && dayInQuarter % 4 === 0 && Math.random() < 0.36) {
        const template = GAME_EVENT_LIBRARY[Math.floor(Math.random() * GAME_EVENT_LIBRARY.length)];
        activeEvent = buildActiveEvent(template, dayInQuarter);
        queuedNotifications.push({
          type: template.severity === 'high' ? 'warning' : 'info',
          title: '市场事件触发',
          message: `${template.title}（持续 ${template.durationDays} 天）：${template.description}`,
        });
      }

      const liveStrategies = strategies.filter(strategy => strategy.status === 'live').length;
      const passedFactors = prev.factorCards.filter(card => card.status === 'passed').length;
      const adoptedPortfolios = prev.portfolioCards.filter(card => card.status === 'adopted').length;
      const passedTheses = prev.theses.filter(thesis => thesis.status === 'passed').length;
      const adoptedTheses = prev.theses.filter(thesis => thesis.status === 'adopted').length;
      const oosConsumed = Object.keys(prev.oosRegistry).length;

      const currentScore = computeQuarterScore(prev.quarter.objective.targetMix, {
        totalPnl,
        liveStrategies,
        passedFactors,
        adoptedPortfolios,
        passedTheses,
        adoptedTheses,
        oosConsumed,
        trustScore: resources.trustScore,
      });

      let quarter = {
        ...prev.quarter,
        dayInQuarter,
        currentScore,
        activeEvent,
      };

      if (dayInQuarter > prev.quarter.totalDays) {
        const score = currentScore;
        const result: 'great' | 'pass' | 'fail' = score.total >= 78 ? 'great' : score.total >= 62 ? 'pass' : 'fail';
        let budgetDelta = 0;
        let trustDelta = 0;
        let oosDelta = 0;
        let creditsDelta = 0;
        if (result === 'great') {
          budgetDelta = 220000;
          trustDelta = 6;
          oosDelta = 1;
          creditsDelta = 160000;
        } else if (result === 'pass') {
          budgetDelta = 120000;
          trustDelta = 2;
          oosDelta = 0;
          creditsDelta = 80000;
        } else {
          budgetDelta = -50000;
          trustDelta = -6;
          oosDelta = 0;
          creditsDelta = -60000;
        }

        resources = {
          ...resources,
          researchBudget: Math.max(0, resources.researchBudget + budgetDelta),
          trustScore: clampScore(resources.trustScore + trustDelta),
          oosTickets: Math.max(0, resources.oosTickets + oosDelta),
        };
        credits = Math.max(0, credits + creditsDelta);
        totalCredits = Math.max(totalCredits, credits);

        queuedNotifications.push({
          type: result === 'fail' ? 'warning' : 'success',
          title: `Q${prev.quarter.quarterNo} 季度结算`,
          message: `得分 ${score.total}（收益${score.return}/回撤${score.drawdown}/稳健${score.robustness}/信任${score.trust}）`,
        });

        const nextQuarterNo = prev.quarter.quarterNo + 1;
        const nextObjective = pickQuarterObjective(nextQuarterNo);
        queuedNotifications.push({
          type: 'info',
          title: `Q${nextQuarterNo} 新目标`,
          message: `${nextObjective.title}：${nextObjective.summary}`,
        });

        quarter = {
          quarterNo: nextQuarterNo,
          dayInQuarter: 1,
          totalDays: prev.quarter.totalDays,
          objective: nextObjective,
          currentScore: score,
          lastSettlement: score,
          activeEvent: null,
          history: [
            {
              quarterNo: prev.quarter.quarterNo,
              objectiveId: prev.quarter.objective.id,
              objectiveTitle: prev.quarter.objective.title,
              result,
              score,
              settledAt: nowCN(),
            },
            ...prev.quarter.history,
          ].slice(0, 12),
        };
        dayInQuarter = 1;
      }

      if (reason === 'manual') {
        queuedNotifications.push({
          type: 'info',
          title: '运营日推进',
          message: `Q${quarter.quarterNo} Day ${dayInQuarter}/${quarter.totalDays} 已结算。`,
        });
      }

      const playerFactorCount = prev.factorCards.filter(card => card.status === 'passed').length;
      const updatedRankings = [...prev.rankings.map(company => company.name === prev.companyName
        ? {
          ...company,
          totalPnl: Math.round(totalPnl),
          strategies: liveStrategies,
          researchers: prev.researchers.length,
          factorsDiscovered: playerFactorCount,
        }
        : company)]
        .sort((a, b) => b.totalPnl - a.totalPnl)
        .map((company, index) => ({ ...company, rank: index + 1 }));

      return {
        ...prev,
        strategies,
        totalPnl,
        credits,
        totalCredits,
        resources,
        quarter,
        rankings: updatedRankings,
      };
    });

    queuedNotifications.forEach(item => addNotification(item.type, item.title, item.message));
  }, [addNotification]);

  const createThesis = useCallback((input: CreateThesisInput) => {
    const hypothesis = input.hypothesis.trim();
    if (!hypothesis) {
      addNotification('warning', '命题描述为空', '请先写出一句可检验的研究假设。');
      return;
    }
    const timestamp = nowCN();
    const thesis: Thesis = {
      id: `th-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: input.type,
      title: buildThesisTitle(input.type, hypothesis),
      hypothesis,
      goal: input.goal,
      status: 'draft',
      experimentPacks: [],
      plannedBudget: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      selectedFactorIds: input.type === 'portfolio' ? input.selectedFactorIds : undefined,
      evidenceNodes: [],
    };
    setState(prev => ({ ...prev, theses: [thesis, ...prev.theses] }));
    addNotification('success', '命题已创建', `${thesis.title} 已进入草稿池。`);
  }, [addNotification]);

  const planThesis = useCallback((thesisId: string, packs?: ExperimentPackType[]) => {
    const outcome: {
      result: 'ok' | 'not_found' | 'invalid_status' | 'insufficient_budget';
      title: string;
    } = { result: 'not_found', title: '' };
    setState(prev => {
      const thesis = prev.theses.find(item => item.id === thesisId);
      if (!thesis) return prev;
      outcome.title = thesis.title;
      if (!['draft', 'parked'].includes(thesis.status)) {
        outcome.result = 'invalid_status';
        return prev;
      }
      const resolvedPacks = (packs && packs.length > 0 ? packs : DEFAULT_PACKS_BY_TYPE[thesis.type])
        .filter((pack, idx, arr) => arr.indexOf(pack) === idx);
      const costMultiplier = prev.quarter.activeEvent?.effect.planCostMultiplier ?? 1;
      const plannedBudget = Math.round(calcPackBudget(resolvedPacks) * costMultiplier);
      if (plannedBudget <= 0 || prev.resources.researchBudget < plannedBudget) {
        outcome.result = 'insufficient_budget';
        return prev;
      }
      outcome.result = 'ok';
      return {
        ...prev,
        resources: {
          ...prev.resources,
          researchBudget: prev.resources.researchBudget - plannedBudget,
        },
        theses: prev.theses.map(item => item.id === thesisId ? {
          ...item,
          status: 'planned',
          experimentPacks: resolvedPacks,
          plannedBudget,
          updatedAt: nowCN(),
        } : item),
      };
    });

    if (outcome.result === 'ok') {
      addNotification('success', '命题计划已确认', `${outcome.title} 已分配实验包并进入待执行。`);
      return;
    }
    if (outcome.result === 'invalid_status') {
      addNotification('warning', '当前状态不可规划', '仅草稿或暂缓中的命题可重新规划。');
      return;
    }
    if (outcome.result === 'insufficient_budget') {
      addNotification('warning', '研究预算不足', '请先降低实验包规模，或等待预算回收。');
      return;
    }
    addNotification('warning', '命题不存在', '未找到对应命题，请刷新后重试。');
  }, [addNotification]);

  const reviewThesis = useCallback((thesisId: string, outcome: ThesisFinalOutcome, reason: string) => {
    const trustDeltaMap: Record<ThesisFinalOutcome, number> = {
      passed: 4,
      adopted: 6,
      hold: 1,
      parked: 0,
      failed: -4,
      rejected: -5,
    };
    let reviewedTitle = '';
    let applied = false;
    let createdLearningCard = false;
    setState(prev => {
      const thesis = prev.theses.find(item => item.id === thesisId);
      if (!thesis) return prev;
      reviewedTitle = thesis.title;
      if (!['needs_review', 'parked'].includes(thesis.status)) return prev;
      applied = true;
      const learningCard = buildLearningCard(thesis, outcome, reason);
      createdLearningCard = true;
      const trustModifier = prev.quarter.activeEvent?.effect.reviewTrustOffset ?? 0;
      const trustScore = clampScore(prev.resources.trustScore + trustDeltaMap[outcome] + trustModifier);
      const refund = (outcome === 'failed' || outcome === 'rejected')
        ? Math.round(thesis.plannedBudget * 0.12)
        : 0;
      return {
        ...prev,
        resources: {
          ...prev.resources,
          trustScore,
          researchBudget: prev.resources.researchBudget + refund,
        },
        theses: prev.theses.map(item => item.id === thesisId ? {
          ...item,
          status: outcome,
          updatedAt: nowCN(),
          verdict: {
            outcome,
            reason: reason.trim() || '无补充说明',
            timestamp: nowCN(),
          },
        } : item),
        learningCards: [learningCard, ...prev.learningCards].slice(0, 120),
      };
    });
    if (!applied) {
      addNotification('warning', '无法裁决命题', '仅待裁决或暂缓中的命题可执行裁决。');
      return;
    }
    addNotification('info', '命题裁决完成', `${reviewedTitle} → ${outcome.toUpperCase()}`);
    if (createdLearningCard) {
      addNotification('success', '学习卡已生成', '请在学习卡面板复盘这次裁决，沉淀可复用经验。');
    }
    advanceQuarterDay('review');
  }, [addNotification, advanceQuarterDay]);

  const markLearningCardReviewed = useCallback((cardId: string) => {
    setState(prev => ({
      ...prev,
      learningCards: prev.learningCards.map(card => card.id === cardId ? { ...card, reviewed: true } : card),
    }));
  }, []);

  const launchThesis = useCallback((thesisId: string, researcherId: string) => {
    const thesis = state.theses.find(item => item.id === thesisId);
    if (!thesis) {
      addNotification('warning', '命题不存在', '未找到对应命题，请刷新后重试。');
      return;
    }
    if (thesis.status !== 'planned') {
      addNotification('warning', '命题尚未规划', '请先为命题分配实验包并确认预算。');
      return;
    }
    const runningTheses = state.theses.filter(item => ['running', 'oos_locked', 'oos_running'].includes(item.status)).length;
    if (runningTheses >= state.resources.maxConcurrentTheses) {
      addNotification('warning', '并发上限已满', '请先等待一个运行中的命题完成或进入裁决。');
      return;
    }
    const researcher = state.researchers.find(item => item.id === researcherId);
    if (!researcher || researcher.status !== 'idle') {
      addNotification('warning', '研究员不可用', '请选一名空闲研究员执行命题。');
      return;
    }
    if (!state.projectConfig) {
      addNotification('warning', '请先完成项目配置', '命题执行前必须统一项目口径。');
      return;
    }

    if (thesis.type === 'factor') {
      const config: SingleFactorConfig = {
        factorDescription: thesis.hypothesis,
        factorType: inferFactorTypeFromHypothesis(thesis.hypothesis),
        fwdPeriod: thesis.goal === 'return' ? 5 : thesis.goal === 'drawdown' ? 8 : 10,
      };
      startSingleFactorTask(researcherId, config, thesisId);
    } else {
      if (state.projectConfig.splitMode !== 'three_way') {
        addNotification('warning', '需要三段切分', '组合命题执行前必须启用 IS/VAL/OOS 三段切分。');
        return;
      }
      if (state.resources.oosTickets <= 0) {
        addNotification('warning', 'OOS 审判券不足', '当前没有可用的 OOS Ticket，请先完成季度补给。');
        return;
      }
      const selectedFactorIds = (thesis.selectedFactorIds && thesis.selectedFactorIds.length > 0
        ? thesis.selectedFactorIds
        : state.factorCards.filter(card => card.status === 'passed').slice(0, 3).map(card => card.id))
        .filter((id, idx, arr) => arr.indexOf(id) === idx);
      if (selectedFactorIds.length < 2) {
        addNotification('warning', '通过因子不足', '组合命题至少需要 2 个通过因子。');
        return;
      }
      const config: MultiFactorConfig = {
        selectedFactorIds,
        blendMode: thesis.goal === 'return' ? 'position_blend' : 'signal_blend',
        weightMethod: thesis.goal === 'return' ? 'sharpe_weighted' : 'equal',
        correlationThreshold: thesis.goal === 'robustness' ? 0.65 : 0.7,
      };
      startMultiFactorTask(researcherId, config, thesisId);
    }

  }, [state, addNotification]);

  // --- Step-by-step task simulation ---
  const advanceTaskStep = useCallback((taskId: string, researcherId: string, taskType: TaskType) => {
    const steps = taskType === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
    let shouldAdvanceDay = false;

    setState(prev => {
      const task = prev.activeTasks.find(t => t.id === taskId);
      if (!task || task.status !== 'running') return prev;

      const nextStepIndex = task.currentStepIndex + 1;

      // Task completed
      if (nextStepIndex >= steps.length) {
        shouldAdvanceDay = true;
        let newFactorCards = prev.factorCards;
        let newPortfolioCards = prev.portfolioCards;
        let newReports = prev.reports;
        let newTheses = prev.theses;
        let factorCardId: string | undefined;
        let portfolioCardId: string | undefined;
        let reportId: string | undefined;
        const completedAt = new Date().toLocaleString('zh-CN');
        const profile: TaskPerformanceProfile = {
          qualityScore: task.qualityScore,
          riskScore: task.riskScore,
          efficiencyScore: task.efficiencyScore,
          decisionCount: task.decisionHistory.length,
        };

        if (taskType === 'single_factor' && task.singleFactorConfig) {
          const researcher = prev.researchers.find(r => r.id === researcherId);
          const fc = simulateFactorCard(
            task.singleFactorConfig,
            researcher?.skin.name || '',
            researcherId,
            taskId,
            task.runId,
            task.guardLog,
            profile,
          );
          newFactorCards = [...prev.factorCards, fc];
          factorCardId = fc.id;
          const report = generateReport({ ...task, status: 'completed' }, fc);
          reportId = report.id;
          newReports = [report, ...prev.reports];
          if (task.thesisId) {
            const evidenceNode = createFactorEvidenceNode(fc, task.runId);
            newTheses = prev.theses.map(item => item.id === task.thesisId ? {
              ...item,
              status: 'needs_review',
              runId: task.runId,
              linkedTaskId: taskId,
              linkedFactorCardId: fc.id,
              updatedAt: nowCN(),
              evidenceNodes: [...item.evidenceNodes, evidenceNode],
            } : item);
          }
        } else if (taskType === 'multi_factor' && task.multiFactorConfig) {
          const pc = simulatePortfolioCard(
            task.multiFactorConfig,
            prev.factorCards,
            {
              taskId,
              runId: task.runId,
              guardLog: task.guardLog,
              blendPlanKey: task.blendPlanKey || buildBlendPlanKey(task.multiFactorConfig),
              oosConsumedAt: task.oosConsumedAt,
            },
            profile,
          );
          newPortfolioCards = [...prev.portfolioCards, pc];
          portfolioCardId = pc.id;
          const report = generateReport({ ...task, status: 'completed' }, undefined, pc);
          reportId = report.id;
          newReports = [report, ...prev.reports];
          if (task.thesisId) {
            const evidenceNode = createPortfolioEvidenceNode(pc, task.runId);
            newTheses = prev.theses.map(item => item.id === task.thesisId ? {
              ...item,
              status: 'needs_review',
              runId: task.runId,
              linkedTaskId: taskId,
              linkedPortfolioCardId: pc.id,
              updatedAt: nowCN(),
              evidenceNodes: [...item.evidenceNodes, evidenceNode],
            } : item);
          }
        }

        return {
          ...prev,
          researchers: prev.researchers.map(r =>
            r.id === researcherId ? { ...r, status: 'completed', progress: 100, tasksCompleted: r.tasksCompleted + 1, totalTokensUsed: r.totalTokensUsed + task.tokenCost } : r
          ),
          activeTasks: prev.activeTasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed', currentStepIndex: nextStepIndex - 1, overallProgress: 100, completedAt, factorCardId, portfolioCardId, reportId } : t
          ),
          factorCards: newFactorCards,
          portfolioCards: newPortfolioCards,
          reports: newReports,
          credits: prev.credits - task.tokenCost,
          theses: newTheses,
        };
      }

      const nextStep = steps[nextStepIndex];
      const overallProgress = Math.round(((nextStepIndex) / steps.length) * 100);
      let newLogs = [...task.logs, ...generateStepLogs(steps, nextStepIndex)];
      const eventStepMultiplier = prev.quarter.activeEvent?.effect.stepCostMultiplier ?? 1;
      const stepCost = Math.round(TOKEN_COSTS[taskType].perStep * task.stepCostMultiplier * eventStepMultiplier);
      let guardLog = task.guardLog;
      let oosConsumedAt = task.oosConsumedAt;
      let oosRegistry = prev.oosRegistry;
      let resources = prev.resources;
      let theses = prev.theses;

      if (taskType === 'multi_factor' && nextStep.id === 'M8' && task.blendPlanKey) {
        const consumedAt = task.oosConsumedAt || new Date().toISOString();
        oosConsumedAt = consumedAt;
        if (!prev.oosRegistry[task.blendPlanKey]) {
          oosRegistry = { ...prev.oosRegistry, [task.blendPlanKey]: consumedAt };
          if (resources.oosTickets > 0) {
            resources = { ...resources, oosTickets: resources.oosTickets - 1 };
          }
          guardLog = [...task.guardLog, `oos_consumed_at:${consumedAt}`, `blend_plan_key:${task.blendPlanKey}`];
          if (task.thesisId) {
            theses = prev.theses.map(item => item.id === task.thesisId ? {
              ...item,
              status: 'oos_running',
              updatedAt: nowCN(),
            } : item);
          }
          const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          newLogs = [
            ...newLogs,
            {
              timestamp: now,
              stepId: 'M8',
              message: '🔒 OOS 已登记一次性消费：当前组合方案后续不可重跑',
              type: 'warning',
            },
          ];
        }
      }

      // If interactive step, pause
      if (nextStep.isInteractive) {
        if (prev.playMode === 'expert') {
          const options = getDecisionOptions(taskType, nextStep.id);
          const selectedOption = options[1] ?? options[0];
          if (selectedOption) {
            const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const summary = summarizeDecisionImpact(selectedOption.impact);
            const decisionRecord: TaskDecisionRecord = {
              stepId: nextStep.id,
              stepName: nextStep.name,
              optionId: selectedOption.id,
              optionLabel: selectedOption.label,
              summary,
              impact: selectedOption.impact,
              timestamp: now,
            };
            const nextQuality = clampScore(task.qualityScore + selectedOption.impact.quality);
            const nextRisk = clampScore(task.riskScore + selectedOption.impact.risk);
            const nextEfficiency = clampScore(task.efficiencyScore + selectedOption.impact.efficiency);
            const nextMultiplier = clampCostMultiplier(task.stepCostMultiplier + selectedOption.impact.costMultiplier);
            const speedMultiplier = clampNumber(1 - ((nextEfficiency - 50) / 220), 0.62, 1.42);
            const stepDuration = Math.round((700 + Math.random() * 400) * speedMultiplier);
            const timer = setTimeout(() => {
              advanceTaskStep(taskId, researcherId, taskType);
            }, stepDuration);
            taskTimersRef.current.set(`${taskId}-${nextStepIndex}-expert`, timer);

            return {
              ...prev,
              oosRegistry,
              resources,
              theses,
              researchers: prev.researchers.map(r =>
                r.id === researcherId ? { ...r, status: 'researching', progress: overallProgress } : r
              ),
              activeTasks: prev.activeTasks.map(t =>
                t.id === taskId ? {
                  ...t,
                  status: 'running',
                  currentStepIndex: nextStepIndex,
                  overallProgress,
                  progress: 0,
                  logs: [
                    ...newLogs,
                    {
                      timestamp: now,
                      stepId: nextStep.id,
                      message: `🤖 专家模式自动决策: ${selectedOption.label}`,
                      type: 'decision',
                    },
                    {
                      timestamp: now,
                      stepId: nextStep.id,
                      message: `📈 自动决策影响: ${summary}`,
                      type: 'info',
                    },
                  ],
                  tokenCost: t.tokenCost + stepCost,
                  qualityScore: nextQuality,
                  riskScore: nextRisk,
                  efficiencyScore: nextEfficiency,
                  stepCostMultiplier: nextMultiplier,
                  decisionHistory: [...t.decisionHistory, decisionRecord],
                  guardLog,
                  oosConsumedAt,
                } : t
              ),
            };
          }
        }

        return {
          ...prev,
          oosRegistry,
          resources,
          theses,
          researchers: prev.researchers.map(r =>
            r.id === researcherId ? { ...r, status: 'waiting', progress: overallProgress } : r
          ),
          activeTasks: prev.activeTasks.map(t =>
            t.id === taskId ? {
              ...t,
              status: 'paused',
              currentStepIndex: nextStepIndex,
              overallProgress,
              progress: 0,
              logs: newLogs,
              tokenCost: t.tokenCost + stepCost,
              guardLog,
              oosConsumedAt,
            } : t
          ),
        };
      }

      // Auto-advance: schedule next step
      const speedMultiplier = clampNumber(1 - ((task.efficiencyScore - 50) / 220), 0.62, 1.42);
      const stepDuration = Math.round((900 + Math.random() * 1200) * speedMultiplier);
      const timer = setTimeout(() => {
        advanceTaskStep(taskId, researcherId, taskType);
      }, stepDuration);
      taskTimersRef.current.set(`${taskId}-${nextStepIndex}`, timer);

      return {
        ...prev,
        oosRegistry,
        resources,
        theses,
        activeTasks: prev.activeTasks.map(t =>
          t.id === taskId ? {
            ...t,
            currentStepIndex: nextStepIndex,
            overallProgress,
            progress: 0,
            logs: newLogs,
            tokenCost: t.tokenCost + stepCost,
            guardLog,
            oosConsumedAt,
          } : t
        ),
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, progress: overallProgress } : r
        ),
      };
    });
    if (shouldAdvanceDay) {
      setTimeout(() => advanceQuarterDay('task_complete'), 0);
    }
  }, [advanceQuarterDay]);

  const startSingleFactorTask = useCallback((researcherId: string, config: SingleFactorConfig, thesisId?: string) => {
    if (!state.projectConfig) {
      addNotification('warning', '请先完成项目配置', '无论新手或专业模式，发起研究前都必须先完成项目配置。');
      return;
    }

    const taskId = `task-${Date.now()}`;
    const runId = createRunId();
    const steps = SINGLE_FACTOR_STEPS;

    // S0 is global project config and is always completed first.
    const startStep = 1;
    const isFirstStepInteractive = steps[startStep]?.isInteractive ?? false;
    const initialLogs = generateStepLogs(steps, startStep);
    const initialOverallProgress = Math.round((startStep / steps.length) * 100);

    const task: ResearchTask = {
      id: taskId,
      runId,
      type: 'single_factor',
      researcherId,
      status: isFirstStepInteractive ? 'paused' : 'running',
      currentStepIndex: startStep,
      totalSteps: steps.length,
      progress: 0,
      overallProgress: initialOverallProgress,
      startedAt: new Date().toLocaleString('zh-CN'),
      tokenCost: TOKEN_COSTS.single_factor.base,
      logs: initialLogs,
      qualityScore: 50,
      riskScore: 50,
      efficiencyScore: 50,
      stepCostMultiplier: 1,
      decisionHistory: [],
      guardLog: ['project_config_locked', 'oos_reserved_for_multi'],
      singleFactorConfig: config,
      thesisId,
    };

    setState(prev => {
      const researcher = prev.researchers.find(r => r.id === researcherId);
      if (!researcher || researcher.status !== 'idle') return prev;
      if (prev.credits < TOKEN_COSTS.single_factor.base) return prev;
      if (!prev.projectConfig) return prev;

      return {
        ...prev,
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, status: isFirstStepInteractive ? 'waiting' : 'researching', currentTask: task, progress: initialOverallProgress } : r
        ),
        activeTasks: [...prev.activeTasks, task],
        theses: thesisId
          ? prev.theses.map(item => item.id === thesisId ? {
            ...item,
            status: 'running',
            linkedTaskId: taskId,
            runId,
            updatedAt: nowCN(),
          } : item)
          : prev.theses,
      };
    });

    if (!isFirstStepInteractive) {
      const timer = setTimeout(() => advanceTaskStep(taskId, researcherId, 'single_factor'), 1000);
      taskTimersRef.current.set(`${taskId}-start`, timer);
    }

    addNotification('info', '因子研究启动', `开始 ${steps.length} 步单因子工作流`);
  }, [state.projectConfig, advanceTaskStep, addNotification]);

  const startMultiFactorTask = useCallback((researcherId: string, config: MultiFactorConfig, thesisId?: string) => {
    if (!state.projectConfig) {
      addNotification('warning', '请先完成项目配置', '无论新手或专业模式，发起研究前都必须先完成项目配置。');
      return;
    }
    if (state.projectConfig.splitMode !== 'three_way') {
      addNotification('warning', '需要三段切分', '多因子流程必须保留 IS/VAL/OOS 三段切分，当前配置不可启动。');
      return;
    }
    if (state.resources.oosTickets <= 0) {
      addNotification('warning', 'OOS 审判券不足', '当前没有可用 OOS Ticket，请先补充资源后再发起。');
      return;
    }
    const blendPlanKey = buildBlendPlanKey(config);
    if (state.oosRegistry[blendPlanKey]) {
      addNotification('warning', 'OOS 已消费', '该组合方案已完成 OOS 终评。请调整因子或权重后再发起新任务。');
      return;
    }
    if (state.activeTasks.some(task => task.type === 'multi_factor' && task.blendPlanKey === blendPlanKey && task.status !== 'completed')) {
      addNotification('warning', '方案进行中', '当前组合方案已有进行中的任务，请先等待其结束。');
      return;
    }

    const taskId = `task-${Date.now()}`;
    const runId = createRunId();
    const steps = MULTI_FACTOR_STEPS;
    const initialLogs = generateStepLogs(steps, 0);

    const task: ResearchTask = {
      id: taskId,
      runId,
      type: 'multi_factor',
      researcherId,
      status: 'running',
      currentStepIndex: 0,
      totalSteps: steps.length,
      progress: 0,
      overallProgress: 0,
      startedAt: new Date().toLocaleString('zh-CN'),
      tokenCost: TOKEN_COSTS.multi_factor.base,
      logs: initialLogs,
      qualityScore: 50,
      riskScore: 50,
      efficiencyScore: 50,
      stepCostMultiplier: 1,
      decisionHistory: [],
      guardLog: ['project_config_locked', 'three_way_split_confirmed', 'oos_not_consumed'],
      blendPlanKey,
      multiFactorConfig: config,
      thesisId,
    };

    setState(prev => {
      const researcher = prev.researchers.find(r => r.id === researcherId);
      if (!researcher || researcher.status !== 'idle') return prev;
      if (prev.credits < TOKEN_COSTS.multi_factor.base) return prev;
      if (!prev.projectConfig) return prev;
      if (prev.projectConfig.splitMode !== 'three_way') return prev;
      if (prev.resources.oosTickets <= 0) return prev;
      if (prev.oosRegistry[blendPlanKey]) return prev;
      if (prev.activeTasks.some(task => task.type === 'multi_factor' && task.blendPlanKey === blendPlanKey && task.status !== 'completed')) return prev;

      return {
        ...prev,
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, status: 'researching', currentTask: task, progress: 0 } : r
        ),
        activeTasks: [...prev.activeTasks, task],
        theses: thesisId
          ? prev.theses.map(item => item.id === thesisId ? {
            ...item,
            status: 'oos_locked',
            linkedTaskId: taskId,
            runId,
            updatedAt: nowCN(),
          } : item)
          : prev.theses,
      };
    });

    const timer = setTimeout(() => advanceTaskStep(taskId, researcherId, 'multi_factor'), 1000);
    taskTimersRef.current.set(`${taskId}-start`, timer);

    addNotification('info', '多因子合成启动', `开始 ${steps.length} 步多因子合成工作流`);
  }, [state.projectConfig, state.oosRegistry, state.activeTasks, state.resources.oosTickets, advanceTaskStep, addNotification]);

  const resumeTask = useCallback((taskId: string, decision?: ResumeDecisionInput) => {
    setState(prev => {
      const task = prev.activeTasks.find(t => t.id === taskId);
      if (!task || task.status !== 'paused') return prev;

      const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
      const currentStep = steps[task.currentStepIndex];
      if (!currentStep) return prev;
      const options = getDecisionOptions(task.type, currentStep.id);
      const fallbackOption = options[1] ?? options[0];
      const selectedOption = options.find(option => option.id === decision?.optionId) ?? fallbackOption;
      if (!selectedOption) return prev;

      const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const summary = summarizeDecisionImpact(selectedOption.impact);
      const decisionRecord: TaskDecisionRecord = {
        stepId: currentStep.id,
        stepName: currentStep.name,
        optionId: selectedOption.id,
        optionLabel: selectedOption.label,
        summary,
        impact: selectedOption.impact,
        timestamp: now,
      };
      const newLogs: TaskLog[] = [
        ...task.logs,
        {
          timestamp: now,
          stepId: currentStep.id,
          message: `🧠 CEO选择: ${selectedOption.label} | ${selectedOption.description}`,
          type: 'decision',
        },
        {
          timestamp: now,
          stepId: currentStep.id,
          message: `📈 决策影响: ${summary}`,
          type: 'info',
        },
        {
          timestamp: now,
          stepId: currentStep.id,
          message: '✅ CEO 已确认，继续执行...',
          type: 'success',
        },
      ];

      const nextQuality = clampScore(task.qualityScore + selectedOption.impact.quality);
      const nextRisk = clampScore(task.riskScore + selectedOption.impact.risk);
      const nextEfficiency = clampScore(task.efficiencyScore + selectedOption.impact.efficiency);
      const nextMultiplier = clampCostMultiplier(task.stepCostMultiplier + selectedOption.impact.costMultiplier);

      return {
        ...prev,
        activeTasks: prev.activeTasks.map(t =>
          t.id === taskId ? {
            ...t,
            status: 'running',
            logs: newLogs,
            qualityScore: nextQuality,
            riskScore: nextRisk,
            efficiencyScore: nextEfficiency,
            stepCostMultiplier: nextMultiplier,
            decisionHistory: [...t.decisionHistory, decisionRecord],
          } : t
        ),
        researchers: prev.researchers.map(r =>
          r.id === task.researcherId ? { ...r, status: 'researching' } : r
        ),
      };
    });

    // Schedule next step advancement
    const task = state.activeTasks.find(t => t.id === taskId);
    if (task && task.status === 'paused') {
      const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
      const step = steps[task.currentStepIndex];
      const options = step ? getDecisionOptions(task.type, step.id) : [];
      const selectedOption = options.find(option => option.id === decision?.optionId) ?? options[1] ?? options[0];
      const projectedEfficiency = selectedOption ? clampScore(task.efficiencyScore + selectedOption.impact.efficiency) : task.efficiencyScore;
      const speedMultiplier = clampNumber(1 - ((projectedEfficiency - 50) / 220), 0.62, 1.42);
      const stepDuration = Math.round((700 + Math.random() * 400) * speedMultiplier);
      const timer = setTimeout(() => advanceTaskStep(taskId, task.researcherId, task.type), stepDuration);
      taskTimersRef.current.set(`${taskId}-resume`, timer);
    }
  }, [state.activeTasks, advanceTaskStep]);

  const deployStrategy = useCallback((sourceType: 'factor' | 'portfolio', sourceId: string, name: string) => {
    const strategy: Strategy = {
      id: `strat-${Date.now()}`,
      name,
      sourceType,
      sourceId,
      status: 'draft',
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    setState(prev => ({ ...prev, strategies: [...prev.strategies, strategy] }));
    addNotification('info', '策略已创建', `${name} 已添加到策略列表`);
  }, [addNotification]);

  const goLive = useCallback((strategyId: string) => {
    setState(prev => {
      const liveCount = prev.strategies.filter(s => s.status === 'live').length;
      if (liveCount >= prev.maxLiveStrategies) return prev;
      return {
        ...prev,
        strategies: prev.strategies.map(s =>
          s.id === strategyId ? { ...s, status: 'live', liveResult: { pnl: 0, pnlPercent: 0, runningDays: 0, todayPnl: 0 } } : s
        ),
      };
    });
    addNotification('info', '策略上线', '策略已开始实盘模拟运行');
  }, [addNotification]);

  const upgradePlan = useCallback(() => {
    setState(prev => ({
      ...prev,
      plan: 'pro',
      maxLiveStrategies: 10,
      credits: prev.credits + 500000,
    }));
    addNotification('success', '升级成功', '已升级至Pro版本！配资1000U，策略上限提升至10个');
  }, [addNotification]);

  return (
    <GameContext.Provider value={{
      state,
      activePanel,
      setActivePanel,
      selectedResearcher,
      setSelectedResearcher,
      selectedReport,
      setSelectedReport,
      selectedFactorCard,
      setSelectedFactorCard,
      selectedPortfolioCard,
      setSelectedPortfolioCard,
      viewingTask,
      setViewingTask,
      hireResearcher,
      changeRole,
      setProjectConfig,
      setPlayMode,
      setInsightView,
      createThesis,
      planThesis,
      launchThesis,
      reviewThesis,
      markLearningCardReviewed,
      advanceQuarterDay,
      startSingleFactorTask,
      startMultiFactorTask,
      resumeTask,
      deployStrategy,
      goLive,
      upgradePlan,
      showIntro,
      setShowIntro,
      setCompanyName,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
