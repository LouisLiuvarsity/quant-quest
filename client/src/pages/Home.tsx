/*
 * Home Page - Main game layout
 * Structure: TopHUD → OfficeScene → BottomToolbar
 * SidePanel overlays from the right
 * No day/turn system - real-time
 */

import { useGame } from '@/contexts/GameContext';
import { IntroScreen } from '@/components/game/IntroScreen';
import { TopHUD } from '@/components/game/TopHUD';
import { OfficeScene } from '@/components/game/OfficeScene';
import { BottomToolbar } from '@/components/game/BottomToolbar';
import { SidePanel } from '@/components/game/SidePanel';
import { buildMissionSnapshot, buildAiCoachTips } from '@/components/game/gameplayBlueprint';

export default function Home() {
  const { showIntro, setShowIntro, state, setActivePanel } = useGame();
  const missionSnapshot = buildMissionSnapshot(state);
  const aiTips = buildAiCoachTips(state);
  const activeTasks = state.activeTasks.filter(task => task.status !== 'completed');
  const passedFactors = state.factorCards.filter(card => card.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(card => card.status === 'adopted').length;
  const liveStrategies = state.strategies.filter(strategy => strategy.status === 'live').length;

  if (showIntro) {
    return (
      <IntroScreen
        onStart={() => setShowIntro(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[oklch(0.07_0.012_260)]">
      <TopHUD />

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_80%,oklch(0.35_0.05_260_/_0.18),transparent_48%),radial-gradient(circle_at_88%_18%,oklch(0.55_0.2_265_/_0.12),transparent_36%)]" />

        <div className="relative h-full w-full xl:grid xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="relative min-h-0">
            <OfficeScene />

            <div className="xl:hidden absolute right-3 top-3 z-20 rounded-xl border border-[oklch(0.28_0.03_260)] bg-[oklch(0.09_0.016_260_/_0.9)] px-3 py-2 backdrop-blur-md max-w-[260px]">
              <p className="font-display text-[10px] font-semibold text-[oklch(0.72_0.19_155)]">{missionSnapshot.activeStage.label}</p>
              <p className="font-display text-[11px] text-[oklch(0.9_0.01_260)] mt-0.5 leading-tight">{missionSnapshot.activeStage.goal}</p>
              <button
                onClick={() => setActivePanel(missionSnapshot.activeStage.panel)}
                className="mt-2 w-full rounded-lg border border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.18)] px-2 py-1.5 font-display text-[10px] font-semibold text-[oklch(0.9_0.02_260)]"
              >
                {missionSnapshot.activeStage.cta}
              </button>
            </div>
          </section>

          <aside className="hidden xl:flex min-h-0 flex-col gap-2.5 border-l border-[oklch(0.22_0.02_260)] bg-[oklch(0.085_0.014_260_/_0.92)] p-3">
            <div className="rounded-2xl border border-[oklch(0.3_0.03_260)] bg-[oklch(0.1_0.016_260_/_0.9)] p-3.5">
              <p className="font-display text-[11px] font-semibold text-[oklch(0.82_0.15_85)]">CEO 指挥台</p>
              <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)] mt-1">{missionSnapshot.activeStage.label}</p>
              <p className="font-display text-[17px] font-semibold text-[oklch(0.94_0.01_260)] mt-1 leading-tight">{missionSnapshot.activeStage.goal}</p>
              <p className="font-display text-xs text-[oklch(0.58_0.02_260)] mt-2 leading-relaxed">{missionSnapshot.activeStage.detail}</p>
              {missionSnapshot.waitingTasks > 0 && (
                <p className="mt-2 font-display text-[10px] text-[oklch(0.82_0.15_85)]">
                  当前有 {missionSnapshot.waitingTasks} 个决策点待处理
                </p>
              )}
              <button
                onClick={() => setActivePanel(missionSnapshot.activeStage.panel)}
                className="mt-3 w-full rounded-xl border border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.16)] px-3 py-2.5 font-display text-xs font-semibold text-[oklch(0.9_0.03_260)] hover:bg-[oklch(0.55_0.2_265_/_0.24)] transition-colors"
              >
                {missionSnapshot.activeStage.cta}
              </button>
            </div>

            <div className="rounded-2xl border border-[oklch(0.26_0.03_260)] bg-[oklch(0.1_0.016_260_/_0.88)] p-3">
              <p className="font-display text-[11px] font-semibold text-[oklch(0.72_0.19_155)]">任务状态机</p>
              <div className="mt-2 space-y-1.5">
                {missionSnapshot.progress.map(stage => (
                  <div
                    key={stage.key}
                    className={`rounded-lg border px-2.5 py-1.5 ${
                      stage.done
                        ? 'border-[oklch(0.72_0.19_155_/_0.45)] bg-[oklch(0.72_0.19_155_/_0.08)]'
                        : stage.key === missionSnapshot.activeStage.key
                          ? 'border-[oklch(0.82_0.15_85_/_0.45)] bg-[oklch(0.82_0.15_85_/_0.08)]'
                          : 'border-[oklch(0.24_0.03_260)] bg-[oklch(0.13_0.02_260)]'
                    }`}
                  >
                    <p className={`font-display text-[11px] ${
                      stage.done
                        ? 'text-[oklch(0.72_0.19_155)]'
                        : stage.key === missionSnapshot.activeStage.key
                          ? 'text-[oklch(0.82_0.15_85)]'
                          : 'text-[oklch(0.7_0.02_260)]'
                    }`}>
                      {stage.done ? '✅' : stage.key === missionSnapshot.activeStage.key ? '▶' : '•'} {stage.goal}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[oklch(0.25_0.03_260)] bg-[oklch(0.1_0.016_260_/_0.88)] p-3">
              <p className="font-display text-[11px] font-semibold text-[oklch(0.75_0.12_200)]">关键指标</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { label: '活跃研究', value: activeTasks.length, color: 'oklch(0.55 0.2 265)' },
                  { label: '待处理决策', value: missionSnapshot.waitingTasks, color: 'oklch(0.82 0.15 85)' },
                  { label: '通过因子', value: passedFactors, color: 'oklch(0.75 0.12 200)' },
                  { label: '采纳组合', value: adoptedPortfolios, color: 'oklch(0.72 0.19 155)' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260_/_0.8)] px-2.5 py-2 text-center">
                    <p className="font-display text-[10px] text-[oklch(0.48_0.02_260)]">{item.label}</p>
                    <p className="font-mono-data text-lg font-semibold mt-1 leading-none" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-2">
                实盘策略: <span className="font-mono-data text-[oklch(0.82_0.15_85)]">{liveStrategies}</span>
              </p>
            </div>

            <div className="min-h-0 flex-1 rounded-2xl border border-[oklch(0.25_0.03_260)] bg-[oklch(0.1_0.016_260_/_0.88)] p-3">
              <p className="font-display text-[11px] font-semibold text-[oklch(0.82_0.15_85)]">AI 教练建议</p>
              <div className="mt-2.5 space-y-2">
                {aiTips.map(tip => (
                  <div key={tip} className="rounded-lg border border-[oklch(0.24_0.03_260)] bg-[oklch(0.13_0.02_260)] px-2.5 py-2">
                    <p className="font-display text-[10px] leading-relaxed text-[oklch(0.75_0.02_260)]">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <SidePanel />
      </div>

      <div className="sm:hidden flex items-center justify-between gap-3 border-t border-[oklch(0.2_0.02_260)] bg-[oklch(0.08_0.015_260_/_0.96)] px-3 py-2">
        <div className="min-w-0">
          <p className="font-display text-[10px] text-[oklch(0.72_0.19_155)] truncate">{missionSnapshot.activeStage.label}</p>
          <p className="font-display text-[11px] text-[oklch(0.9_0.01_260)] truncate">{missionSnapshot.activeStage.goal}</p>
        </div>
        <button
          onClick={() => setActivePanel(missionSnapshot.activeStage.panel)}
          className="shrink-0 rounded-lg border border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.2)] px-3 py-1.5 font-display text-[10px] font-semibold text-[oklch(0.9_0.03_260)]"
        >
          下一步
        </button>
      </div>

      <BottomToolbar />
    </div>
  );
}
