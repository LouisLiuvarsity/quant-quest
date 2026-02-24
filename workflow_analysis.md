# Workflow Analysis（V3 命题驱动版）

## 1. 核心结论

V2 解决了“能玩懂”，但没完全解决“想一直玩”。
关键原因：玩家还在执行流程，不在经营研究决策。

V3 核心机制：
- 以 `命题（Thesis）` 为单位推进研究。
- 以 `预算/时间/OOS审判权` 为稀缺资源制造取舍。
- 以 `证据链` 而非单一收益作为裁决依据。

一句话：
- 从“流程游戏”升级为“研究经营游戏”。

---

## 2. V3 设计北极星

1. 新手 10 分钟首通，能清楚回答“我在做什么”。
2. 稍专业用户可以用数据和证据做判断，不觉得黑箱。
3. 高阶用户能通过策略取舍拉开水平差距。
4. 全程保持研究纪律：口径一致、不可回头、可审计复现。

---

## 3. 宏观玩法结构（三层循环）

### A. 季度循环（经营层）
- 输入：季度目标（增益/稳健/回撤控制）
- 输出：团队评分与排名变化
- 作用：给玩家长期方向，避免只刷短期收益

### B. 周循环（研究层）
- 输入：预算、研究员工时、候选命题
- 动作：立项、排实验、提交裁决
- 输出：通过资产、失败资产、资源变化

### C. 事件循环（扰动层）
- 随机事件：行情切换、流动性恶化、执行成本上升、研究员离岗
- 作用：打破固定最优策略，提升可重玩性

---

## 4. 核心资源系统（决定“好不好玩”）

1. `Token Budget`：实验成本约束。
2. `Research Capacity`：研究员并发/时段约束。
3. `OOS Tickets`：终审次数约束（最关键稀缺资源）。
4. `Trust Score`：审计完整性与稳健性得分，影响高阶内容解锁。

设计要点：
- 任何高收益捷径都必须付出相应风险或信任代价。
- “高分”不是只看收益，而是收益+稳健+可信共同决定。

---

## 5. 命题系统（前台主玩法）

每个命题统一结构：
- `hypothesis`：假设文本
- `goal`：目标函数（return/drawdown/robustness）
- `plan`：实验计划
- `evidence`：证据树
- `verdict`：裁决结果

结果分叉：
- `passed`：形成可复用资产
- `failed`：形成失败模式资产（不是白跑）
- `parked`：资源不足时暂缓

---

## 6. 单因子与多因子在 V3 的关系

### 单因子
- 目标：验证局部信号命题
- 产物：`Reusable Factor Card` / `Failure Pattern Card`
- 不消费 OOS

### 多因子
- 目标：验证组合命题是否值得上线
- 产物：`OOS Verdict Card`
- 消费 OOS Ticket（一次性，不可回头）

---

## 7. 渐进披露（同一结果三层显示）

1. 玩家层：目标、结论、下一步。
2. 专业层：关键指标、权重/参数、失败拆解。
3. 审计层：`run_id/repro_id/guard_log/data_segment` 全链路。

硬约束：
- 三层必须共享同一结果数据源。
- 禁止出现“视图切换后结论变化”。

---

## 8. 反作弊与研究纪律

1. 全局配置锁：项目口径一处设定，全局继承。
2. OOS 一次性：同 `blend_plan_key` 不得重复终审。
3. 决策留痕：关键裁决必须可回放。
4. 证据优先：上线资格必须由证据门槛判定，不可手动绕过。

---

## 9. 代码迁移蓝图（从当前代码平滑升级）

## 9.1 当前代码现状（截至 2026-02-24）

已落地：
- 已完成 `GameContext` 与 `ResearchPanel` 拆分。
- 已引入 `Thesis` 与 `ResourceState`，支持命题池、预算、OOS Ticket、信任分。
- 已接入基础命题状态机：`draft -> planned -> running/oos_locked -> needs_review -> verdict`。
- 已把 OOS 一次性消费与 `blend_plan_key` 锁定接入多因子执行链路。

待继续：
- 事件系统（行情扰动、人员波动、成本冲击）尚未接入。
- 季度目标与经营反馈环尚未接入。
- 失败资产模板化复用（Failure Pattern Library）仍需独立面板与推荐器。

## 9.2 目标架构

建议新增目录：
- `client/src/game/domain/`：实体与状态机
- `client/src/game/engine/`：仿真、裁决、守卫
- `client/src/game/ui/`：命题面板、证据树、裁决台
- `client/src/game/progression/`：引导与解锁

建议核心模块：
1. `thesisSchema.ts`
2. `thesisStateMachine.ts`
3. `resourceEconomy.ts`
4. `verdictEngine.ts`
5. `eventSystem.ts`
6. `quarterGoalEngine.ts`

## 9.3 数据结构升级（最小必要）

新增：
- `Thesis`
  - `id, type(single|portfolio), status, hypothesis, goal, plan, evidence, verdict`
- `EvidenceNode`
  - `id, side(support|oppose|unknown), metricSnapshot, confidence, sourceRunId`
- `ResourceState`
  - `budget, capacity, oosTickets, trustScore`
- `QuarterObjective`
  - `targetMix(return, drawdown, robustness, trust)`

保留并复用：
- `FactorCard`, `PortfolioCard`, `ResearchReport`
- `run_id`, `repro_id`, `guard_log`, `oos_registry`

## 9.4 状态机落地顺序

第一阶段状态机：
- `draft -> planned -> running -> needs_review -> passed/failed/parked`

第二阶段状态机：
- 多因子加入 `oos_locked -> oos_running -> adopted/hold/rejected`

## 9.5 UI 信息架构改造

首页主区从“任务列表”改为：
1. `本周命题看板`
2. `资源条（预算/容量/OOS票/信任分）`
3. `下一步推荐动作`

研究面板改为三栏：
- 左：命题池
- 中：证据树
- 右：裁决与下一步动作

## 9.6 实施阶段（可执行）

### Phase 0（1-2天）
- 文档与字段冻结
- 建立 `Thesis` 与 `ResourceState` 类型
- 验收：类型编译通过

### Phase 1（3-5天）
- 接入单因子命题循环
- 保留原步骤引擎作为后台执行器
- 验收：可完成 `draft -> passed/failed`

### Phase 2（3-5天）
- 接入多因子审判循环与 OOS Ticket
- 实现 `blend_plan_key` 冻结
- 验收：同方案无法重复 OOS

### Phase 3（2-4天）
- 事件系统与季度目标
- 影响预算、风险、信任分
- 验收：不同事件下策略选择有显著差异

当前实现进度（2026-02-24）：
- 已完成季度目标与日推进循环（Qx Day y/z）。
- 已接入市场事件（成本/预算/信任/收益偏置）并支持持续天数。
- 已完成季度结算与奖励惩罚（预算、信任、OOS Ticket、积分）。

### Phase 4（2-3天）
- 新手引导脚本与学习卡
- 审计回放页面
- 验收：10分钟首通+审计链闭环

---

## 10. 成功指标（上线后必须监控）

1. 新手首局完成率（10分钟内） >= 70%
2. 次日留存（D1）提升 >= 20%
3. 平均每局有效决策次数 >= 6（不是纯等待）
4. 审计视图使用率 >= 15%（专业信任信号）
5. 失败资产复用率 >= 30%（反挫败有效性）

---

## 11. 一句话总结

V3 的本质不是再加功能，而是重新定义玩家角色：
- 玩家不是流程执行者，
- 玩家是研究负责人。

只要这个角色转换完成，游戏就会同时满足：
- 新手能玩明白，
- 进阶用户愿意深挖，
- 专业用户愿意相信。
