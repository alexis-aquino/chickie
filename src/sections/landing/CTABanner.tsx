import { Star } from "lucide-react";

export function CTABanner() {
  return (
    <section className="bg-gradient-to-r from-brand-dark to-brand-accent py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-white">
          <h3 className="text-white" style={{ fontSize: "1.4rem" }}>
            Ready to streamline your supply chain?
          </h3>
          <p className="text-amber-100 text-sm mt-1">Sign up in seconds — use your Google account or email.</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="size-4 fill-yellow-300 text-yellow-300" aria-hidden="true" />
          ))}
          <span className="text-white text-sm ml-1">Kung Napapa Ibeg</span>
        </div>
      </div>
    </section>
  );
}
