/*
 * FactorLibraryPanel - Browse all discovered factors
 * Filter by category, sort by IC/Sharpe, view details
 * Can deploy factors to strategy
 */

import { useGame, type Factor } from '@/contexts/GameContext';
import { useState } from 'react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discovered: { label: '已发现', color: 'oklch(0.55 0.2 265)' },
  validated: { label: '已验证', color: 'oklch(0.82 0.15 85)' },
  deployed: { label: '已部署', color: 'oklch(0.72 0.19 155)' },
};

type SortKey = 'ic' | 'sharpe' | 'annualReturn' | 'maxDrawdown';

export function FactorLibraryPanel() {
  const { state, setActivePanel, setSelectedReport } = useGame();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('sharpe');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(state.factors.map(f => f.category)))];

  const filteredFactors = state.factors
    .filter(f => filterCategory === 'all' || f.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'maxDrawdown') return a[sortBy] - b[sortBy]; // less negative = better
      return b[sortBy] - a[sortBy]; // higher = better
    });

  const viewReport = (factor: Factor) => {
    const report = state.reports.find(r => r.taskId === factor.taskId);
    if (report) {
      setSelectedReport(report);
      setActivePanel('report-viewer');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">总因子数</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.55_0.2_265)]">{state.factors.length}</p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">平均IC</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.75_0.12_200)]">
            {state.factors.length > 0
              ? (state.factors.reduce((s, f) => s + f.ic, 0) / state.factors.length).toFixed(3)
              : '—'}
          </p>
        </div>
        <div className="bg-[oklch(0.14_0.02_260)] border border-[oklch(0.22_0.025_260)] p-2.5 text-center">
          <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">最高Sharpe</p>
          <p className="font-mono-data text-lg font-bold text-[oklch(0.72_0.19_155)]">
            {state.factors.length > 0
              ? Math.max(...state.factors.map(f => f.sharpe)).toFixed(2)
              : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div>
          <p className="font-pixel text-[6px] text-[oklch(0.5_0.02_260)] mb-1.5">分类筛选</p>
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 border font-display text-[10px] transition-all ${
                  filterCategory === cat
                    ? 'border-[oklch(0.55_0.2_265)] text-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.08)]'
                    : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.3_0.03_260)]'
                }`}
              >
                {cat === 'all' ? '全部' : cat}
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

      {/* Factor list */}
      {filteredFactors.length === 0 ? (
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
          {filteredFactors.map(factor => {
            const status = STATUS_LABELS[factor.status];
            const isExpanded = expandedId === factor.id;
            return (
              <div
                key={factor.id}
                className="bg-[oklch(0.16_0.025_260)] border-2 border-[oklch(0.25_0.03_260)] hover:border-[oklch(0.35_0.03_260)] transition-all cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : factor.id)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex-1">
                      <h4 className="font-display text-sm font-semibold text-[oklch(0.9_0.01_260)]">
                        {factor.name}
                      </h4>
                      <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)] mt-0.5 line-clamp-1">
                        {factor.description}
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
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.55_0.2_265)]">{factor.ic.toFixed(3)}</p>
                    </div>
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">Sharpe</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.72_0.19_155)]">{factor.sharpe.toFixed(2)}</p>
                    </div>
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">年化</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.82_0.15_85)]">{(factor.annualReturn * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-center bg-[oklch(0.12_0.02_260)] py-1 px-1">
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">回撤</p>
                      <p className="font-mono-data text-[10px] font-bold text-[oklch(0.63_0.22_25)]">{(factor.maxDrawdown * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[oklch(0.22_0.025_260)] p-3 space-y-2 animate-fade-in-up">
                    <div className="grid grid-cols-2 gap-2 font-display text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">ICIR</span>
                        <span className="text-[oklch(0.75_0.12_200)] font-mono-data">{factor.icir.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">换手率</span>
                        <span className="text-[oklch(0.82_0.15_85)] font-mono-data">{(factor.turnover * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">K线周期</span>
                        <span className="text-[oklch(0.7_0.02_260)]">{factor.klinePeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[oklch(0.45_0.02_260)]">分类</span>
                        <span className="text-[oklch(0.7_0.02_260)]">{factor.category}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)] mb-1">公式</p>
                      <p className="font-mono-data text-[9px] text-[oklch(0.6_0.02_260)] bg-[oklch(0.1_0.015_260)] p-2 border border-[oklch(0.2_0.02_260)]">
                        {factor.formula}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); viewReport(factor); }}
                      className="w-full font-pixel text-[7px] py-2 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
                    >
                      📄 查看研究报告
                    </button>
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
