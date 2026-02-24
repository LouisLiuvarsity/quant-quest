import { useGame, type ResearchReport, type ResearchTask } from '@/contexts/GameContext';
import { useEffect, useMemo, useState } from 'react';

function findTaskByReport(report: ResearchReport | undefined, tasks: ResearchTask[]): ResearchTask | undefined {
  if (!report) return undefined;
  return tasks.find(task => task.id === report.taskId);
}

export function AuditReplayPanel() {
  const { state, selectedReport, setSelectedReport, setActivePanel } = useGame();
  const reports = state.reports;
  const [selectedReportId, setSelectedReportId] = useState<string>(selectedReport?.id || reports[0]?.id || '');

  useEffect(() => {
    if (selectedReport?.id) {
      setSelectedReportId(selectedReport.id);
    } else if (!selectedReportId && reports[0]) {
      setSelectedReportId(reports[0].id);
    }
  }, [selectedReport?.id, selectedReportId, reports]);

  const report = useMemo(
    () => reports.find(item => item.id === selectedReportId) || reports[0],
    [reports, selectedReportId],
  );
  const task = useMemo(
    () => findTaskByReport(report, state.activeTasks),
    [report, state.activeTasks],
  );
  const linkedThesis = useMemo(
    () => report
      ? state.theses.find(item => item.linkedTaskId === report.taskId || item.runId === report.runId)
      : undefined,
    [report, state.theses],
  );
  const factorCard = report?.factorCardId ? state.factorCards.find(item => item.id === report.factorCardId) : undefined;
  const portfolioCard = report?.portfolioCardId ? state.portfolioCards.find(item => item.id === report.portfolioCardId) : undefined;
  const evidence = factorCard?.evidence || portfolioCard?.evidence;

  if (!reports.length) {
    return (
      <div className="p-4">
        <div className="border-2 border-[oklch(0.26_0.03_260)] bg-[oklch(0.11_0.016_260)] p-4 text-center">
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">🧾 审计回放</p>
          <p className="font-display text-[11px] text-[oklch(0.58_0.02_260)] mt-2 leading-relaxed">
            暂无可回放的研究报告，先完成一条研究任务。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="border-2 border-[oklch(0.26_0.03_260)] bg-[oklch(0.11_0.016_260)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-pixel text-[8px] text-[oklch(0.82_0.15_85)]">🧾 审计回放</p>
          <span className="font-mono-data text-[10px] text-[oklch(0.75_0.12_200)]">{reports.length} RUNS</span>
        </div>
        <select
          value={report?.id || ''}
          onChange={(e) => {
            const nextReport = reports.find(item => item.id === e.target.value);
            setSelectedReportId(e.target.value);
            if (nextReport) setSelectedReport(nextReport);
          }}
          className="w-full bg-[oklch(0.1_0.015_260)] border border-[oklch(0.24_0.03_260)] text-[oklch(0.85_0.01_260)] font-display text-[11px] px-2 py-2 focus:outline-none focus:border-[oklch(0.75_0.12_200)]"
        >
          {reports.map(item => (
            <option key={item.id} value={item.id}>
              {item.runId} · {item.title}
            </option>
          ))}
        </select>
      </div>

      {report ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2">
              <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">run_id</p>
              <p className="font-mono-data text-[10px] text-[oklch(0.75_0.12_200)] mt-1 break-all">{report.runId}</p>
            </div>
            <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2">
              <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">任务类型</p>
              <p className="font-display text-[10px] text-[oklch(0.82_0.15_85)] mt-1">{report.type === 'single_factor' ? '单因子' : '多因子'}</p>
            </div>
            <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2">
              <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">guard_log</p>
              <p className="font-mono-data text-[10px] text-[oklch(0.82_0.15_85)] mt-1">{report.guardLog.length}</p>
            </div>
            <div className="border border-[oklch(0.22_0.025_260)] bg-[oklch(0.12_0.02_260)] p-2">
              <p className="font-pixel text-[5px] text-[oklch(0.45_0.02_260)]">决策次数</p>
              <p className="font-mono-data text-[10px] text-[oklch(0.72_0.19_155)] mt-1">{task?.decisionHistory.length || 0}</p>
            </div>
          </div>

          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.016_260)] p-2.5">
            <p className="font-pixel text-[6px] text-[oklch(0.75_0.12_200)]">审计概览</p>
            <div className="mt-1.5 space-y-1 text-[10px]">
              <p className="font-display text-[oklch(0.76_0.02_260)]">报告：{report.title}</p>
              <p className="font-display text-[oklch(0.58_0.02_260)]">研究员：{report.researcherName} · 创建时间：{report.createdAt}</p>
              {linkedThesis ? (
                <p className="font-display text-[oklch(0.58_0.02_260)]">
                  关联命题：{linkedThesis.title}（{linkedThesis.status}）
                </p>
              ) : null}
              {evidence ? (
                <p className="font-mono-data text-[oklch(0.58_0.02_260)] break-all">
                  repro_id: {evidence.reproducibilityId}
                </p>
              ) : null}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setSelectedReport(report);
                  setActivePanel('report-viewer');
                }}
                className="font-pixel text-[6px] px-2 py-1.5 border border-[oklch(0.75_0.12_200_/_0.55)] text-[oklch(0.75_0.12_200)] bg-[oklch(0.75_0.12_200_/_0.08)]"
              >
                打开报告详情
              </button>
              {linkedThesis ? (
                <button
                  onClick={() => setActivePanel('learning-cards')}
                  className="font-pixel text-[6px] px-2 py-1.5 border border-[oklch(0.72_0.19_155_/_0.55)] text-[oklch(0.72_0.19_155)] bg-[oklch(0.72_0.19_155_/_0.08)]"
                >
                  跳转学习卡
                </button>
              ) : null}
            </div>
          </div>

          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.016_260)] p-2.5">
            <p className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">Guard Log</p>
            <div className="mt-1.5 space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
              {report.guardLog.length > 0 ? report.guardLog.map((item, index) => (
                <p key={`${item}-${index}`} className="font-mono-data text-[10px] text-[oklch(0.7_0.02_260)] break-all">
                  {index + 1}. {item}
                </p>
              )) : (
                <p className="font-display text-[10px] text-[oklch(0.5_0.02_260)]">无 guard 记录</p>
              )}
            </div>
          </div>

          {task?.decisionHistory.length ? (
            <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.016_260)] p-2.5">
              <p className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">决策时间线</p>
              <div className="mt-1.5 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {task.decisionHistory.map((item, index) => (
                  <div key={`${item.stepId}-${index}`} className="border border-[oklch(0.2_0.02_260)] bg-[oklch(0.1_0.015_260)] px-2 py-1.5">
                    <p className="font-display text-[10px] text-[oklch(0.82_0.02_260)]">{item.stepId} · {item.optionLabel}</p>
                    <p className="font-display text-[9px] text-[oklch(0.58_0.02_260)] mt-0.5">{item.summary}</p>
                    <p className="font-mono-data text-[8px] text-[oklch(0.45_0.02_260)] mt-0.5">{item.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.016_260)] p-2.5">
            <p className="font-pixel text-[6px] text-[oklch(0.75_0.12_200)]">步骤回放</p>
            <div className="mt-1.5 space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
              {report.stepResults.map((item, index) => (
                <div key={`${item.stepId}-${index}`} className="flex items-center gap-2 border-b border-[oklch(0.18_0.02_260)] pb-1">
                  <span className="font-pixel text-[6px] text-[oklch(0.75_0.12_200)] w-7">{item.stepId}</span>
                  <span className="font-display text-[10px] text-[oklch(0.76_0.02_260)] flex-1">{item.stepName}</span>
                  <span className="font-pixel text-[5px] text-[oklch(0.72_0.19_155)]">{item.status === 'completed' ? '✓' : '-'}</span>
                </div>
              ))}
            </div>
          </div>

          {task?.logs.length ? (
            <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.016_260)] p-2.5">
              <p className="font-pixel text-[6px] text-[oklch(0.82_0.15_85)]">执行日志</p>
              <div className="mt-1.5 space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar">
                {task.logs.map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className="flex items-start gap-1.5">
                    <span className="font-mono-data text-[8px] text-[oklch(0.42_0.02_260)] shrink-0">{log.timestamp}</span>
                    <span className={`font-display text-[9px] ${
                      log.type === 'warning'
                        ? 'text-[oklch(0.82_0.15_85)]'
                        : log.type === 'success'
                          ? 'text-[oklch(0.72_0.19_155)]'
                          : log.type === 'decision'
                            ? 'text-[oklch(0.75_0.12_200)]'
                            : 'text-[oklch(0.68_0.02_260)]'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {evidence ? (
            <div className="border border-[oklch(0.24_0.03_260)] bg-[oklch(0.11_0.016_260)] p-2.5">
              <p className="font-pixel text-[6px] text-[oklch(0.72_0.19_155)]">证据快照参数</p>
              <div className="mt-1.5 space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                {Object.entries(evidence.keyParams).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2 border-b border-[oklch(0.18_0.02_260)] pb-1">
                    <span className="font-mono-data text-[9px] text-[oklch(0.52_0.02_260)]">{key}</span>
                    <span className="font-mono-data text-[9px] text-[oklch(0.78_0.02_260)] break-all text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
