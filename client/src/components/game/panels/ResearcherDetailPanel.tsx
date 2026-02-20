/*
 * ResearcherDetailPanel - Detailed view of a selected researcher
 * Shows stats, current task, mood, history
 * Triggered by clicking a researcher in the office scene
 */

import { useGame } from '@/contexts/GameContext';
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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: '空闲', color: 'oklch(0.5 0.02 260)' },
  researching: { label: '研究中', color: 'oklch(0.55 0.2 265)' },
  completed: { label: '已完成', color: 'oklch(0.72 0.19 155)' },
  failed: { label: '失败', color: 'oklch(0.63 0.22 25)' },
};

const RESEARCH_TASKS = [
  '动量因子挖掘',
  '波动率因子研究',
  '基本面因子分析',
  '另类数据因子开发',
  '高频微观结构因子',
  '情绪因子构建',
];

export function ResearcherDetailPanel() {
  const { selectedResearcher, assignTask } = useGame();

  if (!selectedResearcher) {
    return (
      <div className="p-4 text-center py-12">
        <p className="font-pixel text-[10px] text-[oklch(0.5_0.02_260)]">未选择研究员</p>
      </div>
    );
  }

  const r = selectedResearcher;
  const status = STATUS_LABELS[r.status];
  const specColor = SPECIALTY_COLORS[r.specialty];

  const handleAssign = (task: string) => {
    assignTask(r.id, task);
    toast.success('任务已分配', { description: `${r.name} 开始「${task}」` });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile header */}
      <div className="flex items-center gap-4 bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-4">
        <div className="text-4xl">{r.avatar}</div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-[oklch(0.9_0.01_260)]">{r.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-pixel text-[7px] px-2 py-0.5 border" style={{ color: specColor, borderColor: specColor }}>
              {SPECIALTY_LABELS[r.specialty]}
            </span>
            <span className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">
              Lv.{r.level}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[8px] text-[oklch(0.6_0.02_260)]">当前状态</span>
          <span className="font-pixel text-[8px]" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>

        {r.currentTask && (
          <div className="mb-2">
            <span className="font-display text-xs text-[oklch(0.5_0.02_260)]">任务: </span>
            <span className="font-display text-xs text-[oklch(0.85_0.01_260)]">{r.currentTask}</span>
          </div>
        )}

        {r.status === 'researching' && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)]">进度</span>
              <span className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)]">{r.progress}%</span>
            </div>
            <div className="pixel-progress">
              <div
                className="pixel-progress-fill bg-[oklch(0.55_0.2_265)]"
                style={{ width: `${r.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: '日薪', value: `🪙 ${r.salary.toLocaleString()}`, color: 'oklch(0.82 0.15 85)' },
          { label: '心情', value: `${r.mood}%`, color: r.mood > 70 ? 'oklch(0.72 0.19 155)' : r.mood > 40 ? 'oklch(0.82 0.15 85)' : 'oklch(0.63 0.22 25)' },
          { label: '发现因子', value: r.factorsDiscovered.toString(), color: 'oklch(0.55 0.2 265)' },
          { label: '入职日期', value: r.hireDate, color: 'oklch(0.6 0.02 260)' },
        ].map(stat => (
          <div key={stat.label} className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.25_0.03_260)] p-3 text-center">
            <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] mb-1">{stat.label}</p>
            <p className="font-mono-data text-sm font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Mood bar */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <div className="flex justify-between mb-1">
          <span className="font-pixel text-[7px] text-[oklch(0.6_0.02_260)]">心情值</span>
          <span className="text-sm">
            {r.mood > 80 ? '😊' : r.mood > 50 ? '😐' : r.mood > 30 ? '😟' : '😢'}
          </span>
        </div>
        <div className="pixel-progress">
          <div
            className="pixel-progress-fill"
            style={{
              width: `${r.mood}%`,
              backgroundColor: r.mood > 70 ? 'oklch(0.72 0.19 155)' : r.mood > 40 ? 'oklch(0.82 0.15 85)' : 'oklch(0.63 0.22 25)',
            }}
          />
        </div>
        <p className="font-display text-[10px] text-[oklch(0.45_0.02_260)] mt-1">
          {r.mood > 80 ? '状态极佳，研究效率+20%' : r.mood > 50 ? '状态正常' : '心情低落，研究效率-15%'}
        </p>
      </div>

      {/* Assign task (if idle) */}
      {r.status === 'idle' && (
        <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.55_0.2_265)] p-3">
          <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)] mb-2">分配研究任务</p>
          <div className="grid grid-cols-2 gap-1.5">
            {RESEARCH_TASKS.map(task => (
              <button
                key={task}
                onClick={() => handleAssign(task)}
                className="font-display text-[10px] px-2 py-2 bg-[oklch(0.12_0.02_260)] border border-[oklch(0.3_0.03_260)] text-[oklch(0.7_0.02_260)] hover:border-[oklch(0.55_0.2_265)] hover:text-[oklch(0.85_0.01_260)] transition-all text-left"
              >
                🔬 {task}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed task */}
      {r.status === 'completed' && (
        <div className="bg-[oklch(0.72_0.19_155_/_0.1)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] p-3 text-center">
          <p className="font-pixel text-[8px] text-[oklch(0.72_0.19_155)] mb-1">✅ 研究完成！</p>
          <p className="font-display text-xs text-[oklch(0.6_0.02_260)]">
            {r.currentTask} 已完成，新因子已添加到因子库
          </p>
          <button
            onClick={() => handleAssign(RESEARCH_TASKS[Math.floor(Math.random() * RESEARCH_TASKS.length)])}
            className="mt-2 font-pixel text-[7px] px-4 py-1.5 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
          >
            分配新任务
          </button>
        </div>
      )}
    </div>
  );
}
