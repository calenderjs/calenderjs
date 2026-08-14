# WSX 工作技能 - 参考

本文件指向项目内完整文档，供需要详细示例或完整测试模板时查阅。

## 文档索引

| 文档            | 路径                          | 何时查阅                                                                                                              |
| --------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Vue vs WSX 边界 | `docs/vue-vs-wsx-boundary.md` | 决策用 Vue 还是 WSX、包职责、架构图、完整 Vue 使用示例、禁止项列表                                                    |
| WSX 测试指南    | `docs/wsx-testing-guide.md`   | 完整 `waitForRender`/测试模板、各测试场景（初始化、属性、@state、事件、Shadow DOM、生命周期）、工具函数、完整测试示例 |
| WSX 测试总结    | `docs/wsx-testing-summary.md` | 常见测试问题、改进优先级、重构建议                                                                                    |

## 关键代码位置（项目内）

- WSX 核心组件：`packages/calendar/src/`（如 `Calendar.wsx`、`views/*.wsx`）
- 测试示例：`packages/calendar/src/views/__tests__/`（如 `DayViewReproduction.test.ts`、`WeekViewReproduction.test.ts`）

阅读上述文档时请以仓库根目录为基准使用相对路径（例如在技能中引用 `docs/...` 即指仓库根下 `docs/`）。
