import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import { ShieldCheck } from "lucide-react";

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Chickie" className="size-9 rounded-full object-cover ring-2 ring-brand-accent-light" />
          <div>
            <span className="font-semibold text-base tracking-tight">Chickie</span>
            <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
              Integrated Supply Chain &amp; CRM System
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
            <ShieldCheck className="size-3 text-emerald-500" aria-hidden="true" />
            Secure &amp; role-based
          </Badge>
        </div>
      </div>
    </nav>
  );
}
