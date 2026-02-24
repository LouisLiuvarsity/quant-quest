import { KLINE_PERIODS, UNIVERSES, type ProjectConfig } from '@/contexts/GameContext';
import { useState } from 'react';

export function ProjectConfigSetup({ onSave }: { onSave: (config: ProjectConfig) => void }) {
  const [barSize, setBarSize] = useState('1d');
  const [universe, setUniverse] = useState('crypto_top100');
  const [splitMode, setSplitMode] = useState<'three_way' | 'two_way'>('three_way');

  return (
    <div className="p-4 space-y-4">
      <div className="border-2 border-[oklch(0.82_0.15_85_/_0.3)] bg-[oklch(0.82_0.15_85_/_0.05)] p-3">
        <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)] mb-1">⚠️ 项目配置</p>
        <p className="font-display text-[11px] text-[oklch(0.6_0.02_260)] leading-relaxed">
          首次研究需要设定项目配置。此配置将被所有后续因子研究继承。
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <div className="border border-[oklch(0.32_0.03_260)] bg-[oklch(0.14_0.02_260)] p-1.5">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">作用 1</p>
            <p className="font-display text-[9px] text-[oklch(0.75_0.01_260)] mt-0.5">统一回测口径</p>
          </div>
          <div className="border border-[oklch(0.32_0.03_260)] bg-[oklch(0.14_0.02_260)] p-1.5">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">作用 2</p>
            <p className="font-display text-[9px] text-[oklch(0.75_0.01_260)] mt-0.5">固定训练/验证分层</p>
          </div>
          <div className="border border-[oklch(0.32_0.03_260)] bg-[oklch(0.14_0.02_260)] p-1.5">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">作用 3</p>
            <p className="font-display text-[9px] text-[oklch(0.75_0.01_260)] mt-0.5">解锁任务指派</p>
          </div>
        </div>
      </div>

      {/* K-line Period */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">K线级别</label>
        <div className="grid grid-cols-3 gap-1.5">
          {KLINE_PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setBarSize(p.value)}
              className={`font-display text-[11px] py-2 border-2 transition-all ${
                barSize === p.value
                  ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)]'
                  : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Universe */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">资产池</label>
        <div className="space-y-1.5">
          {UNIVERSES.map(u => (
            <button
              key={u.value}
              onClick={() => setUniverse(u.value)}
              className={`w-full text-left font-display text-[11px] px-3 py-2.5 border-2 transition-all ${
                universe === u.value
                  ? 'border-[oklch(0.55_0.2_265)] bg-[oklch(0.55_0.2_265_/_0.1)] text-[oklch(0.55_0.2_265)]'
                  : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Split */}
      <div>
        <label className="font-pixel text-[7px] text-[oklch(0.55_0.2_265)] block mb-2">数据切分</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setSplitMode('three_way')}
            className={`font-display text-[11px] py-2.5 border-2 transition-all ${
              splitMode === 'three_way'
                ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)] text-[oklch(0.72_0.19_155)]'
                : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
            }`}
          >
            三段切分 (IS/VAL/OOS)
          </button>
          <button
            onClick={() => setSplitMode('two_way')}
            className={`font-display text-[11px] py-2.5 border-2 transition-all ${
              splitMode === 'two_way'
                ? 'border-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.1)] text-[oklch(0.72_0.19_155)]'
                : 'border-[oklch(0.22_0.025_260)] text-[oklch(0.5_0.02_260)] hover:border-[oklch(0.35_0.03_260)]'
            }`}
          >
            两段切分 (IS/TEST)
          </button>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex gap-1">
            <div className="flex-1 h-3 bg-[oklch(0.55_0.2_265_/_0.3)] flex items-center justify-center">
              <span className="font-pixel text-[5px] text-[oklch(0.55_0.2_265)]">IS 2020-01~2022-06</span>
            </div>
            <div className="flex-1 h-3 bg-[oklch(0.72_0.19_155_/_0.3)] flex items-center justify-center">
              <span className="font-pixel text-[5px] text-[oklch(0.72_0.19_155)]">VAL 2022-06~2024-06</span>
            </div>
            {splitMode === 'three_way' && (
              <div className="flex-1 h-3 bg-[oklch(0.82_0.15_85_/_0.3)] flex items-center justify-center">
                <span className="font-pixel text-[5px] text-[oklch(0.82_0.15_85)]">OOS 2024-06~2026-01</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onSave({
          barSize,
          universeFilter: UNIVERSES.find(u => u.value === universe)?.label || universe,
          universeRebalance: '每月初',
          splitMode,
          isRange: '2020-01 ~ 2022-06',
          valRange: '2022-06 ~ 2024-06',
          oosRange: splitMode === 'three_way' ? '2024-06 ~ 2026-01' : 'N/A',
          regimeCheck: { bull: 38, bear: 32, sideways: 30 },
        })}
        className="w-full font-pixel text-[9px] py-3 bg-[oklch(0.55_0.2_265)] text-white border-2 border-[oklch(0.65_0.22_265)] hover:brightness-110 transition-all"
        style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.15)' }}
      >
        ✅ 确认项目配置
      </button>
    </div>
  );
}

