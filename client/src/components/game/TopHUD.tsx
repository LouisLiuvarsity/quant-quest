/*
 * TopHUD - Game status bar at the top
 * Shows: Company name, token balance, active tasks, PnL, notifications
 * Style: Dark glass panel with pixel accents
 * No day/turn system - real-time
 */

import { useGame } from '@/contexts/GameContext';
import { Bell } from 'lucide-react';
import { useState } from 'react';

export function TopHUD() {
  const { state, setActivePanel } = useGame();
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = state.notifications.filter(n => !n.read).length;

  const creditsPercent = (state.credits / state.totalCredits) * 100;
  const creditsColor = creditsPercent > 50 ? 'oklch(0.72 0.19 155)' : creditsPercent > 20 ? 'oklch(0.82 0.15 85)' : 'oklch(0.63 0.22 25)';

  const activeTasks = state.researchers.filter(r => r.status === 'researching').length;

  return (
    <div
      className="relative flex items-center justify-between px-3 sm:px-4 py-2 bg-[oklch(0.08_0.015_260_/_0.97)] border-b-2 border-[oklch(0.22_0.025_260)]"
      style={{ zIndex: 50 }}
    >
      {/* Decorative bottom edge */}
      <div className="absolute -bottom-[3px] left-0 right-0 h-[3px] flex">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full"
            style={{
              backgroundColor: i % 4 === 0 ? 'oklch(0.25 0.04 265)' : 'transparent',
            }}
          />
        ))}
      </div>

      {/* Left: Company info + Credits */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🏢</span>
          <div>
            <h1 className="font-pixel text-[9px] text-[oklch(0.92_0.01_260)] leading-tight truncate max-w-[120px]">
              {state.companyName}
            </h1>
            <span className="font-pixel text-[6px] text-[oklch(0.55_0.2_265)]">
              {state.researchers.length} 研究员
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-[oklch(0.22_0.025_260)]" />

        {/* Token Balance */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm animate-coin-spin">🪙</span>
          <div>
            <p className="font-mono-data text-[11px] font-bold leading-tight" style={{ color: creditsColor }}>
              {state.credits >= 1_000_000
                ? `${(state.credits / 1_000_000).toFixed(2)}M`
                : state.credits.toLocaleString()
              }
            </p>
            <div className="w-14 sm:w-20 h-1 bg-[oklch(0.18_0.02_260)] mt-0.5">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${creditsPercent}%`, backgroundColor: creditsColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center: Active Tasks & PnL */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active tasks indicator */}
        <div className="text-center">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] leading-none">TASKS</p>
          <p className="font-mono-data text-sm font-bold text-[oklch(0.55_0.2_265)]">
            {activeTasks > 0 && <span className="inline-block w-1.5 h-1.5 bg-[oklch(0.55_0.2_265)] animate-pulse mr-1 align-middle" />}
            {activeTasks}
          </p>
        </div>

        <div className="hidden sm:block h-5 w-px bg-[oklch(0.22_0.025_260)]" />

        <div className="hidden sm:block text-center">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] leading-none">TOTAL P&L</p>
          <p className={`font-mono-data text-sm font-bold ${state.totalPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
            {state.totalPnl >= 0 ? '+' : ''}${Math.round(state.totalPnl).toLocaleString()}
          </p>
        </div>

        <div className="hidden sm:block h-5 w-px bg-[oklch(0.22_0.025_260)]" />

        <div className="hidden sm:block text-center">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] leading-none">FACTORS</p>
          <p className="font-mono-data text-sm font-bold text-[oklch(0.75_0.12_200)]">
            {state.factorCards.length}
          </p>
        </div>
      </div>

      {/* Right: Plan + Notifications */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivePanel('subscription')}
          className={`font-pixel text-[6px] px-2 py-1 border-2 transition-all ${
            state.plan === 'pro'
              ? 'border-[oklch(0.82_0.15_85)] text-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.08)]'
              : 'border-[oklch(0.35_0.03_260)] text-[oklch(0.45_0.02_260)] hover:border-[oklch(0.82_0.15_85)] hover:text-[oklch(0.82_0.15_85)]'
          }`}
        >
          {state.plan === 'pro' ? '⭐PRO' : 'FREE'}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-1.5 text-[oklch(0.5_0.02_260)] hover:text-[oklch(0.92_0.01_260)] transition-colors"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[oklch(0.63_0.22_25)] text-white font-pixel text-[5px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 glass-panel border-2 border-[oklch(0.28_0.03_260)] z-50 animate-slide-in-up">
                <div className="p-3 border-b-2 border-[oklch(0.22_0.025_260)]">
                  <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">📬 通知</p>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {state.notifications.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="font-display text-xs text-[oklch(0.45_0.02_260)]">暂无通知</p>
                    </div>
                  ) : (
                    state.notifications.slice(0, 20).map(n => (
                      <div
                        key={n.id}
                        className={`px-3 py-2.5 border-b border-[oklch(0.18_0.02_260)] last:border-0 ${!n.read ? 'bg-[oklch(0.14_0.02_260)]' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs mt-0.5 shrink-0">
                            {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : 'ℹ️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{n.title}</p>
                            <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                          <span className="font-mono-data text-[8px] text-[oklch(0.35_0.02_260)] shrink-0">{n.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
