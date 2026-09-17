/// <reference types="vite/client" />

declare module "*.png" {
  const source: string;
  export default source;
}

declare const __ODINS_MOBILE_BUILD__: boolean;
