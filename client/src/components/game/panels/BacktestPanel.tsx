/*
 * BacktestPanel - No longer a standalone panel
 * Backtesting is now embedded within the single-factor and multi-factor workflows
 * This file is kept for backward compatibility but redirects to strategy panel
 */

import { useGame } from '@/contexts/GameContext';

export function BacktestPanel() {
  const { state, setActivePanel } = useGame();

  // Show summary of all factor cards' backtest results
  const factorCards = state.factorCards;
  const passedCount = factorCards.filter(f => f.status === 'passed').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.75_0.12_200)] mb-1">ℹ️ 回测说明</p>
        <p className="font-display text-[11px] text-[oklch(0.5_0.02_260)] leading-relaxed">
          回测已集成到研究工作流中。因子挖掘工作流的 Step 10-15 包含完整的参数搜索、验证集回测和敏感性检验。
          多因子合成工作流的 Step M7-M11 包含 VAL 验证和 OOS 终极评估。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-3 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">已回测因子</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.55_0.2_265)]">{factorCards.length}</p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-3 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">通过验证</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.72_0.19_155)]">{passedCount}</p>
        </div>
      </div>

      {factorCards.length > 0 ? (
        <div className="space-y-2">
          {factorCards.map(fc => (
            <div key={fc.id} className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.25_0.03_260)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{fc.factorName}</span>
                <span className={`font-pixel text-[6px] px-1.5 py-0.5 border ${
                  fc.status === 'passed'
                    ? 'text-[oklch(0.72_0.19_155)] border-[oklch(0.72_0.19_155)]'
                    : 'text-[oklch(0.63_0.22_25)] border-[oklch(0.63_0.22_25)]'
                }`}>
                  {fc.status === 'passed' ? '✅ PASS' : '❌ FAIL'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div>
                  <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">Sharpe</p>
                  <p className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)]">{fc.valPerformance.medianSharpe.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">胜率</p>
                  <p className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)]">{(fc.valPerformance.winRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">年化</p>
                  <p className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)]">{(fc.valPerformance.medianAnnualReturn * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">回撤</p>
                  <p className="font-mono-data text-[10px] text-[oklch(0.63_0.22_25)]">{(fc.valPerformance.medianMaxDrawdown * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-3xl mb-3">📊</p>
          <p className="font-pixel text-[10px] text-[oklch(0.5_0.02_260)]">暂无回测结果</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-2">
            完成因子挖掘任务后会自动进行回测
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActivePanel('factor-library')}
          className="flex-1 font-pixel text-[7px] py-2 bg-[oklch(0.55_0.2_265_/_0.15)] text-[oklch(0.55_0.2_265)] border-2 border-[oklch(0.55_0.2_265_/_0.3)] hover:bg-[oklch(0.55_0.2_265_/_0.25)] transition-all"
        >
          因子库 →
        </button>
        <button
          onClick={() => setActivePanel('strategy')}
          className="flex-1 font-pixel text-[7px] py-2 bg-[oklch(0.72_0.19_155_/_0.15)] text-[oklch(0.72_0.19_155)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] hover:bg-[oklch(0.72_0.19_155_/_0.25)] transition-all"
        >
          策略工坊 →
        </button>
      </div>
    </div>
  );
}
