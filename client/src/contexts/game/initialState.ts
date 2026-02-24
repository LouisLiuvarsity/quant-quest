import type { CompanyRanking, GameState, Researcher } from './schema';
import { AVAILABLE_SKINS, QUARTER_OBJECTIVE_LIBRARY } from './schema';

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

const INITIAL_QUARTER_SCORE = {
  return: 50,
  drawdown: 50,
  robustness: 50,
  trust: 65,
  total: 54,
};

export const INITIAL_STATE: GameState = {
  companyName: '我的量化基金',
  ceoName: 'Player',
  credits: 10_000_000,
  totalCredits: 10_000_000,
  plan: 'free',
  playMode: 'guided',
  insightView: 'player',
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
  oosRegistry: {},
  theses: [],
  resources: {
    researchBudget: 600000,
    maxConcurrentTheses: 3,
    oosTickets: 2,
    trustScore: 65,
  },
  quarter: {
    quarterNo: 1,
    dayInQuarter: 1,
    totalDays: 20,
    objective: QUARTER_OBJECTIVE_LIBRARY[0],
    currentScore: INITIAL_QUARTER_SCORE,
    lastSettlement: null,
    activeEvent: null,
    history: [],
  },
};
