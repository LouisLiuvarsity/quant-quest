/*
 * HiringPanel - Hire new researchers
 * All researchers have the same abilities, only differ in skin
 * User picks a skin and assigns a role (factor/backtest/optimize)
 * Hiring costs a flat token fee
 */

import { useGame, AVAILABLE_SKINS, ROLE_LABELS, ROLE_COLORS, type ResearcherRole } from '@/contexts/GameContext';
import { useState } from 'react';
import { toast } from 'sonner';

const HIRE_COST = 200_000;

export function HiringPanel() {
  const { state, hireResearcher } = useGame();
  const [selectedSkin, setSelectedSkin] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<ResearcherRole>('factor');

  const hiredNames = state.researchers.map(r => r.skin.name);
  const availableSkins = AVAILABLE_SKINS.map((skin, i) => ({
    ...skin,
    index: i,
    hired: hiredNames.includes(skin.name),
  }));

  const canHire = state.researchers.length < 6 && state.credits >= HIRE_COST;

  const handleHire = () => {
    if (selectedSkin === null) {
      toast.error('请先选择一位研究员');
      return;
    }
    if (!canHire) {
      toast.error(state.researchers.length >= 6 ? '团队已满（最多6人）' : '积分不足');
      return;
    }
    hireResearcher(selectedSkin, selectedRole);
    setSelectedSkin(null);
    toast.success('招聘成功！');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Team status */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)]">团队状态</span>
          <span className="font-mono-data text-xs text-[oklch(0.7_0.02_260)]">
            {state.researchers.length}/6
          </span>
        </div>
        <div className="flex gap-1.5">
          {state.researchers.map(r => (
            <div
              key={r.id}
              className="w-8 h-8 flex items-center justify-center text-sm border-2"
              style={{ borderColor: ROLE_COLORS[r.role], backgroundColor: `${ROLE_COLORS[r.role]}10` }}
              title={`${r.skin.name} - ${ROLE_LABELS[r.role]}`}
            >
              {r.skin.avatar}
            </div>
          ))}
          {Array.from({ length: 6 - state.researchers.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-8 h-8 border-2 border-dashed border-[oklch(0.25_0.03_260)] flex items-center justify-center text-[oklch(0.3_0.03_260)] text-xs"
            >
              +
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
        <p className="font-pixel text-[7px] text-[oklch(0.75_0.12_200)] mb-2">ℹ️ 关于研究员</p>
        <div className="space-y-1.5 font-display text-[11px] text-[oklch(0.55_0.02_260)] leading-relaxed">
          <p>• 所有研究员能力相同，底层使用同一个AI Agent</p>
          <p>• 不同的只是外观皮肤和你分配的工作分工</p>
          <p>• 分工可随时更改（空闲状态下）</p>
          <p>• 招聘费用：{HIRE_COST.toLocaleString()} Token（一次性）</p>
        </div>
      </div>

      {/* Candidate selection */}
      <div>
        <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-3">选择研究员</p>
        <div className="grid grid-cols-2 gap-2">
          {availableSkins.map(skin => (
            <button
              key={skin.index}
              onClick={() => !skin.hired && setSelectedSkin(skin.index)}
              disabled={skin.hired}
              className={`p-3 border-2 text-left transition-all ${
                skin.hired
                  ? 'opacity-40 cursor-not-allowed border-[oklch(0.2_0.02_260)] bg-[oklch(0.12_0.02_260)]'
                  : selectedSkin === skin.index
                  ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.08)]'
                  : 'border-[oklch(0.25_0.03_260)] bg-[oklch(0.14_0.02_260)] hover:border-[oklch(0.35_0.04_265)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{skin.avatar}</span>
                <div>
                  <p className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">
                    {skin.name}
                  </p>
                  <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">
                    {skin.hired ? '已在团队中' : 'AI Agent'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Role assignment */}
      {selectedSkin !== null && (
        <div className="animate-fade-in-up">
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-3">分配分工</p>
          <div className="space-y-2">
            {(Object.keys(ROLE_LABELS) as ResearcherRole[]).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full p-3 border-2 text-left transition-all flex items-center justify-between ${
                  selectedRole === role
                    ? 'bg-[oklch(0.18_0.03_260)]'
                    : 'bg-[oklch(0.14_0.02_260)] hover:bg-[oklch(0.16_0.025_260)]'
                }`}
                style={{
                  borderColor: selectedRole === role ? ROLE_COLORS[role] : 'oklch(0.25 0.03 260)',
                }}
              >
                <div>
                  <p className="font-display text-sm font-semibold" style={{ color: ROLE_COLORS[role] }}>
                    {ROLE_LABELS[role]}
                  </p>
                  <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-0.5">
                    {role === 'factor' && '挖掘有效的Alpha因子'}
                    {role === 'backtest' && '对策略进行历史回测验证'}
                    {role === 'optimize' && '组合优化或参数优化'}
                  </p>
                </div>
                {selectedRole === role && (
                  <span className="font-pixel text-[7px]" style={{ color: ROLE_COLORS[role] }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hire button */}
      {selectedSkin !== null && (
        <button
          onClick={handleHire}
          disabled={!canHire}
          className="w-full font-pixel text-[9px] py-3.5 bg-[oklch(0.55_0.2_265)] text-white border-3 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            boxShadow: 'inset -3px -3px 0 oklch(0.4 0.2 265), inset 3px 3px 0 oklch(0.68 0.15 265)',
          }}
        >
          🪙 招聘 · {HIRE_COST.toLocaleString()} Token
        </button>
      )}
    </div>
  );
}
