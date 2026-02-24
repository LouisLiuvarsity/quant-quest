/*
 * ReportViewerPanel - View detailed research reports
 * Shows charts, data analysis, and text descriptions
 * Supports both single-factor and multi-factor reports
 */

import { useGame, type ResearchReport, type FactorCard, type PortfolioCard, type InsightViewMode } from '@/contexts/GameContext';
import { useEffect, useRef } from 'react';

const COLORS = {
  green: 'rgba(74, 222, 128, 1)',
  greenFill: 'rgba(74, 222, 128, 0.15)',
  red: 'rgba(248, 113, 113, 1)',
  redFill: 'rgba(248, 113, 113, 0.15)',
  indigo: 'rgba(129, 140, 248, 1)',
  indigoFill: 'rgba(129, 140, 248, 0.15)',
  amber: 'rgba(251, 191, 36, 1)',
  gridLine: 'rgba(255, 255, 255, 0.06)',
  text: 'rgba(255, 255, 255, 0.4)',
  bg: 'rgba(10, 12, 20, 1)',
};

function drawLineChart(canvas: HTMLCanvasElement, data: number[], color: string, fillColor: string, label: string, compData?: number[], compColor?: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || data.length === 0) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);

  const allData = compData ? [...data, ...compData] : data;
  const min = Math.min(...allData), max = Math.max(...allData), range = max - min || 1;
  const pT = 30, pB = 20, pL = 8, pR = 8, cH = h - pT - pB, cW = w - pL - pR;

  ctx.strokeStyle = COLORS.gridLine; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) { const y = pT + (cH / 4) * i; ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(w - pR, y); ctx.stroke(); }

  if (compData && compColor) {
    ctx.strokeStyle = compColor; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath();
    compData.forEach((v, i) => { const x = pL + (i / (compData.length - 1)) * cW; const y = pT + cH - ((v - min) / range) * cH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke(); ctx.setLineDash([]);
  }

  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
  data.forEach((v, i) => { const x = pL + (i / (data.length - 1)) * cW; const y = pT + cH - ((v - min) / range) * cH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.lineTo(pL + cW, pT + cH); ctx.lineTo(pL, pT + cH); ctx.closePath(); ctx.fillStyle = fillColor; ctx.fill();
  ctx.fillStyle = color; ctx.font = '9px "Press Start 2P", monospace'; ctx.fillText(label, pL + 4, pT - 8);
  ctx.fillStyle = COLORS.text; ctx.font = '8px monospace'; ctx.fillText(max.toFixed(1), pL + 4, pT + 10); ctx.fillText(min.toFixed(1), pL + 4, h - pB - 2);
}

function drawBarChart(canvas: HTMLCanvasElement, data: number[], label: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || data.length === 0) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, w, h);
  const pT = 28, pB = 10, pL = 8, pR = 8, cH = h - pT - pB, cW = w - pL - pR;
  const barW = Math.max(2, cW / data.length - 1);
  const maxAbs = Math.max(...data.map(Math.abs), 0.01);
  const zeroY = pT + cH / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(pL, zeroY); ctx.lineTo(w - pR, zeroY); ctx.stroke();
  data.forEach((v, i) => { const x = pL + (i / data.length) * cW; const bH = (Math.abs(v) / maxAbs) * (cH / 2); const y = v >= 0 ? zeroY - bH : zeroY; ctx.fillStyle = v >= 0 ? COLORS.green : COLORS.red; ctx.fillRect(x, y, barW, bH); });
  ctx.fillStyle = COLORS.amber; ctx.font = '9px "Press Start 2P", monospace'; ctx.fillText(label, pL + 4, pT - 8);
}

function MiniChart({ data, color, fillColor, label, height = 100, compData, compColor }: { data: number[]; color: string; fillColor: string; label: string; height?: number; compData?: number[]; compColor?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawLineChart(ref.current, data, color, fillColor, label, compData, compColor); }, [data, color, fillColor, label, compData, compColor]);
  return <canvas ref={ref} className="w-full border border-[oklch(0.2_0.02_260)]" style={{ height: `${height}px` }} />;
}

function MiniBarChart({ data, label, height = 80 }: { data: number[]; label: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) drawBarChart(ref.current, data, label); }, [data, label]);
  return <canvas ref={ref} className="w-full border border-[oklch(0.2_0.02_260)]" style={{ height: `${height}px` }} />;
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[oklch(0.15_0.02_260)]">
      <span className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">{label}</span>
      <span className={`font-mono-data text-xs font-semibold ${color || 'text-[oklch(0.88_0.01_260)]'}`}>{value}</span>
    </div>
  );
}

function FactorCardReport({ card, viewMode }: { card: FactorCard; viewMode: InsightViewMode }) {
  const showAdvanced = viewMode !== 'player';
  const showAudit = viewMode === 'audit';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-[oklch(0.92_0.01_260)]">{card.factorName}</span>
        <span className={`font-pixel text-[7px] px-3 py-1 border ${card.status === 'passed' ? 'border-[oklch(0.72_0.19_155)] text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)]' : 'border-[oklch(0.63_0.22_25)] text-[oklch(0.63_0.22_25)] bg-[oklch(0.63_0.22_25_/_0.1)]'}`}>
          {card.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
        </span>
      </div>
      <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
        <MetricRow label="因子类型" value={card.factorType} />
        <MetricRow label="描述" value={card.description.length > 40 ? card.description.slice(0, 40) + '...' : card.description} />
        <MetricRow label="K线级别" value={card.barSize} />
        <MetricRow label="预测窗口" value={`${card.fwdPeriod} 期`} />
        <MetricRow label="发现者" value={card.discoveredByName} />
      </div>
      <div><p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-1">📈 净值曲线 (VAL)</p><MiniChart data={card.equityCurve} color={COLORS.green} fillColor={COLORS.greenFill} label="EQUITY" height={110} /></div>
      <div><p className="font-pixel text-[7px] text-[oklch(0.63_0.22_25)] mb-1">📉 回撤曲线</p><MiniChart data={card.drawdownCurve} color={COLORS.red} fillColor={COLORS.redFill} label="DRAWDOWN" height={80} /></div>
      <div><p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-1">📊 月度收益</p><MiniBarChart data={card.monthlyReturns} label="MONTHLY" height={70} /></div>
      <div><p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-1">📐 滚动 Sharpe</p><MiniChart data={card.rollingSharpe} color={COLORS.indigo} fillColor={COLORS.indigoFill} label="SHARPE" height={80} /></div>
      <div><p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-1">🎯 IC 序列</p><MiniBarChart data={card.icTimeSeries} label="IC" height={70} /></div>
      <div>
        <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-2">🏆 VAL 验证表现</p>
        <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
          <MetricRow label="胜率" value={`${(card.valPerformance.winRate * 100).toFixed(1)}%`} color="text-[oklch(0.72_0.19_155)]" />
          <MetricRow label="中位 Sharpe" value={card.valPerformance.medianSharpe.toFixed(2)} color="text-[oklch(0.55_0.2_265)]" />
          <MetricRow label="中位年化" value={`${(card.valPerformance.medianAnnualReturn * 100).toFixed(1)}%`} color="text-[oklch(0.72_0.19_155)]" />
          <MetricRow label="中位最大回撤" value={`${(card.valPerformance.medianMaxDrawdown * 100).toFixed(1)}%`} color="text-[oklch(0.63_0.22_25)]" />
          <MetricRow label="中位换手率" value={`${(card.valPerformance.medianTurnover * 100).toFixed(1)}%`} />
        </div>
      </div>
      {showAdvanced && (
        <>
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">🔍 因子画像</p>
            <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
              <MetricRow label="IC" value={card.profile.ic.toFixed(4)} color="text-[oklch(0.55_0.2_265)]" />
              <MetricRow label="RankIC" value={card.profile.rankIc.toFixed(4)} color="text-[oklch(0.55_0.2_265)]" />
              <MetricRow label="ICIR" value={card.profile.icir.toFixed(2)} />
              <MetricRow label="RankICIR" value={card.profile.rankIcir.toFixed(2)} />
              <MetricRow label="IC 胜率" value={`${(card.profile.icWinRate * 100).toFixed(0)}%`} />
              <MetricRow label="覆盖率" value={`${(card.profile.coverageMean * 100).toFixed(0)}%`} />
            </div>
          </div>
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">⚙️ 最优参数</p>
            <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
              <MetricRow label="zscore_window" value={String(card.bestParams.zscore_window)} />
              <MetricRow label="ewma_span" value={String(card.bestParams.ewma_span)} />
              <MetricRow label="tanh_c" value={String(card.bestParams.tanh_c)} />
              <MetricRow label="min_hold" value={String(card.bestParams.min_hold)} />
              <MetricRow label="cooldown" value={String(card.bestParams.cooldown)} />
              <MetricRow label="target_vol" value={String(card.bestParams.target_vol)} />
            </div>
          </div>
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">🧪 敏感性检验</p>
            <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
              <MetricRow label="参数稳定性" value={card.sensitivity.paramStable ? '✅ 稳定' : '⚠️ 不稳定'} color={card.sensitivity.paramStable ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.82_0.15_85)]'} />
              <MetricRow label="1x成本后 Sharpe" value={card.sensitivity.costSharpe1x.toFixed(2)} />
              <MetricRow label="成本可行性" value={card.sensitivity.costViable ? '✅ 可行' : '⚠️ 不可行'} color={card.sensitivity.costViable ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'} />
            </div>
          </div>
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📊 分组分析</p>
            <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
              <MetricRow label="最佳适用分组" value={card.bestGroup} />
              <MetricRow label="推荐参数区间" value={card.recommendedParamRange} />
            </div>
          </div>
        </>
      )}
      {showAudit && (
        <div>
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">🧾 审计证据链</p>
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
            <MetricRow label="run_id" value={card.evidence.runId} />
            <MetricRow label="repro_id" value={card.evidence.reproducibilityId} />
            <MetricRow label="data_segment" value={card.evidence.dataSegments.join(' / ')} />
            <MetricRow label="guard_count" value={String(card.evidence.guardLog.length)} />
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioCardReport({ card, viewMode }: { card: PortfolioCard; viewMode: InsightViewMode }) {
  const showAdvanced = viewMode !== 'player';
  const showAudit = viewMode === 'audit';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-[oklch(0.92_0.01_260)]">{card.name}</span>
        <span className={`font-pixel text-[7px] px-3 py-1 border ${card.status === 'adopted' ? 'border-[oklch(0.72_0.19_155)] text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)]' : 'border-[oklch(0.63_0.22_25)] text-[oklch(0.63_0.22_25)] bg-[oklch(0.63_0.22_25_/_0.1)]'}`}>
          {card.status === 'adopted' ? '✅ ADOPTED' : '❌ REJECTED'}
        </span>
      </div>
      <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
        <MetricRow label="合成方式" value={card.blendMode === 'signal_blend' ? '信号层合成' : '仓位层合成'} />
        <MetricRow label="权重方案" value={card.weightMethod === 'equal' ? '等权' : card.weightMethod === 'sharpe_weighted' ? '表现加权' : '滚动动态'} />
        <MetricRow label="候选因子" value={`${card.originalCandidates} 个`} />
        <MetricRow label="去冗余剔除" value={`${card.removedFactors} 个`} />
        <MetricRow label="最终保留" value={`${card.finalKept} 个`} />
      </div>
      <div>
        <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">⚖️ 因子权重</p>
        <div className="space-y-1">
          {Object.entries(card.factorWeights).map(([name, weight]) => (
            <div key={name} className="flex items-center gap-2">
              <div className="flex-1 bg-[oklch(0.08_0.015_260)] h-5 border border-[oklch(0.2_0.02_260)] overflow-hidden">
                <div className="h-full bg-[oklch(0.55_0.2_265_/_0.3)]" style={{ width: `${(weight as number) * 100}%` }} />
              </div>
              <span className="font-display text-[9px] text-[oklch(0.7_0.02_260)] w-24 truncate">{name}</span>
              <span className="font-mono-data text-[10px] text-[oklch(0.55_0.2_265)] w-10 text-right">{((weight as number) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-1">📈 组合净值 vs 最优单因子</p>
        <MiniChart data={card.equityCurve} color={COLORS.green} fillColor={COLORS.greenFill} label="PORTFOLIO" height={120} compData={card.comparisonCurve} compColor={COLORS.amber} />
        <div className="flex gap-4 mt-1">
          <span className="font-display text-[9px] text-[oklch(0.72_0.19_155)]">━ 多因子组合</span>
          <span className="font-display text-[9px] text-[oklch(0.82_0.15_85)]">╌ 最优单因子</span>
        </div>
      </div>
      <div><p className="font-pixel text-[7px] text-[oklch(0.63_0.22_25)] mb-1">📉 回撤曲线</p><MiniChart data={card.drawdownCurve} color={COLORS.red} fillColor={COLORS.redFill} label="DRAWDOWN" height={80} /></div>
      <div>
        <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-2">🏆 OOS 终极评估</p>
        <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
          <MetricRow label="胜率" value={`${(card.oosPerformance.winRate * 100).toFixed(1)}%`} color="text-[oklch(0.72_0.19_155)]" />
          <MetricRow label="中位 Sharpe" value={card.oosPerformance.medianSharpe.toFixed(2)} color="text-[oklch(0.55_0.2_265)]" />
          <MetricRow label="中位年化" value={`${(card.oosPerformance.medianAnnualReturn * 100).toFixed(1)}%`} color="text-[oklch(0.72_0.19_155)]" />
          <MetricRow label="中位最大回撤" value={`${(card.oosPerformance.medianMaxDrawdown * 100).toFixed(1)}%`} color="text-[oklch(0.63_0.22_25)]" />
          <MetricRow label="中位换手率" value={`${(card.oosPerformance.medianTurnover * 100).toFixed(1)}%`} />
        </div>
      </div>
      {showAdvanced && (
        <>
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">🧪 敏感性检验</p>
            <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
              <MetricRow label="参数稳定性" value={card.sensitivity.paramStable ? '✅ 稳定' : '⚠️ 不稳定'} />
              <MetricRow label="1x成本后 Sharpe" value={card.sensitivity.costSharpe1x.toFixed(2)} />
              <MetricRow label="成本可行性" value={card.sensitivity.costViable ? '✅ 可行' : '⚠️ 不可行'} />
              <MetricRow label="权重稳定性" value={card.sensitivity.weightStable ? '✅ 稳定' : '⚠️ 不稳定'} />
            </div>
          </div>
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">⚔️ 单因子基准对比</p>
            <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
              <MetricRow label="最优单因子" value={card.bestSingleFactor} />
              <MetricRow label="单因子 Sharpe" value={card.bestSingleSharpe.toFixed(2)} />
              <MetricRow label="多因子优于单因子" value={card.multiIsBetter ? '✅ 是' : '❌ 否'} color={card.multiIsBetter ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'} />
              <MetricRow label="Sharpe 提升" value={`+${card.sharpeImprovement.toFixed(2)}`} color="text-[oklch(0.55_0.2_265)]" />
              <MetricRow label="回撤改善" value={`${card.drawdownImprovement.toFixed(1)}%`} color="text-[oklch(0.72_0.19_155)]" />
            </div>
          </div>
        </>
      )}
      {showAudit && (
        <div>
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">🧾 审计证据链</p>
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3 space-y-1">
            <MetricRow label="run_id" value={card.evidence.runId} />
            <MetricRow label="repro_id" value={card.evidence.reproducibilityId} />
            <MetricRow label="data_segment" value={card.evidence.dataSegments.join(' / ')} />
            <MetricRow label="oos_consumed_at" value={card.oosConsumedAt || '未记录'} />
            <MetricRow label="blend_plan_key" value={card.blendPlanKey} />
            <MetricRow label="guard_count" value={String(card.evidence.guardLog.length)} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportViewerPanel() {
  const { selectedReport, selectedFactorCard, selectedPortfolioCard, state, setSelectedFactorCard, setSelectedPortfolioCard, setActivePanel } = useGame();
  const insightView = state.insightView;

  if (selectedFactorCard) return <div className="p-4"><FactorCardReport card={selectedFactorCard} viewMode={insightView} /></div>;
  if (selectedPortfolioCard) return <div className="p-4"><PortfolioCardReport card={selectedPortfolioCard} viewMode={insightView} /></div>;
  if (selectedReport) {
    const linkedFC = selectedReport.factorCardId ? state.factorCards.find(f => f.id === selectedReport.factorCardId) : null;
    const linkedPC = selectedReport.portfolioCardId ? state.portfolioCards.find(p => p.id === selectedReport.portfolioCardId) : null;

    return (
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-display text-sm font-bold text-[oklch(0.92_0.01_260)]">{selectedReport.title}</h3>
          <div className="flex gap-3 mt-1">
            <span className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">📅 {selectedReport.createdAt}</span>
            <span className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">👤 {selectedReport.researcherName}</span>
            <span className="font-display text-[10px] text-[oklch(0.82_0.15_85)]">🪙 {selectedReport.tokenCost.toLocaleString()}</span>
          </div>
        </div>
        {insightView === 'audit' && (
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">🧾 报告审计信息</p>
            <div className="space-y-1">
              <MetricRow label="run_id" value={selectedReport.runId} />
              <MetricRow label="guard_count" value={String(selectedReport.guardLog.length)} />
            </div>
          </div>
        )}
        <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3">
          <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">📝 摘要</p>
          <p className="font-display text-xs text-[oklch(0.75_0.01_260)] leading-relaxed">{selectedReport.summary}</p>
        </div>
        {selectedReport.insights.length > 0 && (
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-2">💡 关键发现</p>
            <div className="space-y-1.5">
              {selectedReport.insights.map((ins: string, i: number) => (
                <p key={i} className="font-display text-[10px] text-[oklch(0.7_0.02_260)] pl-3 border-l-2 border-[oklch(0.72_0.19_155_/_0.3)]">{ins}</p>
              ))}
            </div>
          </div>
        )}
        {selectedReport.recommendations.length > 0 && (
          <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] p-3">
            <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)] mb-2">📋 建议</p>
            <div className="space-y-1.5">
              {selectedReport.recommendations.map((rec: string, i: number) => (
                <p key={i} className="font-display text-[10px] text-[oklch(0.7_0.02_260)] pl-3 border-l-2 border-[oklch(0.82_0.15_85_/_0.3)]">{rec}</p>
              ))}
            </div>
          </div>
        )}
        {selectedReport.stepResults.length > 0 && (
          <div>
            <p className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] mb-2">🔄 工作流步骤</p>
            <div className="space-y-1">
              {selectedReport.stepResults.map((step, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-[oklch(0.12_0.02_260)]">
                  <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)] w-6">{step.stepId}</span>
                  <span className="font-display text-[10px] text-[oklch(0.7_0.02_260)] flex-1">{step.stepName}</span>
                  <span className="font-pixel text-[5px] text-[oklch(0.72_0.19_155)]">{step.status === 'completed' ? '✓' : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {linkedFC && (
          <button onClick={() => { setSelectedFactorCard(linkedFC); setActivePanel('report-viewer'); }}
            className="w-full font-pixel text-[8px] py-3 bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)] border-2 border-[oklch(0.55_0.2_265_/_0.3)] hover:bg-[oklch(0.55_0.2_265_/_0.2)] transition-all">
            📄 查看因子档案卡详情 →
          </button>
        )}
        {linkedPC && (
          <button onClick={() => { setSelectedPortfolioCard(linkedPC); setActivePanel('report-viewer'); }}
            className="w-full font-pixel text-[8px] py-3 bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)] border-2 border-[oklch(0.55_0.2_265_/_0.3)] hover:bg-[oklch(0.55_0.2_265_/_0.2)] transition-all">
            📦 查看组合档案卡详情 →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-center h-64">
      <p className="font-display text-sm text-[oklch(0.5_0.02_260)]">请选择一个报告或档案卡查看</p>
    </div>
  );
}
