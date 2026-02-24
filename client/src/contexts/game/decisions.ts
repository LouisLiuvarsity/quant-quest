import type { TaskDecisionImpact, TaskDecisionOption, TaskType } from './schema';

const DEFAULT_SINGLE_FACTOR_DECISIONS: TaskDecisionOption[] = [
  {
    id: 'safe',
    label: '保守推进',
    description: '更看重稳定性与可解释性，牺牲一部分速度。',
    impact: { quality: 4, risk: -6, efficiency: -4, costMultiplier: 0.03 },
  },
  {
    id: 'balanced',
    label: '平衡推进',
    description: '在稳健、效率和成本之间取中间方案。',
    impact: { quality: 2, risk: 0, efficiency: 2, costMultiplier: 0.01 },
  },
  {
    id: 'aggressive',
    label: '激进推进',
    description: '更快探索更大空间，承担更高风险和成本波动。',
    impact: { quality: 3, risk: 9, efficiency: 7, costMultiplier: 0.06 },
  },
];

const DEFAULT_MULTI_FACTOR_DECISIONS: TaskDecisionOption[] = [
  {
    id: 'robust',
    label: '鲁棒优先',
    description: '优先降低因子冗余与组合回撤。',
    impact: { quality: 4, risk: -5, efficiency: -3, costMultiplier: 0.03 },
  },
  {
    id: 'balanced',
    label: '平衡优先',
    description: '兼顾组合提升幅度与稳定性。',
    impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.01 },
  },
  {
    id: 'alpha',
    label: 'Alpha优先',
    description: '追求更高收益弹性，接受更高波动和换手。',
    impact: { quality: 3, risk: 8, efficiency: 6, costMultiplier: 0.05 },
  },
];

const STEP_DECISION_OPTIONS: Record<string, TaskDecisionOption[]> = {
  S0: [
    {
      id: 'strict_split',
      label: '严格切分',
      description: '提升数据隔离强度，减少过拟合风险。',
      impact: { quality: 6, risk: -8, efficiency: -6, costMultiplier: 0.05 },
    },
    {
      id: 'balanced_split',
      label: '标准切分',
      description: '使用默认 IS/VAL/OOS 方案。',
      impact: { quality: 3, risk: 0, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'fast_split',
      label: '快速切分',
      description: '缩短验证链路，尽快进入信号构造。',
      impact: { quality: -2, risk: 7, efficiency: 9, costMultiplier: -0.02 },
    },
  ],
  S4: [
    {
      id: 'interpretable_signal',
      label: '可解释信号',
      description: '强调逻辑可解释和可复核。',
      impact: { quality: 5, risk: -4, efficiency: -2, costMultiplier: 0.03 },
    },
    {
      id: 'hybrid_signal',
      label: '混合信号',
      description: '兼顾表达能力和稳定性。',
      impact: { quality: 3, risk: 1, efficiency: 3, costMultiplier: 0.02 },
    },
    {
      id: 'explore_signal',
      label: '探索型信号',
      description: '允许更激进的特征组合，冲击更高上限。',
      impact: { quality: 1, risk: 10, efficiency: 7, costMultiplier: 0.07 },
    },
  ],
  S10: [
    {
      id: 'narrow_search',
      label: '稳健网格',
      description: '缩小参数空间，优先稳定表现。',
      impact: { quality: 4, risk: -5, efficiency: -4, costMultiplier: 0.04 },
    },
    {
      id: 'regular_search',
      label: '常规网格',
      description: '使用中等规模参数搜索。',
      impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.02 },
    },
    {
      id: 'wide_search',
      label: '全量搜索',
      description: '扩大搜索空间，争取更优解但更耗费资源。',
      impact: { quality: 6, risk: 6, efficiency: 6, costMultiplier: 0.08 },
    },
  ],
  S11: [
    {
      id: 'strict_val',
      label: '严格阈值',
      description: '提高 VAL 通过门槛，过滤边缘因子。',
      impact: { quality: 5, risk: -6, efficiency: -3, costMultiplier: 0.02 },
    },
    {
      id: 'std_val',
      label: '标准阈值',
      description: '维持默认通过标准。',
      impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'loose_val',
      label: '宽松阈值',
      description: '提升探索速度，允许更多候选进入后续环节。',
      impact: { quality: -2, risk: 8, efficiency: 6, costMultiplier: -0.01 },
    },
  ],
  S16: [
    {
      id: 'hold_quality',
      label: '质量优先',
      description: '仅保留高置信度结论进入档案库。',
      impact: { quality: 5, risk: -5, efficiency: -2, costMultiplier: 0.03 },
    },
    {
      id: 'balanced_close',
      label: '平衡收敛',
      description: '在产出数量和结论质量间取平衡。',
      impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'ship_fast',
      label: '快速入库',
      description: '优先缩短研究闭环，加速下一轮迭代。',
      impact: { quality: -3, risk: 9, efficiency: 7, costMultiplier: -0.02 },
    },
  ],
  M2: [
    {
      id: 'hard_dedup',
      label: '强去冗余',
      description: '严格剔除高相关因子，重视独立性。',
      impact: { quality: 5, risk: -6, efficiency: -3, costMultiplier: 0.03 },
    },
    {
      id: 'mid_dedup',
      label: '中等去冗余',
      description: '保留一定相关因子，平衡信息密度。',
      impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'soft_dedup',
      label: '弱去冗余',
      description: '保留更多候选，提高组合探索范围。',
      impact: { quality: 0, risk: 8, efficiency: 6, costMultiplier: 0.05 },
    },
  ],
  M3: [
    {
      id: 'position_blend_safe',
      label: '仓位层优先',
      description: '先控制单因子仓位，再做组合叠加。',
      impact: { quality: 4, risk: -4, efficiency: -2, costMultiplier: 0.03 },
    },
    {
      id: 'signal_blend_mid',
      label: '信号层优先',
      description: '默认信号层合成方式，兼顾可解释性。',
      impact: { quality: 2, risk: 2, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'hybrid_blend_fast',
      label: '混合快速',
      description: '尝试多种合成路径，追求收益上限。',
      impact: { quality: 1, risk: 8, efficiency: 6, costMultiplier: 0.06 },
    },
  ],
  M4: [
    {
      id: 'equal_weight',
      label: '等权稳态',
      description: '限制过拟合，控制权重漂移。',
      impact: { quality: 3, risk: -4, efficiency: 1, costMultiplier: 0.01 },
    },
    {
      id: 'perf_weight',
      label: '表现加权',
      description: '按历史表现分配权重，常规方案。',
      impact: { quality: 3, risk: 2, efficiency: 3, costMultiplier: 0.02 },
    },
    {
      id: 'rolling_weight',
      label: '滚动动态',
      description: '动态调权以追踪市场状态变化。',
      impact: { quality: 2, risk: 9, efficiency: 6, costMultiplier: 0.07 },
    },
  ],
  M11: [
    {
      id: 'benchmark_strict',
      label: '严格对照',
      description: '必须显著优于单因子才进入候选。',
      impact: { quality: 5, risk: -5, efficiency: -3, costMultiplier: 0.03 },
    },
    {
      id: 'benchmark_mid',
      label: '标准对照',
      description: '采用常规提升阈值。',
      impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'benchmark_alpha',
      label: '激进对照',
      description: '容忍回撤换取潜在更高收益。',
      impact: { quality: 1, risk: 8, efficiency: 5, costMultiplier: 0.04 },
    },
  ],
  M12: [
    {
      id: 'adopt_strict',
      label: '谨慎采纳',
      description: '仅将高稳定性组合标记为可部署。',
      impact: { quality: 5, risk: -6, efficiency: -3, costMultiplier: 0.03 },
    },
    {
      id: 'adopt_balanced',
      label: '平衡采纳',
      description: '兼顾组合规模和上线效率。',
      impact: { quality: 2, risk: 1, efficiency: 2, costMultiplier: 0.01 },
    },
    {
      id: 'adopt_fast',
      label: '快速采纳',
      description: '扩大可部署组合池，加速策略迭代。',
      impact: { quality: -2, risk: 8, efficiency: 6, costMultiplier: -0.01 },
    },
  ],
};

const formatImpactNumber = (value: number) => `${value > 0 ? '+' : ''}${value}`;

export const summarizeDecisionImpact = (impact: TaskDecisionImpact) => {
  const multiplierPct = Math.round(impact.costMultiplier * 100);
  return `质量${formatImpactNumber(impact.quality)} 风险${formatImpactNumber(impact.risk)} 速度${formatImpactNumber(impact.efficiency)} 成本${formatImpactNumber(multiplierPct)}%`;
};

export function getDecisionOptions(taskType: TaskType, stepId: string): TaskDecisionOption[] {
  const configured = STEP_DECISION_OPTIONS[stepId];
  if (configured) return configured;
  return taskType === 'single_factor' ? DEFAULT_SINGLE_FACTOR_DECISIONS : DEFAULT_MULTI_FACTOR_DECISIONS;
}
