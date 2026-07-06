import { Package, Users, Truck, BarChart3, Zap, type LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const features: Feature[] = [
  { icon: Package, title: "Live Inventory", desc: "Track every ingredient on hand against par levels in real time." },
  { icon: Users, title: "Supplier Hub", desc: "Manage vendors, ratings, and delivery performance effortlessly." },
  { icon: Truck, title: "Smart Reordering", desc: "Get instant alerts the moment an item hits its reorder point." },
  { icon: BarChart3, title: "Cost Analytics", desc: "See inventory value broken down by category at a glance." },
];

export function FeaturesSection() {
  return (
    <section className="bg-white" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-semibold mb-3">
            <Zap className="size-3" aria-hidden="true" /> What Chickie does for you 🐔
          </span>
          <h2 id="features-heading">Everything your kitchen needs, in one place</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            From the walk-in cooler to the dry-goods shelf — keep the whole Chickie operation running without a hitch.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border p-6 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            >
              <div className="size-12 rounded-xl bg-gradient-to-br from-brand-light to-brand-accent-light text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <f.icon className="size-5" aria-hidden="true" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
