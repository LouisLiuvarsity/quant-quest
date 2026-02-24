import { MULTI_FACTOR_STEPS, SINGLE_FACTOR_STEPS } from './schema';
import type {
  EvidenceSnapshot,
  FactorCard,
  MultiFactorConfig,
  MultiFactorStep,
  PortfolioCard,
  ResearchReport,
  ResearchTask,
  SingleFactorConfig,
  SingleFactorStep,
  StepResult,
  TaskLog,
} from './schema';

export const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const clampScore = (value: number) => clampNumber(Math.round(value), 0, 100);
export const clampCostMultiplier = (value: number) => Number(clampNumber(value, 0.75, 1.65).toFixed(2));
export const createRunId = () => `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createReproId = (seed: string) =>
  `rep-${seed.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 72)}`;

export const buildBlendPlanKey = (config: MultiFactorConfig) => {
  const factorKey = [...config.selectedFactorIds].sort().join(',');
  return `factors=${factorKey}|blend=${config.blendMode}|weight=${config.weightMethod}|corr=${config.correlationThreshold.toFixed(2)}`;
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

export interface TaskPerformanceProfile {
  qualityScore: number;
  riskScore: number;
  efficiencyScore: number;
  decisionCount: number;
}

export function simulateFactorCard(
  config: SingleFactorConfig,
  researcherName: string,
  researcherId: string,
  taskId: string,
  runId: string,
  guardLog: string[],
  profile: TaskPerformanceProfile,
): FactorCard {
  const qualityBias = (profile.qualityScore - 50) / 50;
  const riskBias = (profile.riskScore - 50) / 50;
  const efficiencyBias = (profile.efficiencyScore - 50) / 50;
  const decisionBonus = Math.min(profile.decisionCount, 6) * 0.02;

  const sharpe = clampNumber(0.45 + Math.random() * 1.4 + qualityBias * 0.42 - Math.max(0, riskBias) * 0.07 + decisionBonus, 0.15, 2.9);
  const winRate = clampNumber(0.44 + Math.random() * 0.3 + qualityBias * 0.06 - Math.max(0, riskBias) * 0.03 + decisionBonus * 0.25, 0.35, 0.9);
  const annualReturn = clampNumber(0.03 + Math.random() * 0.22 + riskBias * 0.08 + qualityBias * 0.03, 0.01, 0.55);
  const maxDrawdownAbs = clampNumber(0.06 + Math.random() * 0.16 + Math.max(0, riskBias) * 0.09 - Math.max(0, qualityBias) * 0.03, 0.04, 0.36);
  const maxDrawdown = -maxDrawdownAbs;
  const turnover = clampNumber(0.1 + Math.random() * 0.34 + Math.max(0, riskBias) * 0.11 - Math.max(0, efficiencyBias) * 0.07, 0.06, 0.72);
  const ic = clampNumber(0.012 + Math.random() * 0.05 + qualityBias * 0.015 + decisionBonus * 0.2, 0.005, 0.12);
  const rankIc = ic * (0.8 + Math.random() * 0.4);
  const icir = ic * (3 + Math.random() * 5);
  const passScore = sharpe * 0.7 + winRate * 0.8 + ic * 4 - maxDrawdownAbs * 0.8;
  const passed = passScore > 1.1;
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
  const bestParams = {
    zscore_window: [20, 40, 60, 120][Math.floor(Math.random() * 4)],
    ewma_span: [3, 5, 10, 20][Math.floor(Math.random() * 4)],
    tanh_c: [0.5, 1.0, 1.5, 2.0][Math.floor(Math.random() * 4)],
    min_hold: [1, 3, 5][Math.floor(Math.random() * 3)],
    cooldown: [0, 1, 3, 5][Math.floor(Math.random() * 4)],
    target_vol: 0.15,
  };
  const evidence: EvidenceSnapshot = {
    runId,
    dataSegments: ['IS', 'VAL'],
    guardLog: guardLog.length > 0 ? guardLog : ['project_config_locked', 'oos_reserved_for_multi'],
    keyParams: {
      factorType: config.factorType,
      fwdPeriod: config.fwdPeriod,
      zscore_window: bestParams.zscore_window,
      ewma_span: bestParams.ewma_span,
      tanh_c: bestParams.tanh_c,
      min_hold: bestParams.min_hold,
      cooldown: bestParams.cooldown,
    },
    reproducibilityId: createReproId(`${runId}-${config.factorType}-${config.fwdPeriod}`),
  };

  return {
    id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    runId,
    factorName,
    factorType: config.factorType,
    description: config.factorDescription,
    barSize: 'inherited',
    fwdPeriod: config.fwdPeriod,
    bestParams,
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
    evidence,
    equityCurve,
    drawdownCurve: generateDrawdownCurve(equityCurve),
    monthlyReturns: generateMonthlyReturns(),
    rollingSharpe: generateRollingSharpe(),
    icTimeSeries: generateIcTimeSeries(),
  };
}

interface PortfolioTaskMeta {
  taskId: string;
  runId: string;
  guardLog: string[];
  blendPlanKey: string;
  oosConsumedAt?: string;
}

export function simulatePortfolioCard(
  config: MultiFactorConfig,
  factorCards: FactorCard[],
  taskMeta: PortfolioTaskMeta,
  profile: TaskPerformanceProfile,
): PortfolioCard {
  const qualityBias = (profile.qualityScore - 50) / 50;
  const riskBias = (profile.riskScore - 50) / 50;
  const efficiencyBias = (profile.efficiencyScore - 50) / 50;
  const selectedFactors = factorCards.filter(f => config.selectedFactorIds.includes(f.id));
  const fallbackFactor = factorCards[0];
  const bestSingle = selectedFactors.length > 0
    ? selectedFactors.reduce((best, f) => f.valPerformance.medianSharpe > best.valPerformance.medianSharpe ? f : best, selectedFactors[0])
    : fallbackFactor;
  if (!bestSingle) {
    const fallbackSharpe = 0.72;
    const fallbackCurve = generateEquityCurve(fallbackSharpe);
    const evidence: EvidenceSnapshot = {
      runId: taskMeta.runId,
      dataSegments: ['VAL', 'OOS'],
      guardLog: taskMeta.guardLog,
      keyParams: {
        blendMode: config.blendMode,
        weightMethod: config.weightMethod,
        correlationThreshold: config.correlationThreshold,
      },
      reproducibilityId: createReproId(`${taskMeta.runId}-${taskMeta.blendPlanKey}`),
    };
    return {
      id: `pc-${Date.now()}`,
      runId: taskMeta.runId,
      name: '组合_空池',
      includedFactors: [],
      includedFactorIds: [],
      blendMode: config.blendMode,
      weightMethod: config.weightMethod,
      factorWeights: {},
      originalCandidates: 0,
      removedFactors: 0,
      finalKept: 0,
      oosPerformance: {
        winRate: 0.5,
        medianSharpe: fallbackSharpe,
        medianAnnualReturn: 0.05,
        medianMaxDrawdown: -0.12,
        medianTurnover: 0.12,
      },
      sensitivity: {
        paramStable: false,
        costSharpe1x: fallbackSharpe * 0.65,
        costViable: true,
        weightStable: false,
      },
      bestSingleFactor: 'N/A',
      bestSingleSharpe: 0,
      multiIsBetter: false,
      sharpeImprovement: 0,
      drawdownImprovement: 0,
      status: 'rejected',
      createdAt: new Date().toLocaleString('zh-CN'),
      taskId: taskMeta.taskId,
      oosConsumedAt: taskMeta.oosConsumedAt,
      blendPlanKey: taskMeta.blendPlanKey,
      evidence,
      equityCurve: fallbackCurve,
      drawdownCurve: generateDrawdownCurve(fallbackCurve),
      comparisonCurve: generateEquityCurve(0.6),
    };
  }
  const baseSharpe = bestSingle.valPerformance.medianSharpe;
  const multiSharpe = clampNumber(baseSharpe * (1.05 + Math.random() * 0.22 + qualityBias * 0.1 - Math.max(0, riskBias) * 0.04), 0.2, 3.1);
  const multiIsBetter = multiSharpe > baseSharpe;
  const equityCurve = generateEquityCurve(multiSharpe);

  const weights: Record<string, number> = {};
  const kept = (selectedFactors.length > 0 ? selectedFactors : [bestSingle]).filter(() => Math.random() > 0.2);
  if (kept.length === 0) kept.push(bestSingle);
  kept.forEach(f => { weights[f.factorName] = 1 / kept.length; });
  const evidence: EvidenceSnapshot = {
    runId: taskMeta.runId,
    dataSegments: ['VAL', 'OOS'],
    guardLog: taskMeta.guardLog,
    keyParams: {
      blendMode: config.blendMode,
      weightMethod: config.weightMethod,
      correlationThreshold: config.correlationThreshold,
      factorCount: kept.length,
    },
    reproducibilityId: createReproId(`${taskMeta.runId}-${taskMeta.blendPlanKey}-${kept.length}`),
  };

  return {
    id: `pc-${Date.now()}`,
    runId: taskMeta.runId,
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
      winRate: clampNumber(0.52 + Math.random() * 0.24 + qualityBias * 0.05 - Math.max(0, riskBias) * 0.03, 0.38, 0.92),
      medianSharpe: multiSharpe,
      medianAnnualReturn: clampNumber(0.06 + Math.random() * 0.18 + riskBias * 0.07 + qualityBias * 0.04, 0.02, 0.52),
      medianMaxDrawdown: -clampNumber(0.06 + Math.random() * 0.12 + Math.max(0, riskBias) * 0.08 - Math.max(0, qualityBias) * 0.03, 0.04, 0.3),
      medianTurnover: clampNumber(0.09 + Math.random() * 0.16 + Math.max(0, riskBias) * 0.06 - Math.max(0, efficiencyBias) * 0.04, 0.05, 0.35),
    },
    sensitivity: {
      paramStable: Math.random() > 0.25,
      costSharpe1x: multiSharpe * (0.6 + Math.random() * 0.3),
      costViable: multiSharpe > 0.65,
      weightStable: Math.random() > 0.3,
    },
    bestSingleFactor: bestSingle.factorName,
    bestSingleSharpe: baseSharpe,
    multiIsBetter,
    sharpeImprovement: multiSharpe - baseSharpe,
    drawdownImprovement: Math.random() * 5,
    status: multiIsBetter ? 'adopted' : 'rejected',
    createdAt: new Date().toLocaleString('zh-CN'),
    taskId: taskMeta.taskId,
    oosConsumedAt: taskMeta.oosConsumedAt,
    blendPlanKey: taskMeta.blendPlanKey,
    evidence,
    equityCurve,
    drawdownCurve: generateDrawdownCurve(equityCurve),
    comparisonCurve: generateEquityCurve(baseSharpe),
  };
}

export function generateStepLogs(steps: readonly (SingleFactorStep | MultiFactorStep)[], stepIndex: number): TaskLog[] {
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

export function generateReport(task: ResearchTask, factorCard?: FactorCard, portfolioCard?: PortfolioCard): ResearchReport {
  const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
  const decisionDigest = task.decisionHistory.length > 0
    ? task.decisionHistory.slice(-3).map(item => `${item.stepId}:${item.optionLabel}`).join(' | ')
    : '无决策记录';
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
      runId: task.runId,
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
        `研究画像: 质量${task.qualityScore}/100 · 风险${task.riskScore}/100 · 效率${task.efficiencyScore}/100`,
        `参数稳定性: ${factorCard.sensitivity.paramStable ? '✅ 稳定' : '⚠️ 不稳定'}, 1x成本后Sharpe: ${factorCard.sensitivity.costSharpe1x.toFixed(2)}`,
        `关键决策: ${decisionDigest}`,
        `最佳适用分组: ${factorCard.bestGroup}`,
      ],
      recommendations: factorCard.status === 'passed'
        ? ['建议纳入多因子合成候选池', `推荐参数区间: ${factorCard.recommendedParamRange}`, '建议在实盘前进一步观察 OOS 表现']
        : ['因子未通过验证阈值，建议调整因子逻辑或参数', '可尝试不同的信号构造方式', '检查因子在不同市场环境下的表现差异'],
      guardLog: task.guardLog,
      stepResults,
    };
  }

  if (task.type === 'multi_factor' && portfolioCard) {
    return {
      id: `rpt-${Date.now()}`,
      taskId: task.id,
      runId: task.runId,
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
        `研究画像: 质量${task.qualityScore}/100 · 风险${task.riskScore}/100 · 效率${task.efficiencyScore}/100`,
        `权重稳定性: ${portfolioCard.sensitivity.weightStable ? '✅' : '⚠️'} (扰动±20%)`,
        `关键决策: ${decisionDigest}`,
      ],
      recommendations: portfolioCard.status === 'adopted'
        ? ['组合表现优于单因子，建议采纳', '可部署至实盘模拟验证']
        : ['组合未能显著改善单因子表现', '建议增加更多低相关因子', '考虑使用不同的合成权重方案'],
      guardLog: task.guardLog,
      stepResults,
    };
  }

  return {
    id: `rpt-${Date.now()}`,
    taskId: task.id,
    runId: task.runId,
    type: task.type,
    title: '研究报告',
    researcherName: '',
    createdAt: new Date().toLocaleString('zh-CN'),
    tokenCost: task.tokenCost,
    summary: '研究完成',
    insights: [],
    recommendations: [],
    guardLog: task.guardLog,
    stepResults,
  };
}
