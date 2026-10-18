import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeDatabase } from "./services/db/database.ts";

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("The application root element was not found.");
  }

  try {
    await initializeDatabase();

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error: unknown) {
    console.error("Failed to initialize quiz storage:", error);
    rootElement.setAttribute("role", "alert");
    rootElement.textContent =
      "Quiz storage could not be opened. Please allow browser storage and reload the page.";
  }
}

bootstrap();
