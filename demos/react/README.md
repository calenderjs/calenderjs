# CalenderJS React Demo

CalenderJS React 组件演示网站，展示 DSL → Data Model → Event 验证 → Calendar 显示的完整流程。

## 运行方式

### 方式 1: 从根目录运行（推荐）

```bash
# 从项目根目录
pnpm dev react

# 或使用交互式菜单
pnpm dev
# 然后选择 "CalendarJS React Demo"
```

### 方式 2: 使用 pnpm filter

```bash
# 从项目根目录
pnpm --filter demos-react dev
```

### 方式 3: 从演示目录运行

```bash
# 进入演示目录
cd demos/react

# 安装依赖（如果需要）
pnpm install

# 启动开发服务器
pnpm dev
```

## 前置要求

### 1. 构建依赖包

**重要**：在运行演示之前，需要先构建所有依赖包。Next.js 配置使用构建后的 `dist` 目录，而不是源代码。

```bash
# 从项目根目录构建所有包
pnpm build

# 或只构建必要的包
pnpm build --filter @calenderjs/core
pnpm build --filter @calenderjs/event-model
pnpm build --filter @calenderjs/event-dsl
pnpm build --filter @calenderjs/event-runtime
pnpm build --filter @calenderjs/calendar
pnpm build --filter @calenderjs/react
```

### 2. 安装依赖

```bash
# 从项目根目录（推荐）
pnpm install

# 或从演示目录
cd demos/react
pnpm install
```

## 访问演示

启动后，访问：

- **主页**: http://localhost:3000
- **DSL 编辑器演示**: http://localhost:3000（主页已集成 DSL 编辑器）

## 演示功能

### 主页功能

1. **左侧面板 - DSL 编辑器**
   - 使用 Monaco Editor 编辑 Event DSL
   - 实时编译 DSL → Data Model
   - 显示编译错误或成功状态

2. **右侧面板 - Calendar 和验证**
   - 验证状态面板：显示每个事件的验证结果
   - Calendar 组件：显示验证和渲染后的事件
   - 支持月/周/日视图切换
   - 支持日期导航

### 完整流程

1. **DSL 编辑** → 在 Monaco Editor 中编辑 DSL 定义
2. **实时编译** → DSL 自动编译成 Data Model
3. **Event 验证** → 自动验证所有事件（基础结构 + 业务规则）
4. **Event 渲染** → 自动渲染事件（生成 color, icon）
5. **Calendar 显示** → Calendar 组件显示验证和渲染后的事件

## 技术栈

- **Next.js 14**: React 框架
- **Monaco Editor**: 代码编辑器（`@monaco-editor/react`）
- **@calenderjs/react**: React 包装器
- **@calenderjs/calendar**: Calendar Web Component
- **@calenderjs/event-dsl**: DSL 编译器和解析器
- **@calenderjs/event-runtime**: 运行时验证和渲染引擎
- **@calenderjs/event-model**: Event 数据模型和验证器

## 故障排除

### 1. 构建错误

如果遇到构建错误，请先构建所有依赖包：

```bash
pnpm build
```

### 2. 模块找不到错误

如果遇到 "Cannot find module" 错误，请确保：

1. 所有依赖包都已构建（`dist` 目录存在）
2. 从根目录运行 `pnpm install` 安装所有依赖
3. 检查 `next.config.js` 中的 webpack 配置

### 3. 类型错误

如果遇到类型错误，请确保：

1. 所有包都已正确构建
2. TypeScript 配置正确（`tsconfig.json`）
3. 依赖包的 `dist/index.d.ts` 文件存在

### 4. Monaco Editor 加载问题

如果 Monaco Editor 无法加载：

1. 确保 `@monaco-editor/react` 已安装
2. 检查浏览器控制台是否有错误
3. 尝试清除 `.next` 缓存：`rm -rf .next`

### 5. 端口占用

如果端口 3000 被占用：

```bash
# 使用其他端口
PORT=3001 pnpm dev
```

## 开发说明

### Next.js 配置

`next.config.js` 配置了：

- 使用构建后的 `dist` 目录（而不是源代码）
- 禁用 sourcemap loader（避免读取源代码错误）
- 忽略 `.wsx` 文件（这些在构建时处理）

### 包依赖

演示依赖以下 CalenderJS 包：

- `@calenderjs/core`: 核心工具函数
- `@calenderjs/react`: React 包装器
- `@calenderjs/calendar`: Calendar Web Component
- `@calenderjs/event-dsl`: DSL 编译器
- `@calenderjs/event-runtime`: 运行时引擎
- `@calenderjs/event-model`: Event 数据模型

所有包都使用 `workspace:*` 协议，从 monorepo 本地引用。

## 下一步

演示运行成功后，你可以：

1. 修改 DSL 定义，测试不同的验证规则
2. 修改显示规则，改变事件的颜色和图标
3. 添加更多事件，测试 Calendar 组件的显示效果
4. 测试不同的视图（月/周/日）
