import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { errorLogger } from "./services/errorLogger";
import "./index.css";

// Initialize global error logging
errorLogger.setupGlobalErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
