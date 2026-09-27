/// <reference types="vite/client" />

import type * as Monaco from "monaco-editor";

declare global {
  // demo monaco.ts 暴露的真实 Monaco API（e2e 经 model.setValue 写入）
  var monaco: typeof Monaco | undefined;
}

export {};
