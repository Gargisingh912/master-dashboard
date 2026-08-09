import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { KitchenProvider } from "./context/KitchenContext.tsx";
import { SalonProvider } from "./context/SalonContext.tsx";
import { AcademyProvider } from "./context/AcademyContext.tsx";
import { OrderDraftProvider } from "./context/OrderDraftContext.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <KitchenProvider>
          <SalonProvider>
            <AcademyProvider>
              <OrderDraftProvider>
                <AppWrapper>
                  <App />
                </AppWrapper>
              </OrderDraftProvider>
            </AcademyProvider>
          </SalonProvider>
        </KitchenProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
