// Core game domain schema: types and static workflow configs.

export type ResearcherStatus = 'idle' | 'researching' | 'completed' | 'waiting'; // waiting = paused at 🔀 decision point
export type TaskType = 'single_factor' | 'multi_factor';
export type PlanType = 'free' | 'pro';
export type FactorCardStatus = 'passed' | 'failed';
export type PortfolioCardStatus = 'adopted' | 'rejected';
export type InsightViewMode = 'player' | 'pro' | 'audit';
export type ThesisType = 'factor' | 'portfolio';
export type ThesisGoal = 'return' | 'drawdown' | 'robustness';
export type ThesisStatus =
  | 'draft'
  | 'planned'
  | 'running'
  | 'needs_review'
  | 'passed'
  | 'failed'
  | 'parked'
  | 'oos_locked'
  | 'oos_running'
  | 'adopted'
  | 'hold'
  | 'rejected';
export type ExperimentPackType = 'parameter_sweep' | 'robustness_check' | 'cost_shock' | 'counter_example';

export interface EvidenceSnapshot {
  runId: string;
  dataSegments: string[];
  guardLog: string[];
  keyParams: Record<string, string | number>;
  reproducibilityId: string;
}

export interface ThesisEvidenceNode {
  id: string;
  side: 'support' | 'oppose' | 'neutral';
  label: string;
  metricSnapshot: Record<string, string | number>;
  confidence: number; // 0~1
  sourceRunId?: string;
  createdAt: string;
}

export interface ThesisVerdict {
  outcome: Extract<ThesisStatus, 'passed' | 'failed' | 'parked' | 'adopted' | 'hold' | 'rejected'>;
  reason: string;
  timestamp: string;
}

export interface Thesis {
  id: string;
  type: ThesisType;
  title: string;
  hypothesis: string;
  goal: ThesisGoal;
  status: ThesisStatus;
  experimentPacks: ExperimentPackType[];
  plannedBudget: number;
  createdAt: string;
  updatedAt: string;
  selectedFactorIds?: string[];
  runId?: string;
  linkedTaskId?: string;
  linkedFactorCardId?: string;
  linkedPortfolioCardId?: string;
  evidenceNodes: ThesisEvidenceNode[];
  verdict?: ThesisVerdict;
}

export interface ResourceState {
  researchBudget: number;
  maxConcurrentTheses: number;
  oosTickets: number;
  trustScore: number; // 0~100
}

export interface QuarterTargetMix {
  return: number;
  drawdown: number;
  robustness: number;
  trust: number;
}

export interface QuarterObjective {
  id: string;
  title: string;
  summary: string;
  targetMix: QuarterTargetMix; // must sum to 100
}

export interface QuarterScoreBreakdown {
  return: number;
  drawdown: number;
  robustness: number;
  trust: number;
  total: number;
}

export interface GameEventEffect {
  planCostMultiplier: number;
  stepCostMultiplier: number;
  reviewTrustOffset: number;
  dailyBudgetDelta: number;
  dailyTrustDelta: number;
  marketPnlBias: number;
}

export interface GameEventTemplate {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  durationDays: number;
  effect: GameEventEffect;
}

export interface ActiveGameEvent extends GameEventTemplate {
  startedAt: string;
  startDay: number;
  remainingDays: number;
}

export interface QuarterSettlementRecord {
  quarterNo: number;
  objectiveId: string;
  objectiveTitle: string;
  result: 'great' | 'pass' | 'fail';
  score: QuarterScoreBreakdown;
  settledAt: string;
}

export interface QuarterState {
  quarterNo: number;
  dayInQuarter: number;
  totalDays: number;
  objective: QuarterObjective;
  currentScore: QuarterScoreBreakdown;
  lastSettlement: QuarterScoreBreakdown | null;
  activeEvent: ActiveGameEvent | null;
  history: QuarterSettlementRecord[];
}

// --- Single Factor Workflow Steps ---
export interface SingleFactorStep {
  id: string; // e.g. "S0", "S1", ... "S16"
  name: string;
  description: string;
  isInteractive: boolean; // 🔀 decision point
  phase: 'init' | 'config' | 'signal' | 'backtest' | 'analysis' | 'conclusion';
}

export const SINGLE_FACTOR_STEPS: SingleFactorStep[] = [
  { id: 'S0', name: '项目初始化', description: '设定K线级别、资产池、数据三段切分', isInteractive: true, phase: 'init' },
  { id: 'S1', name: '继承项目配置', description: '加载并确认项目配置', isInteractive: false, phase: 'config' },
  { id: 'S2', name: '定义预测目标', description: '设定预测窗口 fwd_period', isInteractive: false, phase: 'config' },
  { id: 'S3', name: '定义退出规则', description: '混合退出: min_hold → 反转 → max_hold', isInteractive: false, phase: 'config' },
  { id: 'S4', name: '构造原始信号', description: '用自然语言定义因子逻辑', isInteractive: true, phase: 'signal' },
  { id: 'S5', name: 'Rolling Z-score', description: '纵向标准化信号', isInteractive: false, phase: 'signal' },
  { id: 'S6', name: 'Clip(±3)', description: '去极值处理', isInteractive: false, phase: 'signal' },
  { id: 'S7', name: 'EWMA 平滑', description: '指数加权移动平均', isInteractive: false, phase: 'signal' },
  { id: 'S8', name: '仓位映射', description: 'tanh映射 + 波动率缩放', isInteractive: false, phase: 'signal' },
  { id: 'S9', name: '退出规则 & 冷却期', description: '应用混合退出机制', isInteractive: false, phase: 'signal' },
  { id: 'S10', name: 'IS 超参搜索', description: '训练集网格搜索最优参数', isInteractive: true, phase: 'backtest' },
  { id: 'S11', name: 'VAL 验证', description: '验证集独立检验', isInteractive: true, phase: 'backtest' },
  { id: 'S12', name: '因子画像', description: 'IC/RankIC/ICIR/覆盖率/衰减', isInteractive: false, phase: 'analysis' },
  { id: 'S13', name: '全市场汇总', description: '胜率、中位Sharpe、回撤汇总', isInteractive: false, phase: 'analysis' },
  { id: 'S14', name: '敏感性检验', description: '参数稳定性 + 成本敏感性', isInteractive: false, phase: 'analysis' },
  { id: 'S15', name: '分组分析', description: '按市值/流动性/波动率分组', isInteractive: false, phase: 'analysis' },
  { id: 'S16', name: '最终结论', description: '生成因子档案卡', isInteractive: true, phase: 'conclusion' },
];

// --- Multi Factor Workflow Steps ---
export interface MultiFactorStep {
  id: string; // e.g. "M1", "M2", ... "M12"
  name: string;
  description: string;
  isInteractive: boolean;
  phase: 'load' | 'blend' | 'validate' | 'evaluate' | 'conclusion';
}

export const MULTI_FACTOR_STEPS: MultiFactorStep[] = [
  { id: 'M1', name: '加载因子档案卡', description: '读取已验证因子 & 一致性检查', isInteractive: false, phase: 'load' },
  { id: 'M2', name: '因子去冗余', description: '相关性矩阵 → 剔除高相关因子', isInteractive: true, phase: 'load' },
  { id: 'M3', name: '确定合成方式', description: '信号层合成 vs 仓位层合成', isInteractive: true, phase: 'blend' },
  { id: 'M4', name: '确定合成权重', description: '等权/表现加权/滚动动态', isInteractive: true, phase: 'blend' },
  { id: 'M5', name: '合成综合信号', description: '加权求和生成综合z值', isInteractive: false, phase: 'blend' },
  { id: 'M6', name: '仓位映射 & 退出', description: 'tanh映射 + 退出规则', isInteractive: false, phase: 'validate' },
  { id: 'M7', name: 'VAL 验证', description: '验证集回测 & 调优', isInteractive: false, phase: 'validate' },
  { id: 'M8', name: 'OOS 终极评估', description: '测试集最终考试（不可回头）', isInteractive: false, phase: 'evaluate' },
  { id: 'M9', name: '全市场汇总', description: 'OOS全市场指标汇总', isInteractive: false, phase: 'evaluate' },
  { id: 'M10', name: '敏感性检验', description: '参数+成本+权重扰动', isInteractive: false, phase: 'evaluate' },
  { id: 'M11', name: '单因子基准对比', description: '多因子 vs 最优单因子', isInteractive: true, phase: 'evaluate' },
  { id: 'M12', name: '最终结论', description: '生成组合档案卡', isInteractive: true, phase: 'conclusion' },
];

// --- Researcher ---
export interface ResearcherSkin {
  name: string;
  avatar: string;
  color: string;
}

export interface Researcher {
  id: string;
  skin: ResearcherSkin;
  role: string; // user-defined role label, e.g. "因子研究", "多因子合成"
  status: ResearcherStatus;
  currentTask?: ResearchTask;
  progress: number;
  totalTokensUsed: number;
  tasksCompleted: number;
}

// --- Project Config (Step 0, shared across all factors) ---
export interface ProjectConfig {
  barSize: string; // K线级别
  universeFilter: string; // 资产池筛选规则描述
  universeRebalance: string; // 调仓频率
  splitMode: 'three_way' | 'two_way';
  isRange: string; // e.g. "2020-01 ~ 2022-06"
  valRange: string;
  oosRange: string;
  regimeCheck: { bull: number; bear: number; sideways: number }; // percentage per segment
}

// --- Single Factor Task Config ---
export interface SingleFactorConfig {
  factorDescription: string; // natural language
  factorType: string; // 趋势/动量/均值回复
  fwdPeriod: number;
  // These get filled during the workflow
  bestParams?: {
    zscore_window: number;
    ewma_span: number;
    tanh_c: number;
    min_hold: number;
    cooldown: number;
  };
}

// --- Multi Factor Task Config ---
export interface MultiFactorConfig {
  selectedFactorIds: string[]; // factor card IDs to include
  blendMode: 'signal_blend' | 'position_blend';
  weightMethod: 'equal' | 'sharpe_weighted' | 'rolling';
  correlationThreshold: number; // default 0.7
}

export interface TaskDecisionImpact {
  quality: number;
  risk: number;
  efficiency: number;
  costMultiplier: number;
}

export interface TaskDecisionOption {
  id: string;
  label: string;
  description: string;
  impact: TaskDecisionImpact;
}

export interface TaskDecisionRecord {
  stepId: string;
  stepName: string;
  optionId: string;
  optionLabel: string;
  summary: string;
  impact: TaskDecisionImpact;
  timestamp: string;
}

export interface ResumeDecisionInput {
  optionId?: string;
}

// --- Research Task ---
export interface ResearchTask {
  id: string;
  runId: string;
  type: TaskType;
  researcherId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStepIndex: number;
  totalSteps: number;
  progress: number; // 0-100 within current step
  overallProgress: number; // 0-100 across all steps
  startedAt: string;
  completedAt?: string;
  tokenCost: number;
  logs: TaskLog[];
  qualityScore: number; // 0~100, affects expected alpha quality
  riskScore: number; // 0~100, affects return/drawdown profile
  efficiencyScore: number; // 0~100, affects research speed
  stepCostMultiplier: number; // affects token burn in future steps
  decisionHistory: TaskDecisionRecord[];
  guardLog: string[];
  blendPlanKey?: string;
  oosConsumedAt?: string;
  // Config
  singleFactorConfig?: SingleFactorConfig;
  multiFactorConfig?: MultiFactorConfig;
  // Results
  factorCardId?: string;
  portfolioCardId?: string;
  reportId?: string;
  thesisId?: string;
}

export interface TaskLog {
  timestamp: string;
  stepId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'decision';
}

// --- Factor Card (output of single factor workflow) ---
export interface FactorCard {
  id: string;
  runId: string;
  factorName: string;
  factorType: string; // 趋势/动量/均值回复
  description: string;
  barSize: string;
  fwdPeriod: number;
  bestParams: {
    zscore_window: number;
    ewma_span: number;
    tanh_c: number;
    min_hold: number;
    cooldown: number;
    target_vol: number;
  };
  // VAL performance
  valPerformance: {
    winRate: number;
    medianSharpe: number;
    medianAnnualReturn: number;
    medianMaxDrawdown: number;
    medianTurnover: number;
    regimeCoverage: { bull: number; bear: number; sideways: number };
  };
  // Factor profile (Step 12)
  profile: {
    ic: number;
    rankIc: number;
    icir: number;
    rankIcir: number;
    icWinRate: number;
    icSignificance: number;
    coverageMean: number;
    groupTurnover: number;
  };
  // Sensitivity (Step 14)
  sensitivity: {
    paramStable: boolean;
    costSharpe1x: number;
    costViable: boolean;
  };
  // Group analysis (Step 15)
  bestGroup: string;
  recommendedParamRange: string;
  // Status
  status: FactorCardStatus;
  canEnterMultiFactor: boolean;
  // Metadata
  discoveredBy: string; // researcher ID
  discoveredByName: string;
  createdAt: string;
  taskId: string;
  evidence: EvidenceSnapshot;
  // Chart data (simulated)
  equityCurve: number[];
  drawdownCurve: number[];
  monthlyReturns: number[];
  rollingSharpe: number[];
  icTimeSeries: number[];
}

// --- Portfolio Card (output of multi factor workflow) ---
export interface PortfolioCard {
  id: string;
  runId: string;
  name: string;
  includedFactors: string[]; // factor names
  includedFactorIds: string[];
  blendMode: string;
  weightMethod: string;
  factorWeights: Record<string, number>;
  // Dedup results
  originalCandidates: number;
  removedFactors: number;
  finalKept: number;
  // OOS performance
  oosPerformance: {
    winRate: number;
    medianSharpe: number;
    medianAnnualReturn: number;
    medianMaxDrawdown: number;
    medianTurnover: number;
  };
  // Sensitivity
  sensitivity: {
    paramStable: boolean;
    costSharpe1x: number;
    costViable: boolean;
    weightStable: boolean;
  };
  // vs best single factor
  bestSingleFactor: string;
  bestSingleSharpe: number;
  multiIsBetter: boolean;
  sharpeImprovement: number;
  drawdownImprovement: number;
  // Status
  status: PortfolioCardStatus;
  createdAt: string;
  taskId: string;
  oosConsumedAt?: string;
  blendPlanKey: string;
  evidence: EvidenceSnapshot;
  // Chart data
  equityCurve: number[];
  drawdownCurve: number[];
  comparisonCurve: number[]; // best single factor equity for comparison
}

// --- Research Report ---
export interface ResearchReport {
  id: string;
  taskId: string;
  runId: string;
  type: TaskType;
  title: string;
  researcherName: string;
  createdAt: string;
  tokenCost: number;
  factorCardId?: string;
  portfolioCardId?: string;
  // Summary
  summary: string;
  insights: string[];
  recommendations: string[];
  guardLog: string[];
  // Workflow log
  stepResults: StepResult[];
}

export interface StepResult {
  stepId: string;
  stepName: string;
  status: 'completed' | 'skipped';
  summary: string;
  metrics?: Record<string, string | number>;
}

// --- Strategy (for live trading) ---
export type StrategyStatus = 'draft' | 'live' | 'stopped';

export interface Strategy {
  id: string;
  name: string;
  sourceType: 'factor' | 'portfolio';
  sourceId: string; // factor card or portfolio card ID
  status: StrategyStatus;
  liveResult?: {
    pnl: number;
    pnlPercent: number;
    runningDays: number;
    todayPnl: number;
  };
  createdAt: string;
}

// --- Other ---
export interface CompanyRanking {
  rank: number;
  name: string;
  ceo: string;
  totalPnl: number;
  strategies: number;
  researchers: number;
  factorsDiscovered: number;
}

export interface GameNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export type PlayMode = 'guided' | 'expert';

export interface GameState {
  companyName: string;
  ceoName: string;
  credits: number;
  totalCredits: number;
  plan: PlanType;
  playMode: PlayMode;
  insightView: InsightViewMode;
  projectConfig: ProjectConfig | null; // null until Step 0 is done
  researchers: Researcher[];
  factorCards: FactorCard[];
  portfolioCards: PortfolioCard[];
  strategies: Strategy[];
  reports: ResearchReport[];
  activeTasks: ResearchTask[];
  rankings: CompanyRanking[];
  totalPnl: number;
  maxLiveStrategies: number;
  notifications: GameNotification[];
  oosRegistry: Record<string, string>;
  theses: Thesis[];
  resources: ResourceState;
  quarter: QuarterState;
}

// ============ Token Cost Config ============

export const TOKEN_COSTS: Record<TaskType, { base: number; perStep: number; label: string }> = {
  single_factor: { base: 20000, perStep: 5000, label: '因子挖掘' },
  multi_factor: { base: 30000, perStep: 8000, label: '多因子合成' },
};

export const EXPERIMENT_PACK_LIBRARY: Record<ExperimentPackType, { label: string; desc: string; cost: number }> = {
  parameter_sweep: { label: '参数探索包', desc: '快速摸清参数可行区间', cost: 120000 },
  robustness_check: { label: '稳健性包', desc: '重视回撤与跨区间稳定', cost: 160000 },
  cost_shock: { label: '成本冲击包', desc: '评估成本上升后的可行性', cost: 140000 },
  counter_example: { label: '反例验证包', desc: '主动寻找命题失效场景', cost: 100000 },
};

export const QUARTER_OBJECTIVE_LIBRARY: QuarterObjective[] = [
  {
    id: 'qobj-balance',
    title: '稳中求进',
    summary: '保持稳健的同时提升收益质量。',
    targetMix: { return: 30, drawdown: 25, robustness: 25, trust: 20 },
  },
  {
    id: 'qobj-return-push',
    title: '收益冲刺',
    summary: '允许更激进探索，但不能牺牲基本纪律。',
    targetMix: { return: 45, drawdown: 15, robustness: 20, trust: 20 },
  },
  {
    id: 'qobj-risk-guard',
    title: '回撤防守',
    summary: '优先稳定与风险控制，压缩尾部风险。',
    targetMix: { return: 20, drawdown: 35, robustness: 25, trust: 20 },
  },
  {
    id: 'qobj-audit-season',
    title: '审计季度',
    summary: '强调证据链完整性与结论可复核。',
    targetMix: { return: 20, drawdown: 20, robustness: 25, trust: 35 },
  },
];

export const GAME_EVENT_LIBRARY: GameEventTemplate[] = [
  {
    id: 'evt-liquidity-crunch',
    title: '流动性收缩',
    description: '盘口变薄，执行成本上升，研究预算被挤压。',
    severity: 'high',
    durationDays: 3,
    effect: {
      planCostMultiplier: 1.12,
      stepCostMultiplier: 1.1,
      reviewTrustOffset: -1,
      dailyBudgetDelta: -12000,
      dailyTrustDelta: -1,
      marketPnlBias: -0.35,
    },
  },
  {
    id: 'evt-trending-market',
    title: '趋势单边行情',
    description: '趋势类策略表现改善，组合收益弹性增强。',
    severity: 'medium',
    durationDays: 3,
    effect: {
      planCostMultiplier: 1,
      stepCostMultiplier: 1,
      reviewTrustOffset: 0,
      dailyBudgetDelta: 6000,
      dailyTrustDelta: 0,
      marketPnlBias: 0.42,
    },
  },
  {
    id: 'evt-audit-drill',
    title: '监管抽查周',
    description: '审计要求提高，证据不足会被放大惩罚。',
    severity: 'medium',
    durationDays: 2,
    effect: {
      planCostMultiplier: 1.05,
      stepCostMultiplier: 1.03,
      reviewTrustOffset: -2,
      dailyBudgetDelta: -4000,
      dailyTrustDelta: -1,
      marketPnlBias: -0.08,
    },
  },
  {
    id: 'evt-data-provider-upgrade',
    title: '数据服务升级',
    description: '数据质量改善，研究效率与可信度提升。',
    severity: 'low',
    durationDays: 2,
    effect: {
      planCostMultiplier: 0.94,
      stepCostMultiplier: 0.95,
      reviewTrustOffset: 1,
      dailyBudgetDelta: 9000,
      dailyTrustDelta: 1,
      marketPnlBias: 0.15,
    },
  },
];

export const KLINE_PERIODS = [
  { value: '1m', label: '1分钟' },
  { value: '5m', label: '5分钟' },
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
];

export const UNIVERSES = [
  { value: 'crypto_top100', label: 'Crypto 市值Top100 ∩ 成交额Top80' },
  { value: 'crypto_top50', label: 'Crypto 市值Top50' },
  { value: 'crypto_defi', label: 'DeFi 代币 Top30' },
];

export const FACTOR_TYPES = [
  { value: 'momentum', label: '动量型', desc: '"强者恒强"' },
  { value: 'trend', label: '趋势型', desc: '"涨的还会涨"' },
  { value: 'mean_revert', label: '均值回复型', desc: '"涨多了会跌回来"' },
  { value: 'volatility', label: '波动率型', desc: '"波动中寻找规律"' },
  { value: 'volume', label: '量价型', desc: '"量在价先"' },
  { value: 'custom', label: '自定义', desc: '自由定义因子逻辑' },
];


export const AVAILABLE_SKINS: ResearcherSkin[] = [
  { name: '张明远', avatar: '👨‍💻', color: '#6366f1' },
  { name: 'Sarah Chen', avatar: '👩‍🔬', color: '#10b981' },
  { name: '李浩然', avatar: '🧑‍💻', color: '#3b82f6' },
  { name: '王思琪', avatar: '🧑‍🎓', color: '#f59e0b' },
  { name: 'Alex Kim', avatar: '👨‍🔬', color: '#ef4444' },
  { name: '赵雪莹', avatar: '👩‍💻', color: '#8b5cf6' },
  { name: 'Mike Johnson', avatar: '🧑‍🏫', color: '#14b8a6' },
  { name: '陈晓薇', avatar: '👩‍🎓', color: '#f97316' },
];
