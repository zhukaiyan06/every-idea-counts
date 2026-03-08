import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import App from "./App"
import { ThemeProvider } from "./design"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)