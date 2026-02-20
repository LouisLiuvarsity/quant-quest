/*
 * SidePanel - Slide-in panel from the right side
 * Routes to different content panels based on activePanel state
 * Style: Glass panel with pixel border accents
 */

import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { HiringPanel } from './panels/HiringPanel';
import { ResearchPanel } from './panels/ResearchPanel';
import { StrategyPanel } from './panels/StrategyPanel';
import { BacktestPanel } from './panels/BacktestPanel';
import { LiveTradingPanel } from './panels/LiveTradingPanel';
import { LeaderboardPanel } from './panels/LeaderboardPanel';
import { ResearcherDetailPanel } from './panels/ResearcherDetailPanel';
import { SubscriptionPanel } from './panels/SubscriptionPanel';

const PANEL_CONFIG: Record<string, { title: string; color: string }> = {
  'hiring': { title: '🧑‍💼 招聘中心', color: 'oklch(0.55 0.2 265)' },
  'research': { title: '🔬 因子研究', color: 'oklch(0.75 0.12 200)' },
  'strategy': { title: '📊 策略工坊', color: 'oklch(0.72 0.19 155)' },
  'backtest': { title: '📈 回测中心', color: 'oklch(0.82 0.15 85)' },
  'live': { title: '🚀 实盘交易', color: 'oklch(0.63 0.22 25)' },
  'leaderboard': { title: '🏆 排行榜', color: 'oklch(0.82 0.15 85)' },
  'researcher-detail': { title: '👤 研究员详情', color: 'oklch(0.55 0.2 265)' },
  'subscription': { title: '⭐ 订阅方案', color: 'oklch(0.82 0.15 85)' },
};

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
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] z-50 flex flex-col overflow-hidden"
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
              {activePanel === 'hiring' && <HiringPanel />}
              {activePanel === 'research' && <ResearchPanel />}
              {activePanel === 'strategy' && <StrategyPanel />}
              {activePanel === 'backtest' && <BacktestPanel />}
              {activePanel === 'live' && <LiveTradingPanel />}
              {activePanel === 'leaderboard' && <LeaderboardPanel />}
              {activePanel === 'researcher-detail' && <ResearcherDetailPanel />}
              {activePanel === 'subscription' && <SubscriptionPanel />}
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
