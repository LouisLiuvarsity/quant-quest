import { MULTI_FACTOR_STEPS, SINGLE_FACTOR_STEPS, getDecisionOptions, useGame, type ResearchTask } from '@/contexts/GameContext';
import { useEffect, useRef, useState } from 'react';
import { DecisionPointModal } from './DecisionPointModal';

export function TaskMonitor({ task }: { task: ResearchTask }) {
  const { resumeTask, setActivePanel, setSelectedReport, state } = useGame();
  const steps = task.type === 'single_factor' ? SINGLE_FACTOR_STEPS : MULTI_FACTOR_STEPS;
  const currentStep = steps[task.currentStepIndex];
  const logsEndRef = useRef<HTMLDivElement>(null);
  const decisionOptions = currentStep ? getDecisionOptions(task.type, currentStep.id) : [];
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.logs.length]);

  useEffect(() => {
    if (task.status !== 'paused') return;
    if (decisionOptions.length === 0) return;
    if (decisionOptions.some(option => option.id === selectedDecisionId)) return;
    setSelectedDecisionId(decisionOptions[1]?.id || decisionOptions[0].id);
  }, [task.status, task.currentStepIndex, task.type, decisionOptions, selectedDecisionId]);

  useEffect(() => {
    if (task.status !== 'paused') {
      setShowDecisionModal(false);
    }
  }, [task.status]);

  const handleViewReport = () => {
    const report = state.reports.find(r => r.taskId === task.id);
    if (report) {
      setSelectedReport(report);
      setActivePanel('report-viewer');
    }
  };

  const selectedOption = decisionOptions.find(option => option.id === selectedDecisionId);

  const profileCards = [
    { key: 'quality', label: '质量', value: task.qualityScore, color: 'oklch(0.75 0.12 200)' },
    { key: 'risk', label: '风险', value: task.riskScore, color: 'oklch(0.82 0.15 85)' },
    { key: 'efficiency', label: '效率', value: task.efficiencyScore, color: 'oklch(0.72 0.19 155)' },
  ];

  const statusText = task.status === 'paused'
    ? '🔀 等待决策'
    : task.status === 'completed'
      ? '✅ 完成'
      : '⏳ 运行中';

  const statusClass = task.status === 'paused'
    ? 'text-[oklch(0.82_0.15_85)] animate-pulse'
    : task.status === 'completed'
      ? 'text-[oklch(0.72_0.19_155)]'
      : 'text-[oklch(0.55_0.2_265)]';

  return (
    <div className="border-2 border-[oklch(0.25_0.03_260)] bg-[oklch(0.1_0.015_260)] p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">
            {task.type === 'single_factor' ? '🔬 因子挖掘' : '🧬 多因子合成'}
          </p>
          <p className="font-display text-[11px] text-[oklch(0.8_0.01_260)] mt-0.5">
            {state.researchers.find(r => r.id === task.researcherId)?.skin.name} · Step {task.currentStepIndex + 1}/{steps.length}
          </p>
          <p className="font-display text-[10px] text-[oklch(0.52_0.02_260)] mt-1 leading-relaxed">
            {currentStep?.id} {currentStep?.name}：{currentStep?.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono-data text-[11px] text-[oklch(0.55_0.2_265)]">
            🪙 {(task.tokenCost / 1000).toFixed(0)}K
          </p>
          <p className={`font-pixel text-[6px] ${statusClass}`}>
            {statusText}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)]">工作流进度</span>
          <span className="font-mono-data text-[10px] text-[oklch(0.78_0.03_260)]">{task.overallProgress}%</span>
        </div>
        <div className="flex gap-0.5">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="flex-1 h-2 border border-[oklch(0.2_0.02_260)]"
              title={`${step.id}: ${step.name}`}
              style={{
                backgroundColor: i < task.currentStepIndex
                  ? 'oklch(0.55 0.2 265)'
                  : i === task.currentStepIndex
                    ? task.status === 'paused' ? 'oklch(0.82 0.15 85)' : 'oklch(0.55 0.2 265 / 0.5)'
                    : 'oklch(0.15 0.02 260)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {profileCards.map(profile => (
          <div key={profile.key} className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.08_0.015_260)] p-2">
            <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)] mb-1">{profile.label}</p>
            <p className="font-mono-data text-[11px] font-bold mb-1" style={{ color: profile.color }}>{profile.value}</p>
            <div className="h-1.5 bg-[oklch(0.16_0.02_260)] border border-[oklch(0.2_0.02_260)]">
              <div className="h-full" style={{ width: `${profile.value}%`, backgroundColor: profile.color }} />
            </div>
          </div>
        ))}
      </div>

      {task.decisionHistory.length > 0 && (
        <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.09_0.015_260)] p-2">
          <p className="font-pixel text-[6px] text-[oklch(0.45_0.02_260)] mb-1.5">最近决策</p>
          <div className="space-y-1">
            {task.decisionHistory.slice(-2).map(item => (
              <div key={`${item.stepId}-${item.timestamp}`} className="flex items-start justify-between gap-2">
                <span className="font-display text-[10px] text-[oklch(0.72_0.19_155)]">{item.stepId} · {item.optionLabel}</span>
                <span className="font-display text-[9px] text-[oklch(0.5_0.02_260)] text-right">{item.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[oklch(0.08_0.015_260)] border border-[oklch(0.2_0.02_260)] max-h-36 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-0.5">
          {task.logs.slice(-14).map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="font-mono-data text-[8px] text-[oklch(0.35_0.02_260)] shrink-0">{log.timestamp}</span>
              <span className={`font-display text-[10px] leading-relaxed ${
                log.type === 'success'
                  ? 'text-[oklch(0.72_0.19_155)]'
                  : log.type === 'warning'
                    ? 'text-[oklch(0.82_0.15_85)]'
                    : log.type === 'decision'
                      ? 'text-[oklch(0.82_0.15_85)] font-semibold'
                      : 'text-[oklch(0.6_0.02_260)]'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {task.status === 'paused' && (
        <div className="border-2 border-[oklch(0.82_0.15_85_/_0.45)] bg-[oklch(0.82_0.15_85_/_0.05)] p-3 space-y-2.5">
          <p className="font-pixel text-[7px] text-[oklch(0.82_0.15_85)]">
            🔀 CEO 决策点：{currentStep?.name}
          </p>
          <p className="font-display text-[10px] text-[oklch(0.62_0.02_260)] leading-relaxed">
            此步骤使用统一决策弹窗，支持步骤解说、影响对比和结果确认。
          </p>
          <button
            onClick={() => setShowDecisionModal(true)}
            className="w-full font-pixel text-[7px] py-2 border border-[oklch(0.82_0.15_85_/_0.7)] bg-[oklch(0.82_0.15_85_/_0.12)] text-[oklch(0.9_0.08_85)] hover:bg-[oklch(0.82_0.15_85_/_0.2)] transition-colors"
          >
            打开决策弹窗
          </button>
          <button
            onClick={() => {
              if (!selectedOption) return;
              resumeTask(task.id, { optionId: selectedOption.id });
            }}
            disabled={!selectedOption}
            className={`w-full font-pixel text-[8px] py-2.5 border-2 transition-all ${
              selectedOption
                ? 'bg-[oklch(0.82_0.15_85)] text-[oklch(0.12_0.02_260)] border-[oklch(0.88_0.16_85)] hover:brightness-110'
                : 'bg-[oklch(0.15_0.02_260)] text-[oklch(0.35_0.02_260)] border-[oklch(0.22_0.025_260)] cursor-not-allowed'
            }`}
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)' }}
          >
            ✅ 应用决策并继续
          </button>
        </div>
      )}

      {task.status === 'completed' && (
        <button
          onClick={handleViewReport}
          className="w-full font-pixel text-[8px] py-2.5 bg-[oklch(0.72_0.19_155)] text-white border-2 border-[oklch(0.8_0.2_155)] hover:brightness-110 transition-all"
        >
          📄 查看研究报告
        </button>
      )}

      <DecisionPointModal
        open={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        taskType={task.type}
        stepId={currentStep?.id}
        stepName={currentStep?.name}
        decisionOptions={decisionOptions}
        selectedDecisionId={selectedDecisionId}
        onSelectDecision={setSelectedDecisionId}
        onConfirm={() => {
          if (!selectedOption) return;
          resumeTask(task.id, { optionId: selectedOption.id });
          setShowDecisionModal(false);
        }}
      />
    </div>
  );
}

