/*
 * BottomToolbar - Quick action bar at the bottom of the screen
 * Style: Pixel art buttons with icons, high z-index for clickability
 * Actions: Hiring, Research, Strategy, Factor Library, Report Library, Live Trading, Leaderboard
 */

import { useGame } from '@/contexts/GameContext';
import { Users, FlaskConical, Layers, Database, FileText, BookOpen, ShieldCheck, Rocket, Trophy } from 'lucide-react';

const ACTIONS = [
  { id: 'hiring', label: '招聘', icon: Users, color: 'oklch(0.55 0.2 265)' },
  { id: 'research', label: '研究', icon: FlaskConical, color: 'oklch(0.75 0.12 200)' },
  { id: 'strategy', label: '策略', icon: Layers, color: 'oklch(0.72 0.19 155)' },
  { id: 'factor-library', label: '因子库', icon: Database, color: 'oklch(0.55 0.2 265)' },
  { id: 'report-library', label: '报告', icon: FileText, color: 'oklch(0.82 0.15 85)' },
  { id: 'audit-replay', label: '审计', icon: ShieldCheck, color: 'oklch(0.82 0.15 85)' },
  { id: 'learning-cards', label: '学习卡', icon: BookOpen, color: 'oklch(0.75 0.12 200)' },
  { id: 'live', label: '实盘', icon: Rocket, color: 'oklch(0.63 0.22 25)' },
  { id: 'leaderboard', label: '排行', icon: Trophy, color: 'oklch(0.82 0.15 85)' },
];

export function BottomToolbar() {
  const { activePanel, setActivePanel, state } = useGame();
  const waitingTasks = state.activeTasks.filter(task => task.status === 'paused').length;
  const draftStrategies = state.strategies.filter(strategy => strategy.status === 'draft').length;
  const liveStrategies = state.strategies.filter(strategy => strategy.status === 'live').length;
  const unreadReports = state.reports.length;
  const pendingLearningCards = state.learningCards.filter(card => !card.reviewed).length;

  const badgeValue = (panelId: string): number => {
    if (panelId === 'research') return waitingTasks;
    if (panelId === 'strategy') return draftStrategies;
    if (panelId === 'report-library') return unreadReports;
    if (panelId === 'audit-replay') return unreadReports;
    if (panelId === 'learning-cards') return pendingLearningCards;
    if (panelId === 'live') return liveStrategies;
    return 0;
  };

  return (
    <div className="relative border-t border-[oklch(0.22_0.02_260)] bg-[oklch(0.075_0.013_260_/_0.96)] px-2 py-2.5" style={{ zIndex: 60 }}>
      <div className="mx-auto w-full max-w-[1080px] rounded-2xl border border-[oklch(0.24_0.025_260)] bg-[oklch(0.1_0.017_260_/_0.9)] px-1.5 py-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          const isActive = activePanel === action.id;
          const badge = badgeValue(action.id);

          return (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                setActivePanel(isActive ? null : action.id);
              }}
              className={`min-w-[84px] sm:min-w-[120px] shrink-0 rounded-xl border px-2.5 sm:px-3 py-2 transition-all duration-150 select-none ${
                isActive
                  ? 'bg-[oklch(0.17_0.028_260)] -translate-y-0.5'
                  : 'bg-[oklch(0.12_0.02_260)] hover:bg-[oklch(0.15_0.02_260)]'
              }`}
              style={{
                borderColor: isActive ? action.color : 'oklch(0.28 0.03 260)',
                boxShadow: isActive ? `0 0 10px ${action.color}35` : 'none',
              }}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon size={15} style={{ color: isActive ? action.color : 'oklch(0.62 0.02 260)' }} />
                <span className="font-display text-[10px] font-semibold leading-none" style={{ color: isActive ? action.color : 'oklch(0.58 0.02 260)' }}>
                  {action.label}
                </span>
                {badge > 0 && (
                  <span className="min-w-4 h-4 rounded-full bg-[oklch(0.63_0.22_25)] px-1 font-mono-data text-[10px] text-white flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
