import { Suspense, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppToaster } from "@/components/shared/AppToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { AppRoutes } from "./routes";
import { useAuthStore } from "./store/authStore";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  // Initialize auth state from localStorage on app load
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <DarkModeProvider>
      <AppToaster />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <TooltipProvider delayDuration={300} skipDelayDuration={400}>
            <AppRoutes />
          </TooltipProvider>
        </Suspense>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;
