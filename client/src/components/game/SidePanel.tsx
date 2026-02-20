/*
 * SidePanel - Slide-in panel from the right
 * Routes to different panel views based on activePanel state
 */

import { useGame } from '@/contexts/GameContext';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { HiringPanel } from './panels/HiringPanel';
import { ResearchPanel } from './panels/ResearchPanel';
import { StrategyPanel } from './panels/StrategyPanel';
import { LiveTradingPanel } from './panels/LiveTradingPanel';
import { LeaderboardPanel } from './panels/LeaderboardPanel';
import { ResearcherDetailPanel } from './panels/ResearcherDetailPanel';
import { SubscriptionPanel } from './panels/SubscriptionPanel';
import { FactorLibraryPanel } from './panels/FactorLibraryPanel';
import { ReportLibraryPanel } from './panels/ReportLibraryPanel';
import { ReportViewerPanel } from './panels/ReportViewerPanel';

const PANEL_CONFIG: Record<string, { title: string; color: string }> = {
  'hiring': { title: '👥 招聘中心', color: 'oklch(0.55 0.2 265)' },
  'research': { title: '🔬 研究实验室', color: 'oklch(0.75 0.12 200)' },
  'strategy': { title: '📊 策略工坊', color: 'oklch(0.72 0.19 155)' },
  'factor-library': { title: '🗄️ 因子库', color: 'oklch(0.55 0.2 265)' },
  'report-library': { title: '📋 研究报告库', color: 'oklch(0.82 0.15 85)' },
  'report-viewer': { title: '📄 研究报告', color: 'oklch(0.82 0.15 85)' },
  'live': { title: '🚀 实盘交易', color: 'oklch(0.63 0.22 25)' },
  'leaderboard': { title: '🏆 排行榜', color: 'oklch(0.82 0.15 85)' },
  'researcher-detail': { title: '👤 研究员详情', color: 'oklch(0.55 0.2 265)' },
  'subscription': { title: '⭐ 订阅方案', color: 'oklch(0.82 0.15 85)' },
};

function PanelContent({ panelId }: { panelId: string }) {
  switch (panelId) {
    case 'hiring': return <HiringPanel />;
    case 'research': return <ResearchPanel />;
    case 'strategy': return <StrategyPanel />;
    case 'factor-library': return <FactorLibraryPanel />;
    case 'report-library': return <ReportLibraryPanel />;
    case 'report-viewer': return <ReportViewerPanel />;
    case 'live': return <LiveTradingPanel />;
    case 'leaderboard': return <LeaderboardPanel />;
    case 'researcher-detail': return <ResearcherDetailPanel />;
    case 'subscription': return <SubscriptionPanel />;
    default: return null;
  }
}

export function SidePanel() {
  const { activePanel, setActivePanel, setSelectedResearcher } = useGame();

  const handleClose = () => {
    setActivePanel(null);
    setSelectedResearcher(null);
  };

  const config = activePanel ? PANEL_CONFIG[activePanel] : null;

  return (
    <AnimatePresence>
      {activePanel && config && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[oklch(0.06_0.015_260_/_0.5)] backdrop-blur-[2px] z-40"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] md:w-[460px] z-50 flex flex-col overflow-hidden"
            style={{
              background: 'oklch(0.12 0.02 260 / 0.97)',
              backdropFilter: 'blur(20px) saturate(1.5)',
              borderLeft: `2px solid ${config.color}30`,
              boxShadow: `-8px 0 30px oklch(0.06 0.015 260 / 0.5)`,
            }}
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b-2"
              style={{ borderColor: `${config.color}25`, background: `${config.color}08` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-5" style={{ backgroundColor: config.color }} />
                <h2 className="font-pixel text-[9px]" style={{ color: config.color }}>
                  {config.title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-[oklch(0.45_0.02_260)] hover:text-[oklch(0.92_0.01_260)] hover:bg-[oklch(0.18_0.025_260)] transition-all border border-transparent hover:border-[oklch(0.28_0.03_260)]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <PanelContent panelId={activePanel} />
            </div>

            {/* Bottom edge decoration */}
            <div className="h-1 flex">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? `${config.color}20` : 'transparent',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
