/*
 * BottomToolbar - Quick action bar at the bottom of the screen
 * Style: Pixel art buttons with icons, high z-index for clickability
 * Actions: Hiring, Research, Strategy, Backtest, Live Trading, Leaderboard
 */

import { useGame } from '@/contexts/GameContext';
import { Users, FlaskConical, Layers, BarChart3, Rocket, Trophy } from 'lucide-react';

const ACTIONS = [
  { id: 'hiring', label: '招聘', icon: Users, color: 'oklch(0.55 0.2 265)' },
  { id: 'research', label: '研究', icon: FlaskConical, color: 'oklch(0.75 0.12 200)' },
  { id: 'strategy', label: '策略', icon: Layers, color: 'oklch(0.72 0.19 155)' },
  { id: 'backtest', label: '回测', icon: BarChart3, color: 'oklch(0.82 0.15 85)' },
  { id: 'live', label: '实盘', icon: Rocket, color: 'oklch(0.63 0.22 25)' },
  { id: 'leaderboard', label: '排行', icon: Trophy, color: 'oklch(0.82 0.15 85)' },
];

export function BottomToolbar() {
  const { activePanel, setActivePanel } = useGame();

  return (
    <div
      className="relative flex items-center justify-center gap-1 sm:gap-2 px-3 py-3 pb-4 bg-[oklch(0.08_0.015_260_/_0.98)] border-t-2 border-[oklch(0.25_0.03_260)]"
      style={{ zIndex: 60 }}
    >
      {/* Decorative top edge pixels */}
      <div className="absolute -top-[3px] left-0 right-0 h-[3px] flex">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full"
            style={{
              backgroundColor: i % 3 === 0 ? 'oklch(0.35 0.05 265)' : 'transparent',
            }}
          />
        ))}
      </div>

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
            className={`flex flex-col items-center gap-1 px-3 sm:px-5 py-2.5 border-2 transition-all duration-150 select-none ${
              isActive
                ? 'bg-[oklch(0.2_0.03_260)] -translate-y-0.5'
                : 'bg-[oklch(0.14_0.02_260)] hover:bg-[oklch(0.18_0.025_260)] active:translate-y-0.5'
            }`}
            style={{
              borderColor: isActive ? action.color : 'oklch(0.28 0.03 260)',
              boxShadow: isActive
                ? `0 0 12px ${action.color}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                : 'inset -1px -1px 0 rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <Icon
              size={18}
              style={{ color: isActive ? action.color : 'oklch(0.6 0.02 260)' }}
            />
            <span
              className="font-pixel text-[7px] leading-none"
              style={{ color: isActive ? action.color : 'oklch(0.5 0.02 260)' }}
            >
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
