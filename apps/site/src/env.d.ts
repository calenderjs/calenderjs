/// <reference types="vite/client" />

declare module "*.wsx" {
  const content: unknown;
  export default content;
}

declare module "*.css?inline" {
  const content: string;
  export default content;
}
