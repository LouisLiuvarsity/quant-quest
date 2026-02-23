/*
 * FactorLibraryPanel - Browse all discovered factor cards
 * Filter by type, sort by metrics, view details
 */

import { useGame, type FactorCard } from '@/contexts/GameContext';
import { useState } from 'react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  passed: { label: '✅ 通过', color: 'oklch(0.72 0.19 155)' },
  failed: { label: '❌ 未通过', color: 'oklch(0.63 0.22 25)' },
};

type SortKey = 'sharpe' | 'ic' | 'annualReturn';

export function FactorLibraryPanel() {
  const { state, setSelectedFactorCard, setActivePanel, setSelectedReport } = useGame();
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('sharpe');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const factorCards = state.factorCards;
  const types = ['all', ...Array.from(new Set(factorCards.map(f => f.factorType)))];

  const filteredCards = factorCards
    .filter(f => filterType === 'all' || f.factorType === filterType)
    .sort((a, b) => {
      if (sortBy === 'sharpe') return b.valPerformance.medianSharpe - a.valPerformance.medianSharpe;
      if (sortBy === 'ic') return b.profile.ic - a.profile.ic;
      return b.valPerformance.medianAnnualReturn - a.valPerformance.medianAnnualReturn;
    });

  const avgIc = factorCards.length > 0 ? factorCards.reduce((s, f) => s + f.profile.ic, 0) / factorCards.length : 0;
  const maxSharpe = factorCards.length > 0 ? Math.max(...factorCards.map(f => f.valPerformance.medianSharpe)) : 0;
  const passedCount = factorCards.filter(f => f.status === 'passed').length;

  const viewReport = (card: FactorCard) => {
    const report = state.reports.find(r => r.factorCardId === card.id);
    if (report) {
      setSelectedReport(report);
      setActivePanel('report-viewer');
    }
  };

  const viewCard = (card: FactorCard) => {
    setSelectedFactorCard(card);
    setActivePanel('report-viewer');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">总因子</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.55_0.2_265)]">{factorCards.length}</p>
          <p className="font-pixel text-[5px] text-[oklch(0.72_0.19_155)]">{passedCount} 通过</p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">平均IC</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.75_0.12_200)]">
            {factorCards.length > 0 ? avgIc.toFixed(3) : '—'}
          </p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">最高Sharpe</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.72_0.19_155)]">
            {factorCards.length > 0 ? maxSharpe.toFixed(2) : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div>
          <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)] mb-1.5">因子类型</p>
          <div className="flex flex-wrap gap-1">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 border font-display text-[10px] transition-all ${
                  filterType === t
                    ? 'border-[oklch(0.55_0.2_265)] text-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.08)]'
                    : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.3_0.03_260)]'
                }`}
              >
                {t === 'all' ? '全部' : t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)] mb-1.5">排序</p>
          <div className="flex gap-1">
            {([
              { key: 'sharpe' as SortKey, label: 'Sharpe' },
              { key: 'ic' as SortKey, label: 'IC' },
              { key: 'annualReturn' as SortKey, label: '年化' },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-2.5 py-1 border font-mono-data text-[10px] transition-all ${
                  sortBy === opt.key
                    ? 'border-[oklch(0.82_0.15_85)] text-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.08)]'
                    : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)]'
                }`}
              >
                {opt.label} ↓
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Factor card list */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🧬</p>
          <p className="font-pixel text-[9px] text-[oklch(0.5_0.02_260)]">因子库为空</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-1">
            分配因子挖掘任务来发现新因子
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
          {filteredCards.map(card => {
            const status = STATUS_LABELS[card.status] || { label: card.status, color: 'oklch(0.5 0.02 260)' };
            const isExpanded = expandedId === card.id;
            return (
              <div
                key={card.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.25_0.03_260)] hover:border-[oklch(0.35_0.03_260)] transition-all cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : card.id)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1">
                      <h4 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                        {card.factorName}
                      </h4>
                      <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-0.5 line-clamp-1">
                        {card.description}
                      </p>
                    </div>
                    <span
                      className="font-pixel text-[6px] px-1.5 py-0.5 border ml-2 shrink-0"
                      style={{ color: status.color, borderColor: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">IC</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.55_0.2_265)]">{card.profile.ic.toFixed(3)}</p>
                    </div>
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">Sharpe</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.72_0.19_155)]">{card.valPerformance.medianSharpe.toFixed(2)}</p>
                    </div>
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">年化</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.82_0.15_85)]">{(card.valPerformance.medianAnnualReturn * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">回撤</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.63_0.22_25)]">{(card.valPerformance.medianMaxDrawdown * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[oklch(0.22_0.025_260)] p-3 space-y-2 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-2 font-display text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">ICIR</span>
                        <span className="text-[oklch(0.75_0.12_200)] font-mono-data">{card.profile.icir.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">换手率</span>
                        <span className="text-[oklch(0.82_0.15_85)] font-mono-data">{(card.valPerformance.medianTurnover * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">K线级别</span>
                        <span className="text-[oklch(0.7_0.02_260)]">{card.barSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">因子类型</span>
                        <span className="text-[oklch(0.7_0.02_260)]">{card.factorType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">发现者</span>
                        <span className="text-[oklch(0.7_0.02_260)]">{card.discoveredByName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">可合成</span>
                        <span className={card.canEnterMultiFactor ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}>
                          {card.canEnterMultiFactor ? '✅ 是' : '❌ 否'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); viewCard(card); }}
                        className="flex-1 font-pixel text-[7px] py-2 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
                      >
                        📄 因子档案卡
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); viewReport(card); }}
                        className="flex-1 font-pixel text-[7px] py-2 bg-[oklch(0.14_0.02_260)] text-[oklch(0.7_0.02_260)] border-2 border-[oklch(0.25_0.03_260)] hover:bg-[oklch(0.18_0.02_260)] transition-all"
                      >
                        📊 研究报告
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
