import { initI18n } from "@wsxjs/wsx-i18next";

export const i18n = initI18n({
  fallbackLng: "zh",
  debug: false,
  backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
  ns: ["home", "common", "footer", "features"],
  defaultNS: "common",
});

export { i18nInstance } from "@wsxjs/wsx-i18next";
