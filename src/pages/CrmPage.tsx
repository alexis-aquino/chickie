import { Navigate, useNavigate, useParams } from "react-router";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRMDashboard } from "@/sections/crm/CRMDashboard";
import { CustomerList } from "@/sections/crm/CustomerList";
import { LoyaltyProgram } from "@/sections/crm/LoyaltyProgram";
import { FeedbackLog } from "@/sections/crm/FeedbackLog";
import { PromotionSuggestions } from "@/sections/crm/PromotionSuggestions";
import { LayoutDashboard, Users, Award, MessageSquare, Zap } from "lucide-react";

const VALID_TABS = ["dashboard", "customers", "loyalty", "feedback", "promotions"];

export function CrmPage() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { promotions } = useStore();
  const activePromos = promotions.filter((p) => p.status === "Active").length;

  // Supplier accounts only get the SCM side of the dashboard.
  if (user?.role === "supplier") {
    return <Navigate to="/dashboard/scm/deliveries" replace />;
  }

  if (!tab || !VALID_TABS.includes(tab)) {
    return <Navigate to="/dashboard/crm/dashboard" replace />;
  }

  return (
    <>
      <div>
        <h1 style={{ fontSize: "1.5rem" }}>Customer Relations 💛</h1>
        <p className="text-muted-foreground text-sm">
          Customer profiles, loyalty program, feedback, and SCM-driven promotions.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => navigate(`/dashboard/crm/${v}`)} className="gap-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="size-3.5" aria-hidden="true" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <Users className="size-3.5" aria-hidden="true" /> Customers
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-1.5">
            <Award className="size-3.5" aria-hidden="true" /> Loyalty
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="size-3.5" aria-hidden="true" /> Feedback
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1.5">
            <Zap className="size-3.5" aria-hidden="true" /> Promotions
            {activePromos > 0 && (
              <span className="size-4 rounded-full bg-brand text-white text-[10px] flex items-center justify-center leading-none ml-0.5">
                {activePromos}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CRMDashboard />
        </TabsContent>
        <TabsContent value="customers">
          <CustomerList />
        </TabsContent>
        <TabsContent value="loyalty">
          <LoyaltyProgram />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackLog />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionSuggestions />
        </TabsContent>
      </Tabs>
    </>
  );
}
