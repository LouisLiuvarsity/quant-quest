import type { GameState } from '@/contexts/GameContext';

export type MissionStageKey =
  | 'project_config'
  | 'single_factor_baseline'
  | 'multi_factor_validation'
  | 'strategy_deployment'
  | 'scale_and_optimize';

export interface MissionStage {
  key: MissionStageKey;
  label: string;
  goal: string;
  detail: string;
  cta: string;
  panel: 'research' | 'strategy';
}

const STAGE_BLUEPRINT: MissionStage[] = [
  {
    key: 'project_config',
    label: '阶段 1 · 项目配置',
    goal: '完成项目初始化',
    detail: '先统一 K 线、资产池和数据切分，后续所有任务强制继承这份口径。',
    cta: '去配置项目',
    panel: 'research',
  },
  {
    key: 'single_factor_baseline',
    label: '阶段 2 · 单因子基线',
    goal: '拿到 2 个通过因子',
    detail: '优先跑单因子形成可复用资产，构建稳定的研究基线。',
    cta: '发起单因子任务',
    panel: 'research',
  },
  {
    key: 'multi_factor_validation',
    label: '阶段 3 · 多因子验证',
    goal: '产出可采纳组合',
    detail: '完成去冗余、合成与 OOS 终极评估，确认多因子优于最优单因子。',
    cta: '进入多因子合成',
    panel: 'research',
  },
  {
    key: 'strategy_deployment',
    label: '阶段 4 · 策略部署',
    goal: '上线首个实盘策略',
    detail: '将通过因子或采纳组合转为策略并上线模拟运行。',
    cta: '去策略工坊',
    panel: 'strategy',
  },
  {
    key: 'scale_and_optimize',
    label: '阶段 5 · 扩展优化',
    goal: '并行优化策略池',
    detail: '平衡质量、风险和效率，持续提高组合稳定性和收益质量。',
    cta: '继续研究优化',
    panel: 'research',
  },
];

interface StageProgressContext {
  hasProjectConfig: boolean;
  passedFactors: number;
  adoptedPortfolios: number;
  liveStrategies: number;
  passedTheses: number;
  adoptedTheses: number;
}

const isStageDone = (stageKey: MissionStageKey, ctx: StageProgressContext): boolean => {
  switch (stageKey) {
    case 'project_config':
      return ctx.hasProjectConfig;
    case 'single_factor_baseline':
      return ctx.passedFactors >= 2 || ctx.passedTheses >= 2;
    case 'multi_factor_validation':
      return ctx.adoptedPortfolios >= 1 || ctx.adoptedTheses >= 1;
    case 'strategy_deployment':
      return ctx.liveStrategies >= 1;
    case 'scale_and_optimize':
      return false;
    default:
      return false;
  }
};

export interface MissionSnapshot {
  activeStage: MissionStage;
  waitingTasks: number;
  progress: Array<MissionStage & { done: boolean }>;
}

export const buildMissionSnapshot = (state: GameState): MissionSnapshot => {
  const passedFactors = state.factorCards.filter(card => card.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(card => card.status === 'adopted').length;
  const liveStrategies = state.strategies.filter(strategy => strategy.status === 'live').length;
  const waitingTasks = state.activeTasks.filter(task => task.status === 'paused').length
    + state.theses.filter(thesis => thesis.status === 'needs_review').length;
  const passedTheses = state.theses.filter(thesis => thesis.status === 'passed').length;
  const adoptedTheses = state.theses.filter(thesis => thesis.status === 'adopted').length;

  const ctx: StageProgressContext = {
    hasProjectConfig: Boolean(state.projectConfig),
    passedFactors,
    adoptedPortfolios,
    liveStrategies,
    passedTheses,
    adoptedTheses,
  };

  const progress = STAGE_BLUEPRINT.map(stage => ({
    ...stage,
    done: isStageDone(stage.key, ctx),
  }));

  const nextStage = progress.find(stage => !stage.done) ?? progress[progress.length - 1];

  return {
    activeStage: nextStage,
    waitingTasks,
    progress,
  };
};

export const buildAiCoachTips = (state: GameState): string[] => {
  const waitingTasks = state.activeTasks.filter(task => task.status === 'paused').length;
  const passedFactors = state.factorCards.filter(card => card.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(card => card.status === 'adopted').length;
  const liveStrategies = state.strategies.filter(strategy => strategy.status === 'live').length;
  const activeEvent = state.quarter.activeEvent;
  const learningCards = state.learningCards.length;
  const pendingLearningCards = state.learningCards.filter(card => !card.reviewed).length;

  if (!state.projectConfig) {
    return [
      '先锁定项目口径：K 线、资产池筛选与 IS/VAL/OOS 切分。',
      '优先使用三段切分，避免后续多因子阶段的 OOS 污染。',
      '确认配置后再给研究员派单，避免重复返工。',
    ];
  }

  if (activeEvent) {
    return [
      `当前事件：${activeEvent.title}（剩余 ${activeEvent.remainingDays} 天），先考虑它对成本与信任分的冲击。`,
      '高不确定环境下优先稳健命题，减少一次性激进押注。',
      '若季度分下降，先补审计质量与回撤控制，再追收益。',
    ];
  }

  if (pendingLearningCards > 0) {
    return [
      `你有 ${pendingLearningCards} 张学习卡待复盘，先把结论沉淀为可复用经验。`,
      '每张学习卡至少确认“关键证据、学到什么、下次避免什么”。',
      '先复盘再开新命题，能显著提高后续通过率。',
    ];
  }

  if (learningCards === 0 && state.theses.some(thesis => ['passed', 'failed', 'parked', 'adopted', 'hold', 'rejected'].includes(thesis.status))) {
    return [
      '你已完成首个裁决，下一步去学习卡库完成第一次复盘。',
      '复盘不是总结口号，而是沉淀可执行的下次动作。',
      '完成首张学习卡后再并行扩展命题池。',
    ];
  }

  if (waitingTasks > 0) {
    return [
      `当前有 ${waitingTasks} 个 CEO 决策点待处理，先清空阻塞任务。`,
      '优先选择“平衡推进”作为默认策略，兼顾质量与成本。',
      '每次决策后观察质量/风险/效率三维画像的变化。',
    ];
  }

  if (passedFactors < 2) {
    return [
      '先创建单因子命题，再分配参数探索包与稳健性包。',
      '命题的目标要明确：收益、回撤或稳健，不要混在一起。',
      '若验证集表现断崖下降，优先补一条反例验证证据。',
    ];
  }

  if (adoptedPortfolios === 0) {
    return [
      '先创建组合命题并锁定 Blend Plan，再进入 OOS 审判。',
      'OOS 审判券是稀缺资源，提交前先确认证据是否收敛。',
      '终审后不要回调参数，保持结果可审计与可复现。',
    ];
  }

  if (liveStrategies === 0) {
    return [
      '从采纳组合中创建策略，先上线 1 条模拟实盘。',
      '优先关注回撤与换手，避免只看收益率。',
      '用报告复盘把结论沉淀成可复用模板。',
    ];
  }

  return [
    '并行运行研究任务，维持因子池新陈代谢。',
    '定期淘汰边际贡献低的组合，保持策略池质量。',
    '将有效流程沉淀为模板，缩短后续研究启动时间。',
  ];
};

export const AI_PROMPT_TEMPLATES = {
  coach_step_brief:
    '你是量化研究教练。请用三行输出：1) 这一步要做什么；2) 为什么重要；3) 常见误区与规避建议。',
  factor_spec_builder:
    '你是规则类单因子助手。根据用户自然语言想法，输出 factor_type、factor_params、fwd_period 建议与风险提示。',
  decision_guard:
    '你是流程审计器。检查是否存在 OOS 泄露、项目配置不一致、或无效派单（未配置先启动）。给出阻断理由与修复动作。',
  report_translator:
    '你是策略报告翻译器。将 Sharpe、回撤、胜率、IC/RankICIR 翻译成“可上线/需观察/淘汰”结论，并附下一步动作。',
} as const;
