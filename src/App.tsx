import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SignIn } from "@clerk/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { HelpProvider } from "./HelpContext";
import { GlobalShortcuts } from "./components/GlobalShortcuts";
import { YearDashboard } from "./components/YearDashboard";
import { MonthView } from "./components/MonthView";

const HelpModal = lazy(() => import("./components/HelpModal").then((m) => ({ default: m.HelpModal })));
const VisionBoard = lazy(() => import("./components/VisionBoard").then((m) => ({ default: m.VisionBoard })));
const InspirationPage = lazy(() => import("./components/InspirationPage").then((m) => ({ default: m.InspirationPage })));
const AnalyticsPage = lazy(() => import("./components/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));

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
          <Suspense
            fallback={(
              <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-stone-500 dark:text-stone-400">
                Loading...
              </div>
            )}
          >
            <HelpModal />
            <Routes>
              <Route path="/" element={<YearDashboard />} />
              <Route path="/:year/:month" element={<MonthView />} />
              <Route path="/inspiration" element={<InspirationPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
            <VisionBoard />
          </Suspense>
        </BrowserRouter>
      </Authenticated>
    </HelpProvider>
  );
}

export default App;
