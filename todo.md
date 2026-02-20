# QuantQuest Refactoring Todo

## Phase 1: GameContext Refactor
- [ ] Remove day/turn system (NEXT DAY button, day counter, daily salary)
- [ ] Replace fixed salary with token-based cost per research task
- [ ] Add Factor Library data structure (discovered factors collection)
- [ ] Add Report Library data structure (research reports collection)
- [ ] Add real-time research task tracking with progress simulation

## Phase 2: Researcher System
- [ ] Remove level/ability differences from researchers
- [ ] Make researchers skin-only (avatar, name) + user-assigned role
- [ ] User assigns division of labor (因子挖掘/策略回测/优化)

## Phase 3: Research Task Flow
- [ ] Factor mining task: NL factor description, K-line period, backtest range
- [ ] Strategy backtest task: select factors, configure parameters
- [ ] Optimization task: combo optimization or parameter optimization
- [ ] Real-time progress simulation with status updates

## Phase 4: Research Report
- [ ] Report viewer with equity curve chart (recharts)
- [ ] Key metrics display (Sharpe, MaxDD, Annual Return, etc.)
- [ ] Text analysis section
- [ ] Factor performance visualization

## Phase 5: Libraries
- [ ] Factor Library panel with search/filter
- [ ] Report Library panel with history browsing

## Phase 6: UI Updates
- [ ] Remove NEXT DAY from TopHUD, show token balance
- [ ] Update BottomToolbar with new panels (因子库, 报告库)
- [ ] Update OfficeScene for new researcher mechanics
- [ ] Update IntroScreen rules text

## Phase 7: Testing & Delivery
- [ ] Full flow test
- [ ] Save checkpoint and deliver
