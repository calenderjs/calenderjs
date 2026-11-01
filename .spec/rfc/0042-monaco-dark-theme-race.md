# RFC 0042: Monaco 编辑器首次加载暗色主题不生效

**Status:** Approved

## Summary

Demo 首次打开时，日历本体正确跟随系统暗色模式，但左侧 DSL 编辑器（Monaco，`EventEditor` 组件）仍显示亮色；只有手动点击主题切换按钮后才变暗。根因在 `@monaco-editor/react` 4.7.0 的 `theme` 处理时序，不是 `isDarkMode`/`data-theme` 这条链路的问题（已确认日历首次加载即为暗色）。

## Problem

`packages/react-event-editor/src/EventEditor.tsx:126` 把 `theme={darkMode ? EVENT_DSL_THEME_DARK : EVENT_DSL_THEME_LIGHT}` 传给 `@monaco-editor/react` 的 `<Editor>`。读了该库 4.7.0 的产物（`node_modules/.pnpm/@monaco-editor+react@4.7.0.../dist/index.mjs`）确认：

- 组件内部用 `theme: E = "light"` 作为参数默认值。
- Editor 实例创建时（`editor.create(...)`）之后紧跟一次 `d.current.editor.setTheme(E)`——理论上创建时就该应用当前 `E`。
- 另有一个专门的 `useEffect`（源码里的 `l(()=>{d.current?.editor.setTheme(E)},[E],s)`）监听 `theme` prop 变化、调 `setTheme`——这个 effect 用的是"跳过首次执行"的 hook（`he(e,r,n=true)`，`n` 默认 `true` 即跳过首次），只在 `theme` 依赖后续变化时触发。
- Monaco 本身是通过 `@monaco-editor/loader` 异步加载的（`Ne.init()` 返回 Promise），`editor.create` 实际执行时机是 loader resolve 之后的某次渲染——如果这次渲染里闭包捕获到的 `theme` 落后于当前 `isDarkMode` 的最新值（React 多次重渲染 + 异步加载 resolve 时机交织），首次创建就会用错主题；之后唯一能补救的 `setTheme` effect 又因为"跳过首次"的机制不会在加载完成的这次渲染上触发用户期望的那次更新——实际表现就是：首次加载锁死在创建时捕获到的（错误的）主题，只有后续 `theme` prop 真正变化（点击按钮）才第一次真正调用 `setTheme`，把它纠正过来。
- 本仓库现有代码（`EventEditor.tsx`）没有在 `onMount` 回调里做任何主动同步主题的兜底——`handleMount` 只调用 `registerEventDSL`，不涉及 `setTheme`。

## Goals

- 首次挂载 DSL 编辑器时，主题必须和当前 `darkMode` prop 一致，不依赖"之后手动切换一次"才生效。
- 不改变 `@monaco-editor/react` 库本身（三方依赖，不碰）。
- 不改变 Calendar 本体的主题同步逻辑（已经工作正常，不在本 RFC 范围）。

## Non-goals

- 不升级/更换 `@monaco-editor/react` 版本（如果后续独立验证某个新版本修了这个时序问题，单开 RFC 评估）。
- 不改动 `App.tsx` 的 `isDarkMode`/`matchMedia` 逻辑（已验证日历本体链路正确，问题只在 Monaco 这一侧）。
- 不处理 Monaco 加载失败/超时等异常场景（超出本 RFC 的"主题时序"范围）。

## Design

关键决策：在 `EventEditor.tsx` 的 `handleMount` 回调里，**挂载完成后主动调用一次 `monaco.editor.setTheme(...)`**，不依赖 `<Editor theme={...}>` prop 在创建时刻的闭包时序。`onMount` 回调本身是 `@monaco-editor/react` 保证"editor 实例已真正创建完成"之后才触发的钩子，在这里强制同步一次主题，补掉"创建时捕获到的 theme 可能落后"的时间窗。

涉及文件：

- `packages/react-event-editor/src/EventEditor.tsx`：
  - `handleMount` 在 `registerEventDSL(monaco)` 之后，追加 `monaco.editor.setTheme(darkMode ? EVENT_DSL_THEME_DARK : EVENT_DSL_THEME_LIGHT)`——用当前渲染闭包里的 `darkMode`（`onMount` 触发时 React 已经是最新一次渲染，这个值可信）。
  - 不改 `<EditorComponent theme={...}>` 这一行本身（继续传，保留"后续 `darkMode` 变化时库自己的 `setTheme` effect 生效"这条现有正确路径），只是额外补一次挂载时刻的强制同步。

## Acceptance

- 系统/浏览器处于暗色模式时，刷新 demo 页面，DSL 编辑器首次渲染即为暗色主题（不需要点击按钮）。
- 系统/浏览器处于浅色模式时，刷新页面，编辑器首次渲染即为浅色主题。
- 点击主题切换按钮，编辑器主题仍能正确来回切换（不能因为新增的 `onMount` 兜底破坏现有切换路径）。
- 真实浏览器验证（遵循 RFC-0027 金科玉律）：在系统暗色模式下完整刷新一次页面，确认日历和编辑器同时为暗色，不依赖任何点击操作。
