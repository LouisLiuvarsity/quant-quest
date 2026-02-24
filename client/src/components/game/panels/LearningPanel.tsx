import { useGame } from '@/contexts/GameContext';

export function LearningPanel() {
  const { state, markLearningCardReviewed, setSelectedReport, setActivePanel, createThesis } = useGame();
  const cards = state.learningCards;
  const reviewedCount = cards.filter(card => card.reviewed).length;
  const pendingCount = cards.length - reviewedCount;

  const buildRetryHypothesis = (hypothesis: string, outcome: string): string => {
    const clean = hypothesis.replace(/（复盘迭代：补反例）$/, '').replace(/（复盘迭代）$/, '').trim();
    const suffix = ['failed', 'rejected', 'hold', 'parked'].includes(outcome)
      ? '（复盘迭代：补反例）'
      : '（复盘迭代）';
    return `${clean}${suffix}`;
  };

  if (cards.length === 0) {
    return (
      <div className="p-4 space-y-3">
        <div className="border-2 border-[oklch(0.26_0.03_260)] bg-[oklch(0.11_0.016_260)] p-4 text-center">
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">📚 学习卡库</p>
          <p className="font-display text-[11px] text-[oklch(0.58_0.02_260)] mt-2 leading-relaxed">
            暂无学习卡。完成一次命题裁决后，会自动生成复盘卡片。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="border-2 border-[oklch(0.26_0.03_260)] bg-[oklch(0.11_0.016_260)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">📚 学习卡库</p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">总卡片</p>
            <p className="font-mono-data text-[12px] text-[oklch(0.82_0.15_85)]">{cards.length}</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">待复盘</p>
            <p className="font-mono-data text-[12px] text-[oklch(0.63_0.22_25)]">{pendingCount}</p>
          </div>
          <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2 text-center">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">已掌握</p>
            <p className="font-mono-data text-[12px] text-[oklch(0.72_0.19_155)]">{reviewedCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-[68vh] overflow-y-auto custom-scrollbar">
        {cards.map(card => {
          const thesis = state.theses.find(item => item.id === card.thesisId);
          const linkedReport = thesis?.linkedTaskId
            ? state.reports.find(report => report.taskId === thesis.linkedTaskId)
            : null;
          const hasRetryDraft = state.theses.some(item => (
            item.sourceLearningCardId === card.id
            && ['draft', 'planned', 'running', 'oos_locked', 'oos_running', 'needs_review'].includes(item.status)
          ));
          const statusColor = card.outcome === 'passed' || card.outcome === 'adopted'
            ? 'text-[oklch(0.72_0.19_155)]'
            : card.outcome === 'hold' || card.outcome === 'parked'
              ? 'text-[oklch(0.82_0.15_85)]'
              : 'text-[oklch(0.63_0.22_25)]';

          return (
            <div key={card.id} className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.12_0.02_260)] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[11px] text-[oklch(0.86_0.01_260)] truncate">{card.thesisTitle}</p>
                <span className={`font-pixel text-[6px] ${statusColor}`}>{card.outcome.toUpperCase()}</span>
              </div>
              <p className="font-display text-[10px] text-[oklch(0.58_0.02_260)] leading-relaxed">{card.hypothesis}</p>

              <div className="border border-[oklch(0.2_0.02_260)] bg-[oklch(0.1_0.015_260)] p-2 space-y-1">
                <p className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">关键证据</p>
                <p className="font-display text-[10px] text-[oklch(0.74_0.02_260)] leading-relaxed">{card.keyEvidence}</p>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.1_0.015_260)] px-2 py-1.5">
                  <p className="font-pixel text-[6px] text-[oklch(0.75_0.12_200)]">学到什么</p>
                  <p className="font-display text-[10px] text-[oklch(0.74_0.02_260)] mt-1">{card.lesson}</p>
                </div>
                <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.1_0.015_260)] px-2 py-1.5">
                  <p className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">下次避免</p>
                  <p className="font-display text-[10px] text-[oklch(0.74_0.02_260)] mt-1">{card.avoidNextTime}</p>
                </div>
                <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.1_0.015_260)] px-2 py-1.5">
                  <p className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">下一步建议</p>
                  <p className="font-display text-[10px] text-[oklch(0.74_0.02_260)] mt-1">{card.recommendedNextAction}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => markLearningCardReviewed(card.id)}
                  disabled={card.reviewed}
                  className={`flex-1 font-pixel text-[6px] py-1.5 border ${
                    card.reviewed
                      ? 'border-[oklch(0.22_0.025_260)] text-[oklch(0.35_0.02_260)] bg-[oklch(0.15_0.02_260)]'
                      : 'border-[oklch(0.72_0.19_155_/_0.55)] text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.08)]'
                  }`}
                >
                  {card.reviewed ? '已标记掌握' : '标记为已掌握'}
                </button>
                <button
                  onClick={() => {
                    if (!linkedReport) return;
                    setSelectedReport(linkedReport);
                    setActivePanel('report-viewer');
                  }}
                  disabled={!linkedReport}
                  className={`flex-1 font-pixel text-[6px] py-1.5 border ${
                    linkedReport
                      ? 'border-[oklch(0.75_0.12_200_/_0.55)] text-[oklch(0.75_0.12_200)] bg-[oklch(0.75_0.12_200_/_0.08)]'
                      : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.35_0.02_260)] bg-[oklch(0.15_0.02_260)]'
                  }`}
                >
                  查看关联报告
                </button>
              </div>
              <button
                onClick={() => {
                  createThesis({
                    type: card.thesisType,
                    hypothesis: buildRetryHypothesis(card.hypothesis, card.outcome),
                    goal: thesis?.goal ?? 'robustness',
                    selectedFactorIds: card.thesisType === 'portfolio' ? thesis?.selectedFactorIds : undefined,
                    sourceLearningCardId: card.id,
                  });
                  if (!card.reviewed) markLearningCardReviewed(card.id);
                  setActivePanel('research');
                }}
                disabled={hasRetryDraft}
                className={`w-full font-pixel text-[6px] py-1.5 border ${
                  hasRetryDraft
                    ? 'border-[oklch(0.22_0.025_260)] text-[oklch(0.35_0.02_260)] bg-[oklch(0.15_0.02_260)]'
                    : 'border-[oklch(0.82_0.15_85_/_0.55)] text-[oklch(0.82_0.15_85)] bg-[oklch(0.82_0.15_85_/_0.08)] hover:bg-[oklch(0.82_0.15_85_/_0.15)]'
                }`}
              >
                {hasRetryDraft ? '该学习卡已有重开命题' : '基于此卡重开命题'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
