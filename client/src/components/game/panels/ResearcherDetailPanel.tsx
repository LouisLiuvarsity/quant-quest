/*
 * ResearcherDetailPanel - Shows researcher info when clicked in office
 * Displays: skin, role, current task progress, completed tasks, token usage
 * Can change role (if idle), view completed report
 */

import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  { value: '因子研究', color: 'oklch(0.55 0.2 265)' },
  { value: '多因子合成', color: 'oklch(0.72 0.19 155)' },
  { value: '通用研究', color: 'oklch(0.82 0.15 85)' },
];

const TASK_LABELS: Record<string, string> = {
  single_factor: '因子挖掘',
  multi_factor: '多因子合成',
};

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  idle: { label: '💤 空闲', class: 'text-[oklch(0.5_0.02_260)] border-[oklch(0.3_0.03_260)]' },
  researching: { label: '🔬 研究中', class: 'text-[oklch(0.55_0.2_265)] border-[oklch(0.55_0.2_265)]' },
  waiting: { label: '🔀 等待决策', class: 'text-[oklch(0.82_0.15_85)] border-[oklch(0.82_0.15_85)]' },
  completed: { label: '✅ 已完成', class: 'text-[oklch(0.72_0.19_155)] border-[oklch(0.72_0.19_155)]' },
};

export function ResearcherDetailPanel() {
  const { selectedResearcher, state, changeRole, setActivePanel, setSelectedReport, setViewingTask } = useGame();

  if (!selectedResearcher) {
    return (
      <div className="p-4 text-center">
        <p className="font-display text-sm text-[oklch(0.5_0.02_260)]">请在办公室中点击一位研究员</p>
      </div>
    );
  }

  const researcher = state.researchers.find(r => r.id === selectedResearcher.id) || selectedResearcher;
  const roleColor = ROLE_OPTIONS.find(r => r.value === researcher.role)?.color || 'oklch(0.5 0.02 260)';
  const statusInfo = STATUS_MAP[researcher.status] || STATUS_MAP.idle;

  // Find active task for this researcher
  const activeTask = state.activeTasks.find(t => t.researcherId === researcher.id && (t.status === 'running' || t.status === 'paused'));
  // Find most recent completed task
  const completedTask = state.activeTasks.find(t => t.researcherId === researcher.id && t.status === 'completed');

  const handleChangeRole = (role: string) => {
    if (researcher.status !== 'idle') {
      toast.error('研究员正在工作中，无法更改分工');
      return;
    }
    changeRole(researcher.id, role);
    toast.success(`已将 ${researcher.skin.name} 的分工更改为 ${role}`);
  };

  const handleViewReport = () => {
    if (completedTask?.reportId) {
      const report = state.reports.find(r => r.id === completedTask.reportId);
      if (report) {
        setSelectedReport(report);
        setActivePanel('report-viewer');
      }
    } else if (completedTask) {
      // Try to find report by taskId
      const report = state.reports.find(r => r.taskId === completedTask.id);
      if (report) {
        setSelectedReport(report);
        setActivePanel('report-viewer');
      }
    }
  };

  const handleViewActiveTask = () => {
    if (activeTask) {
      setViewingTask(activeTask);
      setActivePanel('research');
    }
  };

  const getFactorDescription = () => {
    if (activeTask?.singleFactorConfig?.factorDescription) {
      return activeTask.singleFactorConfig.factorDescription;
    }
    return null;
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
            style={{ color: roleColor, borderColor: roleColor }}
          >
            {researcher.role}
          </span>
          <span className={`font-pixel text-[7px] px-2 py-1 border ${statusInfo.class}`}>
            {statusInfo.label}
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

      {/* Active task */}
      {activeTask && (researcher.status === 'researching' || researcher.status === 'waiting') && (
        <div className={`bg-[oklch(0.16_0.025_260)] border-2 p-3 ${
          researcher.status === 'waiting'
            ? 'border-[oklch(0.82_0.15_85_/_0.5)]'
            : 'border-[oklch(0.55_0.2_265_/_0.3)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-[7px]" style={{ color: roleColor }}>
              {researcher.status === 'waiting' ? '🔀 等待CEO决策' : '🔬 当前任务'}
            </p>
            <span className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)]">
              Step {activeTask.currentStepIndex + 1}/{activeTask.totalSteps}
            </span>
          </div>
          <p className="font-display text-xs text-[oklch(0.88_0.01_260)] mb-1">
            {TASK_LABELS[activeTask.type] || activeTask.type}
          </p>
          {getFactorDescription() && (
            <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mb-2 leading-relaxed italic">
              "{getFactorDescription()}"
            </p>
          )}
          <div className="w-full h-3 bg-[oklch(0.18_0.02_260)] border border-[oklch(0.25_0.03_260)]">
            <div
              className="h-full transition-all duration-300 relative"
              style={{ width: `${activeTask.overallProgress}%`, backgroundColor: roleColor }}
            >
              <div className="absolute inset-0" style={{
                background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)',
              }} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="font-mono-data text-[9px] text-[oklch(0.5_0.02_260)]">
              已消耗: 🪙 {activeTask.tokenCost.toLocaleString()}
            </span>
            <span className="font-mono-data text-[9px] font-bold" style={{ color: roleColor }}>
              {activeTask.overallProgress}%
            </span>
          </div>
          <button
            onClick={handleViewActiveTask}
            className="w-full mt-2 font-pixel text-[7px] py-2 bg-[oklch(0.14_0.02_260)] text-[oklch(0.7_0.02_260)] border-2 border-[oklch(0.25_0.03_260)] hover:bg-[oklch(0.18_0.02_260)] transition-all"
          >
            查看任务详情 →
          </button>
        </div>
      )}

      {/* Completed - view report */}
      {researcher.status === 'completed' && completedTask && (
        <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-2">✅ 研究完成</p>
          <p className="font-display text-xs text-[oklch(0.88_0.01_260)] mb-3">
            {TASK_LABELS[completedTask.type] || completedTask.type} 任务已完成
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
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChangeRole(opt.value)}
                className={`w-full p-2.5 border-2 text-left transition-all flex items-center justify-between ${
                  researcher.role === opt.value
                    ? 'bg-[oklch(0.18_0.03_260)]'
                    : 'bg-[oklch(0.14_0.02_260)] hover:bg-[oklch(0.16_0.025_260)]'
                }`}
                style={{
                  borderColor: researcher.role === opt.value ? opt.color : 'oklch(0.22 0.025 260)',
                }}
              >
                <span className="font-display text-xs" style={{ color: opt.color }}>
                  {opt.value}
                </span>
                {researcher.role === opt.value && (
                  <span className="font-pixel text-[6px]" style={{ color: opt.color }}>当前</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActivePanel('research')}
            className="w-full mt-3 font-pixel text-[8px] py-2.5 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
          >
            分配研究任务 →
          </button>
        </div>
      )}
    </div>
  );
}
