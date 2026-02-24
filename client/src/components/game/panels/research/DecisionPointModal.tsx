import type { TaskDecisionOption, TaskType } from '@/contexts/GameContext';

interface DecisionPointCopy {
  headline: string;
  what: string;
  why: string;
  pitfall: string;
  cta: string;
}

const DECISION_POINT_COPIES: Record<string, DecisionPointCopy> = {
  S4: {
    headline: '描述你的交易直觉',
    what: '把信号逻辑定义清楚，确保可复现。',
    why: 'S4 决定了后续整个因子链路的方向与可解释性。',
    pitfall: '常见误区是逻辑过于复杂，导致验证阶段难以复盘。',
    cta: '生成因子草案并继续',
  },
  S10: {
    headline: '训练集参数搜索',
    what: '在 IS 里确定候选参数区间与优先方案。',
    why: '这是筛选参数的唯一训练阶段，影响后续泛化质量。',
    pitfall: '常见误区是搜索空间过宽，容易导致过拟合。',
    cta: '确认 Top 参数方案',
  },
  S11: {
    headline: '验证集独立检验',
    what: '在 VAL 上检验 IS 方案是否仍稳定有效。',
    why: 'VAL 是过拟合防线，能直接揭示泛化能力。',
    pitfall: '常见误区是只看收益不看回撤和换手。',
    cta: '确认验证结论',
  },
  S16: {
    headline: '输出因子档案卡',
    what: '给出采纳/淘汰结论并归档参数区间。',
    why: '档案卡是后续多因子与策略复用的入口资产。',
    pitfall: '常见误区是结论只看单一指标，忽视稳定性。',
    cta: '确认因子结论',
  },
  M2: {
    headline: '去冗余筛选',
    what: '移除高相关因子，保留独立贡献更强的候选。',
    why: '去冗余能降低重复下注，提升组合稳健性。',
    pitfall: '常见误区是保留过多相关因子导致回撤放大。',
    cta: '应用去冗余结果',
  },
  M3: {
    headline: '选择合成层级',
    what: '在信号层与仓位层中选定当前合成方式。',
    why: '合成层级决定后续风控和调参复杂度。',
    pitfall: '常见误区是忽略执行复杂度，只追求理论收益。',
    cta: '确认合成方式',
  },
  M4: {
    headline: '确定权重方案',
    what: '在等权、表现加权、滚动动态中选择权重策略。',
    why: '权重方案直接影响组合稳定性和换手水平。',
    pitfall: '常见误区是过度动态调权，导致成本上升。',
    cta: '确认权重方案',
  },
  M11: {
    headline: '与最优单因子对比',
    what: '对比多因子与单因子在 OOS 的核心指标。',
    why: '只有显著优于最优单因子，合成才有价值。',
    pitfall: '常见误区是只比较 Sharpe，不比较回撤和成本。',
    cta: '确认对比结论',
  },
  M12: {
    headline: '输出组合档案卡',
    what: '形成最终采纳决策并沉淀组合资产。',
    why: '组合档案卡将直接用于策略部署与复盘。',
    pitfall: '常见误区是 OOS 后继续回调参，污染测试结论。',
    cta: '确认组合结论',
  },
};

const DEFAULT_DECISION_COPY: DecisionPointCopy = {
  headline: '研究关键决策点',
  what: '选择当前步骤的推进方案并确认执行。',
  why: '该决策会影响后续质量、风险、效率与成本。',
  pitfall: '常见误区是忽略成本与稳定性，只看短期速度。',
  cta: '应用决策并继续',
};

function getDecisionPointCopy(stepId?: string): DecisionPointCopy {
  if (!stepId) return DEFAULT_DECISION_COPY;
  return DECISION_POINT_COPIES[stepId] || DEFAULT_DECISION_COPY;
}

export function DecisionPointModal({
  open,
  onClose,
  taskType,
  stepId,
  stepName,
  decisionOptions,
  selectedDecisionId,
  onSelectDecision,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  taskType: TaskType;
  stepId?: string;
  stepName?: string;
  decisionOptions: TaskDecisionOption[];
  selectedDecisionId: string;
  onSelectDecision: (id: string) => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const copy = getDecisionPointCopy(stepId);
  const selectedOption = decisionOptions.find(option => option.id === selectedDecisionId);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[oklch(0.06_0.015_260_/_0.82)] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[680px] max-h-[85vh] overflow-y-auto border-2 border-[oklch(0.82_0.15_85_/_0.5)] bg-[oklch(0.1_0.015_260_/_0.98)] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
              🔀 {taskType === 'single_factor' ? '单因子' : '多因子'}关键决策点
            </p>
            <p className="font-display text-[13px] font-semibold text-[oklch(0.92_0.01_260)] mt-1">
              {stepId} · {stepName}
            </p>
            <p className="font-display text-[11px] text-[oklch(0.72_0.19_155)] mt-1">{copy.headline}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 font-pixel text-[7px] border border-[oklch(0.3_0.03_260)] text-[oklch(0.52_0.02_260)] px-2 py-1 hover:border-[oklch(0.82_0.15_85)] hover:text-[oklch(0.82_0.15_85)] transition-colors"
          >
            关闭
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">做什么</p>
            <p className="font-display text-[10px] text-[oklch(0.78_0.02_260)] mt-1 leading-relaxed">{copy.what}</p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">为什么</p>
            <p className="font-display text-[10px] text-[oklch(0.78_0.02_260)] mt-1 leading-relaxed">{copy.why}</p>
          </div>
          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">常见误区</p>
            <p className="font-display text-[10px] text-[oklch(0.78_0.02_260)] mt-1 leading-relaxed">{copy.pitfall}</p>
          </div>
        </div>

        <div className="space-y-2">
          {decisionOptions.map(option => {
            const isSelected = option.id === selectedDecisionId;
            const costPct = Math.round(option.impact.costMultiplier * 100);
            return (
              <button
                key={option.id}
                onClick={() => onSelectDecision(option.id)}
                className={`w-full text-left border-2 px-3 py-2.5 transition-all ${
                  isSelected
                    ? 'border-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.12)]'
                    : 'border-[oklch(0.3_0.03_260)] bg-[oklch(0.14_0.02_260)] hover:border-[oklch(0.5_0.04_260)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`font-display text-xs font-semibold ${isSelected ? 'text-[oklch(0.9_0.08_85)]' : 'text-[oklch(0.82_0.02_260)]'}`}>{option.label}</span>
                  <span className="font-mono-data text-[10px] text-[oklch(0.55_0.02_260)]">
                    质{option.impact.quality >= 0 ? '+' : ''}{option.impact.quality} 风{option.impact.risk >= 0 ? '+' : ''}{option.impact.risk} 速{option.impact.efficiency >= 0 ? '+' : ''}{option.impact.efficiency} 成本{costPct >= 0 ? '+' : ''}{costPct}%
                  </span>
                </div>
                <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)] mt-1.5 leading-relaxed">{option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.018_260)] p-2">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">当前选择</p>
          <p className="font-display text-[11px] text-[oklch(0.82_0.02_260)] mt-1">
            {selectedOption ? selectedOption.label : '请选择一个方案'}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="font-pixel text-[7px] px-3 py-2 border border-[oklch(0.28_0.03_260)] text-[oklch(0.55_0.02_260)] hover:text-[oklch(0.82_0.15_85)] hover:border-[oklch(0.82_0.15_85)] transition-colors"
          >
            稍后处理
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedOption}
            className={`font-pixel text-[7px] px-3 py-2 border-2 transition-all ${
              selectedOption
                ? 'bg-[oklch(0.82_0.15_85)] text-[oklch(0.12_0.02_260)] border-[oklch(0.88_0.16_85)] hover:brightness-110'
                : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
            }`}
          >
            ✅ {copy.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

