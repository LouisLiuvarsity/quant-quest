/*
 * ResearcherDetailPanel - Shows researcher info when clicked in office
 * Displays: skin, role, current task progress, completed tasks, token usage
 * Can change role (if idle), view completed report
 */

import { useGame, ROLE_LABELS, ROLE_COLORS, TASK_TYPE_LABELS, type ResearcherRole } from '@/contexts/GameContext';
import { toast } from 'sonner';

export function ResearcherDetailPanel() {
  const { selectedResearcher, state, changeRole, setActivePanel, setSelectedReport } = useGame();

  if (!selectedResearcher) {
    return (
      <div className="p-4 text-center">
        <p className="font-display text-sm text-[oklch(0.5_0.02_260)]">请在办公室中点击一位研究员</p>
      </div>
    );
  }

  const researcher = state.researchers.find(r => r.id === selectedResearcher.id) || selectedResearcher;

  const handleChangeRole = (role: ResearcherRole) => {
    if (researcher.status !== 'idle') {
      toast.error('研究员正在工作中，无法更改分工');
      return;
    }
    changeRole(researcher.id, role);
    toast.success(`已将 ${researcher.skin.name} 的分工更改为${ROLE_LABELS[role]}`);
  };

  const handleViewReport = () => {
    if (researcher.currentTask?.reportId) {
      const report = state.reports.find(r => r.id === researcher.currentTask?.reportId);
      if (report) {
        setSelectedReport(report);
        setActivePanel('report-viewer');
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Researcher card */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 p-4 text-center" style={{ borderColor: researcher.skin.color }}>
        <div className="text-4xl mb-2">{researcher.skin.avatar}</div>
        <h3 className="font-display text-lg font-bold text-[oklch(0.92_0.01_260)]">{researcher.skin.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span
            className="font-pixel text-[7px] px-2 py-1 border"
            style={{ color: ROLE_COLORS[researcher.role], borderColor: ROLE_COLORS[researcher.role] }}
          >
            {ROLE_LABELS[researcher.role]}
          </span>
          <span className={`font-pixel text-[7px] px-2 py-1 border ${
            researcher.status === 'idle' ? 'text-[oklch(0.5_0.02_260)] border-[oklch(0.3_0.03_260)]'
            : researcher.status === 'researching' ? 'text-[oklch(0.55_0.2_265)] border-[oklch(0.55_0.2_265)]'
            : 'text-[oklch(0.72_0.19_155)] border-[oklch(0.72_0.19_155)]'
          }`}>
            {researcher.status === 'idle' ? '💤 空闲' : researcher.status === 'researching' ? '🔬 研究中' : '✅ 已完成'}
          </span>
        </div>
        <p className="font-display text-[10px] text-[oklch(0.45_0.02_260)] mt-2">
          底层: 统一AI Agent · 能力无差异
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3 text-center">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">已完成任务</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.55_0.2_265)]">{researcher.tasksCompleted}</p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3 text-center">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">Token消耗</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.82_0.15_85)]">
            {researcher.totalTokensUsed >= 1_000_000
              ? `${(researcher.totalTokensUsed / 1_000_000).toFixed(1)}M`
              : researcher.totalTokensUsed.toLocaleString()
            }
          </p>
        </div>
      </div>

      {/* Current task */}
      {researcher.status === 'researching' && researcher.currentTask && (
        <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.55_0.2_265_/_0.3)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">当前任务</p>
          <p className="font-display text-xs text-[oklch(0.88_0.01_260)] mb-1">
            {TASK_TYPE_LABELS[researcher.currentTask.type]}
          </p>
          {researcher.currentTask.config.factorDescription && (
            <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mb-2 leading-relaxed italic">
              "{researcher.currentTask.config.factorDescription}"
            </p>
          )}
          <div className="w-full h-3 bg-[oklch(0.18_0.02_260)] border border-[oklch(0.25_0.03_260)]">
            <div
              className="h-full transition-all duration-300 relative"
              style={{ width: `${researcher.progress}%`, backgroundColor: ROLE_COLORS[researcher.role] }}
            >
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)',
              }} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="font-mono-data text-[9px] text-[oklch(0.5_0.02_260)]">
              预估: 🪙 ~{researcher.currentTask.tokenCost.toLocaleString()}
            </span>
            <span className="font-mono-data text-[9px] font-bold" style={{ color: ROLE_COLORS[researcher.role] }}>
              {researcher.progress}%
            </span>
          </div>
        </div>
      )}

      {/* Completed - view report */}
      {researcher.status === 'completed' && researcher.currentTask?.reportId && (
        <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-2">✅ 研究完成</p>
          <p className="font-display text-xs text-[oklch(0.88_0.01_260)] mb-3">
            {TASK_TYPE_LABELS[researcher.currentTask.type]}任务已完成
          </p>
          <button
            onClick={handleViewReport}
            className="w-full font-pixel text-[8px] py-2.5 bg-[oklch(0.72_0.19_155)] text-white border-2 border-[oklch(0.55_0.19_155)] hover:bg-[oklch(0.77_0.19_155)] transition-all active:translate-y-0.5"
            style={{
              boxShadow: 'inset -2px -2px 0 oklch(0.5 0.19 155), inset 2px 2px 0 oklch(0.82 0.12 155)',
            }}
          >
            📄 查看研究报告
          </button>
        </div>
      )}

      {/* Change role (only when idle) */}
      {researcher.status === 'idle' && (
        <div>
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">更改分工</p>
          <div className="space-y-1.5">
            {(Object.keys(ROLE_LABELS) as ResearcherRole[]).map(role => (
              <button
                key={role}
                onClick={() => handleChangeRole(role)}
                className={`w-full p-2.5 border-2 text-left transition-all flex items-center justify-between ${
                  researcher.role === role
                    ? 'bg-[oklch(0.18_0.03_260)]'
                    : 'bg-[oklch(0.14_0.02_260)] hover:bg-[oklch(0.16_0.025_260)]'
                }`}
                style={{
                  borderColor: researcher.role === role ? ROLE_COLORS[role] : 'oklch(0.22 0.025 260)',
                }}
              >
                <span className="font-display text-xs" style={{ color: ROLE_COLORS[role] }}>
                  {ROLE_LABELS[role]}
                </span>
                {researcher.role === role && (
                  <span className="font-pixel text-[6px]" style={{ color: ROLE_COLORS[role] }}>当前</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
