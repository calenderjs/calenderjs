# RFC-0006: Documentation and Examples

**状态**: Draft  
**创建日期**: 2024-12-30  
**作者**: WSX Team  
**关联 RFC**: RFC-0001, RFC-0004

## 摘要

设计并实现 CalenderJS 的完整文档体系和示例项目，为开发者提供清晰的使用指南、API 参考和可运行的示例代码。

**目标**：
- 提供完整的 API 文档
- 提供详细的使用指南
- 提供 DSL 语法文档
- 提供多个示例项目（基础、高级、集成）

## 动机

### 为什么需要完整文档？

- **降低学习曲线**：新开发者可以快速上手
- **提高采用率**：清晰的文档是开源项目成功的关键
- **减少支持负担**：完善的文档可以减少重复问题
- **提升专业度**：专业文档体现项目质量

### 为什么需要示例项目？

- **快速上手**：开发者可以立即看到运行效果
- **最佳实践**：展示正确的使用方式
- **场景覆盖**：覆盖不同使用场景
- **代码参考**：提供可直接使用的代码

## 详细设计

### 1. 文档结构

```
docs/
├── README.md                    # 项目总览
├── getting-started/
│   ├── installation.md         # 安装指南
│   ├── quick-start.md          # 快速开始
│   └── basic-usage.md          # 基础使用
├── guides/
│   ├── calendar-component.md   # Calendar 组件指南
│   ├── event-dsl.md            # Event DSL 指南
│   ├── validation.md           # 验证规则指南
│   ├── rendering.md            # 渲染规则指南
│   ├── behavior.md             # 行为规则指南
│   └── advanced.md             # 高级用法
├── api/
│   ├── core/
│   │   ├── Event.md            # Event 接口
│   │   ├── User.md             # User 接口
│   │   └── EventType.md        # EventType 接口
│   ├── event-dsl/
│   │   ├── parser.md           # 解析器 API
│   │   ├── runtime.md          # 运行时 API
│   │   └── ast.md              # AST 类型
│   └── calendar/
│       ├── Calendar.md          # Calendar 组件 API
│       └── props.md             # 组件属性
├── dsl/
│   ├── syntax.md               # DSL 语法规范
│   ├── examples.md             # DSL 示例
│   └── reference.md            # DSL 参考手册
└── examples/
    ├── basic/                  # 基础示例
    ├── advanced/               # 高级示例
    └── integration/            # 集成示例
```

### 2. 文档内容

#### 2.1 入门文档

**installation.md**
- 安装方法（npm/pnpm/yarn）
- 依赖要求
- 版本兼容性
- 常见问题

**quick-start.md**
- 5 分钟快速开始
- 最小示例代码
- 运行第一个日历
- 下一步学习路径

**basic-usage.md**
- 基础组件使用
- 事件数据格式
- 视图切换
- 基本交互

#### 2.2 指南文档

**calendar-component.md**
- 组件概述
- 属性说明
- 事件处理
- 样式定制
- 性能优化

**event-dsl.md**
- DSL 概述
- 语法基础
- 类型定义
- 规则编写
- 最佳实践

**validation.md**
- 验证规则详解
- Between 规则
- Comparison 规则
- Conflict 规则
- When 规则
- 逻辑表达式

**rendering.md**
- 渲染规则详解
- 颜色配置
- 图标配置
- 标题模板
- 描述模板
- 条件渲染

**behavior.md**
- 行为规则详解
- 可拖拽配置
- 可调整大小配置
- 可编辑配置
- 可删除配置
- 权限控制

**advanced.md**
- 高级用法
- 自定义验证
- 自定义渲染
- 性能优化
- 扩展开发

#### 2.3 API 文档

**核心接口**
- Event 接口：字段说明、使用示例
- User 接口：字段说明、使用示例
- EventType 接口：字段说明、使用示例
- ValidationContext：上下文说明
- RenderContext：上下文说明

**Event DSL API**
- parseEventDSL：解析函数
- EventDSLRuntime：运行时类
- AST 类型：类型定义
- 错误处理：错误类型和处理

**Calendar 组件 API**
- Calendar 组件：组件说明
- CalendarProps：属性接口
- 事件回调：事件处理
- 方法：公共方法

#### 2.4 DSL 文档

**syntax.md**
- 完整语法规范
- 语法规则
- 关键字说明
- 操作符说明
- 示例代码

**examples.md**
- 会议类型示例
- 任务类型示例
- 节假日类型示例
- 生日类型示例
- 复杂场景示例

**reference.md**
- 语法参考表
- 类型参考表
- 规则参考表
- 操作符参考表
- 字段访问参考

### 3. 示例项目

#### 3.1 基础示例

**examples/basic/vanilla-js/**
- 纯 JavaScript 使用示例
- 最小化配置
- 基础事件显示
- 视图切换

**examples/basic/react/**
- React 使用示例
- 使用 @calenderjs/react
- 基础集成
- 状态管理

**examples/basic/vue/**
- Vue 使用示例
- Web Component 集成
- 基础集成

#### 3.2 高级示例

**examples/advanced/custom-validation/**
- 自定义验证规则
- 复杂验证逻辑
- 跨字段验证
- 时间冲突检测

**examples/advanced/custom-rendering/**
- 自定义渲染规则
- 条件渲染
- 模板字符串
- 动态样式

**examples/advanced/multi-type/**
- 多事件类型
- 类型切换
- 类型过滤
- 类型分组

**examples/advanced/permissions/**
- 权限控制
- 用户角色
- 行为规则
- 动态权限

#### 3.3 集成示例

**examples/integration/nextjs/**
- Next.js 集成
- Server Components
- API Routes
- 数据获取

**examples/integration/remix/**
- Remix 集成
- Loaders
- Actions
- 数据同步

**examples/integration/state-management/**
- Redux 集成
- Zustand 集成
- Jotai 集成
- 状态同步

### 4. 文档工具

#### 4.1 文档生成

- **工具选择**：VitePress / Docusaurus / TypeDoc
- **API 文档**：自动从 TypeScript 类型生成
- **示例代码**：可运行的代码块
- **搜索功能**：全文搜索
- **多语言支持**：中英文（可选）

#### 4.2 文档维护

- **版本管理**：文档版本与代码版本同步
- **更新流程**：代码变更时同步更新文档
- **审查流程**：文档审查机制
- **反馈机制**：文档反馈渠道

## 实施计划

### 阶段 1: 基础文档（3天）

**Day 1**：
- [ ] 项目 README
- [ ] 安装指南
- [ ] 快速开始

**Day 2**：
- [ ] Calendar 组件指南
- [ ] Event DSL 指南
- [ ] 基础 API 文档

**Day 3**：
- [ ] DSL 语法文档
- [ ] DSL 示例
- [ ] 基础示例项目

### 阶段 2: 完整文档（2天）

**Day 4**：
- [ ] 验证规则指南
- [ ] 渲染规则指南
- [ ] 行为规则指南
- [ ] 高级用法指南

**Day 5**：
- [ ] 完整 API 文档
- [ ] DSL 参考手册
- [ ] 高级示例项目

### 阶段 3: 示例项目（2天）

**Day 6**：
- [ ] 基础示例（Vanilla JS, React, Vue）
- [ ] 高级示例（自定义验证、渲染）

**Day 7**：
- [ ] 集成示例（Next.js, Remix, 状态管理）
- [ ] 文档网站部署

## 技术栈

### 文档工具
- **VitePress**：文档生成工具（推荐）
- **TypeDoc**：API 文档生成
- **Markdown**：文档格式
- **CodeSandbox**：在线示例（可选）

### 示例项目
- **React + Vite**：React 示例
- **Vue + Vite**：Vue 示例
- **Next.js**：Next.js 集成示例
- **Remix**：Remix 集成示例

## 质量标准

### 文档质量
- ✅ 所有 API 都有文档
- ✅ 所有示例代码可运行
- ✅ 文档结构清晰
- ✅ 语言简洁准确
- ✅ 包含常见问题解答

### 示例质量
- ✅ 所有示例可运行
- ✅ 代码注释完整
- ✅ 遵循最佳实践
- ✅ 覆盖主要场景

## 交付物

1. **文档网站**：完整的在线文档
2. **API 文档**：自动生成的 API 参考
3. **示例项目**：多个可运行的示例
4. **快速开始指南**：5 分钟上手教程
5. **DSL 参考手册**：完整的 DSL 语法参考

## 后续计划

- **多语言支持**：英文文档（可选）
- **视频教程**：视频演示（可选）
- **社区贡献**：社区文档贡献指南
- **文档分析**：文档使用情况分析
