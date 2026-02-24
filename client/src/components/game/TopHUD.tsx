/*
 * TopHUD - Game status bar at the top
 * Shows: Company status, mission stage, key counters, notifications
 */

import { useGame } from '@/contexts/GameContext';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { buildMissionSnapshot } from './gameplayBlueprint';

export function TopHUD() {
  const { state, setActivePanel, setInsightView } = useGame();
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = state.notifications.filter(n => !n.read).length;
  const missionSnapshot = buildMissionSnapshot(state);
  const completedStages = missionSnapshot.progress.filter(stage => stage.done).length;

  const creditsPercent = Math.max(0, Math.min(100, (state.credits / state.totalCredits) * 100));
  const creditsColor = creditsPercent > 50 ? 'oklch(0.72 0.19 155)' : creditsPercent > 20 ? 'oklch(0.82 0.15 85)' : 'oklch(0.63 0.22 25)';

  const runningTasks = state.activeTasks.filter(task => task.status === 'running').length;
  const waitingTasks = missionSnapshot.waitingTasks;
  const passedFactors = state.factorCards.filter(f => f.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(p => p.status === 'adopted').length;
  const liveStrategies = state.strategies.filter(s => s.status === 'live').length;
  const activeTheses = state.theses.filter(item => ['running', 'oos_locked', 'oos_running', 'needs_review'].includes(item.status)).length;
  const oosConsumedCount = Object.keys(state.oosRegistry).length;
  const oosUnlocked = oosConsumedCount > 0;

  return (
    <header className="relative z-50 border-b border-[oklch(0.22_0.02_260)] bg-[oklch(0.07_0.012_260_/_0.94)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-4 py-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[oklch(0.28_0.03_260)] bg-[oklch(0.13_0.02_260)] text-sm">🏢</div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-sm font-semibold text-[oklch(0.94_0.01_260)]">{state.companyName}</h1>
              <p className="font-display text-[11px] text-[oklch(0.56_0.02_260)]">
                {state.researchers.length} 名研究员 · {state.playMode === 'guided' ? '新手引导模式' : '专业直达模式'}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex min-w-0 flex-1 justify-center px-2">
            <button
              onClick={() => setActivePanel(missionSnapshot.activeStage.panel)}
              className="min-w-[300px] max-w-[620px] w-full rounded-xl border border-[oklch(0.28_0.03_260)] bg-[oklch(0.11_0.018_260_/_0.9)] px-3 py-2 text-left hover:border-[oklch(0.55_0.2_265)] transition-colors"
            >
              <p className="font-display text-[10px] text-[oklch(0.72_0.19_155)]">{missionSnapshot.activeStage.label}</p>
              <p className="font-display text-[12px] font-semibold text-[oklch(0.92_0.01_260)] mt-0.5 truncate">{missionSnapshot.activeStage.goal}</p>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePanel('research')}
              className="hidden sm:inline-flex rounded-lg border border-[oklch(0.3_0.03_260)] bg-[oklch(0.12_0.02_260)] px-2.5 py-1.5 font-display text-[11px] font-semibold text-[oklch(0.68_0.02_260)] hover:border-[oklch(0.55_0.2_265)] hover:text-[oklch(0.9_0.02_260)] transition-colors"
            >
              阶段 {completedStages}/{missionSnapshot.progress.length}
            </button>

            <button
              onClick={() => setActivePanel('subscription')}
              className={`rounded-lg border px-2.5 py-1.5 font-display text-[11px] font-semibold transition-all ${
                state.plan === 'pro'
                  ? 'border-[oklch(0.82_0.15_85)] text-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.12)]'
                  : 'border-[oklch(0.3_0.03_260)] text-[oklch(0.55_0.02_260)] bg-[oklch(0.12_0.02_260)] hover:border-[oklch(0.82_0.15_85)] hover:text-[oklch(0.82_0.15_85)]'
              }`}
            >
              {state.plan === 'pro' ? 'PRO' : 'FREE'}
            </button>

            <div className="hidden md:flex items-center rounded-lg border border-[oklch(0.3_0.03_260)] bg-[oklch(0.12_0.02_260)] p-0.5">
              {([
                { key: 'player', label: '玩家' },
                { key: 'pro', label: '专业' },
                { key: 'audit', label: '审计' },
              ] as const).map(item => (
                <button
                  key={item.key}
                  onClick={() => setInsightView(item.key)}
                  className={`px-2 py-1 font-display text-[10px] rounded-md transition-all ${
                    state.insightView === item.key
                      ? 'bg-[oklch(0.55_0.2_265_/_0.22)] text-[oklch(0.9_0.02_260)]'
                      : 'text-[oklch(0.52_0.02_260)] hover:text-[oklch(0.85_0.01_260)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative rounded-lg border border-[oklch(0.28_0.03_260)] bg-[oklch(0.12_0.02_260)] p-2 text-[oklch(0.55_0.02_260)] hover:text-[oklch(0.92_0.01_260)] transition-colors"
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full bg-[oklch(0.63_0.22_25)] px-1 text-white font-mono-data text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 glass-panel border border-[oklch(0.28_0.03_260)] z-50 rounded-xl overflow-hidden animate-slide-in-up">
                    <div className="p-3 border-b border-[oklch(0.22_0.025_260)]">
                      <p className="font-display text-sm font-semibold text-[oklch(0.82_0.15_85)]">通知</p>
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

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {[
            { label: '资金', value: state.credits >= 1_000_000 ? `${(state.credits / 1_000_000).toFixed(2)}M` : state.credits.toLocaleString(), color: creditsColor },
            { label: '运行任务', value: runningTasks, color: 'oklch(0.55 0.2 265)' },
            { label: '待决策', value: waitingTasks, color: 'oklch(0.82 0.15 85)' },
            { label: '通过因子', value: passedFactors, color: 'oklch(0.75 0.12 200)' },
            { label: '采纳组合', value: adoptedPortfolios, color: 'oklch(0.72 0.19 155)' },
            { label: '命题池', value: activeTheses, color: 'oklch(0.75 0.12 200)' },
            { label: '实盘策略', value: liveStrategies, color: 'oklch(0.63 0.22 25)' },
            { label: '审判券', value: state.resources.oosTickets, color: state.resources.oosTickets > 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)' },
            { label: '信任', value: state.resources.trustScore, color: 'oklch(0.82 0.15 85)' },
            { label: 'OOS', value: oosUnlocked ? `已消费${oosConsumedCount}` : '未消费', color: oosUnlocked ? 'oklch(0.72 0.19 155)' : 'oklch(0.82 0.15 85)' },
            { label: 'P&L', value: `${state.totalPnl >= 0 ? '+' : ''}$${Math.round(state.totalPnl).toLocaleString()}`, color: state.totalPnl >= 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)' },
          ].map(item => (
            <div key={item.label} className="inline-flex items-center gap-1.5 rounded-md border border-[oklch(0.24_0.025_260)] bg-[oklch(0.11_0.018_260)] px-2 py-1">
              <span className="font-display text-[10px] text-[oklch(0.52_0.02_260)]">{item.label}</span>
              <span className="font-mono-data text-[11px] font-semibold" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
          ))}
          <div className="hidden md:block h-1 w-24 rounded-full bg-[oklch(0.18_0.02_260)] ml-1">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${creditsPercent}%`, backgroundColor: creditsColor }} />
          </div>
        </div>
      </div>
    </header>
  );
}
