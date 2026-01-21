import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { syncDataAcrossTabs, detectDataCorruption, emergencyDataRecovery } from "./lib/data-integrity";

// Register service worker for PWA functionality and data protection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Initialize data protection
syncDataAcrossTabs();

// Check for data corruption on startup
if (detectDataCorruption()) {
  console.warn('Data corruption detected, attempting recovery...');
  const recoveredTasks = emergencyDataRecovery();
  if (recoveredTasks.length > 0) {
    localStorage.setItem('orderline-tasks', JSON.stringify(recoveredTasks));
    console.log('Data successfully recovered');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
