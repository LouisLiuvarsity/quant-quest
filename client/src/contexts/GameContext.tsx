import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ============ Types ============

export type ResearcherStatus = 'idle' | 'researching' | 'completed' | 'failed';
export type ResearcherSpecialty = 'factor' | 'strategy' | 'risk' | 'data';
export type StrategyStatus = 'draft' | 'backtesting' | 'backtested' | 'live' | 'stopped';
export type PlanType = 'free' | 'pro';

export interface Researcher {
  id: string;
  name: string;
  avatar: string;
  specialty: ResearcherSpecialty;
  level: number;
  salary: number; // per day in credits
  status: ResearcherStatus;
  currentTask?: string;
  progress: number; // 0-100
  mood: number; // 0-100
  factorsDiscovered: number;
  hireDate: string;
}

export interface Factor {
  id: string;
  name: string;
  description: string;
  ic: number; // Information Coefficient
  sharpe: number;
  turnover: number;
  discoveredBy: string;
  status: 'discovered' | 'validated' | 'deployed';
  category: string;
}

export interface Strategy {
  id: string;
  name: string;
  factors: string[];
  status: StrategyStatus;
  backtestResult?: BacktestResult;
  liveResult?: LiveResult;
  createdAt: string;
}

export interface BacktestResult {
  totalReturn: number;
  annualReturn: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  tradeCount: number;
  period: string;
}

export interface LiveResult {
  pnl: number;
  pnlPercent: number;
  runningDays: number;
  todayPnl: number;
}

export interface CompanyRanking {
  rank: number;
  name: string;
  ceo: string;
  totalPnl: number;
  strategies: number;
  researchers: number;
  level: number;
}

export interface GameState {
  companyName: string;
  ceoName: string;
  credits: number;
  totalCredits: number;
  companyLevel: number;
  day: number;
  plan: PlanType;
  researchers: Researcher[];
  factors: Factor[];
  strategies: Strategy[];
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

// ============ Initial Data ============

const INITIAL_RESEARCHERS: Researcher[] = [
  {
    id: 'r1',
    name: '张明远',
    avatar: '👨‍💻',
    specialty: 'factor',
    level: 3,
    salary: 5000,
    status: 'researching',
    currentTask: '动量因子挖掘',
    progress: 72,
    mood: 85,
    factorsDiscovered: 12,
    hireDate: '2026-01-15',
  },
  {
    id: 'r2',
    name: 'Sarah Chen',
    avatar: '👩‍🔬',
    specialty: 'strategy',
    level: 4,
    salary: 8000,
    status: 'researching',
    currentTask: '多因子组合优化',
    progress: 45,
    mood: 92,
    factorsDiscovered: 8,
    hireDate: '2026-01-10',
  },
  {
    id: 'r3',
    name: '李浩然',
    avatar: '🧑‍💻',
    specialty: 'data',
    level: 2,
    salary: 3500,
    status: 'idle',
    progress: 0,
    mood: 70,
    factorsDiscovered: 5,
    hireDate: '2026-02-01',
  },
];

const INITIAL_FACTORS: Factor[] = [
  { id: 'f1', name: '5日动量反转', description: '基于5日收益率的短期反转因子', ic: 0.042, sharpe: 1.8, turnover: 0.35, discoveredBy: 'r1', status: 'deployed', category: '动量' },
  { id: 'f2', name: '波动率偏度', description: '收益率分布偏度作为波动率因子', ic: 0.038, sharpe: 1.5, turnover: 0.22, discoveredBy: 'r1', status: 'validated', category: '波动率' },
  { id: 'f3', name: '资金流向强度', description: '主力资金净流入占比因子', ic: 0.051, sharpe: 2.1, turnover: 0.41, discoveredBy: 'r2', status: 'deployed', category: '资金流' },
  { id: 'f4', name: '盈利质量得分', description: '基于应计利润和现金流的质量因子', ic: 0.035, sharpe: 1.3, turnover: 0.15, discoveredBy: 'r2', status: 'discovered', category: '基本面' },
  { id: 'f5', name: '隐含波动率价差', description: '期权隐含波动率与历史波动率之差', ic: 0.029, sharpe: 1.1, turnover: 0.28, discoveredBy: 'r3', status: 'discovered', category: '波动率' },
];

const INITIAL_STRATEGIES: Strategy[] = [
  {
    id: 's1',
    name: 'Alpha-动量反转v2',
    factors: ['f1', 'f3'],
    status: 'live',
    backtestResult: { totalReturn: 0.342, annualReturn: 0.185, sharpe: 2.1, maxDrawdown: -0.082, winRate: 0.58, tradeCount: 1247, period: '2024-01 ~ 2025-12' },
    liveResult: { pnl: 12580, pnlPercent: 0.126, runningDays: 45, todayPnl: 380 },
    createdAt: '2026-01-20',
  },
  {
    id: 's2',
    name: 'Beta-多因子均衡',
    factors: ['f1', 'f2', 'f4'],
    status: 'backtested',
    backtestResult: { totalReturn: 0.278, annualReturn: 0.152, sharpe: 1.8, maxDrawdown: -0.095, winRate: 0.55, tradeCount: 986, period: '2024-01 ~ 2025-12' },
    createdAt: '2026-02-05',
  },
  {
    id: 's3',
    name: 'Gamma-资金流追踪',
    factors: ['f3', 'f5'],
    status: 'backtesting',
    createdAt: '2026-02-18',
  },
];

const INITIAL_RANKINGS: CompanyRanking[] = [
  { rank: 1, name: 'AlgoKing Capital', ceo: 'QuantMaster', totalPnl: 285000, strategies: 8, researchers: 6, level: 12 },
  { rank: 2, name: 'DataDriven Fund', ceo: 'AlphaHunter', totalPnl: 198000, strategies: 6, researchers: 5, level: 10 },
  { rank: 3, name: 'NeuralAlpha', ceo: 'DeepTrader', totalPnl: 156000, strategies: 5, researchers: 4, level: 9 },
  { rank: 4, name: '我的量化基金', ceo: 'Player', totalPnl: 12580, strategies: 3, researchers: 3, level: 4 },
  { rank: 5, name: 'QuantumEdge', ceo: 'EdgeSeeker', totalPnl: 8900, strategies: 2, researchers: 3, level: 3 },
  { rank: 6, name: 'ByteAlpha Labs', ceo: 'CodeTrader', totalPnl: 5200, strategies: 2, researchers: 2, level: 2 },
  { rank: 7, name: 'PrimeQuant', ceo: 'StatArb', totalPnl: 3100, strategies: 1, researchers: 2, level: 2 },
  { rank: 8, name: 'AlphaWave', ceo: 'WaveRider', totalPnl: 1500, strategies: 1, researchers: 1, level: 1 },
];

const INITIAL_NOTIFICATIONS: GameNotification[] = [
  { id: 'n1', type: 'success', title: '因子发现', message: '张明远发现了新因子「隐含波动率价差」', timestamp: '10:32', read: false },
  { id: 'n2', type: 'info', title: '回测完成', message: '策略「Beta-多因子均衡」回测完成，年化收益15.2%', timestamp: '09:15', read: false },
  { id: 'n3', type: 'warning', title: '积分提醒', message: '当前积分余额不足500万，请注意控制开支', timestamp: '08:00', read: true },
];

const INITIAL_STATE: GameState = {
  companyName: '我的量化基金',
  ceoName: 'Player',
  credits: 7_850_000,
  totalCredits: 10_000_000,
  companyLevel: 4,
  day: 36,
  plan: 'free',
  researchers: INITIAL_RESEARCHERS,
  factors: INITIAL_FACTORS,
  strategies: INITIAL_STRATEGIES,
  rankings: INITIAL_RANKINGS,
  totalPnl: 12580,
  maxLiveStrategies: 3,
  notifications: INITIAL_NOTIFICATIONS,
};

// ============ Hiring Pool ============

export const HIRING_POOL: Omit<Researcher, 'hireDate' | 'status' | 'currentTask' | 'progress' | 'factorsDiscovered'>[] = [
  { id: 'h1', name: '王思聪', avatar: '🧑‍🎓', specialty: 'factor', level: 1, salary: 2000, mood: 90 },
  { id: 'h2', name: 'Alex Kim', avatar: '👨‍🔬', specialty: 'risk', level: 3, salary: 6000, mood: 80 },
  { id: 'h3', name: '赵雪莹', avatar: '👩‍💻', specialty: 'strategy', level: 5, salary: 12000, mood: 95 },
  { id: 'h4', name: 'Mike Johnson', avatar: '🧑‍🏫', specialty: 'data', level: 2, salary: 4000, mood: 75 },
];

// ============ Context ============

interface GameContextType {
  state: GameState;
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  selectedResearcher: Researcher | null;
  setSelectedResearcher: (r: Researcher | null) => void;
  hireResearcher: (id: string) => void;
  assignTask: (researcherId: string, task: string) => void;
  startBacktest: (strategyId: string) => void;
  goLive: (strategyId: string) => void;
  upgradePlan: () => void;
  advanceDay: () => void;
  showIntro: boolean;
  setShowIntro: (v: boolean) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const hireResearcher = useCallback((id: string) => {
    const candidate = HIRING_POOL.find(h => h.id === id);
    if (!candidate) return;
    setState(prev => ({
      ...prev,
      researchers: [...prev.researchers, {
        ...candidate,
        status: 'idle' as ResearcherStatus,
        progress: 0,
        factorsDiscovered: 0,
        hireDate: `Day ${prev.day}`,
      }],
      credits: prev.credits - candidate.salary * 30,
      notifications: [{
        id: `n-${Date.now()}`,
        type: 'success' as const,
        title: '新员工入职',
        message: `${candidate.name} 已加入团队！`,
        timestamp: 'Just now',
        read: false,
      }, ...prev.notifications],
    }));
  }, []);

  const assignTask = useCallback((researcherId: string, task: string) => {
    setState(prev => ({
      ...prev,
      researchers: prev.researchers.map(r =>
        r.id === researcherId ? { ...r, status: 'researching' as ResearcherStatus, currentTask: task, progress: 0 } : r
      ),
    }));
  }, []);

  const startBacktest = useCallback((strategyId: string) => {
    setState(prev => ({
      ...prev,
      strategies: prev.strategies.map(s =>
        s.id === strategyId ? { ...s, status: 'backtesting' as StrategyStatus } : s
      ),
    }));
    // Simulate backtest completion
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
        notifications: [{
          id: `n-${Date.now()}`,
          type: 'success' as const,
          title: '回测完成',
          message: `策略回测已完成`,
          timestamp: 'Just now',
          read: false,
        }, ...prev.notifications],
      }));
    }, 3000);
  }, []);

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
        notifications: [{
          id: `n-${Date.now()}`,
          type: 'info' as const,
          title: '策略上线',
          message: `策略已开始实盘模拟运行`,
          timestamp: 'Just now',
          read: false,
        }, ...prev.notifications],
      };
    });
  }, []);

  const upgradePlan = useCallback(() => {
    setState(prev => ({
      ...prev,
      plan: 'pro',
      maxLiveStrategies: 10,
      credits: prev.credits + 500000,
      notifications: [{
        id: `n-${Date.now()}`,
        type: 'success' as const,
        title: '升级成功',
        message: '已升级至Pro版本！配资1000U，策略上限提升至10个',
        timestamp: 'Just now',
        read: false,
      }, ...prev.notifications],
    }));
  }, []);

  const advanceDay = useCallback(() => {
    setState(prev => {
      const dailyCost = prev.researchers.reduce((sum, r) => sum + r.salary, 0);
      const newCredits = Math.max(0, prev.credits - dailyCost);

      // Update researcher progress
      const updatedResearchers = prev.researchers.map(r => {
        if (r.status === 'researching') {
          const newProgress = Math.min(100, r.progress + 5 + Math.floor(Math.random() * 10));
          if (newProgress >= 100) {
            return { ...r, status: 'completed' as ResearcherStatus, progress: 100 };
          }
          return { ...r, progress: newProgress };
        }
        return r;
      });

      // Update live strategy PnL
      const updatedStrategies = prev.strategies.map(s => {
        if (s.status === 'live' && s.liveResult) {
          const dailyPnl = (Math.random() - 0.45) * 1000;
          return {
            ...s,
            liveResult: {
              ...s.liveResult,
              pnl: s.liveResult.pnl + dailyPnl,
              pnlPercent: (s.liveResult.pnl + dailyPnl) / 100000,
              runningDays: s.liveResult.runningDays + 1,
              todayPnl: dailyPnl,
            },
          };
        }
        return s;
      });

      const totalPnl = updatedStrategies.reduce((sum, s) => sum + (s.liveResult?.pnl || 0), 0);

      return {
        ...prev,
        day: prev.day + 1,
        credits: newCredits,
        researchers: updatedResearchers,
        strategies: updatedStrategies,
        totalPnl,
      };
    });
  }, []);

  return (
    <GameContext.Provider value={{
      state,
      activePanel,
      setActivePanel,
      selectedResearcher,
      setSelectedResearcher,
      hireResearcher,
      assignTask,
      startBacktest,
      goLive,
      upgradePlan,
      advanceDay,
      showIntro,
      setShowIntro,
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
