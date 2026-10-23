import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/src/App";
import "@/src/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No se encontró el contenedor principal #root.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
