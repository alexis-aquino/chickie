import { useState, useMemo, type CSSProperties } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { CreateOrderDialog } from "@/sections/scm/CreateOrderDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { initials } from "@/utils/format";
import { shade } from "@/utils/color";
import logo from "@/assets/logo.png";
import { ShoppingCart, LogOut, Crown, Boxes, HeartHandshake } from "lucide-react";

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { loading: storeLoading } = useStore();
  const location = useLocation();
  const isOwner = user?.role === "owner";
  const module: "scm" | "crm" = location.pathname.startsWith("/dashboard/crm") ? "crm" : "scm";

  const [orderOpen, setOrderOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const accentColor = user?.accentColor ?? "#dc2626";

  // The user's chosen accent color becomes this session's brand color —
  // every `bg-brand`/`text-brand`/`border-brand` utility in the dashboard
  // subtree re-resolves against these overridden CSS variables.
  const brandVars = useMemo(
    () =>
      ({
        "--brand": accentColor,
        "--brand-dark": shade(accentColor, -15),
        "--brand-light": shade(accentColor, 12),
      }) as CSSProperties,
    [accentColor],
  );

  return (
    <div className="min-h-full bg-muted/30" style={brandVars}>
      <Toaster richColors position="top-right" />

      <header className="border-b bg-background sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="Chickie logo" className="size-11 rounded-full object-cover ring-2 ring-brand-accent-light" />
            <div>
              <h2 className="leading-tight">Chickie</h2>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {module === "scm" ? "Supply Chain Management" : "Customer Relations"}
              </p>
            </div>
          </Link>

          {/* Module switcher — centre */}
          <nav aria-label="Dashboard module" className="flex items-center gap-1 rounded-xl border bg-muted p-1 shrink-0">
            <NavLink
              to="/dashboard/scm/inventory"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive || module === "scm"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Boxes className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">SCM</span>
            </NavLink>
            <NavLink
              to="/dashboard/crm/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive || module === "crm"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <HeartHandshake className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">CRM</span>
            </NavLink>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isOwner && module === "scm" && (
              <Button
                className="bg-brand hover:bg-brand-dark text-white hidden sm:inline-flex"
                onClick={() => setOrderOpen(true)}
              >
                <ShoppingCart className="size-4" />
                Create Order
              </Button>
            )}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-full pr-2 hover:bg-accent transition-colors"
              title="Edit profile"
            >
              <Avatar className="size-9 ring-2 ring-brand">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-sm bg-brand/20 text-brand">
                  {user ? initials(user.name) : ""}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block leading-tight text-left">
                <div className="text-sm font-medium flex items-center gap-1">
                  {user?.name}
                  {isOwner && <Crown className="size-3 text-amber-500" aria-label="Owner" />}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
              </div>
            </button>
            <Button variant="ghost" size="icon" onClick={logout} title="Sign out" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {storeLoading ? (
          <div className="flex items-center justify-center py-24" role="status" aria-label="Loading your data">
            <div className="size-8 rounded-full border-2 border-muted-foreground/30 border-t-brand animate-spin" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {isOwner && <CreateOrderDialog open={orderOpen} onOpenChange={setOrderOpen} />}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
