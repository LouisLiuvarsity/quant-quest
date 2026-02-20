/*
 * LeaderboardPanel - Company rankings
 * Shows top funds with PnL, strategies, researchers
 * Highlights current player's position
 */

import { useGame } from '@/contexts/GameContext';

const LEADERBOARD_BG = 'https://private-us-east-1.manuscdn.com/sessionFile/QeSitOBhLnUEOAHGV2ohey/sandbox/W11Rk9GbnhEmhaFn5kwVyf-img-5_1771586924000_na1fn_bGVhZGVyYm9hcmQtYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUWVTaXRPQmhMblVFT0FIR1Yyb2hleS9zYW5kYm94L1cxMVJrOUdibmhFbWhhRm41a3dWeWYtaW1nLTVfMTc3MTU4NjkyNDAwMF9uYTFmbl9iR1ZoWkdWeVltOWhjbVF0WW1jLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=arh6wbPR8tJBaArXhsQmRrqZ9WsthlI7KI7JR5nVffUCTMdkObZGrekgNR9kXhSJJTJ9p7hZDN3LRLyH8hwEqmNjTyCN1wzW5Pi-1Znv37aRvOzekn7dDrtFpOprSNCR2GYjrSft2DoV9H1jeJSpUpzAb5O26LXPSoeQ2sKYPeH5IAmGFVdSkmUrQf8kuYMusnSQKyRuOER~MBbMZItwgrJ-6FRUkcnwKzeR0qNqLcKYBRKta25aQVBB8JZLsHdeVvm8iguXlcZ6fBjK3FS3IlMVnKCi8KTERyZgdEYSzFJRaokBqIKpYiljLnT~ErpZzB1cZjGJ34d0ULWLZ~-m-w__';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardPanel() {
  const { state } = useGame();

  return (
    <div className="p-4 space-y-4">
      {/* Header with background */}
      <div className="relative overflow-hidden border-2 border-[oklch(0.82_0.15_85_/_0.3)]">
        <img src={LEADERBOARD_BG} alt="" className="w-full h-28 object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.12_0.02_260)] to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-pixel text-sm text-[oklch(0.82_0.15_85)]" style={{ textShadow: '0 0 10px oklch(0.82 0.15 85 / 0.5)' }}>
              🏆 HALL OF FAME
            </p>
            <p className="font-pixel text-[7px] text-[oklch(0.65_0.1_85)] mt-1">量化基金排行榜</p>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {state.rankings.map((company, index) => {
          const isPlayer = company.name === state.companyName;
          const medal = RANK_MEDALS[index];

          return (
            <div
              key={company.rank}
              className={`border-2 p-3 transition-all ${
                isPlayer
                  ? 'bg-[oklch(0.55_0.2_265_/_0.1)] border-[oklch(0.55_0.2_265_/_0.5)] animate-pulse-glow'
                  : 'bg-[oklch(0.16_0.025_260)] border-[oklch(0.25_0.03_260)]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className="font-mono-data text-sm font-bold text-[oklch(0.5_0.02_260)]">
                      #{company.rank}
                    </span>
                  )}
                </div>

                {/* Company info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-display text-sm font-semibold truncate ${
                      isPlayer ? 'text-[oklch(0.55_0.2_265)]' : 'text-[oklch(0.9_0.01_260)]'
                    }`}>
                      {company.name}
                      {isPlayer && <span className="font-pixel text-[6px] ml-1 text-[oklch(0.82_0.15_85)]">YOU</span>}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">
                      CEO: {company.ceo}
                    </span>
                    <span className="font-pixel text-[6px] text-[oklch(0.55_0.2_265)]">
                      Lv.{company.level}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className={`font-mono-data text-sm font-bold ${
                    company.totalPnl >= 0 ? 'text-[oklch(0.72_0.19_155)]' : 'text-[oklch(0.63_0.22_25)]'
                  }`}>
                    {company.totalPnl >= 0 ? '+' : ''}${company.totalPnl.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 justify-end">
                    <span className="font-display text-[9px] text-[oklch(0.45_0.02_260)]">
                      📊{company.strategies}
                    </span>
                    <span className="font-display text-[9px] text-[oklch(0.45_0.02_260)]">
                      👥{company.researchers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="font-pixel text-[7px] text-[oklch(0.4_0.02_260)]">
          排名每日更新 · 基于总实盘收益
        </p>
      </div>
    </div>
  );
}
