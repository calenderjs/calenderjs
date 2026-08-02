/**
 * CalenderJS Site - 入口
 * WSX 应用，挂载根组件到 DOM
 */
import "uno.css";
import "./main.css";
import "@wsxjs/wsx-base-components";
import "@wsxjs/wsx-router";
import "./i18n";
import "./App.wsx";

function initTheme() {
  const saved = localStorage.getItem("calenderjs-theme") || "dark";
  const theme = saved === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);
}

function initApp() {
  initTheme();
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = "<calenderjs-app></calenderjs-app>";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
