# pnpm + Nx Monorepo 设置指南

本文档说明如何在 CalenderJS 项目中使用 pnpm 和 Nx 进行 monorepo 管理。

## 项目结构

```
calenderjs/
├── packages/              # 共享包
│   ├── core/  # 核心组件库
│   ├── dsl/   # DSL 支持
│   └── ntegrations/  # 第三方集成
├── apps/                 # 应用
│   └── calendar-service/ # Next.js 服务
├── pnpm-workspace.yaml   # pnpm 工作区配置
├── nx.json              # Nx 配置
└── package.json         # 根 package.json
```

## 配置文件说明

### pnpm-workspace.yaml

定义 pnpm 工作区，指定哪些目录包含包：

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### .npmrc

pnpm 配置，包括：
- `shamefully-hoist=true`: 提升所有依赖到根 node_modules（兼容某些工具）
- `strict-peer-dependencies=false`: 不严格检查 peer dependencies
- `auto-install-peers=true`: 自动安装 peer dependencies

### nx.json

Nx 配置文件，定义：
- 任务默认配置（build, dev, test, lint）
- 缓存策略
- 插件配置（Vite, Next.js）
- 依赖图分析

## 常用命令

### 安装依赖

```bash
# 安装所有依赖
pnpm install

# 为特定包安装依赖
pnpm --filter @calenderjs/core add <package>
```

### 运行任务

```bash
# 使用 pnpm 运行所有包的 dev 任务
pnpm dev

# 使用 pnpm 运行特定包的 dev 任务
pnpm --filter @calenderjs/core dev

# 使用 nx 运行任务
nx dev @calenderjs/core
nx build calendar-service

# 并行运行多个任务
nx run-many --target=build --projects=@calenderjs/core,@calenderjs/dsl --parallel
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
nx build @calenderjs/core

# 只构建受影响的项目
nx affected:build
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
nx test @calenderjs/core

# 只测试受影响的项目
nx affected:test
```

### 查看依赖图

```bash
# 启动 Nx 依赖图可视化工具
nx graph
```

## 包配置示例

### 组件库包 (packages/calenderjs-core/package.json)

```json
{
  "name": "@calenderjs/core",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "@calenderjs/dsl": "workspace:*"
  },
  "peerDependencies": {
    "@wsxjs/wsx-core": "^0.0.1"
  }
}
```

### Next.js 应用 (apps/calendar-service/package.json)

```json
{
  "name": "calendar-service",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@calenderjs/core": "workspace:*",
    "@calenderjs/dsl": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.0.0"
  }
}
```

### Nx 项目配置 (project.json)

每个包可以有自己的 `project.json` 文件来配置 Nx 任务：

```json
{
  "name": "@calenderjs/core",
  "sourceRoot": "packages/calenderjs-core/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/calenderjs-core"
      }
    },
    "dev": {
      "executor": "@nx/vite:build",
      "options": {
        "watch": true
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["packages/calenderjs-core/**/*.{ts,tsx}"]
      }
    }
  },
  "tags": ["scope:core", "type:library"]
}
```

## 工作区协议

使用 `workspace:*` 协议来引用工作区内的包：

```json
{
  "dependencies": {
    "@calenderjs/core": "workspace:*",
    "@calenderjs/dsl": "workspace:*"
  }
}
```

这确保：
- 开发时使用本地版本
- 构建时自动解析到正确的路径
- 发布时自动替换为发布版本号

## 缓存和性能

Nx 提供强大的缓存功能：

- **任务缓存**: 如果输入未改变，直接使用缓存结果
- **计算缓存**: 缓存依赖图计算
- **远程缓存**: 团队共享缓存（需要配置）

查看缓存状态：

```bash
nx show projects
nx show project @calenderjs/core --web
```

## 最佳实践

1. **使用 workspace 协议**: 工作区内包引用使用 `workspace:*`
2. **标签管理**: 使用 tags 组织项目（如 `scope:core`, `type:library`）
3. **依赖图**: 定期运行 `nx graph` 检查依赖关系
4. **受影响命令**: 使用 `nx affected:*` 只处理变更的项目
5. **并行执行**: 使用 `--parallel` 标志并行运行任务

## 故障排除

### 依赖问题

```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 缓存问题

```bash
# 重置 Nx 缓存
nx reset

# 清理特定项目的缓存
nx reset @calenderjs/core
```

### 工作区链接问题

```bash
# 检查工作区链接
pnpm list --depth=0

# 重新链接工作区
pnpm install --force
```

## 参考资源

- [pnpm 文档](https://pnpm.io/)
- [Nx 文档](https://nx.dev/)
- [Nx + pnpm 指南](https://nx.dev/nx-api/nx/documents/package-manager-support)
