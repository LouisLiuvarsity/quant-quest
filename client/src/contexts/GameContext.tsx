import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

// ============ Types ============

export type ResearcherStatus = 'idle' | 'researching' | 'completed' | 'waiting'; // waiting = paused at 🔀 decision point
export type TaskType = 'single_factor' | 'multi_factor';
export type PlanType = 'free' | 'pro';
export type FactorCardStatus = 'passed' | 'failed';
export type PortfolioCardStatus = 'adopted' | 'rejected';

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

// --- Research Task ---
export interface ResearchTask {
  id: string;
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
  // Config
  singleFactorConfig?: SingleFactorConfig;
  multiFactorConfig?: MultiFactorConfig;
  // Results
  factorCardId?: string;
  portfolioCardId?: string;
  reportId?: string;
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
  // Chart data
  equityCurve: number[];
  drawdownCurve: number[];
  comparisonCurve: number[]; // best single factor equity for comparison
}

// --- Research Report ---
export interface ResearchReport {
  id: string;
  taskId: string;
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

export interface GameState {
  companyName: string;
  ceoName: string;
  credits: number;
  totalCredits: number;
  plan: PlanType;
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
}

// ============ Token Cost Config ============

export const TOKEN_COSTS: Record<TaskType, { base: number; perStep: number; label: string }> = {
  single_factor: { base: 20000, perStep: 5000, label: '因子挖掘' },
  multi_factor: { base: 30000, perStep: 8000, label: '多因子合成' },
};

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

// ============ Researcher Skins ============

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

// ============ Initial Data ============

const INITIAL_RESEARCHERS: Researcher[] = [
  { id: 'r1', skin: AVAILABLE_SKINS[0], role: '因子研究', status: 'idle', progress: 0, totalTokensUsed: 0, tasksCompleted: 0 },
  { id: 'r2', skin: AVAILABLE_SKINS[1], role: '因子研究', status: 'idle', progress: 0, totalTokensUsed: 0, tasksCompleted: 0 },
  { id: 'r3', skin: AVAILABLE_SKINS[2], role: '多因子合成', status: 'idle', progress: 0, totalTokensUsed: 0, tasksCompleted: 0 },
];

const INITIAL_RANKINGS: CompanyRanking[] = [
  { rank: 1, name: 'AlgoKing Capital', ceo: 'QuantMaster', totalPnl: 285000, strategies: 8, researchers: 6, factorsDiscovered: 24 },
  { rank: 2, name: 'DataDriven Fund', ceo: 'AlphaHunter', totalPnl: 198000, strategies: 6, researchers: 5, factorsDiscovered: 18 },
  { rank: 3, name: 'NeuralAlpha', ceo: 'DeepTrader', totalPnl: 156000, strategies: 5, researchers: 4, factorsDiscovered: 15 },
  { rank: 4, name: 'QuantumEdge', ceo: 'EdgeSeeker', totalPnl: 89000, strategies: 4, researchers: 4, factorsDiscovered: 12 },
  { rank: 5, name: 'ByteAlpha Labs', ceo: 'CodeTrader', totalPnl: 52000, strategies: 3, researchers: 3, factorsDiscovered: 9 },
  { rank: 6, name: 'PrimeQuant', ceo: 'StatArb', totalPnl: 31000, strategies: 2, researchers: 3, factorsDiscovered: 7 },
  { rank: 7, name: 'AlphaWave', ceo: 'WaveRider', totalPnl: 15000, strategies: 2, researchers: 2, factorsDiscovered: 4 },
  { rank: 8, name: '我的量化基金', ceo: 'Player', totalPnl: 0, strategies: 0, researchers: 3, factorsDiscovered: 0 },
];

const INITIAL_STATE: GameState = {
  companyName: '我的量化基金',
  ceoName: 'Player',
  credits: 10_000_000,
  totalCredits: 10_000_000,
  plan: 'free',
  projectConfig: null,
  researchers: INITIAL_RESEARCHERS,
  factorCards: [],
  portfolioCards: [],
  strategies: [],
  reports: [],
  activeTasks: [],
  rankings: INITIAL_RANKINGS,
  totalPnl: 0,
  maxLiveStrategies: 3,
  notifications: [],
};

// ============ Simulation Helpers ============

function generateEquityCurve(sharpe: number, points = 60): number[] {
  const data: number[] = [100];
  const dailyReturn = sharpe * 0.01;
  for (let i = 1; i < points; i++) {
    const noise = (Math.random() - 0.48) * 2.0;
    data.push(Math.max(85, data[i - 1] + dailyReturn + noise));
  }
  return data;
}

function generateDrawdownCurve(equityCurve: number[]): number[] {
  let peak = equityCurve[0];
  return equityCurve.map(v => {
    if (v > peak) peak = v;
    return ((v - peak) / peak) * 100;
  });
}

function generateMonthlyReturns(): number[] {
  return Array.from({ length: 24 }, () => (Math.random() - 0.42) * 8);
}

function generateRollingSharpe(): number[] {
  let base = 0.8 + Math.random() * 0.5;
  return Array.from({ length: 60 }, () => {
    base += (Math.random() - 0.5) * 0.15;
    return Math.max(0, base);
  });
}

function generateIcTimeSeries(): number[] {
  return Array.from({ length: 60 }, () => 0.01 + Math.random() * 0.07);
}

function simulateFactorCard(config: SingleFactorConfig, researcherName: string, researcherId: string, taskId: string): FactorCard {
  const sharpe = 0.6 + Math.random() * 1.8;
  const winRate = 0.45 + Math.random() * 0.35;
  const annualReturn = 0.03 + Math.random() * 0.22;
  const maxDrawdown = -(0.05 + Math.random() * 0.2);
  const turnover = 0.1 + Math.random() * 0.4;
  const ic = 0.02 + Math.random() * 0.06;
  const rankIc = ic * (0.8 + Math.random() * 0.4);
  const icir = ic * (3 + Math.random() * 5);
  const passed = sharpe > 0.5 && winRate > 0.5;
  const equityCurve = generateEquityCurve(sharpe);

  const factorNames: Record<string, string[]> = {
    momentum: ['动量反转因子', '价格动量因子', '相对强弱因子', '截面动量因子'],
    trend: ['趋势跟踪因子', '均线突破因子', '趋势强度因子', '方向性因子'],
    mean_revert: ['均值回归因子', '超卖反弹因子', '价格偏离因子', '回归速度因子'],
    volatility: ['波动率偏度因子', '隐含波动率因子', '波动率聚类因子', 'GARCH因子'],
    volume: ['成交量异动因子', '量价背离因子', '大单净流入因子', '换手率因子'],
    custom: ['自定义因子'],
  };
  const names = factorNames[config.factorType] || factorNames.custom;
  const factorName = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 100);

  return {
    id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    factorName,
    factorType: config.factorType,
    description: config.factorDescription,
    barSize: 'inherited',
    fwdPeriod: config.fwdPeriod,
    bestParams: {
      zscore_window: [20, 40, 60, 120][Math.floor(Math.random() * 4)],
      ewma_span: [3, 5, 10, 20][Math.floor(Math.random() * 4)],
      tanh_c: [0.5, 1.0, 1.5, 2.0][Math.floor(Math.random() * 4)],
      min_hold: [1, 3, 5][Math.floor(Math.random() * 3)],
      cooldown: [0, 1, 3, 5][Math.floor(Math.random() * 4)],
      target_vol: 0.15,
    },
    valPerformance: {
      winRate,
      medianSharpe: sharpe,
      medianAnnualReturn: annualReturn,
      medianMaxDrawdown: maxDrawdown,
      medianTurnover: turnover,
      regimeCoverage: { bull: 35 + Math.random() * 10, bear: 25 + Math.random() * 10, sideways: 25 + Math.random() * 10 },
    },
    profile: {
      ic,
      rankIc,
      icir,
      rankIcir: rankIc * (3 + Math.random() * 4),
      icWinRate: 0.5 + Math.random() * 0.15,
      icSignificance: Math.random() * 0.05,
      coverageMean: 0.85 + Math.random() * 0.12,
      groupTurnover: 0.1 + Math.random() * 0.15,
    },
    sensitivity: {
      paramStable: Math.random() > 0.3,
      costSharpe1x: sharpe * (0.5 + Math.random() * 0.4),
      costViable: sharpe * 0.7 > 0.3,
    },
    bestGroup: ['市值Top30 & 高流动性', '中盘 & 中等流动性', '全市场均有效'][Math.floor(Math.random() * 3)],
    recommendedParamRange: `ewma_span:[${Math.floor(3 + Math.random() * 5)},${Math.floor(12 + Math.random() * 8)}], tanh_c:[${(0.5 + Math.random() * 0.5).toFixed(1)},${(1.2 + Math.random() * 0.8).toFixed(1)}]`,
    status: passed ? 'passed' : 'failed',
    canEnterMultiFactor: passed,
    discoveredBy: researcherId,
    discoveredByName: researcherName,
    createdAt: new Date().toLocaleString('zh-CN'),
    taskId,
    equityCurve,
    drawdownCurve: generateDrawdownCurve(equityCurve),
    monthlyReturns: generateMonthlyReturns(),
    rollingSharpe: generateRollingSharpe(),
    icTimeSeries: generateIcTimeSeries(),
  };
}

function simulatePortfolioCard(config: MultiFactorConfig, factorCards: FactorCard[], taskId: string): PortfolioCard {
  const selectedFactors = factorCards.filter(f => config.selectedFactorIds.includes(f.id));
  const bestSingle = selectedFactors.reduce((best, f) => f.valPerformance.medianSharpe > best.valPerformance.medianSharpe ? f : best, selectedFactors[0]);
  const baseSharpe = bestSingle.valPerformance.medianSharpe;
  const multiSharpe = baseSharpe * (1.1 + Math.random() * 0.3);
  const multiIsBetter = multiSharpe > baseSharpe;
  const equityCurve = generateEquityCurve(multiSharpe);

  const weights: Record<string, number> = {};
  const kept = selectedFactors.filter(() => Math.random() > 0.2);
  kept.forEach(f => { weights[f.factorName] = 1 / kept.length; });

  return {
    id: `pc-${Date.now()}`,
    name: `组合_${kept.map(f => f.factorName.slice(0, 4)).join('+')}`,
    includedFactors: kept.map(f => f.factorName),
    includedFactorIds: kept.map(f => f.id),
    blendMode: config.blendMode,
    weightMethod: config.weightMethod,
    factorWeights: weights,
    originalCandidates: selectedFactors.length,
    removedFactors: selectedFactors.length - kept.length,
    finalKept: kept.length,
    oosPerformance: {
      winRate: 0.55 + Math.random() * 0.25,
      medianSharpe: multiSharpe,
      medianAnnualReturn: 0.06 + Math.random() * 0.18,
      medianMaxDrawdown: -(0.05 + Math.random() * 0.12),
      medianTurnover: 0.1 + Math.random() * 0.15,
    },
    sensitivity: {
      paramStable: Math.random() > 0.25,
      costSharpe1x: multiSharpe * (0.6 + Math.random() * 0.3),
      costViable: true,
      weightStable: Math.random() > 0.3,
    },
    bestSingleFactor: bestSingle.factorName,
    bestSingleSharpe: baseSharpe,
    multiIsBetter,
    sharpeImprovement: multiSharpe - baseSharpe,
    drawdownImprovement: Math.random() * 5,
    status: multiIsBetter ? 'adopted' : 'rejected',
    createdAt: new Date().toLocaleString('zh-CN'),
    taskId,
    equityCurve,
    drawdownCurve: generateDrawdownCurve(equityCurve),
    comparisonCurve: generateEquityCurve(baseSharpe),
  };
}

function generateStepLogs(steps: readonly (SingleFactorStep | MultiFactorStep)[], stepIndex: number): TaskLog[] {
  const step = steps[stepIndex];
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logs: TaskLog[] = [
    { timestamp: now, stepId: step.id, message: `▶ 开始执行 ${step.name}...`, type: 'info' },
  ];

  // Add step-specific detail logs
  const detailMessages: Record<string, string[]> = {
    'S1': ['✓ 项目配置已加载，K线级别/资产池/数据切分一致'],
    'S2': ['✓ 预测窗口 fwd_period 已设定'],
    'S3': ['✓ 退出规则: hybrid (min_hold → 反转 → max_hold)'],
    'S5': ['⏳ 计算 Rolling Z-score...', '✓ 标准化完成，z值范围 [-3.2, 3.1]'],
    'S6': ['✓ Clip(±3) 完成，极端值已处理'],
    'S7': ['⏳ 计算 EWMA 平滑...', '✓ 信号平滑完成'],
    'S8': ['⏳ tanh 仓位映射 + 波动率缩放...', '✓ 仓位序列生成完成'],
    'S9': ['✓ 混合退出规则已应用', '✓ 冷却期已设置'],
    'S12': ['⏳ 计算截面 IC/RankIC...', '⏳ 计算 IC 衰减曲线...', '⏳ 计算覆盖率...', '✓ 因子画像完成'],
    'S13': ['⏳ 汇总全市场表现...', '✓ 胜率/Sharpe/回撤/换手率已计算'],
    'S14': ['⏳ 参数邻域稳定性检验...', '⏳ 成本敏感性检验 (0.5x/1x/2x)...', '✓ 敏感性检验完成'],
    'S15': ['⏳ 按市值分组分析...', '⏳ 按流动性分组分析...', '⏳ 按波动率分组分析...', '✓ 分组分析完成'],
    'M1': ['⏳ 加载因子档案卡...', '✓ 一致性检查通过 (bar_size/universe/fwd_period)'],
    'M5': ['⏳ 加权求和生成综合信号...', '✓ Clip(±3) 防止极端叠加', '✓ 综合信号生成完成'],
    'M6': ['⏳ 综合信号 → tanh 映射...', '✓ 退出规则已应用'],
    'M7': ['⏳ VAL 验证集回测...', '✓ 多因子 VAL 表现已计算'],
    'M8': ['⚠️ 进入 OOS 终极评估（不可回头）', '⏳ OOS 测试集回测...', '✓ OOS 评估完成'],
    'M9': ['⏳ OOS 全市场汇总...', '✓ 汇总完成'],
    'M10': ['⏳ 参数稳定性检验...', '⏳ 成本敏感性检验...', '⏳ 权重扰动检验 (±20%)...', '✓ 敏感性检验完成'],
  };

  const details = detailMessages[step.id] || [`✓ ${step.name} 执行完成`];
  details.forEach(msg => {
    logs.push({ timestamp: now, stepId: step.id, message: msg, type: msg.startsWith('⚠') ? 'warning' : msg.startsWith('✓') ? 'success' : 'info' });
  });

  if (step.isInteractive) {
    logs.push({ timestamp: now, stepId: step.id, message: `🔀 等待 CEO 决策...`, type: 'decision' });
  }

  return logs;
}

function generateReport(task: ResearchTask, factorCard?: FactorCard, portfolioCard?: PortfolioCard): ResearchReport {
  const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
  const stepResults: StepResult[] = steps.map(s => ({
    stepId: s.id,
    stepName: s.name,
    status: 'completed' as const,
    summary: s.description,
    metrics: {},
  }));

  if (task.type === 'single_factor' && factorCard) {
    return {
      id: `rpt-${Date.now()}`,
      taskId: task.id,
      type: 'single_factor',
      title: `因子研究报告: ${factorCard.factorName}`,
      researcherName: factorCard.discoveredByName,
      createdAt: new Date().toLocaleString('zh-CN'),
      tokenCost: task.tokenCost,
      factorCardId: factorCard.id,
      summary: `本次研究通过 ${SINGLE_FACTOR_STEPS.length} 步完整工作流，对因子「${factorCard.factorName}」进行了系统性评估。因子在验证集上的中位 Sharpe 为 ${factorCard.valPerformance.medianSharpe.toFixed(2)}，胜率 ${(factorCard.valPerformance.winRate * 100).toFixed(0)}%，${factorCard.status === 'passed' ? '通过验证，可进入多因子合成' : '未通过验证阈值'}。`,
      insights: [
        `因子类型: ${factorCard.factorType}，预测窗口: ${factorCard.fwdPeriod} 期`,
        `最优参数: zscore_window=${factorCard.bestParams.zscore_window}, ewma_span=${factorCard.bestParams.ewma_span}, tanh_c=${factorCard.bestParams.tanh_c}`,
        `RankIC: ${factorCard.profile.rankIc.toFixed(4)}, ICIR: ${factorCard.profile.icir.toFixed(2)}, IC胜率: ${(factorCard.profile.icWinRate * 100).toFixed(0)}%`,
        `参数稳定性: ${factorCard.sensitivity.paramStable ? '✅ 稳定' : '⚠️ 不稳定'}, 1x成本后Sharpe: ${factorCard.sensitivity.costSharpe1x.toFixed(2)}`,
        `最佳适用分组: ${factorCard.bestGroup}`,
      ],
      recommendations: factorCard.status === 'passed'
        ? ['建议纳入多因子合成候选池', `推荐参数区间: ${factorCard.recommendedParamRange}`, '建议在实盘前进一步观察 OOS 表现']
        : ['因子未通过验证阈值，建议调整因子逻辑或参数', '可尝试不同的信号构造方式', '检查因子在不同市场环境下的表现差异'],
      stepResults,
    };
  }

  if (task.type === 'multi_factor' && portfolioCard) {
    return {
      id: `rpt-${Date.now()}`,
      taskId: task.id,
      type: 'multi_factor',
      title: `多因子合成报告: ${portfolioCard.name}`,
      researcherName: '',
      createdAt: new Date().toLocaleString('zh-CN'),
      tokenCost: task.tokenCost,
      portfolioCardId: portfolioCard.id,
      summary: `本次多因子合成从 ${portfolioCard.originalCandidates} 个候选因子中，去冗余后保留 ${portfolioCard.finalKept} 个，采用${portfolioCard.blendMode === 'signal_blend' ? '信号层' : '仓位层'}合成 + ${portfolioCard.weightMethod === 'equal' ? '等权' : '表现加权'}。OOS 终极评估中位 Sharpe ${portfolioCard.oosPerformance.medianSharpe.toFixed(2)}，${portfolioCard.multiIsBetter ? '优于' : '不如'}最优单因子 (${portfolioCard.bestSingleSharpe.toFixed(2)})。`,
      insights: [
        `合成方式: ${portfolioCard.blendMode}, 权重方案: ${portfolioCard.weightMethod}`,
        `去冗余: ${portfolioCard.originalCandidates} → ${portfolioCard.finalKept} 个因子`,
        `OOS Sharpe: ${portfolioCard.oosPerformance.medianSharpe.toFixed(2)} vs 最优单因子 ${portfolioCard.bestSingleSharpe.toFixed(2)}`,
        `权重稳定性: ${portfolioCard.sensitivity.weightStable ? '✅' : '⚠️'} (扰动±20%)`,
      ],
      recommendations: portfolioCard.status === 'adopted'
        ? ['组合表现优于单因子，建议采纳', '可部署至实盘模拟验证']
        : ['组合未能显著改善单因子表现', '建议增加更多低相关因子', '考虑使用不同的合成权重方案'],
      stepResults,
    };
  }

  return {
    id: `rpt-${Date.now()}`,
    taskId: task.id,
    type: task.type,
    title: '研究报告',
    researcherName: '',
    createdAt: new Date().toLocaleString('zh-CN'),
    tokenCost: task.tokenCost,
    summary: '研究完成',
    insights: [],
    recommendations: [],
    stepResults,
  };
}

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
  startSingleFactorTask: (researcherId: string, config: SingleFactorConfig) => void;
  startMultiFactorTask: (researcherId: string, config: MultiFactorConfig) => void;
  resumeTask: (taskId: string, decision?: Record<string, unknown>) => void;
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

  // --- Step-by-step task simulation ---
  const advanceTaskStep = useCallback((taskId: string, researcherId: string, taskType: TaskType) => {
    const steps = taskType === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;

    setState(prev => {
      const task = prev.activeTasks.find(t => t.id === taskId);
      if (!task || task.status !== 'running') return prev;

      const nextStepIndex = task.currentStepIndex + 1;

      // Task completed
      if (nextStepIndex >= steps.length) {
        let newFactorCards = prev.factorCards;
        let newPortfolioCards = prev.portfolioCards;
        let newReports = prev.reports;
        let factorCardId: string | undefined;
        let portfolioCardId: string | undefined;

        if (taskType === 'single_factor' && task.singleFactorConfig) {
          const researcher = prev.researchers.find(r => r.id === researcherId);
          const fc = simulateFactorCard(task.singleFactorConfig, researcher?.skin.name || '', researcherId, taskId);
          newFactorCards = [...prev.factorCards, fc];
          factorCardId = fc.id;
          const report = generateReport({ ...task, status: 'completed' }, fc);
          newReports = [report, ...prev.reports];
        } else if (taskType === 'multi_factor' && task.multiFactorConfig) {
          const pc = simulatePortfolioCard(task.multiFactorConfig, prev.factorCards, taskId);
          newPortfolioCards = [...prev.portfolioCards, pc];
          portfolioCardId = pc.id;
          const report = generateReport({ ...task, status: 'completed' }, undefined, pc);
          newReports = [report, ...prev.reports];
        }

        return {
          ...prev,
          researchers: prev.researchers.map(r =>
            r.id === researcherId ? { ...r, status: 'completed', progress: 100, tasksCompleted: r.tasksCompleted + 1, totalTokensUsed: r.totalTokensUsed + task.tokenCost } : r
          ),
          activeTasks: prev.activeTasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed', currentStepIndex: nextStepIndex - 1, overallProgress: 100, completedAt: new Date().toLocaleString('zh-CN'), factorCardId, portfolioCardId } : t
          ),
          factorCards: newFactorCards,
          portfolioCards: newPortfolioCards,
          reports: newReports,
          credits: prev.credits - task.tokenCost,
        };
      }

      const nextStep = steps[nextStepIndex];
      const overallProgress = Math.round(((nextStepIndex) / steps.length) * 100);
      const newLogs = [...task.logs, ...generateStepLogs(steps, nextStepIndex)];

      // If interactive step, pause
      if (nextStep.isInteractive) {
        return {
          ...prev,
          researchers: prev.researchers.map(r =>
            r.id === researcherId ? { ...r, status: 'waiting', progress: overallProgress } : r
          ),
          activeTasks: prev.activeTasks.map(t =>
            t.id === taskId ? { ...t, status: 'paused', currentStepIndex: nextStepIndex, overallProgress, progress: 0, logs: newLogs } : t
          ),
        };
      }

      // Auto-advance: schedule next step
      const stepDuration = 800 + Math.random() * 1200;
      const timer = setTimeout(() => {
        advanceTaskStep(taskId, researcherId, taskType);
      }, stepDuration);
      taskTimersRef.current.set(`${taskId}-${nextStepIndex}`, timer);

      // Token cost per step
      const stepCost = TOKEN_COSTS[taskType].perStep;

      return {
        ...prev,
        activeTasks: prev.activeTasks.map(t =>
          t.id === taskId ? { ...t, currentStepIndex: nextStepIndex, overallProgress, progress: 0, logs: newLogs, tokenCost: t.tokenCost + stepCost } : t
        ),
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, progress: overallProgress } : r
        ),
      };
    });
  }, []);

  const startSingleFactorTask = useCallback((researcherId: string, config: SingleFactorConfig) => {
    const taskId = `task-${Date.now()}`;
    const steps = SINGLE_FACTOR_STEPS;
    const initialLogs = generateStepLogs(steps, 0);

    // Step 0 is interactive (project config), but if config exists, skip to step 1
    const hasConfig = state.projectConfig !== null;
    const startStep = hasConfig ? 1 : 0;
    const isFirstStepInteractive = steps[startStep].isInteractive;

    const task: ResearchTask = {
      id: taskId,
      type: 'single_factor',
      researcherId,
      status: isFirstStepInteractive ? 'paused' : 'running',
      currentStepIndex: startStep,
      totalSteps: steps.length,
      progress: 0,
      overallProgress: 0,
      startedAt: new Date().toLocaleString('zh-CN'),
      tokenCost: TOKEN_COSTS.single_factor.base,
      logs: initialLogs,
      singleFactorConfig: config,
    };

    setState(prev => {
      const researcher = prev.researchers.find(r => r.id === researcherId);
      if (!researcher || researcher.status !== 'idle') return prev;
      if (prev.credits < TOKEN_COSTS.single_factor.base) return prev;

      return {
        ...prev,
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, status: isFirstStepInteractive ? 'waiting' : 'researching', currentTask: task, progress: 0 } : r
        ),
        activeTasks: [...prev.activeTasks, task],
      };
    });

    if (!isFirstStepInteractive) {
      const timer = setTimeout(() => advanceTaskStep(taskId, researcherId, 'single_factor'), 1000);
      taskTimersRef.current.set(`${taskId}-start`, timer);
    }

    addNotification('info', '因子研究启动', `开始 ${steps.length} 步单因子工作流`);
  }, [state.projectConfig, advanceTaskStep, addNotification]);

  const startMultiFactorTask = useCallback((researcherId: string, config: MultiFactorConfig) => {
    const taskId = `task-${Date.now()}`;
    const steps = MULTI_FACTOR_STEPS;
    const initialLogs = generateStepLogs(steps, 0);

    const task: ResearchTask = {
      id: taskId,
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
      multiFactorConfig: config,
    };

    setState(prev => {
      const researcher = prev.researchers.find(r => r.id === researcherId);
      if (!researcher || researcher.status !== 'idle') return prev;
      if (prev.credits < TOKEN_COSTS.multi_factor.base) return prev;

      return {
        ...prev,
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, status: 'researching', currentTask: task, progress: 0 } : r
        ),
        activeTasks: [...prev.activeTasks, task],
      };
    });

    const timer = setTimeout(() => advanceTaskStep(taskId, researcherId, 'multi_factor'), 1000);
    taskTimersRef.current.set(`${taskId}-start`, timer);

    addNotification('info', '多因子合成启动', `开始 ${steps.length} 步多因子合成工作流`);
  }, [advanceTaskStep, addNotification]);

  const resumeTask = useCallback((taskId: string, _decision?: Record<string, unknown>) => {
    setState(prev => {
      const task = prev.activeTasks.find(t => t.id === taskId);
      if (!task || task.status !== 'paused') return prev;

      const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLogs = [...task.logs, { timestamp: now, stepId: task.type === 'single_factor' ? SINGLE_FACTOR_STEPS[task.currentStepIndex].id : MULTI_FACTOR_STEPS[task.currentStepIndex].id, message: '✅ CEO 已确认，继续执行...', type: 'success' as const }];

      return {
        ...prev,
        activeTasks: prev.activeTasks.map(t =>
          t.id === taskId ? { ...t, status: 'running', logs: newLogs } : t
        ),
        researchers: prev.researchers.map(r =>
          r.id === task.researcherId ? { ...r, status: 'researching' } : r
        ),
      };
    });

    // Schedule next step advancement
    const task = state.activeTasks.find(t => t.id === taskId);
    if (task) {
      const timer = setTimeout(() => advanceTaskStep(taskId, task.researcherId, task.type), 800);
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
