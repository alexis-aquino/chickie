import logo from "@/assets/logo.png";
import { Badge } from "@/components/ui/badge";
import { AuthCard } from "./AuthCard";
import { Zap, CheckCircle2, Star } from "lucide-react";

const perks = [
  "Real-time inventory tracking",
  "Automated reorder alerts",
  "Supplier performance ratings",
  "Delivery schedule management",
  "Role-based access control",
  "Purchase history & analytics",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-accent">
      {/* decorative blobs */}
      <div className="absolute -top-32 -right-32 size-[480px] rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-red-900/30 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-white/5 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-[1fr_420px] gap-16 items-center">
        {/* LEFT — hero copy */}
        <div className="flex flex-col gap-6 text-white">
          <div className="flex items-center gap-5">
            <img
              src={logo}
              alt="Chickie mascot"
              className="size-28 lg:size-36 rounded-full object-cover ring-4 ring-brand-accent-light shadow-2xl"
            />
            <div className="flex flex-col gap-2">
              <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-xs gap-1 w-fit">
                <Zap className="size-3 text-yellow-300" aria-hidden="true" /> Built for restaurants
              </Badge>
              <div className="text-yellow-300 text-xs font-semibold tracking-widest uppercase">Since 2025</div>
            </div>
          </div>

          <div>
            <h1 className="text-white font-semibold leading-tight" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
              Chickie: Integrated Supply Chain
              <br />& Customer Relationship Management System
            </h1>
            <p className="mt-4 text-amber-50 text-lg max-w-lg leading-relaxed">
              The all-in-one supply chain platform for Chickie restaurants. Track inventory, manage suppliers, and
              never run out mid-service — for owners and staff alike.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 list-none">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-amber-50">
                <CheckCircle2 className="size-4 text-yellow-300 shrink-0" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2" aria-hidden="true">
              {["OW", "SC", "MG", "JR"].map((i) => (
                <div
                  key={i}
                  className="size-8 rounded-full bg-gradient-to-br from-brand-accent-light to-brand-light ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white"
                >
                  {i}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5" role="img" aria-label="Rated 5 out of 5 stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="size-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                ))}
              </div>
              <p className="text-xs text-amber-100 mt-0.5">Trusted by Chickie teams</p>
            </div>
          </div>
        </div>

        {/* RIGHT — auth card */}
        <div className="flex justify-center lg:justify-end">
          <AuthCard />
        </div>
      </div>

      {/* wave divider */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 56" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 56L1440 56L1440 16C1200 52 960 0 720 16C480 32 240 0 0 16L0 56Z" fill="white" />
      </svg>
    </section>
  );
}
