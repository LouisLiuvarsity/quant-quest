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

export default function Home() {
  const { showIntro, setShowIntro, state, setActivePanel } = useGame();
  const activeTasks = state.activeTasks.filter(task => task.status !== 'completed');
  const waitingTasks = state.activeTasks.filter(task => task.status === 'paused').length;
  const passedFactors = state.factorCards.filter(card => card.status === 'passed').length;
  const adoptedPortfolios = state.portfolioCards.filter(card => card.status === 'adopted').length;
  const liveStrategies = state.strategies.filter(strategy => strategy.status === 'live').length;

  const mission = !state.projectConfig
    ? {
        title: '完成项目初始化',
        detail: '设置 K 线、资产池和数据切分后再启动研究。',
        actionLabel: '去配置研究项目',
        actionPanel: 'research' as const,
      }
    : waitingTasks > 0
      ? {
          title: `处理 ${waitingTasks} 个 CEO 决策点`,
          detail: '决策会影响质量/风险/效率，并改变后续成本。',
          actionLabel: '去处理决策',
          actionPanel: 'research' as const,
        }
      : passedFactors < 2
        ? {
            title: '继续挖掘可通过因子',
            detail: '目标至少 2 个通过因子，再进入多因子合成。',
            actionLabel: '发起单因子研究',
            actionPanel: 'research' as const,
          }
        : adoptedPortfolios === 0
          ? {
              title: '发起多因子合成',
              detail: '把通过因子做去冗余和加权，产出可部署组合。',
              actionLabel: '进入多因子面板',
              actionPanel: 'research' as const,
            }
          : liveStrategies === 0
            ? {
                title: '部署首个实盘策略',
                detail: '从因子或组合档案卡创建策略并上线模拟。',
                actionLabel: '打开策略工坊',
                actionPanel: 'strategy' as const,
              }
            : {
                title: '持续优化研究画像',
                detail: '平衡质量、风险和效率，稳定提升组合表现。',
                actionLabel: '查看研究面板',
                actionPanel: 'research' as const,
              };

  if (showIntro) {
    return (
      <IntroScreen
        onStart={() => setShowIntro(false)}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[oklch(0.08_0.015_260)]">
      {/* Top HUD */}
      <TopHUD />

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-2">
            <div className="pointer-events-auto border-2 border-[oklch(0.3_0.03_260_/_0.8)] bg-[oklch(0.08_0.015_260_/_0.82)] backdrop-blur-sm px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">🎮 CEO 指挥台</p>
                  <p className="font-display text-sm text-[oklch(0.9_0.01_260)] mt-1">{mission.title}</p>
                  <p className="font-display text-[11px] text-[oklch(0.58_0.02_260)] mt-0.5">{mission.detail}</p>
                </div>
                <button
                  onClick={() => setActivePanel(mission.actionPanel)}
                  className="font-pixel text-[7px] px-3 py-2 border-2 border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.18)] text-[oklch(0.9_0.03_260)] hover:bg-[oklch(0.55_0.2_265_/_0.32)] transition-all shrink-0"
                >
                  {mission.actionLabel}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                {[
                  { label: '活跃研究', value: activeTasks.length, color: 'oklch(0.55 0.2 265)' },
                  { label: '通过因子', value: passedFactors, color: 'oklch(0.75 0.12 200)' },
                  { label: '采纳组合', value: adoptedPortfolios, color: 'oklch(0.72 0.19 155)' },
                  { label: '实盘策略', value: liveStrategies, color: 'oklch(0.82 0.15 85)' },
                ].map(item => (
                  <div key={item.label} className="bg-[oklch(0.12_0.02_260_/_0.75)] border border-[oklch(0.24_0.025_260)] px-2 py-1.5">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">{item.label}</p>
                    <p className="font-mono-data text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden xl:block pointer-events-auto border-2 border-[oklch(0.28_0.03_260)] bg-[oklch(0.08_0.015_260_/_0.8)] backdrop-blur-sm px-3 py-2.5">
              <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)]">📚 玩法循环</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  '1. 招募研究员',
                  '2. 单因子挖掘',
                  '3. CEO 决策推进',
                  '4. 多因子合成',
                  '5. 策略部署/实盘',
                ].map(item => (
                  <span key={item} className="font-display text-[11px] text-[oklch(0.78_0.02_260)] border border-[oklch(0.24_0.025_260)] bg-[oklch(0.12_0.02_260)] px-2 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <OfficeScene />

        {/* Side panel overlay */}
        <SidePanel />
      </div>

      {/* Mobile PnL bar (shown on small screens) */}
      <div className="sm:hidden flex items-center justify-center gap-4 py-1.5 bg-[oklch(0.08_0.015_260_/_0.97)] border-t border-[oklch(0.2_0.02_260)]">
        <div className="text-center">
          <span className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">P&L</span>
          <p className="font-mono-data text-xs font-bold text-[oklch(0.72_0.19_155)]">${Math.round(state.totalPnl).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <span className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">因子</span>
          <p className="font-mono-data text-xs font-bold text-[oklch(0.75_0.12_200)]">{state.factorCards.length}</p>
        </div>
        <div className="text-center">
          <span className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">报告</span>
          <p className="font-mono-data text-xs font-bold text-[oklch(0.82_0.15_85)]">{state.reports.length}</p>
        </div>
        <div className="text-center">
          <span className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">决策</span>
          <p className={`font-mono-data text-xs font-bold ${waitingTasks > 0 ? 'text-[oklch(0.82_0.15_85)]' : 'text-[oklch(0.72_0.19_155)]'}`}>{waitingTasks}</p>
        </div>
      </div>

      {/* Bottom toolbar */}
      <BottomToolbar />
    </div>
  );
}
