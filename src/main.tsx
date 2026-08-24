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
import { SportsClubProvider } from "./context/SportsClubContext.tsx";
import { WellnessProvider } from "./context/WellnessContext.tsx";
import { VenueBookingProvider } from "./context/VenueBookingContext.tsx";
import ErrorBoundary from "./components/common/ErrorBoundary.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <KitchenProvider>
          <SalonProvider>
            <AcademyProvider>
              <OrderDraftProvider>
                <SportsClubProvider>
                  <WellnessProvider>
                    <VenueBookingProvider>
                      <AppWrapper>
                        <App />
                      </AppWrapper>
                    </VenueBookingProvider>
                  </WellnessProvider>
                </SportsClubProvider>
              </OrderDraftProvider>
            </AcademyProvider>
          </SalonProvider>
        </KitchenProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
