"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function ActivityListPrefetch() {
  // Warm the Convex cache by fetching activities at layout level
  useQuery(api.activities.listActivities);
  return null;
}
