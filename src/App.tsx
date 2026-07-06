import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store-context";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { DashboardLayout } from "@/layout/DashboardLayout";

// Route-level code splitting: the landing page (public, first paint for
// most visitors) never needs the dashboard's SCM/CRM bundles and vice versa.
const LandingPage = lazy(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const ScmPage = lazy(() => import("@/pages/ScmPage").then((m) => ({ default: m.ScmPage })));
const CrmPage = lazy(() => import("@/pages/CrmPage").then((m) => ({ default: m.CrmPage })));

function RouteFallback() {
  return (
    <div className="min-h-full flex items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="size-8 rounded-full border-2 border-muted-foreground/30 border-t-brand animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="scm/inventory" replace />} />
                <Route path="scm" element={<Navigate to="inventory" replace />} />
                <Route path="scm/:tab" element={<ScmPage />} />
                <Route path="crm" element={<Navigate to="dashboard" replace />} />
                <Route path="crm/:tab" element={<CrmPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </StoreProvider>
    </AuthProvider>
  );
}
