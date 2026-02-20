/*
 * LiveTradingPanel - Live trading simulation dashboard
 * Shows running strategies, PnL, and trading activity
 * Free vs Pro mode differences
 */

import { useGame } from '@/contexts/GameContext';
import { useMemo } from 'react';

export function LiveTradingPanel() {
  const { state, setActivePanel } = useGame();
  const liveStrategies = state.strategies.filter(s => s.status === 'live');
  const liveCount = liveStrategies.length;

  // Generate fake recent trades
  const recentTrades = useMemo(() => [
    { time: '14:32:15', symbol: 'BTC/USDT', side: 'BUY', price: 98542.5, qty: 0.015, pnl: 23.4 },
    { time: '14:28:03', symbol: 'ETH/USDT', side: 'SELL', price: 3421.8, qty: 0.5, pnl: -12.1 },
    { time: '14:15:47', symbol: 'SOL/USDT', side: 'BUY', price: 185.3, qty: 2.0, pnl: 8.7 },
    { time: '13:58:22', symbol: 'BTC/USDT', side: 'SELL', price: 98380.0, qty: 0.01, pnl: 15.2 },
    { time: '13:42:11', symbol: 'ETH/USDT', side: 'BUY', price: 3415.2, qty: 0.3, pnl: -5.8 },
  ], []);

  return (
    <div className="p-4 space-y-4">
      {/* Mode indicator */}
      <div className={`border-2 p-3 ${
        state.plan === 'pro'
          ? 'bg-[oklch(0.82_0.15_85_/_0.05)] border-[oklch(0.82_0.15_85_/_0.3)]'
          : 'bg-[oklch(0.16_0.025_260)] border-[oklch(0.28_0.03_260)]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
            {state.plan === 'pro' ? '⭐ PRO 模式' : '🆓 免费模式'}
          </span>
          <span className="font-mono-data text-xs text-[oklch(0.7_0.02_260)]">
            策略: {liveCount} / {state.maxLiveStrategies}
          </span>
        </div>
        {state.plan === 'free' && (
          <div className="flex items-center justify-between">
            <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">
              免费版最多3个策略，收益不可提现
            </p>
            <button
              onClick={() => setActivePanel('subscription')}
              className="font-pixel text-[7px] px-2 py-1 bg-[oklch(0.82_0.15_85_/_0.15)] text-[oklch(0.82_0.15_85)] border border-[oklch(0.82_0.15_85_/_0.3)] hover:bg-[oklch(0.82_0.15_85_/_0.25)] transition-all"
            >
              升级PRO
            </button>
          </div>
        )}
        {state.plan === 'pro' && (
          <div className="space-y-1">
            <p className="font-display text-[10px] text-[oklch(0.6_0.02_260)]">
              配资: 1,000 USDT · 利润提现: 50%-90%
            </p>
          </div>
        )}
      </div>

      {/* Total PnL */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-4 text-center">
        <p className="font-pixel text-[7px] text-[oklch(0.5_0.02_260)] mb-1">总实盘收益</p>
        <p className={`font-mono-data text-2xl font-bold ${state.totalPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
          {state.totalPnl >= 0 ? '+' : ''}{Math.round(state.totalPnl).toLocaleString()} USDT
        </p>
        <p className="font-mono-data text-xs text-[oklch(0.5_0.02_260)] mt-1">
          ≈ ¥{Math.round(state.totalPnl * 7.2).toLocaleString()}
        </p>
      </div>

      {/* Live strategies */}
      {liveStrategies.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-3xl mb-3">🚀</p>
          <p className="font-pixel text-[10px] text-[oklch(0.5_0.02_260)]">暂无运行中的策略</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-2">
            在策略工坊中将回测通过的策略上线实盘
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {liveStrategies.map(strategy => (
            <div
              key={strategy.id}
              className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                  🚀 {strategy.name}
                </h4>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[oklch(0.72_0.19_155)] animate-pulse" />
                  <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">LIVE</span>
                </div>
              </div>

              {strategy.liveResult && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[oklch(0.12_0.02_260)] p-2 text-center">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">累计收益</p>
                    <p className={`font-mono-data text-sm font-bold ${strategy.liveResult.pnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      {strategy.liveResult.pnl >= 0 ? '+' : ''}{strategy.liveResult.pnl.toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-[oklch(0.12_0.02_260)] p-2 text-center">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">今日收益</p>
                    <p className={`font-mono-data text-sm font-bold ${strategy.liveResult.todayPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      {strategy.liveResult.todayPnl >= 0 ? '+' : ''}{strategy.liveResult.todayPnl.toFixed(0)}
                    </p>
                  </div>
                  <div className="bg-[oklch(0.12_0.02_260)] p-2 text-center">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">运行天数</p>
                    <p className="font-mono-data text-sm font-bold text-[oklch(0.75_0.12_200)]">
                      {strategy.liveResult.runningDays}
                    </p>
                  </div>
                  <div className="bg-[oklch(0.12_0.02_260)] p-2 text-center">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">收益率</p>
                    <p className={`font-mono-data text-sm font-bold ${strategy.liveResult.pnlPercent >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      {(strategy.liveResult.pnlPercent * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent trades */}
      {liveStrategies.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-2">最近成交</p>
          <div className="bg-[oklch(0.12_0.02_260)] border-2 border-[oklch(0.22_0.03_260)]">
            <div className="grid grid-cols-6 gap-1 px-2 py-1.5 border-b border-[oklch(0.22_0.03_260)]">
              {['时间', '币对', '方向', '价格', '数量', '盈亏'].map(h => (
                <span key={h} className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">{h}</span>
              ))}
            </div>
            {recentTrades.map((trade, i) => (
              <div key={i} className="grid grid-cols-6 gap-1 px-2 py-1.5 border-b border-[oklch(0.18_0.02_260)] last:border-0">
                <span className="font-mono-data text-[8px] text-[oklch(0.5_0.02_260)]">{trade.time}</span>
                <span className="font-mono-data text-[8px] text-[oklch(0.8_0.01_260)]">{trade.symbol.split('/')[0]}</span>
                <span className={`font-pixel text-[6px] ${trade.side === 'BUY' ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                  {trade.side}
                </span>
                <span className="font-mono-data text-[8px] text-[oklch(0.7_0.02_260)]">{trade.price}</span>
                <span className="font-mono-data text-[8px] text-[oklch(0.6_0.02_260)]">{trade.qty}</span>
                <span className={`font-mono-data text-[8px] ${trade.pnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
