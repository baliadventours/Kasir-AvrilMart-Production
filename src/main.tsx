
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App.tsx";
import "./styles/index.css";

// Immediate service worker registration for reliable offline PWA support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("PWA: New content available, reload to update.");
  },
  onOfflineReady() {
    console.log("PWA: Content cached and ready for offline use.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
  