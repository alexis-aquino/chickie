import { Navigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Nav } from "@/sections/landing/Nav";
import { Hero } from "@/sections/landing/Hero";
import { FeaturesSection } from "@/sections/landing/FeaturesSection";
import { CTABanner } from "@/sections/landing/CTABanner";
import { Footer } from "@/sections/landing/Footer";

export function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24" role="status" aria-label="Loading">
        <div className="size-8 rounded-full border-2 border-muted-foreground/30 border-t-red-600 animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-full flex flex-col bg-white">
      <Nav />
      <Hero />
      <FeaturesSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
