/*
 * ReportViewerPanel - Full research report viewer
 * Adapts to factorResult, backtestResult, or optimizationResult
 * Shows: summary, equity curve chart, key metrics, insights, recommendations
 */

import { useGame, TASK_TYPE_LABELS } from '@/contexts/GameContext';
import { useRef, useEffect } from 'react';

// Convert oklch to hex for canvas compatibility
const COLOR_MAP: Record<string, string> = {
  'oklch(0.72 0.19 155)': '#22c55e',
  'oklch(0.63 0.22 25)': '#ef4444',
  'oklch(0.55 0.2 265)': '#6366f1',
  'oklch(0.5 0.1 260)': '#6b7280',
  'oklch(0.82 0.15 85)': '#eab308',
  'oklch(0.75 0.12 200)': '#06b6d4',
};

function resolveColor(c: string): string {
  return COLOR_MAP[c] || c;
}

function MiniChart({ data, color, comparisonData }: { data: number[]; color: string; comparisonData?: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const allData = comparisonData ? [...data, ...comparisonData] : data;
    const min = Math.min(...allData);
    const max = Math.max(...allData);
    const range = max - min || 1;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const drawLine = (lineData: number[], lineColor: string, lw: number, dashed = false) => {
      const resolved = resolveColor(lineColor);
      const stepX = w / (lineData.length - 1);
      // Fill
      if (!dashed) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        lineData.forEach((v, i) => {
          const x = i * stepX;
          const y = h - ((v - min) / range) * (h * 0.85) - h * 0.05;
          ctx.lineTo(x, y);
        });
        ctx.lineTo(w, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, resolved + '40');
        grad.addColorStop(1, resolved + '05');
        ctx.fillStyle = grad;
        ctx.fill();
      }
      // Line
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 3]);
      lineData.forEach((v, i) => {
        const x = i * stepX;
        const y = h - ((v - min) / range) * (h * 0.85) - h * 0.05;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = resolved;
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.setLineDash([]);
      // End dot
      if (!dashed) {
        const lastX = (lineData.length - 1) * stepX;
        const lastY = h - ((lineData[lineData.length - 1] - min) / range) * (h * 0.85) - h * 0.05;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = resolved;
        ctx.fill();
      }
    };

    if (comparisonData) {
      drawLine(comparisonData, 'oklch(0.5 0.1 260)', 1.5, true);
    }
    drawLine(data, color, 2);
  }, [data, color, comparisonData]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function MetricCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-[oklch(0.12_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
      <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)] mb-1">{label}</p>
      <p className="font-mono-data text-sm font-bold" style={{ color }}>{value}</p>
      {sub && <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)] mt-0.5">{sub}</p>}
    </div>
  );
}

export function ReportViewerPanel() {
  const { selectedReport, setActivePanel } = useGame();

  if (!selectedReport) {
    return (
      <div className="p-4 text-center py-12">
        <p className="font-display text-sm text-[oklch(0.5_0.02_260)]">未选择报告</p>
      </div>
    );
  }

  const r = selectedReport;

  // Determine report content based on type
  const isFactorReport = r.type === 'factor_mining' && r.factorResult;
  const isBacktestReport = r.type === 'strategy_backtest' && r.backtestResult;
  const isOptReport = r.type === 'optimization' && r.optimizationResult;

  return (
    <div className="p-4 space-y-4">
      {/* Report header */}
      <div className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.28_0.03_260)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)]">
            {TASK_TYPE_LABELS[r.type]}
          </span>
          <span className="font-mono-data text-[9px] text-[oklch(0.45_0.02_260)]">
            {r.createdAt}
          </span>
        </div>
        <h3 className="font-display text-base font-bold text-[oklch(0.92_0.01_260)]">{r.title}</h3>
        <p className="font-display text-xs text-[oklch(0.55_0.02_260)] mt-1 leading-relaxed">{r.summary}</p>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[oklch(0.22_0.025_260)]">
          <span className="font-display text-[10px] text-[oklch(0.45_0.02_260)]">研究员: {r.researcherName}</span>
          <span className="font-mono-data text-[9px] text-[oklch(0.82_0.15_85)]">🪙 {r.tokenCost.toLocaleString()}</span>
        </div>
      </div>

      {/* ===== Factor Mining Report ===== */}
      {isFactorReport && r.factorResult && (
        <>
          {/* Equity curve */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">📈 因子净值曲线</span>
              <span className={`font-mono-data text-xs font-bold ${r.factorResult.annualReturn > 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                年化 {(r.factorResult.annualReturn * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-32 w-full">
              <MiniChart
                data={r.factorResult.equityCurve}
                color={r.factorResult.annualReturn > 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)'}
              />
            </div>
          </div>

          {/* Key metrics */}
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📊 关键指标</p>
            <div className="grid grid-cols-3 gap-1.5">
              <MetricCard label="IC" value={r.factorResult.ic.toFixed(4)} color="oklch(0.55 0.2 265)" />
              <MetricCard label="ICIR" value={r.factorResult.icir.toFixed(2)} color="oklch(0.55 0.2 265)" />
              <MetricCard label="Sharpe" value={r.factorResult.sharpe.toFixed(2)} color={r.factorResult.sharpe > 1 ? 'oklch(0.72 0.19 155)' : 'oklch(0.82 0.15 85)'} />
              <MetricCard label="年化收益" value={`${(r.factorResult.annualReturn * 100).toFixed(1)}%`} color={r.factorResult.annualReturn > 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)'} />
              <MetricCard label="最大回撤" value={`${(r.factorResult.maxDrawdown * 100).toFixed(1)}%`} color="oklch(0.63 0.22 25)" />
              <MetricCard label="胜率" value={`${(r.factorResult.winRate * 100).toFixed(0)}%`} color={r.factorResult.winRate > 0.5 ? 'oklch(0.72 0.19 155)' : 'oklch(0.82 0.15 85)'} />
              <MetricCard label="换手率" value={`${(r.factorResult.turnover * 100).toFixed(0)}%`} color="oklch(0.75 0.12 200)" />
              <MetricCard label="分类" value={r.factorResult.category} color="oklch(0.7 0.02 260)" />
              <MetricCard label="因子名" value={r.factorResult.factorName} color="oklch(0.55 0.2 265)" />
            </div>
          </div>

          {/* Factor formula */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">🧬 因子公式</p>
            <p className="font-mono-data text-[10px] text-[oklch(0.7_0.02_260)] bg-[oklch(0.1_0.015_260)] p-2.5 border border-[oklch(0.2_0.02_260)] leading-relaxed">
              {r.factorResult.formula}
            </p>
            <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-2 leading-relaxed">
              {r.factorResult.description}
            </p>
          </div>

          {/* Drawdown curve */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <span className="font-pixel text-[7px] text-[oklch(0.63_0.22_25)]">📉 回撤曲线</span>
            <div className="h-20 w-full mt-2">
              <MiniChart data={r.factorResult.drawdownCurve} color="oklch(0.63 0.22 25)" />
            </div>
          </div>

          {/* Monthly returns */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📅 月度收益</p>
            <div className="grid grid-cols-6 gap-1">
              {r.factorResult.monthlyReturns.slice(0, 12).map((ret, i) => (
                <div
                  key={i}
                  className="text-center py-1.5 border"
                  style={{
                    backgroundColor: ret > 0
                      ? `oklch(0.72 0.19 155 / ${Math.min(Math.abs(ret) * 0.05, 0.4)})`
                      : `oklch(0.63 0.22 25 / ${Math.min(Math.abs(ret) * 0.05, 0.4)})`,
                    borderColor: 'oklch(0.2 0.02 260)',
                  }}
                >
                  <p className="font-mono-data text-[7px] text-[oklch(0.5_0.02_260)]">{i + 1}月</p>
                  <p className={`font-mono-data text-[8px] font-bold ${ret > 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                    {ret > 0 ? '+' : ''}{ret.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== Backtest Report ===== */}
      {isBacktestReport && r.backtestResult && (
        <>
          {/* Equity curve */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">📈 策略净值曲线</span>
              <span className={`font-mono-data text-xs font-bold ${r.backtestResult.totalReturn > 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                总收益 {(r.backtestResult.totalReturn * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-32 w-full">
              <MiniChart
                data={r.backtestResult.equityCurve}
                color={r.backtestResult.totalReturn > 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)'}
              />
            </div>
          </div>

          {/* Key metrics */}
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📊 关键指标</p>
            <div className="grid grid-cols-3 gap-1.5">
              <MetricCard label="总收益" value={`${(r.backtestResult.totalReturn * 100).toFixed(1)}%`} color={r.backtestResult.totalReturn > 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)'} />
              <MetricCard label="年化收益" value={`${(r.backtestResult.annualReturn * 100).toFixed(1)}%`} color={r.backtestResult.annualReturn > 0 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)'} />
              <MetricCard label="Sharpe" value={r.backtestResult.sharpe.toFixed(2)} color={r.backtestResult.sharpe > 1 ? 'oklch(0.72 0.19 155)' : 'oklch(0.82 0.15 85)'} />
              <MetricCard label="最大回撤" value={`${(r.backtestResult.maxDrawdown * 100).toFixed(1)}%`} color="oklch(0.63 0.22 25)" />
              <MetricCard label="胜率" value={`${(r.backtestResult.winRate * 100).toFixed(0)}%`} color={r.backtestResult.winRate > 0.5 ? 'oklch(0.72 0.19 155)' : 'oklch(0.82 0.15 85)'} />
              <MetricCard label="交易次数" value={r.backtestResult.tradeCount.toString()} color="oklch(0.55 0.2 265)" />
              <MetricCard label="平均持仓" value={`${r.backtestResult.avgHoldDays.toFixed(1)}天`} color="oklch(0.75 0.12 200)" />
              <MetricCard label="盈亏比" value={r.backtestResult.profitFactor.toFixed(2)} color={r.backtestResult.profitFactor > 1 ? 'oklch(0.72 0.19 155)' : 'oklch(0.63 0.22 25)'} />
              <MetricCard label="Calmar" value={r.backtestResult.calmarRatio.toFixed(2)} color={r.backtestResult.calmarRatio > 1 ? 'oklch(0.72 0.19 155)' : 'oklch(0.82 0.15 85)'} />
            </div>
          </div>

          {/* Drawdown */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <span className="font-pixel text-[7px] text-[oklch(0.63_0.22_25)]">📉 回撤曲线</span>
            <div className="h-20 w-full mt-2">
              <MiniChart data={r.backtestResult.drawdownCurve} color="oklch(0.63 0.22 25)" />
            </div>
          </div>

          {/* Monthly returns */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📅 月度收益</p>
            <div className="grid grid-cols-6 gap-1">
              {r.backtestResult.monthlyReturns.slice(0, 12).map((ret, i) => (
                <div
                  key={i}
                  className="text-center py-1.5 border"
                  style={{
                    backgroundColor: ret > 0
                      ? `oklch(0.72 0.19 155 / ${Math.min(Math.abs(ret) * 0.05, 0.4)})`
                      : `oklch(0.63 0.22 25 / ${Math.min(Math.abs(ret) * 0.05, 0.4)})`,
                    borderColor: 'oklch(0.2 0.02 260)',
                  }}
                >
                  <p className="font-mono-data text-[7px] text-[oklch(0.5_0.02_260)]">{i + 1}月</p>
                  <p className={`font-mono-data text-[8px] font-bold ${ret > 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                    {ret > 0 ? '+' : ''}{ret.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== Optimization Report ===== */}
      {isOptReport && r.optimizationResult && (
        <>
          {/* Comparison chart */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">📈 优化前后对比</span>
              <div className="flex items-center gap-3">
                <span className="font-mono-data text-[8px] text-[oklch(0.5_0.1_260)]">--- 优化前</span>
                <span className="font-mono-data text-[8px] text-[oklch(0.72_0.19_155)]">— 优化后</span>
              </div>
            </div>
            <div className="h-32 w-full">
              <MiniChart
                data={r.optimizationResult.equityCurve}
                color="oklch(0.72 0.19 155)"
                comparisonData={r.optimizationResult.comparisonCurve}
              />
            </div>
          </div>

          {/* Before vs After */}
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📊 优化效果</p>
            <div className="grid grid-cols-3 gap-1.5">
              <MetricCard
                label="Sharpe (前)"
                value={r.optimizationResult.originalSharpe.toFixed(2)}
                color="oklch(0.5 0.1 260)"
              />
              <MetricCard
                label="Sharpe (后)"
                value={r.optimizationResult.optimizedSharpe.toFixed(2)}
                color="oklch(0.72 0.19 155)"
              />
              <MetricCard
                label="提升"
                value={`+${((r.optimizationResult.optimizedSharpe / r.optimizationResult.originalSharpe - 1) * 100).toFixed(0)}%`}
                color="oklch(0.72 0.19 155)"
              />
              <MetricCard
                label="年化 (前)"
                value={`${(r.optimizationResult.originalReturn * 100).toFixed(1)}%`}
                color="oklch(0.5 0.1 260)"
              />
              <MetricCard
                label="年化 (后)"
                value={`${(r.optimizationResult.optimizedReturn * 100).toFixed(1)}%`}
                color="oklch(0.72 0.19 155)"
              />
              <MetricCard
                label="回撤改善"
                value={`${((1 - r.optimizationResult.optimizedDrawdown / r.optimizationResult.originalDrawdown) * 100).toFixed(0)}%`}
                color="oklch(0.82 0.15 85)"
              />
            </div>
          </div>

          {/* Parameter changes */}
          <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">🔧 参数调整</p>
            <div className="space-y-1.5">
              {r.optimizationResult.parameterChanges.map((change, i) => (
                <div key={i} className="flex items-center justify-between bg-[oklch(0.12_0.015_260)] p-2 border border-[oklch(0.2_0.02_260)]">
                  <span className="font-display text-[11px] text-[oklch(0.6_0.02_260)]">{change.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data text-[10px] text-[oklch(0.5_0.1_260)]">{change.before}</span>
                    <span className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">→</span>
                    <span className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)] font-bold">{change.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Insights */}
      <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
        <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">💡 研究洞察</p>
        <div className="space-y-1.5">
          {r.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-mono-data text-[9px] text-[oklch(0.55_0.2_265)] mt-0.5 shrink-0">{i + 1}.</span>
              <p className="font-display text-[11px] text-[oklch(0.65_0.02_260)] leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-[oklch(0.14_0.02_260)] border-2 border-[oklch(0.22_0.025_260)] p-3">
        <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-2">📋 建议</p>
        <div className="space-y-1.5">
          {r.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)] mt-1 shrink-0">▸</span>
              <p className="font-display text-[11px] text-[oklch(0.65_0.02_260)] leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => setActivePanel('report-library')}
        className="w-full font-pixel text-[8px] py-2.5 bg-[oklch(0.18_0.025_260)] text-[oklch(0.7_0.02_260)] border-2 border-[oklch(0.28_0.03_260)] hover:bg-[oklch(0.22_0.03_260)] transition-all"
      >
        ← 返回报告库
      </button>
    </div>
  );
}
