/*
 * ReportLibraryPanel - Browse all research reports
 * Filter by type, sort by date, click to view full report
 */

import { useGame, type TaskType, type ResearchReport } from '@/contexts/GameContext';
import { useState } from 'react';

const TYPE_LABELS: Record<TaskType, string> = {
  single_factor: '因子挖掘',
  multi_factor: '多因子合成',
};

const TYPE_COLORS: Record<TaskType, string> = {
  single_factor: 'oklch(0.55 0.2 265)',
  multi_factor: 'oklch(0.72 0.19 155)',
};

export function ReportLibraryPanel() {
  const { state, setActivePanel, setSelectedReport, setSelectedFactorCard, setSelectedPortfolioCard } = useGame();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredReports = state.reports.filter(
    r => filterType === 'all' || r.type === filterType
  );

  const totalTokens = state.reports.reduce((s, r) => s + r.tokenCost, 0);

  const handleViewReport = (report: ResearchReport) => {
    setSelectedReport(report);
    setActivePanel('report-viewer');
  };

  const handleViewCard = (report: ResearchReport) => {
    if (report.factorCardId) {
      const fc = state.factorCards.find(f => f.id === report.factorCardId);
      if (fc) { setSelectedFactorCard(fc); setActivePanel('report-viewer'); return; }
    }
    if (report.portfolioCardId) {
      const pc = state.portfolioCards.find(p => p.id === report.portfolioCardId);
      if (pc) { setSelectedPortfolioCard(pc); setActivePanel('report-viewer'); return; }
    }
  };

  const getReportPreview = (report: ResearchReport) => {
    // Try to find linked factor or portfolio card for stats
    if (report.factorCardId) {
      const fc = state.factorCards.find(f => f.id === report.factorCardId);
      if (fc) {
        return {
          mainStat: `Sharpe ${fc.valPerformance.medianSharpe.toFixed(2)}`,
          subStat: `IC ${fc.profile.ic.toFixed(3)}`,
          isPositive: fc.status === 'passed',
        };
      }
    }
    if (report.portfolioCardId) {
      const pc = state.portfolioCards.find(p => p.id === report.portfolioCardId);
      if (pc) {
        return {
          mainStat: `Sharpe ${pc.oosPerformance.medianSharpe.toFixed(2)}`,
          subStat: pc.multiIsBetter ? '优于单因子' : '不如单因子',
          isPositive: pc.status === 'adopted',
        };
      }
    }
    return { mainStat: '—', subStat: '', isPositive: false };
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">总报告数</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.55_0.2_265)]">{state.reports.length}</p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">因子报告</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.75_0.12_200)]">
            {state.reports.filter(r => r.type === 'single_factor').length}
          </p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">总Token消耗</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.82_0.15_85)]">
            {totalTokens >= 1_000_000
              ? `${(totalTokens / 1_000_000).toFixed(1)}M`
              : totalTokens.toLocaleString()
            }
          </p>
        </div>
      </div>

      {/* Type filter */}
      <div>
        <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)] mb-1.5">类型筛选</p>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 border font-display text-[10px] transition-all ${
              filterType === 'all'
                ? 'border-[oklch(0.55_0.2_265)] text-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.08)]'
                : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)]'
            }`}
          >
            全部
          </button>
          {(Object.keys(TYPE_LABELS) as TaskType[]).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 border font-display text-[10px] transition-all ${
                filterType === type
                  ? 'bg-[oklch(0.18_0.03_260)]'
                  : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)]'
              }`}
              style={{
                borderColor: filterType === type ? TYPE_COLORS[type] : undefined,
                color: filterType === type ? TYPE_COLORS[type] : undefined,
              }}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Report list */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📋</p>
          <p className="font-pixel text-[9px] text-[oklch(0.5_0.02_260)]">暂无研究报告</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-1">
            完成研究任务后会自动生成报告
          </p>
          <button
            onClick={() => setActivePanel('research')}
            className="mt-3 font-pixel text-[7px] px-4 py-2 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
          >
            去研究 →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReports.map(report => {
            const preview = getReportPreview(report);
            const typeColor = TYPE_COLORS[report.type];
            return (
              <div
                key={report.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.25_0.03_260)] p-3 cursor-pointer hover:border-[oklch(0.4_0.1_265)] transition-all group"
              >
                <div className="flex items-start justify-between mb-1.5" onClick={() => handleViewReport(report)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-pixel text-[6px] px-1.5 py-0.5 border"
                        style={{ color: typeColor, borderColor: typeColor }}
                      >
                        {TYPE_LABELS[report.type]}
                      </span>
                      <span className="font-mono-data text-[8px] text-[oklch(0.4_0.02_260)]">
                        {report.createdAt}
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-semibold text-[oklch(0.88_0.01_260)] group-hover:text-[oklch(0.95_0.01_260)] transition-colors">
                      {report.title}
                    </h4>
                    <p className="font-display text-[10px] text-[oklch(0.45_0.02_260)] mt-0.5 line-clamp-2">
                      {report.summary}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className={`font-mono-data text-sm font-bold ${preview.isPositive ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
                      {preview.mainStat}
                    </p>
                    <p className="font-mono-data text-[9px] text-[oklch(0.5_0.02_260)]">{preview.subStat}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[oklch(0.2_0.02_260)]">
                  <span className="font-display text-[10px] text-[oklch(0.45_0.02_260)]">
                    研究员: {report.researcherName || '—'}
                  </span>
                  <div className="flex gap-2 items-center">
                    <span className="font-mono-data text-[9px] text-[oklch(0.82_0.15_85)]">
                      🪙 {report.tokenCost.toLocaleString()}
                    </span>
                    {(report.factorCardId || report.portfolioCardId) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewCard(report); }}
                        className="font-pixel text-[6px] px-2 py-0.5 border border-[oklch(0.55_0.2_265)] text-[oklch(0.55_0.2_265)] hover:bg-[oklch(0.55_0.2_265_/_0.1)] transition-all"
                      >
                        档案卡 →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
