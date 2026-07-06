import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24" role="status" aria-label="Loading">
        <div className="size-8 rounded-full border-2 border-muted-foreground/30 border-t-brand animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}
