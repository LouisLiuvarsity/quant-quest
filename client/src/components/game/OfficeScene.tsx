/*
 * OfficeScene - Isometric pixel art office with interactive researchers
 * Researchers have unified abilities, only differ in skin and assigned role
 * Click a researcher to see their status panel
 */

import { useGame, type Researcher } from '@/contexts/GameContext';

const ROLE_COLORS: Record<string, string> = {
  '因子研究': 'oklch(0.55 0.2 265)',
  '多因子合成': 'oklch(0.72 0.19 155)',
  '策略优化': 'oklch(0.82 0.15 85)',
  '全能': 'oklch(0.75 0.12 200)',
};

const TASK_TYPE_LABELS: Record<string, string> = {
  single_factor: '因子挖掘',
  multi_factor: '多因子合成',
};
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const OFFICE_BG = 'https://private-us-east-1.manuscdn.com/sessionFile/QeSitOBhLnUEOAHGV2ohey/sandbox/W11Rk9GbnhEmhaFn5kwVyf-img-1_1771586922000_na1fn_b2ZmaWNlLWJn.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUWVTaXRPQmhMblVFT0FIR1Yyb2hleS9zYW5kYm94L1cxMVJrOUdibmhFbWhhRm41a3dWeWYtaW1nLTFfMTc3MTU4NjkyMjAwMF9uYTFmbl9iMlptYVdObExXSm4ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=fpZMiz0l-C7HQivOmwLcjwwZ2qEeVsjDf4E3tXBiIAPkyPeluwqpophPHk1Y0VHRTbFMWZnK4OfNDwI25vtEkzu6xQ-hWuW8NPLA78zOkyxa7x33ZfR-nunZpNWwlWrR-Uv1c0WCAkmYFjyjgO5aPL-ND1E1Ju4x~Y6-CM4aW4CXedgYAdc9Zw0NkwurfWXr5nzLIpunk~RiTKE45ej06rEmiCAE43e3LBk0QgpkwbOU8GmxYE93GSw7jfVwf6yogSfrrdestb8RKUr7FIpJXnm-NAC-mO35p6UJyGqCczUBkbiXOE0EZSPs2X8BQ-xaIwyp6xJRjYBNtAvW6UReLg__';

const DESK_POSITIONS = [
  { x: 18, y: 32, deskLabel: 'A1' },
  { x: 42, y: 32, deskLabel: 'A2' },
  { x: 18, y: 58, deskLabel: 'B1' },
  { x: 42, y: 58, deskLabel: 'B2' },
  { x: 66, y: 45, deskLabel: 'C1' },
  { x: 66, y: 68, deskLabel: 'C2' },
];

const STATUS_EMOJIS: Record<string, string> = {
  idle: '💤',
  researching: '🔬',
  completed: '✅',
  waiting: '🔀',
};

function ResearcherSprite({ researcher, position, onSelect }: {
  researcher: Researcher;
  position: { x: number; y: number };
  onSelect: (r: Researcher) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [typingFrame, setTypingFrame] = useState(0);

  useEffect(() => {
    if (researcher.status !== 'researching') return;
    const interval = setInterval(() => {
      setTypingFrame(f => (f + 1) % 3);
    }, 400);
    return () => clearInterval(interval);
  }, [researcher.status]);

  const typingDots = '.'.repeat(typingFrame + 1);
  const roleColor = ROLE_COLORS[researcher.role] || 'oklch(0.55 0.2 265)';

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10 + Math.floor(position.y),
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(researcher);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status bubble */}
      <AnimatePresence>
        {(isHovered || researcher.status === 'completed' || researcher.status === 'researching' || researcher.status === 'waiting') && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
          >
            <div
              className="bg-[oklch(0.1_0.015_260_/_0.95)] border-2 px-2.5 py-1.5 whitespace-nowrap backdrop-blur-sm"
              style={{ borderColor: roleColor }}
            >
              <p className="font-pixel text-[7px] text-[oklch(0.92_0.01_260)] mb-0.5 flex items-center gap-1">
                {researcher.skin.name}
                <span className="text-[6px]" style={{ color: roleColor }}>
                  {researcher.role}
                </span>
              </p>
              <p className="font-pixel text-[6px]" style={{ color: roleColor }}>
                {researcher.status === 'researching' && researcher.currentTask
                  ? `${TASK_TYPE_LABELS[researcher.currentTask.type]}${typingDots}`
                  : researcher.status === 'waiting'
                  ? '🔀 等待CEO决策 - 点击查看'
                  : researcher.status === 'completed'
                  ? '✅ 研究完成 - 点击查看'
                  : '💤 空闲 - 点击分配任务'
                }
              </p>
              {(researcher.status === 'researching' || researcher.status === 'waiting') && (
                <div className="mt-1 w-full h-[5px] bg-[oklch(0.18_0.02_260)] border border-[oklch(0.3_0.03_260)]">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${researcher.progress}%`,
                      backgroundColor: roleColor,
                    }}
                  />
                </div>
              )}
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                style={{ backgroundColor: 'oklch(0.1 0.015 260)', borderRight: `2px solid ${roleColor}`, borderBottom: `2px solid ${roleColor}` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating status icon */}
      <div
        className={`absolute -top-6 left-1/2 -translate-x-1/2 text-sm ${
          researcher.status === 'researching' ? 'animate-pixel-float' : ''
        } ${researcher.status === 'completed' ? 'animate-pixel-blink' : ''}`}
      >
        {STATUS_EMOJIS[researcher.status]}
      </div>

      {/* Avatar */}
      <motion.div
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
        className="w-10 h-10 flex items-center justify-center text-xl relative"
        style={{
          filter: isHovered
            ? `drop-shadow(0 0 10px ${roleColor})`
            : researcher.status === 'completed'
            ? 'drop-shadow(0 0 6px oklch(0.72 0.19 155 / 0.6))'
            : 'none',
        }}
      >
        {researcher.skin.avatar}
        {/* Role indicator dot */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-[oklch(0.1_0.015_260)]"
          style={{ backgroundColor: roleColor }}
        />
      </motion.div>

      {/* Name tag */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className="font-pixel text-[6px] bg-[oklch(0.08_0.015_260_/_0.85)] px-1.5 py-0.5 border"
          style={{
            color: isHovered ? roleColor : 'oklch(0.65 0.02 260)',
            borderColor: isHovered ? `${roleColor}60` : 'transparent',
          }}
        >
          {researcher.skin.name.length > 6 ? researcher.skin.name.slice(0, 6) : researcher.skin.name}
        </span>
      </div>
    </div>
  );
}

export function OfficeScene() {
  const { state, setSelectedResearcher, setActivePanel } = useGame();

  const handleResearcherClick = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setActivePanel('researcher-detail');
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, oklch(0.08 0.015 260 / 0.6) 100%)',
      }} />

      <div className="relative w-full h-full max-w-[1200px] max-h-[700px] mx-auto">
        <img
          src={OFFICE_BG}
          alt="Pixel Office"
          className="w-full h-full object-contain select-none"
          draggable={false}
          style={{ imageRendering: 'auto' }}
        />

        {/* Researchers */}
        {state.researchers.map((researcher, index) => {
          const pos = DESK_POSITIONS[index];
          if (!pos) return null;
          return (
            <ResearcherSprite
              key={researcher.id}
              researcher={researcher}
              position={pos}
              onSelect={handleResearcherClick}
            />
          );
        })}

        {/* Empty desks */}
        {DESK_POSITIONS.slice(state.researchers.length).map((pos, i) => (
          <motion.div
            key={`empty-${i}`}
            className="absolute cursor-pointer group"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10 + Math.floor(pos.y),
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActivePanel('hiring');
            }}
            whileHover={{ scale: 1.1 }}
          >
            <div className="w-10 h-10 border-2 border-dashed border-[oklch(0.28_0.03_260)] flex items-center justify-center text-[oklch(0.3_0.03_260)] hover:border-[oklch(0.55_0.2_265)] hover:text-[oklch(0.55_0.2_265)] transition-all bg-[oklch(0.1_0.015_260_/_0.3)]">
              <span className="font-pixel text-lg leading-none">+</span>
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="font-pixel text-[6px] text-[oklch(0.3_0.03_260)] group-hover:text-[oklch(0.55_0.2_265)] transition-colors">
                招聘
              </span>
            </div>
          </motion.div>
        ))}

        {/* Office label */}
        <div className="absolute top-3 right-4 z-10">
          <div className="bg-[oklch(0.08_0.015_260_/_0.88)] border-2 border-[oklch(0.28_0.03_260)] px-3 py-1.5 backdrop-blur-sm">
            <p className="font-pixel text-[7px] text-[oklch(0.65_0.02_260)]">
              🏢 {state.companyName}
            </p>
            <p className="font-pixel text-[5px] text-[oklch(0.4_0.02_260)] mt-0.5">
              研究员: {state.researchers.length}/6
            </p>
          </div>
        </div>

        {/* Mini stats */}
        <div className="absolute bottom-3 left-4 flex gap-2 z-10">
          {[
            { label: '因子', value: state.factorCards.length, color: 'oklch(0.55 0.2 265)', bg: 'oklch(0.55 0.2 265 / 0.08)' },
            { label: '报告', value: state.reports.length, color: 'oklch(0.82 0.15 85)', bg: 'oklch(0.82 0.15 85 / 0.08)' },
            { label: '策略', value: state.strategies.length, color: 'oklch(0.72 0.19 155)', bg: 'oklch(0.72 0.19 155 / 0.08)' },
          ].map(stat => (
            <div
              key={stat.label}
              className="border-2 px-2.5 py-1.5 backdrop-blur-sm"
              style={{ borderColor: stat.color, backgroundColor: stat.bg }}
            >
              <p className="font-pixel text-[5px]" style={{ color: stat.color }}>{stat.label}</p>
              <p className="font-mono-data text-sm font-bold text-[oklch(0.92_0.01_260)]">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
