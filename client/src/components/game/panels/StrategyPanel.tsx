/*
 * StrategyPanel - Strategy composition and management
 * Create new strategies by combining factors
 * View existing strategies and their status
 */

import { useGame, type Strategy } from '@/contexts/GameContext';
import { toast } from 'sonner';
import { useState } from 'react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: '草稿', color: 'oklch(0.5 0.02 260)', icon: '📝' },
  backtesting: { label: '回测中', color: 'oklch(0.82 0.15 85)', icon: '⏳' },
  backtested: { label: '已回测', color: 'oklch(0.55 0.2 265)', icon: '✅' },
  live: { label: '实盘中', color: 'oklch(0.72 0.19 155)', icon: '🚀' },
  stopped: { label: '已停止', color: 'oklch(0.63 0.22 25)', icon: '⏹️' },
};

export function StrategyPanel() {
  const { state, startBacktest, goLive } = useGame();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [strategyName, setStrategyName] = useState('');

  const deployedFactors = state.factors.filter(f => f.status === 'deployed' || f.status === 'validated');

  const handleCreate = () => {
    if (!strategyName || selectedFactors.length === 0) {
      toast.error('请输入策略名称并选择至少一个因子');
      return;
    }
    toast.success('策略已创建', { description: `${strategyName} - 包含 ${selectedFactors.length} 个因子` });
    setShowCreate(false);
    setStrategyName('');
    setSelectedFactors([]);
  };

  const toggleFactor = (id: string) => {
    setSelectedFactors(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const liveCount = state.strategies.filter(s => s.status === 'live').length;

  return (
    <div className="p-4 space-y-4">
      {/* Create new strategy */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full font-pixel text-[8px] py-3 bg-[oklch(0.2_0.03_260)] border-2 border-dashed border-[oklch(0.35_0.03_260)] text-[oklch(0.6_0.02_260)] hover:border-[oklch(0.55_0.2_265)] hover:text-[oklch(0.55_0.2_265)] transition-all"
        >
          + 创建新策略
        </button>
      ) : (
        <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.55_0.2_265)] p-3 space-y-3">
          <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)]">创建新策略</p>

          <input
            type="text"
            value={strategyName}
            onChange={e => setStrategyName(e.target.value)}
            placeholder="策略名称..."
            className="w-full bg-[oklch(0.12_0.02_260)] border-2 border-[oklch(0.28_0.03_260)] px-3 py-2 font-display text-sm text-[oklch(0.9_0.01_260)] placeholder:text-[oklch(0.4_0.02_260)] focus:border-[oklch(0.55_0.2_265)] focus:outline-none"
          />

          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.6_0.02_260)] mb-2">选择因子</p>
            <div className="space-y-1.5">
              {deployedFactors.map(f => (
                <button
                  key={f.id}
                  onClick={() => toggleFactor(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 border-2 transition-all text-left ${
                    selectedFactors.includes(f.id)
                      ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.1)]'
                      : 'border-[oklch(0.25_0.03_260)] hover:border-[oklch(0.35_0.03_260)]'
                  }`}
                >
                  <span className="font-display text-xs text-[oklch(0.85_0.01_260)]">{f.name}</span>
                  <span className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)]">
                    IC: {f.ic.toFixed(3)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 font-pixel text-[8px] py-2 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
            >
              创建
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 font-pixel text-[8px] py-2 bg-[oklch(0.2_0.03_260)] text-[oklch(0.6_0.02_260)] border-2 border-[oklch(0.3_0.03_260)] hover:bg-[oklch(0.25_0.03_260)] transition-all"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Strategy list */}
      <div className="space-y-3">
        {state.strategies.map(strategy => {
          const config = STATUS_CONFIG[strategy.status];
          const factors = strategy.factors.map(fId => state.factors.find(f => f.id === fId)).filter(Boolean);

          return (
            <div
              key={strategy.id}
              className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.25_0.03_260)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                  {config.icon} {strategy.name}
                </h4>
                <span
                  className="font-pixel text-[7px] px-2 py-0.5 border"
                  style={{ color: config.color, borderColor: config.color }}
                >
                  {config.label}
                </span>
              </div>

              {/* Factors used */}
              <div className="flex flex-wrap gap-1 mb-2">
                {factors.map(f => f && (
                  <span key={f.id} className="font-display text-[10px] px-1.5 py-0.5 bg-[oklch(0.2_0.03_260)] text-[oklch(0.6_0.02_260)]">
                    {f.name}
                  </span>
                ))}
              </div>

              {/* Backtest results */}
              {strategy.backtestResult && (
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1.5">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">年化</p>
                    <p className={`font-mono-data text-[11px] font-bold ${strategy.backtestResult.annualReturn >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      {(strategy.backtestResult.annualReturn * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1.5">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">Sharpe</p>
                    <p className="font-mono-data text-[11px] font-bold text-[oklch(0.55_0.2_265)]">
                      {strategy.backtestResult.sharpe.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1.5">
                    <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">最大回撤</p>
                    <p className="font-mono-data text-[11px] font-bold text-[oklch(0.63_0.22_25)]">
                      {(strategy.backtestResult.maxDrawdown * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Live results */}
              {strategy.liveResult && (
                <div className="bg-[oklch(0.12_0.02_260)] border border-[oklch(0.72_0.19_155_/_0.3)] p-2 mb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">实盘收益</span>
                    <span className={`font-mono-data text-sm font-bold ${strategy.liveResult.pnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      {strategy.liveResult.pnl >= 0 ? '+' : ''}{strategy.liveResult.pnl.toFixed(0)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">
                      运行 {strategy.liveResult.runningDays} 天
                    </span>
                    <span className={`font-mono-data text-[10px] ${strategy.liveResult.todayPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      今日: {strategy.liveResult.todayPnl >= 0 ? '+' : ''}{strategy.liveResult.todayPnl.toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {strategy.status === 'draft' && (
                  <button
                    onClick={() => startBacktest(strategy.id)}
                    className="flex-1 font-pixel text-[7px] py-1.5 bg-[oklch(0.82_0.15_85_/_0.15)] text-[oklch(0.82_0.15_85)] border border-[oklch(0.82_0.15_85_/_0.3)] hover:bg-[oklch(0.82_0.15_85_/_0.25)] transition-all"
                  >
                    📈 开始回测
                  </button>
                )}
                {strategy.status === 'backtested' && (
                  <>
                    <button
                      onClick={() => startBacktest(strategy.id)}
                      className="flex-1 font-pixel text-[7px] py-1.5 bg-[oklch(0.82_0.15_85_/_0.15)] text-[oklch(0.82_0.15_85)] border border-[oklch(0.82_0.15_85_/_0.3)] hover:bg-[oklch(0.82_0.15_85_/_0.25)] transition-all"
                    >
                      🔄 重新回测
                    </button>
                    <button
                      onClick={() => {
                        if (liveCount >= state.maxLiveStrategies) {
                          toast.error(`实盘策略已达上限 (${state.maxLiveStrategies})`, {
                            description: state.plan === 'free' ? '升级Pro版可运行更多策略' : '',
                          });
                          return;
                        }
                        goLive(strategy.id);
                      }}
                      className="flex-1 font-pixel text-[7px] py-1.5 bg-[oklch(0.72_0.19_155_/_0.15)] text-[oklch(0.72_0.19_155)] border border-[oklch(0.72_0.19_155_/_0.3)] hover:bg-[oklch(0.72_0.19_155_/_0.25)] transition-all"
                    >
                      🚀 上线实盘
                    </button>
                  </>
                )}
                {strategy.status === 'backtesting' && (
                  <div className="flex-1 flex items-center justify-center gap-2 py-1.5">
                    <div className="w-3 h-3 border-2 border-[oklch(0.82_0.15_85)] border-t-transparent animate-spin" />
                    <span className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">回测中...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
