import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// DSL 使用通用编辑器 worker；所有资源与 demo 一起构建，不依赖 CDN。
self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });
// 暴露真实 Monaco API，供 e2e 通过 model.setValue 驱动编辑器（非替身）。
(globalThis as typeof globalThis & { monaco: typeof monaco }).monaco = monaco;
