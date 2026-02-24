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

const DESK_POSITIONS = [
  { x: 20, y: 30, deskLabel: 'A1' },
  { x: 46, y: 30, deskLabel: 'A2' },
  { x: 20, y: 58, deskLabel: 'B1' },
  { x: 46, y: 58, deskLabel: 'B2' },
  { x: 71, y: 43, deskLabel: 'C1' },
  { x: 71, y: 70, deskLabel: 'C2' },
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-1 sm:p-2">
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{
        background: 'radial-gradient(ellipse at center, transparent 54%, oklch(0.07 0.012 260 / 0.52) 100%)',
      }} />

      <div className="relative w-full h-full max-w-[1460px] max-h-[860px] mx-auto">
        <div className="absolute inset-[4%] rounded-[28px] border-2 border-[oklch(0.24_0.03_260)] bg-[linear-gradient(160deg,oklch(0.18_0.03_250),oklch(0.12_0.02_260))] shadow-[inset_0_0_0_1px_oklch(0.32_0.03_260_/_0.45)] overflow-hidden">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage: `
                linear-gradient(to right, oklch(0.28 0.03 260 / 0.35) 1px, transparent 1px),
                linear-gradient(to bottom, oklch(0.28 0.03 260 / 0.35) 1px, transparent 1px)
              `,
              backgroundSize: '38px 38px',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,oklch(0.55_0.2_265_/_0.18),transparent_40%),radial-gradient(circle_at_20%_75%,oklch(0.72_0.19_155_/_0.12),transparent_42%)]" />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {DESK_POSITIONS.map((pos, index) => {
            const owner = state.researchers[index];
            const roleColor = owner ? (ROLE_COLORS[owner.role] || 'oklch(0.55 0.2 265)') : 'oklch(0.3 0.03 260)';
            return (
              <div
                key={`desk-${pos.deskLabel}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  zIndex: 4 + Math.floor(pos.y),
                  borderColor: owner ? `${roleColor}80` : 'oklch(0.28 0.03 260)',
                  backgroundColor: owner ? `${roleColor}1A` : 'oklch(0.1 0.015 260 / 0.7)',
                  boxShadow: owner ? `0 0 10px ${roleColor}35` : 'none',
                }}
              >
                <p className="font-pixel text-[7px]" style={{ color: owner ? roleColor : 'oklch(0.5 0.02 260)' }}>
                  工位 {pos.deskLabel}
                </p>
              </div>
            );
          })}
        </div>

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

        <div className="absolute top-3 left-4 z-10">
          <div className="rounded-xl bg-[oklch(0.08_0.015_260_/_0.84)] border border-[oklch(0.28_0.03_260)] px-3 py-1.5 backdrop-blur-sm">
            <p className="font-display text-[10px] text-[oklch(0.82_0.15_85)]">🕹️ 点击研究员查看状态，点击空工位招聘</p>
          </div>
        </div>

        <div className="absolute bottom-3 right-4 z-10 hidden lg:flex items-center gap-1.5 rounded-xl border border-[oklch(0.26_0.03_260)] bg-[oklch(0.08_0.015_260_/_0.84)] px-2.5 py-1.5 backdrop-blur-sm">
          {[
            { icon: '💤', label: '空闲', color: 'oklch(0.45 0.02 260)' },
            { icon: '🔬', label: '研究中', color: 'oklch(0.55 0.2 265)' },
            { icon: '🔀', label: '待决策', color: 'oklch(0.82 0.15 85)' },
            { icon: '✅', label: '完成', color: 'oklch(0.72 0.19 155)' },
          ].map(item => (
            <span key={item.label} className="font-display text-[10px]" style={{ color: item.color }}>
              {item.icon} {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
