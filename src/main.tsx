import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Применяем сохранённую тему до рендера чтобы не было мигания
const savedTheme = localStorage.getItem("tezdavo-theme");
if (savedTheme) {
  try {
    const { state } = JSON.parse(savedTheme);
    if (state?.isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch {}
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
