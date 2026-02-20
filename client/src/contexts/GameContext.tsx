import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

// ============ Types ============

export type ResearcherStatus = 'idle' | 'researching' | 'completed';
export type ResearcherRole = 'factor' | 'backtest' | 'optimize';
export type TaskType = 'factor_mining' | 'strategy_backtest' | 'optimization';
export type StrategyStatus = 'draft' | 'backtesting' | 'backtested' | 'live' | 'stopped';
export type PlanType = 'free' | 'pro';
export type OptimizationType = 'portfolio' | 'parameter';

export interface ResearcherSkin {
  name: string;
  avatar: string;
  color: string; // accent color for this researcher
}

export interface Researcher {
  id: string;
  skin: ResearcherSkin;
  role: ResearcherRole;
  status: ResearcherStatus;
  currentTask?: ResearchTask;
  progress: number; // 0-100
  totalTokensUsed: number;
  tasksCompleted: number;
}

export interface ResearchTaskConfig {
  type: TaskType;
  // Factor mining config
  factorDescription?: string; // natural language description
  klinePeriod?: string; // 1m, 5m, 15m, 1h, 4h, 1d
  backtestRange?: { start: string; end: string };
  universe?: string; // stock universe
  // Optimization config
  optimizationType?: OptimizationType;
  targetStrategyId?: string;
}

export interface ResearchTask {
  id: string;
  type: TaskType;
  config: ResearchTaskConfig;
  researcherId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  tokenCost: number;
  reportId?: string;
}

export interface Factor {
  id: string;
  name: string;
  description: string;
  formula: string;
  ic: number;
  icir: number;
  sharpe: number;
  turnover: number;
  annualReturn: number;
  maxDrawdown: number;
  discoveredBy: string;
  discoveredAt: string;
  category: string;
  klinePeriod: string;
  status: 'discovered' | 'validated' | 'deployed';
  taskId: string;
}

export interface ResearchReport {
  id: string;
  taskId: string;
  type: TaskType;
  title: string;
  researcherName: string;
  createdAt: string;
  tokenCost: number;
  // Factor mining report
  factorResult?: {
    factorName: string;
    description: string;
    formula: string;
    ic: number;
    icir: number;
    sharpe: number;
    turnover: number;
    annualReturn: number;
    maxDrawdown: number;
    winRate: number;
    category: string;
    equityCurve: number[];
    monthlyReturns: number[];
    drawdownCurve: number[];
    icTimeSeries: number[];
  };
  // Backtest report
  backtestResult?: {
    totalReturn: number;
    annualReturn: number;
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    tradeCount: number;
    avgHoldDays: number;
    profitFactor: number;
    calmarRatio: number;
    equityCurve: number[];
    monthlyReturns: number[];
    drawdownCurve: number[];
  };
  // Optimization report
  optimizationResult?: {
    originalSharpe: number;
    optimizedSharpe: number;
    originalReturn: number;
    optimizedReturn: number;
    originalDrawdown: number;
    optimizedDrawdown: number;
    parameterChanges: { name: string; before: string; after: string }[];
    equityCurve: number[];
    comparisonCurve: number[];
  };
  // Text analysis
  summary: string;
  insights: string[];
  recommendations: string[];
}

export interface Strategy {
  id: string;
  name: string;
  factors: string[];
  status: StrategyStatus;
  backtestResult?: {
    totalReturn: number;
    annualReturn: number;
    sharpe: number;
    maxDrawdown: number;
    winRate: number;
    tradeCount: number;
    period: string;
  };
  liveResult?: {
    pnl: number;
    pnlPercent: number;
    runningDays: number;
    todayPnl: number;
  };
  createdAt: string;
}

export interface CompanyRanking {
  rank: number;
  name: string;
  ceo: string;
  totalPnl: number;
  strategies: number;
  researchers: number;
}

export interface GameState {
  companyName: string;
  ceoName: string;
  credits: number;
  totalCredits: number;
  plan: PlanType;
  researchers: Researcher[];
  factors: Factor[];
  strategies: Strategy[];
  reports: ResearchReport[];
  activeTasks: ResearchTask[];
  rankings: CompanyRanking[];
  totalPnl: number;
  maxLiveStrategies: number;
  notifications: GameNotification[];
}

export interface GameNotification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ============ Token Cost Config ============

export const TOKEN_COSTS: Record<TaskType, { base: number; label: string }> = {
  factor_mining: { base: 50000, label: '因子挖掘' },
  strategy_backtest: { base: 30000, label: '策略回测' },
  optimization: { base: 80000, label: '策略优化' },
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
  { value: 'crypto_top50', label: '加密货币 Top50' },
  { value: 'crypto_defi', label: 'DeFi 代币' },
  { value: 'a_share_300', label: 'A股 沪深300' },
  { value: 'a_share_500', label: 'A股 中证500' },
  { value: 'us_sp500', label: '美股 S&P500' },
];

export const ROLE_LABELS: Record<ResearcherRole, string> = {
  factor: '因子挖掘',
  backtest: '策略回测',
  optimize: '策略优化',
};

export const ROLE_COLORS: Record<ResearcherRole, string> = {
  factor: 'oklch(0.55 0.2 265)',
  backtest: 'oklch(0.82 0.15 85)',
  optimize: 'oklch(0.72 0.19 155)',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  factor_mining: '因子挖掘',
  strategy_backtest: '策略回测',
  optimization: '策略优化',
};

// ============ Researcher Skins ============

export const AVAILABLE_SKINS: ResearcherSkin[] = [
  { name: '张明远', avatar: '👨‍💻', color: 'oklch(0.55 0.2 265)' },
  { name: 'Sarah Chen', avatar: '👩‍🔬', color: 'oklch(0.72 0.19 155)' },
  { name: '李浩然', avatar: '🧑‍💻', color: 'oklch(0.75 0.12 200)' },
  { name: '王思聪', avatar: '🧑‍🎓', color: 'oklch(0.82 0.15 85)' },
  { name: 'Alex Kim', avatar: '👨‍🔬', color: 'oklch(0.63 0.22 25)' },
  { name: '赵雪莹', avatar: '👩‍💻', color: 'oklch(0.55 0.2 300)' },
  { name: 'Mike Johnson', avatar: '🧑‍🏫', color: 'oklch(0.65 0.15 145)' },
  { name: '陈晓薇', avatar: '👩‍🎓', color: 'oklch(0.7 0.18 30)' },
];

// ============ Initial Data ============

const INITIAL_RESEARCHERS: Researcher[] = [
  {
    id: 'r1',
    skin: AVAILABLE_SKINS[0],
    role: 'factor',
    status: 'idle',
    progress: 0,
    totalTokensUsed: 0,
    tasksCompleted: 0,
  },
  {
    id: 'r2',
    skin: AVAILABLE_SKINS[1],
    role: 'backtest',
    status: 'idle',
    progress: 0,
    totalTokensUsed: 0,
    tasksCompleted: 0,
  },
  {
    id: 'r3',
    skin: AVAILABLE_SKINS[2],
    role: 'optimize',
    status: 'idle',
    progress: 0,
    totalTokensUsed: 0,
    tasksCompleted: 0,
  },
];

const INITIAL_FACTORS: Factor[] = [];
const INITIAL_STRATEGIES: Strategy[] = [];

const INITIAL_RANKINGS: CompanyRanking[] = [
  { rank: 1, name: 'AlgoKing Capital', ceo: 'QuantMaster', totalPnl: 285000, strategies: 8, researchers: 6 },
  { rank: 2, name: 'DataDriven Fund', ceo: 'AlphaHunter', totalPnl: 198000, strategies: 6, researchers: 5 },
  { rank: 3, name: 'NeuralAlpha', ceo: 'DeepTrader', totalPnl: 156000, strategies: 5, researchers: 4 },
  { rank: 4, name: 'QuantumEdge', ceo: 'EdgeSeeker', totalPnl: 89000, strategies: 4, researchers: 4 },
  { rank: 5, name: 'ByteAlpha Labs', ceo: 'CodeTrader', totalPnl: 52000, strategies: 3, researchers: 3 },
  { rank: 6, name: 'PrimeQuant', ceo: 'StatArb', totalPnl: 31000, strategies: 2, researchers: 3 },
  { rank: 7, name: 'AlphaWave', ceo: 'WaveRider', totalPnl: 15000, strategies: 2, researchers: 2 },
  { rank: 8, name: '我的量化基金', ceo: 'Player', totalPnl: 0, strategies: 0, researchers: 3 },
];

const INITIAL_STATE: GameState = {
  companyName: '我的量化基金',
  ceoName: 'Player',
  credits: 10_000_000,
  totalCredits: 10_000_000,
  plan: 'free',
  researchers: INITIAL_RESEARCHERS,
  factors: INITIAL_FACTORS,
  strategies: INITIAL_STRATEGIES,
  reports: [],
  activeTasks: [],
  rankings: INITIAL_RANKINGS,
  totalPnl: 0,
  maxLiveStrategies: 3,
  notifications: [],
};

// ============ Helpers ============

function generateEquityCurve(totalReturn: number, points = 60): number[] {
  const data: number[] = [100];
  for (let i = 1; i < points; i++) {
    const trend = (totalReturn * 100) / points;
    const noise = (Math.random() - 0.48) * 2.5;
    data.push(Math.max(85, data[i - 1] + trend + noise));
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

function generateIcTimeSeries(): number[] {
  return Array.from({ length: 60 }, () => 0.02 + Math.random() * 0.06);
}

const FACTOR_NAMES = [
  '动量反转因子', '波动率偏度因子', '资金流向因子', '盈利质量因子',
  '隐含波动率因子', '成交量异动因子', '价格突破因子', '均线偏离因子',
  'RSI超买超卖因子', '布林带宽度因子', 'MACD背离因子', '换手率因子',
  '大单净流入因子', '跳空缺口因子', '量价背离因子', '波动率聚类因子',
];

const FACTOR_CATEGORIES = ['动量', '波动率', '资金流', '基本面', '技术指标', '另类数据', '微观结构'];

function generateFactorReport(config: ResearchTaskConfig, researcherName: string): {
  factor: Omit<Factor, 'id' | 'taskId' | 'discoveredBy' | 'discoveredAt'>;
  report: Omit<ResearchReport, 'id' | 'taskId' | 'researcherName' | 'createdAt' | 'tokenCost'>;
} {
  const ic = 0.02 + Math.random() * 0.06;
  const icir = ic * (3 + Math.random() * 5);
  const sharpe = 0.8 + Math.random() * 2.0;
  const turnover = 0.1 + Math.random() * 0.5;
  const annualReturn = 0.05 + Math.random() * 0.25;
  const maxDrawdown = -(0.03 + Math.random() * 0.12);
  const winRate = 0.48 + Math.random() * 0.12;
  const factorName = FACTOR_NAMES[Math.floor(Math.random() * FACTOR_NAMES.length)];
  const category = FACTOR_CATEGORIES[Math.floor(Math.random() * FACTOR_CATEGORIES.length)];
  const equityCurve = generateEquityCurve(annualReturn * 2);

  return {
    factor: {
      name: factorName,
      description: config.factorDescription || `基于${config.klinePeriod || '1d'}周期的${factorName}`,
      formula: `alpha = rank(ts_delta(close, 5)) * sign(volume_change)`,
      ic, icir, sharpe, turnover, annualReturn, maxDrawdown,
      category,
      klinePeriod: config.klinePeriod || '1d',
      status: 'discovered',
    },
    report: {
      type: 'factor_mining',
      title: `因子研究报告: ${factorName}`,
      summary: `本次研究基于用户描述"${config.factorDescription || '自定义因子'}"，在${config.universe || 'crypto_top50'}标的池中，使用${config.klinePeriod || '1d'}周期K线数据进行因子挖掘。经过多轮迭代测试，最终构建了${factorName}。该因子IC均值为${ic.toFixed(4)}，ICIR为${icir.toFixed(2)}，年化收益率${(annualReturn * 100).toFixed(1)}%，最大回撤${(maxDrawdown * 100).toFixed(1)}%，Sharpe比率${sharpe.toFixed(2)}。整体表现${sharpe > 1.5 ? '优秀' : sharpe > 1.0 ? '良好' : '一般'}，${ic > 0.04 ? '因子预测能力较强' : '因子预测能力中等'}。`,
      insights: [
        `因子IC均值${ic.toFixed(4)}，${ic > 0.04 ? '显著高于随机水平' : '处于可接受范围'}`,
        `换手率${(turnover * 100).toFixed(0)}%，${turnover < 0.3 ? '交易成本可控' : '需关注交易成本影响'}`,
        `最大回撤${(maxDrawdown * 100).toFixed(1)}%，${maxDrawdown > -0.08 ? '风险控制良好' : '建议增加风控约束'}`,
        `因子在${config.klinePeriod === '1d' ? '日线' : '分钟线'}级别表现${sharpe > 1.2 ? '稳定' : '存在波动'}`,
      ],
      recommendations: [
        sharpe > 1.5 ? '建议直接部署至策略组合' : '建议进一步优化后再部署',
        turnover > 0.35 ? '考虑增加换手率约束以降低交易成本' : '换手率合理，可直接使用',
        '可尝试与其他低相关因子进行组合以提升稳定性',
      ],
      factorResult: {
        factorName, description: config.factorDescription || factorName,
        formula: `alpha = rank(ts_delta(close, 5)) * sign(volume_change)`,
        ic, icir, sharpe, turnover, annualReturn, maxDrawdown, winRate, category,
        equityCurve,
        monthlyReturns: generateMonthlyReturns(),
        drawdownCurve: generateDrawdownCurve(equityCurve),
        icTimeSeries: generateIcTimeSeries(),
      },
    },
  };
}

function generateBacktestReport(config: ResearchTaskConfig): Omit<ResearchReport, 'id' | 'taskId' | 'researcherName' | 'createdAt' | 'tokenCost'> {
  const totalReturn = 0.1 + Math.random() * 0.4;
  const annualReturn = 0.06 + Math.random() * 0.2;
  const sharpe = 0.8 + Math.random() * 2.0;
  const maxDrawdown = -(0.04 + Math.random() * 0.12);
  const winRate = 0.45 + Math.random() * 0.15;
  const tradeCount = Math.floor(300 + Math.random() * 1500);
  const equityCurve = generateEquityCurve(totalReturn);

  return {
    type: 'strategy_backtest',
    title: `策略回测报告`,
    summary: `本次回测使用${config.backtestRange?.start || '2024-01'}至${config.backtestRange?.end || '2025-12'}的历史数据，在${config.universe || 'crypto_top50'}标的池中进行策略验证。回测结果显示：总收益率${(totalReturn * 100).toFixed(1)}%，年化收益率${(annualReturn * 100).toFixed(1)}%，Sharpe比率${sharpe.toFixed(2)}，最大回撤${(maxDrawdown * 100).toFixed(1)}%。共执行${tradeCount}笔交易，胜率${(winRate * 100).toFixed(0)}%。`,
    insights: [
      `年化收益${(annualReturn * 100).toFixed(1)}%，${annualReturn > 0.15 ? '表现优异' : '表现中等'}`,
      `Sharpe比率${sharpe.toFixed(2)}，${sharpe > 1.5 ? '风险调整后收益优秀' : '风险调整后收益一般'}`,
      `最大回撤${(maxDrawdown * 100).toFixed(1)}%，${maxDrawdown > -0.08 ? '回撤控制良好' : '回撤较大需关注'}`,
      `胜率${(winRate * 100).toFixed(0)}%，共${tradeCount}笔交易`,
    ],
    recommendations: [
      sharpe > 1.5 ? '策略表现优秀，可考虑上线实盘' : '建议进一步优化后再上线',
      '建议进行参数敏感性分析以验证策略稳健性',
      maxDrawdown < -0.1 ? '建议增加止损机制以控制最大回撤' : '风控表现良好',
    ],
    backtestResult: {
      totalReturn, annualReturn, sharpe, maxDrawdown, winRate, tradeCount,
      avgHoldDays: 1 + Math.random() * 10,
      profitFactor: 1.2 + Math.random() * 1.5,
      calmarRatio: annualReturn / Math.abs(maxDrawdown),
      equityCurve,
      monthlyReturns: generateMonthlyReturns(),
      drawdownCurve: generateDrawdownCurve(equityCurve),
    },
  };
}

function generateOptimizationReport(config: ResearchTaskConfig): Omit<ResearchReport, 'id' | 'taskId' | 'researcherName' | 'createdAt' | 'tokenCost'> {
  const originalSharpe = 1.0 + Math.random() * 0.8;
  const optimizedSharpe = originalSharpe + 0.2 + Math.random() * 0.5;
  const originalReturn = 0.08 + Math.random() * 0.12;
  const optimizedReturn = originalReturn + 0.02 + Math.random() * 0.08;
  const originalDrawdown = -(0.06 + Math.random() * 0.1);
  const optimizedDrawdown = originalDrawdown * (0.6 + Math.random() * 0.3);
  const equityCurve = generateEquityCurve(optimizedReturn * 2);
  const comparisonCurve = generateEquityCurve(originalReturn * 2);

  const isPortfolio = config.optimizationType === 'portfolio';

  return {
    type: 'optimization',
    title: isPortfolio ? '组合优化报告' : '参数优化报告',
    summary: `本次${isPortfolio ? '组合优化' : '参数优化'}通过${isPortfolio ? '调整因子权重和风险预算' : '网格搜索和贝叶斯优化'}，将策略Sharpe从${originalSharpe.toFixed(2)}提升至${optimizedSharpe.toFixed(2)}（提升${((optimizedSharpe / originalSharpe - 1) * 100).toFixed(0)}%），年化收益从${(originalReturn * 100).toFixed(1)}%提升至${(optimizedReturn * 100).toFixed(1)}%，最大回撤从${(originalDrawdown * 100).toFixed(1)}%改善至${(optimizedDrawdown * 100).toFixed(1)}%。`,
    insights: [
      `Sharpe比率提升${((optimizedSharpe / originalSharpe - 1) * 100).toFixed(0)}%`,
      `年化收益提升${((optimizedReturn - originalReturn) * 100).toFixed(1)}个百分点`,
      `最大回撤改善${((1 - optimizedDrawdown / originalDrawdown) * 100).toFixed(0)}%`,
      isPortfolio ? '因子权重重新分配后组合更加均衡' : '关键参数调整后策略更加稳健',
    ],
    recommendations: [
      '建议使用优化后的参数进行样本外验证',
      '注意避免过拟合，建议在不同市场环境下测试',
      optimizedSharpe > 2.0 ? '优化效果显著，可考虑上线' : '建议继续迭代优化',
    ],
    optimizationResult: {
      originalSharpe, optimizedSharpe, originalReturn, optimizedReturn,
      originalDrawdown, optimizedDrawdown,
      parameterChanges: isPortfolio
        ? [
            { name: '动量因子权重', before: '30%', after: '45%' },
            { name: '波动率因子权重', before: '40%', after: '25%' },
            { name: '资金流因子权重', before: '30%', after: '30%' },
          ]
        : [
            { name: '回看窗口', before: '20', after: '14' },
            { name: '止损阈值', before: '-5%', after: '-3.5%' },
            { name: '仓位上限', before: '10%', after: '8%' },
            { name: '换仓频率', before: '每日', after: '每2日' },
          ],
      equityCurve,
      comparisonCurve,
    },
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
  hireResearcher: (skinIndex: number, role: ResearcherRole) => void;
  changeRole: (researcherId: string, role: ResearcherRole) => void;
  startResearch: (researcherId: string, config: ResearchTaskConfig) => void;
  startBacktest: (strategyId: string) => void;
  goLive: (strategyId: string) => void;
  upgradePlan: () => void;
  showIntro: boolean;
  setShowIntro: (v: boolean) => void;
  setCompanyName: (name: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const taskTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timers on unmount
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

  const hireResearcher = useCallback((skinIndex: number, role: ResearcherRole) => {
    const skin = AVAILABLE_SKINS[skinIndex];
    if (!skin) return;

    const hireCost = 200000; // flat hiring cost in tokens
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

      return {
        ...prev,
        researchers: [...prev.researchers, newResearcher],
        credits: prev.credits - hireCost,
      };
    });
    addNotification('success', '新员工入职', `${skin.name} 已加入团队，分工：${ROLE_LABELS[role]}`);
  }, [addNotification]);

  const changeRole = useCallback((researcherId: string, role: ResearcherRole) => {
    setState(prev => ({
      ...prev,
      researchers: prev.researchers.map(r =>
        r.id === researcherId && r.status === 'idle' ? { ...r, role } : r
      ),
    }));
  }, []);

  const simulateResearchProgress = useCallback((taskId: string, researcherId: string, totalDuration: number, config: ResearchTaskConfig) => {
    const stepInterval = 500; // update every 500ms
    const totalSteps = totalDuration / stepInterval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));

      setState(prev => ({
        ...prev,
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? { ...r, progress } : r
        ),
        activeTasks: prev.activeTasks.map(t =>
          t.id === taskId ? { ...t, progress } : t
        ),
      }));

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        taskTimersRef.current.delete(taskId);

        // Generate report based on task type
        const researcher = state.researchers.find(r => r.id === researcherId);
        const researcherName = researcher?.skin.name || 'Unknown';
        const tokenCost = TOKEN_COSTS[config.type].base + Math.floor(Math.random() * 20000);
        const reportId = `rpt-${Date.now()}`;
        const now = new Date().toLocaleString('zh-CN');

        let report: ResearchReport;
        let newFactor: Factor | null = null;

        if (config.type === 'factor_mining') {
          const result = generateFactorReport(config, researcherName);
          report = {
            ...result.report,
            id: reportId,
            taskId,
            researcherName,
            createdAt: now,
            tokenCost,
          };
          newFactor = {
            ...result.factor,
            id: `f-${Date.now()}`,
            taskId,
            discoveredBy: researcherId,
            discoveredAt: now,
          };
        } else if (config.type === 'strategy_backtest') {
          const result = generateBacktestReport(config);
          report = {
            ...result,
            id: reportId,
            taskId,
            researcherName,
            createdAt: now,
            tokenCost,
          };
        } else {
          const result = generateOptimizationReport(config);
          report = {
            ...result,
            id: reportId,
            taskId,
            researcherName,
            createdAt: now,
            tokenCost,
          };
        }

        setState(prev => ({
          ...prev,
          researchers: prev.researchers.map(r =>
            r.id === researcherId ? {
              ...r,
              status: 'completed' as ResearcherStatus,
              progress: 100,
              totalTokensUsed: r.totalTokensUsed + tokenCost,
              tasksCompleted: r.tasksCompleted + 1,
              currentTask: r.currentTask ? { ...r.currentTask, status: 'completed', reportId } : undefined,
            } : r
          ),
          activeTasks: prev.activeTasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed', completedAt: now, reportId } : t
          ),
          reports: [report, ...prev.reports],
          factors: newFactor ? [...prev.factors, newFactor] : prev.factors,
          credits: prev.credits - tokenCost,
        }));

        const taskLabel = TASK_TYPE_LABELS[config.type];
        addNotification('success', `${taskLabel}完成`, `${researcherName} 完成了${taskLabel}任务，消耗 ${tokenCost.toLocaleString()} Token`);
      }
    }, stepInterval);

    taskTimersRef.current.set(taskId, timer);
  }, [state.researchers, addNotification]);

  const startResearch = useCallback((researcherId: string, config: ResearchTaskConfig) => {
    const cost = TOKEN_COSTS[config.type].base;

    setState(prev => {
      if (prev.credits < cost) return prev;
      const researcher = prev.researchers.find(r => r.id === researcherId);
      if (!researcher || researcher.status !== 'idle') return prev;

      const taskId = `task-${Date.now()}`;
      const task: ResearchTask = {
        id: taskId,
        type: config.type,
        config,
        researcherId,
        status: 'running',
        progress: 0,
        startedAt: new Date().toLocaleString('zh-CN'),
        tokenCost: cost,
      };

      // Start simulation (8-15 seconds)
      const duration = 8000 + Math.random() * 7000;
      setTimeout(() => simulateResearchProgress(taskId, researcherId, duration, config), 100);

      return {
        ...prev,
        researchers: prev.researchers.map(r =>
          r.id === researcherId ? {
            ...r,
            status: 'researching' as ResearcherStatus,
            currentTask: task,
            progress: 0,
          } : r
        ),
        activeTasks: [...prev.activeTasks, task],
      };
    });

    addNotification('info', '研究任务启动', `${TASK_TYPE_LABELS[config.type]}任务已开始，预计消耗 ${cost.toLocaleString()} Token`);
  }, [simulateResearchProgress, addNotification]);

  const startBacktest = useCallback((strategyId: string) => {
    setState(prev => ({
      ...prev,
      strategies: prev.strategies.map(s =>
        s.id === strategyId ? { ...s, status: 'backtesting' as StrategyStatus } : s
      ),
    }));
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        strategies: prev.strategies.map(s =>
          s.id === strategyId ? {
            ...s,
            status: 'backtested' as StrategyStatus,
            backtestResult: {
              totalReturn: 0.15 + Math.random() * 0.3,
              annualReturn: 0.08 + Math.random() * 0.15,
              sharpe: 1.0 + Math.random() * 1.5,
              maxDrawdown: -(0.05 + Math.random() * 0.1),
              winRate: 0.45 + Math.random() * 0.15,
              tradeCount: Math.floor(500 + Math.random() * 1000),
              period: '2024-01 ~ 2025-12',
            },
          } : s
        ),
      }));
      addNotification('success', '回测完成', '策略回测已完成');
    }, 3000);
  }, [addNotification]);

  const goLive = useCallback((strategyId: string) => {
    setState(prev => {
      const liveCount = prev.strategies.filter(s => s.status === 'live').length;
      if (liveCount >= prev.maxLiveStrategies) return prev;
      return {
        ...prev,
        strategies: prev.strategies.map(s =>
          s.id === strategyId ? {
            ...s,
            status: 'live' as StrategyStatus,
            liveResult: { pnl: 0, pnlPercent: 0, runningDays: 0, todayPnl: 0 },
          } : s
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
      hireResearcher,
      changeRole,
      startResearch,
      startBacktest,
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
