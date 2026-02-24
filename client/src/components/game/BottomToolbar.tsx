/*
 * BottomToolbar - Quick action bar at the bottom of the screen
 * Style: Pixel art buttons with icons, high z-index for clickability
 * Actions: Hiring, Research, Strategy, Factor Library, Report Library, Live Trading, Leaderboard
 */

import { useGame } from '@/contexts/GameContext';
import { Users, FlaskConical, Layers, Database, FileText, Rocket, Trophy } from 'lucide-react';

const ACTIONS = [
  { id: 'hiring', label: '招聘', icon: Users, color: 'oklch(0.55 0.2 265)' },
  { id: 'research', label: '研究', icon: FlaskConical, color: 'oklch(0.75 0.12 200)' },
  { id: 'strategy', label: '策略', icon: Layers, color: 'oklch(0.72 0.19 155)' },
  { id: 'factor-library', label: '因子库', icon: Database, color: 'oklch(0.55 0.2 265)' },
  { id: 'report-library', label: '报告', icon: FileText, color: 'oklch(0.82 0.15 85)' },
  { id: 'live', label: '实盘', icon: Rocket, color: 'oklch(0.63 0.22 25)' },
  { id: 'leaderboard', label: '排行', icon: Trophy, color: 'oklch(0.82 0.15 85)' },
];

export function BottomToolbar() {
  const { activePanel, setActivePanel } = useGame();

  return (
    <div className="relative border-t border-[oklch(0.25_0.03_260)] bg-[oklch(0.08_0.015_260_/_0.96)] px-2 py-2.5 pb-3" style={{ zIndex: 60 }}>
      <div className="mx-auto w-full max-w-[980px] flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
        {ACTIONS.map(action => {
          const Icon = action.icon;
          const isActive = activePanel === action.id;

          return (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                setActivePanel(isActive ? null : action.id);
              }}
              className={`min-w-[74px] sm:min-w-[92px] shrink-0 rounded-xl border px-2.5 sm:px-3 py-2 transition-all duration-150 select-none ${
                isActive
                  ? 'bg-[oklch(0.18_0.03_260)] -translate-y-0.5'
                  : 'bg-[oklch(0.12_0.02_260)] hover:bg-[oklch(0.16_0.02_260)]'
              }`}
              style={{
                borderColor: isActive ? action.color : 'oklch(0.28 0.03 260)',
                boxShadow: isActive ? `0 0 10px ${action.color}35` : 'none',
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon size={16} style={{ color: isActive ? action.color : 'oklch(0.62 0.02 260)' }} />
                <span
                  className="font-display text-[10px] font-semibold leading-none"
                  style={{ color: isActive ? action.color : 'oklch(0.58 0.02 260)' }}
                >
                  {action.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
