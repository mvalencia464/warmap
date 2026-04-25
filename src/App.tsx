import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SignIn } from "@clerk/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { HelpProvider } from "./HelpContext";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { HelpModal } from "./components/HelpModal";
import { YearDashboard } from "./components/YearDashboard";
import { MonthView } from "./components/MonthView";
import { VisionBoard } from "./components/VisionBoard";
import { InspirationPage } from "./components/InspirationPage";

function App() {
  return (
    <HelpProvider>
      <AuthLoading>
        <div className="flex min-h-svh items-center justify-center bg-stone-50 text-stone-600 dark:bg-stone-950 dark:text-stone-400">
          <p className="text-sm">Loading…</p>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-stone-50 p-6 text-stone-800 dark:bg-stone-950 dark:text-stone-200">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">War map</h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Sign in to open your plan and tasks.
            </p>
          </div>
          <SignIn />
        </div>
      </Unauthenticated>
      <Authenticated>
        <BrowserRouter>
          <GlobalShortcuts />
          <HelpModal />
          <Routes>
            <Route path="/" element={<YearDashboard />} />
            <Route path="/:year/:month" element={<MonthView />} />
            <Route path="/inspiration" element={<InspirationPage />} />
          </Routes>
          <VisionBoard />
        </BrowserRouter>
      </Authenticated>
    </HelpProvider>
  );
}

export default App;
