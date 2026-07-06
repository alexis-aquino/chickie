export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatDate(
  iso: string,
  style: "short" | "long" | "weekday" | "month-year" = "short",
): string {
  const date = new Date(iso);
  if (style === "long") {
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }
  if (style === "weekday") {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (style === "month-year") {
    return date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
