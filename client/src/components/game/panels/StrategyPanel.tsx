/*
 * StrategyPanel - View strategies from factor/portfolio cards
 * Deploy to live trading, manage portfolio cards
 */

import { useGame, type PortfolioCard, type Strategy } from '@/contexts/GameContext';

export function StrategyPanel() {
  const { state, setActivePanel, deployStrategy, goLive, setSelectedPortfolioCard } = useGame();

  const portfolioCards = state.portfolioCards;
  const passedFactors = state.factorCards.filter(f => f.status === 'passed');
  const liveStrategies = state.strategies.filter(s => s.status === 'live');
  const draftStrategies = state.strategies.filter(s => s.status === 'draft');

  const handleDeployFactor = (factorId: string, factorName: string) => {
    deployStrategy('factor', factorId, `策略_${factorName}`);
  };

  const handleDeployPortfolio = (portfolioId: string, portfolioName: string) => {
    deployStrategy('portfolio', portfolioId, `策略_${portfolioName}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Live Strategies */}
      {liveStrategies.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.72_0.19_155)] mb-2">🟢 运行中的策略 ({liveStrategies.length}/{state.maxLiveStrategies})</p>
          <div className="space-y-2">
            {liveStrategies.map(s => (
              <LiveStrategyItem key={s.id} strategy={s} />
            ))}
          </div>
        </div>
      )}

      {/* Draft strategies */}
      {draftStrategies.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-2">📋 待上线策略 ({draftStrategies.length})</p>
          <div className="space-y-2">
            {draftStrategies.map(s => (
              <div key={s.id} className="border-2 border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{s.name}</span>
                  <span className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">DRAFT</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">
                    来源: {s.sourceType === 'factor' ? '单因子' : '组合'} | {s.createdAt}
                  </p>
                  <button
                    onClick={() => goLive(s.id)}
                    disabled={liveStrategies.length >= state.maxLiveStrategies}
                    className="font-pixel text-[7px] px-3 py-1.5 bg-[oklch(0.72_0.19_155)] text-white border-2 border-[oklch(0.62_0.19_155)] hover:bg-[oklch(0.77_0.19_155)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上线 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployable Factor Cards */}
      {passedFactors.length > 0 && (
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.55_0.2_265)] mb-2">🧬 可部署的因子 ({passedFactors.length})</p>
          <div className="space-y-2">
            {passedFactors.map(fc => {
              const alreadyDeployed = state.strategies.some(s => s.sourceId === fc.id);
              return (
                <div key={fc.id} className="border-2 border-[oklch(0.25_0.03_260)] bg-[oklch(0.14_0.02_260)] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{fc.factorName}</span>
                    <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">✅ PASS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div>
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">Sharpe</p>
                      <p className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)]">{fc.valPerformance.medianSharpe.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">年化</p>
                      <p className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)]">{(fc.valPerformance.medianAnnualReturn * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">回撤</p>
                      <p className="font-mono-data text-[10px] text-[oklch(0.63_0.22_25)]">{(fc.valPerformance.medianMaxDrawdown * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeployFactor(fc.id, fc.factorName)}
                    disabled={alreadyDeployed}
                    className="w-full font-pixel text-[7px] py-2 bg-[oklch(0.55_0.2_265_/_0.15)] text-[oklch(0.55_0.2_265)] border-2 border-[oklch(0.55_0.2_265_/_0.3)] hover:bg-[oklch(0.55_0.2_265_/_0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {alreadyDeployed ? '已部署' : '创建策略 →'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Portfolio Cards */}
      <div>
        <p className="font-pixel text-[8px] text-[oklch(0.75_0.12_200)] mb-2">📦 组合档案卡 ({portfolioCards.length})</p>
        {portfolioCards.length === 0 ? (
          <div className="border-2 border-dashed border-[oklch(0.25_0.03_260)] p-6 text-center">
            <p className="text-2xl mb-2">🧬</p>
            <p className="font-display text-xs text-[oklch(0.5_0.02_260)]">暂无组合档案卡</p>
            <p className="font-display text-[10px] text-[oklch(0.4_0.02_260)] mt-1">
              完成多因子合成任务后会生成组合档案卡
            </p>
            <button
              onClick={() => setActivePanel('research')}
              className="mt-3 font-pixel text-[7px] px-4 py-2 bg-[oklch(0.72_0.19_155_/_0.15)] text-[oklch(0.72_0.19_155)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] hover:bg-[oklch(0.72_0.19_155_/_0.25)] transition-all"
            >
              去发起多因子合成 →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {portfolioCards.map(pc => (
              <PortfolioCardItem
                key={pc.id}
                card={pc}
                onDeploy={() => handleDeployPortfolio(pc.id, pc.name)}
                onViewDetail={() => { setSelectedPortfolioCard(pc); setActivePanel('report-viewer'); }}
                isDeployed={state.strategies.some(s => s.sourceId === pc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty state if nothing at all */}
      {passedFactors.length === 0 && portfolioCards.length === 0 && state.strategies.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-3">🏗️</p>
          <p className="font-pixel text-[9px] text-[oklch(0.5_0.02_260)]">策略工坊</p>
          <p className="font-display text-xs text-[oklch(0.4_0.02_260)] mt-1">
            先完成因子挖掘，通过验证的因子可以部署为策略
          </p>
          <button
            onClick={() => setActivePanel('research')}
            className="mt-3 font-pixel text-[7px] px-4 py-2 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all"
          >
            去研究 →
          </button>
        </div>
      )}
    </div>
  );
}

function LiveStrategyItem({ strategy }: { strategy: Strategy }) {
  const pnl = strategy.liveResult?.pnl ?? 0;
  const pnlPercent = strategy.liveResult?.pnlPercent ?? 0;
  const runDays = strategy.liveResult?.runningDays ?? 0;
  const todayPnl = strategy.liveResult?.todayPnl ?? 0;

  return (
    <div className="border-2 border-[oklch(0.72_0.19_155_/_0.3)] bg-[oklch(0.72_0.19_155_/_0.05)] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{strategy.name}</span>
        <span className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)] animate-pulse">● LIVE</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">总P&L</p>
          <p className={`font-mono-data text-xs ${pnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">收益率</p>
          <p className={`font-mono-data text-xs ${pnlPercent >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
            {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">今日</p>
          <p className={`font-mono-data text-xs ${todayPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'}`}>
            {todayPnl >= 0 ? '+' : ''}{todayPnl.toFixed(0)}
          </p>
        </div>
        <div>
          <p className="font-pixel text-[4px] text-[oklch(0.4_0.02_260)]">天数</p>
          <p className="font-mono-data text-xs text-[oklch(0.85_0.01_260)]">{runDays}</p>
        </div>
      </div>
    </div>
  );
}

function PortfolioCardItem({ card, onDeploy, onViewDetail, isDeployed }: { card: PortfolioCard; onDeploy: () => void; onViewDetail: () => void; isDeployed: boolean }) {
  const statusLabel = card.status === 'adopted' ? '✅ 采纳' : card.status === 'rejected' ? '❌ 拒绝' : '⏳ 待定';
  const statusColor = card.status === 'adopted' ? 'oklch(0.72 0.19 155)' : card.status === 'rejected' ? 'oklch(0.63 0.22 25)' : 'oklch(0.82 0.15 85)';

  return (
    <div className="border-2 border-[oklch(0.28_0.03_260)] bg-[oklch(0.12_0.02_260)] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-semibold text-[oklch(0.88_0.01_260)]">{card.name}</span>
        <span className="font-pixel text-[6px] px-2 py-0.5 border" style={{ color: statusColor, borderColor: statusColor }}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[oklch(0.08_0.015_260)] p-2 border border-[oklch(0.2_0.02_260)]">
          <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">合成方式</p>
          <p className="font-display text-[10px] text-[oklch(0.85_0.01_260)]">
            {card.blendMode === 'signal_blend' ? '信号层合成' : '仓位层合成'}
          </p>
        </div>
        <div className="bg-[oklch(0.08_0.015_260)] p-2 border border-[oklch(0.2_0.02_260)]">
          <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">权重方案</p>
          <p className="font-display text-[10px] text-[oklch(0.85_0.01_260)]">
            {card.weightMethod === 'equal' ? '等权' : '表现加权'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div>
          <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">因子数</p>
          <p className="font-mono-data text-xs text-[oklch(0.55_0.2_265)]">{card.includedFactorIds.length}</p>
        </div>
        <div>
          <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">Sharpe</p>
          <p className="font-mono-data text-xs text-[oklch(0.72_0.19_155)]">{card.oosPerformance.medianSharpe.toFixed(2)}</p>
        </div>
        <div>
          <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">年化</p>
          <p className="font-mono-data text-xs text-[oklch(0.72_0.19_155)]">{(card.oosPerformance.medianAnnualReturn * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)]">回撤</p>
          <p className="font-mono-data text-xs text-[oklch(0.63_0.22_25)]">{(card.oosPerformance.medianMaxDrawdown * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div>
        <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)] mb-1">因子组成</p>
        <div className="flex flex-wrap gap-1">
          {card.includedFactors.map((name, i) => {
            const weight = card.factorWeights[name];
            return (
              <span key={i} className="font-display text-[9px] px-1.5 py-0.5 bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)] border border-[oklch(0.55_0.2_265_/_0.3)]">
                {name.slice(0, 8)} {weight ? `(${(weight * 100).toFixed(0)}%)` : ''}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onViewDetail}
          className="flex-1 font-pixel text-[7px] py-1.5 bg-[oklch(0.14_0.02_260)] text-[oklch(0.7_0.02_260)] border-2 border-[oklch(0.25_0.03_260)] hover:bg-[oklch(0.18_0.02_260)] transition-all"
        >
          📊 详情
        </button>
        {card.status === 'adopted' && (
          <button
            onClick={onDeploy}
            disabled={isDeployed}
            className="flex-1 font-pixel text-[7px] py-1.5 bg-[oklch(0.72_0.19_155_/_0.15)] text-[oklch(0.72_0.19_155)] border-2 border-[oklch(0.72_0.19_155_/_0.3)] hover:bg-[oklch(0.72_0.19_155_/_0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isDeployed ? '已部署' : '部署策略 →'}
          </button>
        )}
      </div>
    </div>
  );
}
