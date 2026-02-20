/*
 * BacktestPanel - Backtest center showing results and equity curves
 * Displays strategies that have been backtested with detailed metrics
 */

import { useGame } from '@/contexts/GameContext';
import { useMemo } from 'react';

export function BacktestPanel() {
  const { state, startBacktest } = useGame();
  const backtestableStrategies = state.strategies.filter(
    s => s.status === 'backtested' || s.status === 'backtesting' || s.status === 'live'
  );

  // Generate fake equity curve data points
  const generateEquityCurve = useMemo(() => {
    return (totalReturn: number) => {
      const points = 50;
      const data: number[] = [100];
      for (let i = 1; i < points; i++) {
        const trend = (totalReturn * 100) / points;
        const noise = (Math.random() - 0.5) * 3;
        data.push(Math.max(80, data[i - 1] + trend + noise));
      }
      return data;
    };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.6_0.02_260)] mb-1">回测引擎</p>
        <p className="font-display text-[11px] text-[oklch(0.5_0.02_260)]">
          基于2024-01至2025-12的历史数据进行策略回测，包含交易成本和滑点模拟
        </p>
      </div>

      {backtestableStrategies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-3">📊</p>
          <p className="font-pixel text-[10px] text-[oklch(0.5_0.02_260)]">暂无回测结果</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-2">
            前往策略工坊创建策略并开始回测
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {backtestableStrategies.map(strategy => {
            const bt = strategy.backtestResult;
            if (!bt && strategy.status !== 'backtesting') return null;

            const equityData = bt ? generateEquityCurve(bt.totalReturn) : [];
            const maxVal = Math.max(...equityData);
            const minVal = Math.min(...equityData);
            const range = maxVal - minVal || 1;

            return (
              <div
                key={strategy.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                    {strategy.name}
                  </h4>
                  {strategy.status === 'backtesting' && (
                    <span className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] animate-pixel-blink">
                      回测中...
                    </span>
                  )}
                </div>

                {strategy.status === 'backtesting' && (
                  <div className="py-6 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-[oklch(0.82_0.15_85)] border-t-transparent animate-spin" />
                    <p className="font-pixel text-[8px] text-[oklch(0.6_0.02_260)]">
                      正在回测策略...
                    </p>
                    <div className="w-full pixel-progress">
                      <div className="pixel-progress-fill bg-[oklch(0.82_0.15_85)] animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}

                {bt && (
                  <>
                    {/* Mini equity curve using SVG */}
                    <div className="bg-[oklch(0.12_0.02_260)] border border-[oklch(0.22_0.03_260)] p-2 mb-3">
                      <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] mb-1">净值曲线</p>
                      <svg viewBox="0 0 200 60" className="w-full h-16">
                        {/* Grid lines */}
                        {[0, 1, 2, 3].map(i => (
                          <line key={i} x1="0" y1={i * 20} x2="200" y2={i * 20} stroke="oklch(0.22 0.02 260)" strokeWidth="0.5" />
                        ))}
                        {/* Equity curve */}
                        <polyline
                          fill="none"
                          stroke="oklch(0.55 0.2 265)"
                          strokeWidth="1.5"
                          points={equityData.map((v, i) => `${(i / (equityData.length - 1)) * 200},${60 - ((v - minVal) / range) * 55}`).join(' ')}
                        />
                        {/* Fill area */}
                        <polygon
                          fill="oklch(0.55 0.2 265 / 0.1)"
                          points={`0,60 ${equityData.map((v, i) => `${(i / (equityData.length - 1)) * 200},${60 - ((v - minVal) / range) * 55}`).join(' ')} 200,60`}
                        />
                      </svg>
                      <div className="flex justify-between mt-1">
                        <span className="font-mono-data text-[8px] text-[oklch(0.4_0.02_260)]">2024-01</span>
                        <span className="font-mono-data text-[8px] text-[oklch(0.4_0.02_260)]">2025-12</span>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: '总收益', value: `${(bt.totalReturn * 100).toFixed(1)}%`, color: bt.totalReturn >= 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)' },
                        { label: '年化收益', value: `${(bt.annualReturn * 100).toFixed(1)}%`, color: bt.annualReturn >= 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)' },
                        { label: 'Sharpe', value: bt.sharpe.toFixed(2), color: 'oklch(0.55 0.2 265)' },
                        { label: '最大回撤', value: `${(bt.maxDrawdown * 100).toFixed(1)}%`, color: 'oklch(0.63 0.22 25)' },
                        { label: '胜率', value: `${(bt.winRate * 100).toFixed(0)}%`, color: 'oklch(0.82 0.15 85)' },
                        { label: '交易次数', value: bt.tradeCount.toString(), color: 'oklch(0.75 0.12 200)' },
                      ].map(metric => (
                        <div key={metric.label} className="text-center bg-[oklch(0.12_0.02_260)] py-2 px-1">
                          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">{metric.label}</p>
                          <p className="font-mono-data text-xs font-bold" style={{ color: metric.color }}>
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="font-mono-data text-[9px] text-[oklch(0.4_0.02_260)]">
                      回测区间: {bt.period}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
