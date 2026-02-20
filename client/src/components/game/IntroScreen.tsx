/*
 * IntroScreen - Pixel art game intro / landing page
 * Design: Dark atmospheric with pixel accents
 * Three phases: title → setup → loading
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_BG = 'https://private-us-east-1.manuscdn.com/sessionFile/QeSitOBhLnUEOAHGV2ohey/sandbox/W11Rk9GbnhEmhaFn5kwVyf-img-2_1771586918000_na1fn_aGVyby1iYW5uZXI.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUWVTaXRPQmhMblVFT0FIR1Yyb2hleS9zYW5kYm94L1cxMVJrOUdibmhFbWhhRm41a3dWeWYtaW1nLTJfMTc3MTU4NjkxODAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=vdOUivCMShkRG~LlP1jShYk5yioS0Wa9zALHBYORH0n7QnVI-bthDmFdXt8-IKylnQYR6BB-9LqRswMPSmxNZsf0YUuI~l~wkkbpbgDVS1N3FmJuKn~SftYCeM5iWh8HY6GUIkKYSkoNVFXetahsnXmYDFSut6YCTHta~lUqfB3zRUEY5HsaSHz3QY3-rOa~wU32Os9W9GiFxGWSYN3aNh~Sc4CDYg9xGBjk~z1IpncTEuYys6WpKPYkdJ6aKW6e6iEAzSz2yl1eoFn6wymGSVYRIcTeggpkFvYzAOeje73hbSG~hAu6tCL7bE0NyxzV~SjhZiknrn~ve1Im~JGfLA__';

interface IntroScreenProps {
  onStart: () => void;
}

const LOADING_MESSAGES = [
  '初始化量化引擎...',
  '加载市场数据...',
  '部署AI研究员...',
  '连接交易系统...',
  '准备就绪！',
];

export function IntroScreen({ onStart }: IntroScreenProps) {
  const [phase, setPhase] = useState<'title' | 'setup' | 'starting'>('title');
  const [companyName, setCompanyName] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(0);

  useEffect(() => {
    if (phase !== 'starting') return;
    const interval = setInterval(() => {
      setLoadingMsg(prev => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          clearInterval(interval);
          setTimeout(onStart, 400);
          return prev;
        }
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [phase, onStart]);

  const handleStart = () => {
    setPhase('starting');
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[oklch(0.06_0.015_260)]">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover opacity-30"
          style={{ filter: 'blur(1px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.06_0.015_260)] via-[oklch(0.06_0.015_260_/_0.75)] to-[oklch(0.06_0.015_260_/_0.4)]" />
      </div>

      {/* Animated grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(oklch(0.55 0.2 265) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.55 0.2 265) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-60" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
      }} />

      <AnimatePresence mode="wait">
        {phase === 'title' && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 h-full flex flex-col items-center justify-center gap-6 px-4"
          >
            {/* Pixel art decorative corners */}
            <div className="absolute top-6 left-6 w-8 h-8 border-l-3 border-t-3 border-[oklch(0.55_0.2_265_/_0.3)]" />
            <div className="absolute top-6 right-6 w-8 h-8 border-r-3 border-t-3 border-[oklch(0.55_0.2_265_/_0.3)]" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-l-3 border-b-3 border-[oklch(0.55_0.2_265_/_0.3)]" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-r-3 border-b-3 border-[oklch(0.55_0.2_265_/_0.3)]" />

            {/* Logo / Title */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center"
            >
              {/* Pixel coin decoration */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-4xl mb-4"
              >
                🏛️
              </motion.div>

              <h1
                className="font-pixel text-2xl md:text-4xl leading-relaxed tracking-wider"
                style={{
                  color: 'oklch(0.88 0.12 85)',
                  textShadow: '0 0 30px oklch(0.82 0.15 85 / 0.4), 0 4px 0 oklch(0.45 0.1 85), 0 6px 12px rgba(0,0,0,0.5)',
                }}
              >
                QUANT QUEST
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="font-pixel text-[9px] md:text-[11px] text-[oklch(0.65_0.1_200)] tracking-[0.3em] mt-3"
              >
                量化基金经营模拟器
              </motion.p>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center max-w-md"
            >
              <p className="font-display text-base md:text-lg text-[oklch(0.65_0.02_260)] leading-relaxed">
                扮演量化基金 CEO，招募 AI 研究员
              </p>
              <p className="font-display text-base md:text-lg text-[oklch(0.65_0.02_260)] leading-relaxed">
                挖掘 Alpha 因子，打造你的量化帝国
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="flex flex-wrap justify-center gap-2.5 max-w-lg"
            >
              {[
                { tag: '👥 招聘研究员', color: 'oklch(0.55 0.2 265)' },
                { tag: '🔬 因子挖掘', color: 'oklch(0.75 0.12 200)' },
                { tag: '📊 策略组合', color: 'oklch(0.72 0.19 155)' },
                { tag: '📈 回测验证', color: 'oklch(0.82 0.15 85)' },
                { tag: '🚀 实盘模拟', color: 'oklch(0.63 0.22 25)' },
              ].map((item, i) => (
                <motion.span
                  key={item.tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.08 }}
                  className="font-pixel text-[7px] px-3 py-2 border-2"
                  style={{
                    borderColor: `${item.color}60`,
                    color: item.color,
                    backgroundColor: `${item.color}10`,
                  }}
                >
                  {item.tag}
                </motion.span>
              ))}
            </motion.div>

            {/* Start Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              onClick={() => setPhase('setup')}
              className="mt-6 font-pixel text-sm md:text-base px-10 py-4 bg-[oklch(0.55_0.2_265)] text-white border-4 border-[oklch(0.45_0.2_265)] hover:bg-[oklch(0.6_0.2_265)] transition-all active:translate-y-0.5"
              style={{
                boxShadow: 'inset -3px -3px 0 oklch(0.4 0.2 265), inset 3px 3px 0 oklch(0.68 0.15 265), 0 0 25px oklch(0.55 0.2 265 / 0.3), 0 8px 20px rgba(0,0,0,0.4)',
              }}
            >
              <span className="animate-pixel-blink">▶ START GAME</span>
            </motion.button>

            {/* Version */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 2 }}
              className="font-pixel text-[7px] text-[oklch(0.5_0.02_260)] mt-2"
            >
              v0.1.0 DEMO · POWERED BY AI AGENT
            </motion.p>
          </motion.div>
        )}

        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 h-full flex items-center justify-center px-4"
          >
            <div className="glass-panel border-2 border-[oklch(0.55_0.2_265_/_0.4)] p-6 sm:p-8 max-w-md w-full" style={{
              boxShadow: '0 0 40px oklch(0.55 0.2 265 / 0.1), 0 20px 60px rgba(0,0,0,0.5)',
            }}>
              <div className="text-center mb-6">
                <span className="text-3xl">🏢</span>
                <h2 className="font-pixel text-sm text-[oklch(0.88_0.12_85)] mt-3">
                  创建你的基金
                </h2>
                <p className="font-display text-xs text-[oklch(0.5_0.02_260)] mt-1">
                  给你的量化基金起一个响亮的名字
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="font-pixel text-[7px] text-[oklch(0.6_0.02_260)] block mb-2">
                    基金名称
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="例如: Alpha Capital..."
                    className="w-full bg-[oklch(0.1_0.015_260)] border-2 border-[oklch(0.28_0.03_260)] px-4 py-3 font-display text-sm text-[oklch(0.92_0.01_260)] placeholder:text-[oklch(0.35_0.02_260)] focus:border-[oklch(0.55_0.2_265)] focus:outline-none transition-colors"
                  />
                </div>

                <div className="bg-[oklch(0.1_0.015_260)] border-2 border-[oklch(0.22_0.025_260)] p-4">
                  <p className="font-pixel text-[7px] text-[oklch(0.88_0.12_85)] mb-3 flex items-center gap-2">
                    <span>💰</span> 初始资源
                  </p>
                  <div className="space-y-2.5 font-mono-data text-xs text-[oklch(0.65_0.02_260)]">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">🪙 启动积分</span>
                      <span className="text-[oklch(0.88_0.12_85)] font-bold">10,000,000</span>
                    </div>
                    <div className="h-px bg-[oklch(0.2_0.02_260)]" />
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">👥 初始研究员</span>
                      <span>3 名</span>
                    </div>
                    <div className="h-px bg-[oklch(0.2_0.02_260)]" />
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5">📊 策略上限</span>
                      <span>3 个 <span className="text-[oklch(0.45_0.02_260)]">(免费版)</span></span>
                    </div>
                  </div>
                </div>

                <div className="bg-[oklch(0.1_0.015_260)] border-2 border-[oklch(0.22_0.025_260)] p-4">
                  <p className="font-pixel text-[7px] text-[oklch(0.72_0.19_155)] mb-3 flex items-center gap-2">
                    <span>📋</span> 游戏规则
                  </p>
                  <div className="space-y-2 font-display text-xs text-[oklch(0.55_0.02_260)] leading-relaxed">
                    <p className="flex items-start gap-2">
                      <span className="text-[oklch(0.55_0.2_265)] mt-0.5 shrink-0">▸</span>
                      积分按研究任务消耗的 Token 扣费，耗尽则公司停止运转
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[oklch(0.55_0.2_265)] mt-0.5 shrink-0">▸</span>
                      免费版最多同时运行 3 个策略，收益不可提现
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[oklch(0.82_0.15_85)] mt-0.5 shrink-0">★</span>
                      <span>Pro版 ¥20/月，配资1000U，盈利可提现 50%-90%</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStart}
                  className="w-full font-pixel text-xs py-4 bg-[oklch(0.72_0.19_155)] text-white border-3 border-[oklch(0.55_0.19_155)] hover:bg-[oklch(0.77_0.19_155)] transition-all active:translate-y-0.5"
                  style={{
                    boxShadow: 'inset -3px -3px 0 oklch(0.5 0.19 155), inset 3px 3px 0 oklch(0.82 0.12 155), 0 0 20px oklch(0.72 0.19 155 / 0.2)',
                  }}
                >
                  🚀 开始经营
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'starting' && (
          <motion.div
            key="starting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 h-full flex items-center justify-center"
          >
            <div className="text-center w-72">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 1] }}
                transition={{ duration: 0.4 }}
                className="text-4xl mb-6"
              >
                🏛️
              </motion.div>
              <div className="space-y-3">
                {LOADING_MESSAGES.map((msg, i) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0, x: -10 }}
                    animate={i <= loadingMsg ? { opacity: 1, x: 0 } : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    <span className={`font-pixel text-[6px] ${i < loadingMsg ? 'text-[oklch(0.72_0.19_155)]' : i === loadingMsg ? 'text-[oklch(0.82_0.15_85)] animate-pixel-blink' : 'text-[oklch(0.35_0.02_260)]'}`}>
                      {i < loadingMsg ? '✓' : i === loadingMsg ? '▶' : '○'}
                    </span>
                    <span className={`font-display text-xs ${i <= loadingMsg ? 'text-[oklch(0.75_0.02_260)]' : 'text-[oklch(0.35_0.02_260)]'}`}>
                      {msg}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 w-full pixel-progress">
                <motion.div
                  className="pixel-progress-fill bg-[oklch(0.55_0.2_265)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((loadingMsg + 1) / LOADING_MESSAGES.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
