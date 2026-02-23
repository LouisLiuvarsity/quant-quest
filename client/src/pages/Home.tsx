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
  const { showIntro, setShowIntro, state } = useGame();

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
      </div>

      {/* Bottom toolbar */}
      <BottomToolbar />
    </div>
  );
}
