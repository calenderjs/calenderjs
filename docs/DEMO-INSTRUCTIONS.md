# DSL → Calendar 演示运行说明

## 快速开始

### 方式 1: 从根目录运行（推荐）

```bash
# 从项目根目录
pnpm dev react
```

### 方式 2: 从 demos/react 目录运行

```bash
# 进入演示目录
cd demos/react

# 安装依赖（如果需要）
pnpm install

# 启动开发服务器
pnpm dev
```

## 访问演示

启动后，访问以下 URL：

- **主页**: http://localhost:3000
- **DSL → Calendar 完整流程演示**: http://localhost:3000/dsl-demo

## 演示内容

### DSL → Calendar 完整流程演示 (`/dsl-demo`)

这个演示展示了完整的端到端流程：

1. **DSL AST 定义**
   - 定义了 `meeting` 和 `appointment` 两种事件类型
   - 包含字段定义、验证规则、显示规则和行为规则

2. **编译 DSL AST → Data Model**
   - 使用 `EventDSLCompiler` 编译成 `EventTypeDataModel`
   - 生成 JSON Schema 用于验证 `Event.extra`
   - 生成业务规则用于运行时验证

3. **创建 Event 对象**
   - 创建符合 `Event` 接口的事件对象
   - 包含 `id`, `type`, `title`, `startTime`, `endTime`, `extra` 等字段

4. **验证 Event**
   - 使用 `EventValidator` 验证基础结构
   - 使用生成的 JSON Schema 验证 `Event.extra`
   - 使用 `EventRuntime` 验证业务规则（如 `attendees.count between 1 and 50`）

5. **渲染 Event**
   - 使用 `EventRuntime` 生成显示数据（`color`, `icon`）
   - 组合 `Event` + `RenderedEvent` 用于 Calendar 组件

6. **Calendar 组件显示**
   - 将验证和渲染后的事件传递给 Calendar 组件
   - Calendar 组件显示事件，使用渲染后的颜色和图标

## 演示页面功能

- ✅ 实时显示验证状态（每个事件的验证结果）
- ✅ Calendar 组件显示验证和渲染后的事件
- ✅ 支持月/周/日视图切换
- ✅ 支持日期导航
- ✅ 点击事件查看详情

## 技术栈

- **Next.js 14**: React 框架
- **@calenderjs/react**: React 包装器
- **@calenderjs/calendar**: Calendar Web Component
- **@calenderjs/event-dsl**: DSL 编译器
- **@calenderjs/event-runtime**: 运行时验证和渲染引擎
- **@calenderjs/event-model**: Event 数据模型和验证器

## 故障排除

### 构建错误

如果遇到构建错误，请先构建所有依赖包：

```bash
# 从根目录构建所有包
pnpm build
```

### 类型错误

如果遇到类型错误，请确保所有包都已正确构建：

```bash
# 构建核心包
pnpm build --filter @calenderjs/core
pnpm build --filter @calenderjs/event-model
pnpm build --filter @calenderjs/event-dsl
pnpm build --filter @calenderjs/event-runtime
pnpm build --filter @calenderjs/calendar
```

### 依赖问题

如果遇到依赖问题，请重新安装：

```bash
# 从根目录
pnpm install

# 或从演示目录
cd demos/react
pnpm install
```

## 下一步

演示运行成功后，你可以：

1. 修改 DSL AST 定义，添加新的事件类型
2. 修改验证规则，测试不同的业务逻辑
3. 修改显示规则，改变事件的颜色和图标
4. 添加更多事件，测试 Calendar 组件的显示效果
