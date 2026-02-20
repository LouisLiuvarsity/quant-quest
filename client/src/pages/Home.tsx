/*
 * QuantQuest Home - Main Game View
 * Design: Modern Pixel × Isometric Office
 * - Dark theme with pixel accents
 * - Top HUD bar with company stats
 * - Center: Pixel office scene with interactive researchers
 * - Bottom: Quick action toolbar
 * - Right: Slide-in detail panels
 */

import { useGame } from '@/contexts/GameContext';
import { TopHUD } from '@/components/game/TopHUD';
import { OfficeScene } from '@/components/game/OfficeScene';
import { BottomToolbar } from '@/components/game/BottomToolbar';
import { SidePanel } from '@/components/game/SidePanel';
import { IntroScreen } from '@/components/game/IntroScreen';
import { NotificationToast } from '@/components/game/NotificationToast';

export default function Home() {
  const { showIntro, setShowIntro, state } = useGame();

  if (showIntro) {
    return <IntroScreen onStart={() => setShowIntro(false)} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative bg-[oklch(0.08_0.015_260)]">
      {/* Top HUD */}
      <TopHUD />

      {/* Mobile PnL bar (visible only on small screens) */}
      <div className="sm:hidden flex items-center justify-center gap-4 py-1.5 bg-[oklch(0.1_0.015_260)] border-b border-[oklch(0.2_0.02_260)]">
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">P&L</span>
          <span className={`font-mono-data text-xs font-bold ${state.totalPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
            {state.totalPnl >= 0 ? '+' : ''}${Math.round(state.totalPnl).toLocaleString()}
          </span>
        </div>
        <div className="w-px h-3 bg-[oklch(0.22_0.025_260)]" />
        <div className="flex items-center gap-1.5">
          <span className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">策略</span>
          <span className="font-mono-data text-xs text-[oklch(0.72_0.19_155)]">
            {state.strategies.filter(s => s.status === 'live').length} LIVE
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Office Scene */}
        <OfficeScene />

        {/* Side Panel (slides in from right) */}
        <SidePanel />
      </div>

      {/* Bottom Toolbar */}
      <BottomToolbar />

      {/* Notification Toasts */}
      <NotificationToast />
    </div>
  );
}
