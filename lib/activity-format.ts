/**
 * Shared formatting helpers for rendering activity details (dates, urgency).
 * Used by both the play page and the activities list detail tray.
 */

type UrgencyColor = "red" | "yellow" | "green" | "gray";

export const formatDate = (dateString?: string): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getUrgencyColor = (urgency: string): UrgencyColor => {
  switch (urgency) {
    case "high":
      return "red";
    case "medium":
      return "yellow";
    case "low":
      return "green";
    default:
      return "gray";
  }
};

export const getDaysUntilEnd = (endDate?: string): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
