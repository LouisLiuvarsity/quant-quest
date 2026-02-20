/*
 * HiringPanel - Recruit new researchers
 * Shows available candidates with stats, salary, specialty
 * Pixel card style with hire button
 */

import { useGame, HIRING_POOL } from '@/contexts/GameContext';
import { toast } from 'sonner';

const SPECIALTY_LABELS: Record<string, string> = {
  factor: '因子研究',
  strategy: '策略开发',
  risk: '风控分析',
  data: '数据工程',
};

const SPECIALTY_COLORS: Record<string, string> = {
  factor: 'oklch(0.55 0.2 265)',
  strategy: 'oklch(0.72 0.19 155)',
  risk: 'oklch(0.63 0.22 25)',
  data: 'oklch(0.75 0.12 200)',
};

const LEVEL_STARS = (level: number) => '⭐'.repeat(Math.min(level, 5));

export function HiringPanel() {
  const { state, hireResearcher } = useGame();
  const hiredIds = state.researchers.map(r => r.id);
  const availableCandidates = HIRING_POOL.filter(c => !hiredIds.includes(c.id));

  const handleHire = (id: string) => {
    const candidate = HIRING_POOL.find(c => c.id === id);
    if (!candidate) return;

    const monthlyCost = candidate.salary * 30;
    if (state.credits < monthlyCost) {
      toast.error('积分不足', { description: `需要 ${monthlyCost.toLocaleString()} 积分支付首月工资` });
      return;
    }

    if (state.researchers.length >= 6) {
      toast.error('工位已满', { description: '最多只能雇佣6名研究员' });
      return;
    }

    hireResearcher(id);
    toast.success(`${candidate.name} 已加入团队！`, { description: `每日工资: ${candidate.salary.toLocaleString()} 积分` });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header info */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-pixel text-[8px] text-[oklch(0.6_0.02_260)]">团队规模</span>
          <span className="font-mono-data text-xs text-[oklch(0.9_0.01_260)]">
            {state.researchers.length} / 6
          </span>
        </div>
        <div className="pixel-progress">
          <div
            className="pixel-progress-fill bg-[oklch(0.55_0.2_265)]"
            style={{ width: `${(state.researchers.length / 6) * 100}%` }}
          />
        </div>
        <p className="font-display text-[11px] text-[oklch(0.5_0.02_260)] mt-2">
          招聘研究员需支付首月工资（30天），之后每日自动扣除
        </p>
      </div>

      {/* Candidate list */}
      {availableCandidates.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-pixel text-[10px] text-[oklch(0.5_0.02_260)]">暂无可用候选人</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-2">推进游戏天数后会刷新候选人</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableCandidates.map(candidate => (
            <div
              key={candidate.id}
              className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-4 hover:border-[oklch(0.4_0.1_265)] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{candidate.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                      {candidate.name}
                    </h3>
                    <span className="font-pixel text-[7px]" style={{ color: SPECIALTY_COLORS[candidate.specialty] }}>
                      {SPECIALTY_LABELS[candidate.specialty]}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-display text-xs text-[oklch(0.5_0.02_260)]">等级</span>
                      <span className="text-xs">{LEVEL_STARS(candidate.level)} Lv.{candidate.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-display text-xs text-[oklch(0.5_0.02_260)]">日薪</span>
                      <span className="font-mono-data text-xs text-[oklch(0.82_0.15_85)]">
                        🪙 {candidate.salary.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-display text-xs text-[oklch(0.5_0.02_260)]">首月费用</span>
                      <span className="font-mono-data text-xs text-[oklch(0.82_0.15_85)]">
                        🪙 {(candidate.salary * 30).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-display text-xs text-[oklch(0.5_0.02_260)]">心情</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-[oklch(0.2_0.02_260)]">
                          <div
                            className="h-full bg-[oklch(0.72_0.19_155)]"
                            style={{ width: `${candidate.mood}%` }}
                          />
                        </div>
                        <span className="font-mono-data text-[10px] text-[oklch(0.6_0.02_260)]">{candidate.mood}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleHire(candidate.id)}
                    className="mt-3 w-full font-pixel text-[8px] py-2 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all active:translate-y-0.5"
                    style={{
                      boxShadow: 'inset -2px -2px 0 oklch(0.4 0.2 265), inset 2px 2px 0 oklch(0.65 0.15 265)',
                    }}
                  >
                    💼 招聘 · {(candidate.salary * 30).toLocaleString()} 积分
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
