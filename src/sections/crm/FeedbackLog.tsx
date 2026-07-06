import { useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { initials } from "@/utils/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stars } from "@/components/Stars";
import { Star, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";

type RatingFilter = "All" | "5" | "4" | "3" | "2" | "1";

export function FeedbackLog() {
  const { customers } = useStore();
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("All");

  const allFeedback = useMemo(() => {
    return customers
      .flatMap((c) => c.feedback.map((fb) => ({ ...fb, customer: c })))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [customers]);

  const filtered = useMemo(() => {
    if (ratingFilter === "All") return allFeedback;
    return allFeedback.filter((f) => f.rating === parseInt(ratingFilter));
  }, [allFeedback, ratingFilter]);

  const stats = useMemo(() => {
    const total = allFeedback.length;
    const avg = total ? allFeedback.reduce((s, f) => s + f.rating, 0) / total : 0;
    const positive = allFeedback.filter((f) => f.rating >= 4).length;
    const negative = allFeedback.filter((f) => f.rating <= 2).length;
    const dist = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: allFeedback.filter((f) => f.rating === r).length,
    }));
    return { total, avg, positive, negative, dist };
  }, [allFeedback]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Reviews</span>
            <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </Card>
        <Card className="p-4 gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Rating</span>
            <Star className="size-4 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold">{stats.avg.toFixed(1)}</div>
          <Stars rating={stats.avg} size="xs" />
        </Card>
        <Card className="p-4 gap-1.5 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-medium">Positive (4–5★)</span>
            <ThumbsUp className="size-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-emerald-700">{stats.positive}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total ? Math.round((stats.positive / stats.total) * 100) : 0}% of reviews
          </div>
        </Card>
        <Card className="p-4 gap-1.5 border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-destructive font-medium">Negative (1–2★)</span>
            <ThumbsDown className="size-4 text-destructive" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-destructive">{stats.negative}</div>
          <div className="text-xs text-muted-foreground">
            {stats.total ? Math.round((stats.negative / stats.total) * 100) : 0}% of reviews
          </div>
        </Card>
      </div>

      <Card className="p-5 gap-4">
        <div>
          <h3 className="mb-3">Rating Distribution</h3>
          <div className="flex flex-col gap-1.5">
            {stats.dist.map(({ rating, count }) => {
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-xs text-muted-foreground w-2">{rating}</span>
                    <Star className="size-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-brand-light to-brand-accent-light transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3>All Reviews</h3>
          <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as RatingFilter)}>
            <SelectTrigger className="w-36" aria-label="Filter by rating">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r} Stars
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-8">No reviews match your filter.</div>
          )}
          {filtered.map((fb) => {
            const cfg =
              fb.customer.tier === "Gold"
                ? "bg-yellow-100 text-yellow-700"
                : fb.customer.tier === "Silver"
                ? "bg-slate-100 text-slate-600"
                : "bg-amber-100 text-amber-700";
            return (
              <div key={fb.id} className="rounded-xl border p-4 flex gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className={`${cfg} text-sm font-medium`}>{initials(fb.customer.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{fb.customer.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {fb.customer.tier}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(fb.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <Stars rating={fb.rating} />
                  <p className="text-sm text-muted-foreground mt-1.5 italic">&quot;{fb.comment}&quot;</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Order: {fb.customer.orders.find((o) => o.id === fb.orderId)?.items.map((i) => i.name).join(", ") ?? "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
