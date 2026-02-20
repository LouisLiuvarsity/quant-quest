/*
 * ResearchPanel - Factor research management
 * Shows discovered factors with IC, Sharpe, status
 * Assign researchers to discover new factors
 */

import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: '已发现', color: 'oklch(0.55 0.2 265)' },
  validated: { label: '已验证', color: 'oklch(0.82 0.15 85)' },
  deployed: { label: '已部署', color: 'oklch(0.72 0.19 155)' },
};

const RESEARCH_TASKS = [
  '动量因子挖掘',
  '波动率因子研究',
  '基本面因子分析',
  '另类数据因子开发',
  '高频微观结构因子',
  '情绪因子构建',
];

export function ResearchPanel() {
  const { state, assignTask } = useGame();
  const idleResearchers = state.researchers.filter(r => r.status === 'idle');

  const handleAssignTask = (researcherId: string, task: string) => {
    assignTask(researcherId, task);
    toast.success('任务已分配', { description: `研究员已开始「${task}」` });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Assign new research */}
      {idleResearchers.length > 0 && (
        <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.55_0.2_265)] p-3">
          <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)] mb-3">分配研究任务</p>
          {idleResearchers.map(r => (
            <div key={r.id} className="mb-3 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{r.avatar}</span>
                <span className="font-display text-sm text-[oklch(0.9_0.01_260)]">{r.name}</span>
                <span className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)]">空闲中</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {RESEARCH_TASKS.map(task => (
                  <button
                    key={task}
                    onClick={() => handleAssignTask(r.id, task)}
                    className="font-display text-[10px] px-2 py-1.5 bg-[oklch(0.12_0.02_260)] border border-[oklch(0.3_0.03_260)] text-[oklch(0.7_0.02_260)] hover:border-[oklch(0.55_0.2_265)] hover:text-[oklch(0.85_0.01_260)] transition-all text-left"
                  >
                    🔬 {task}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Factor list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
            已发现因子 ({state.factors.length})
          </p>
        </div>

        <div className="space-y-2">
          {state.factors.map(factor => {
            const status = STATUS_LABELS[factor.status];
            return (
              <div
                key={factor.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.25_0.03_260)] p-3 hover:border-[oklch(0.35_0.03_260)] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                      {factor.name}
                    </h4>
                    <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-0.5">
                      {factor.description}
                    </p>
                  </div>
                  <span
                    className="font-pixel text-[7px] px-2 py-0.5 border"
                    style={{ color: status.color, borderColor: status.color }}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center bg-[oklch(0.12_0.02_260)] py-1.5 px-2">
                    <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)]">IC</p>
                    <p className="font-mono-data text-xs font-bold text-[oklch(0.55_0.2_265)]">
                      {factor.ic.toFixed(3)}
                    </p>
                  </div>
                  <div className="text-center bg-[oklch(0.12_0.02_260)] py-1.5 px-2">
                    <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)]">Sharpe</p>
                    <p className="font-mono-data text-xs font-bold text-[oklch(0.72_0.19_155)]">
                      {factor.sharpe.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center bg-[oklch(0.12_0.02_260)] py-1.5 px-2">
                    <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)]">换手率</p>
                    <p className="font-mono-data text-xs font-bold text-[oklch(0.82_0.15_85)]">
                      {(factor.turnover * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2">
                  <span className="font-pixel text-[6px] px-1.5 py-0.5 bg-[oklch(0.2_0.03_260)] text-[oklch(0.6_0.02_260)]">
                    {factor.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
