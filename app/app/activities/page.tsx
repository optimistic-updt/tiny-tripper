"use client";

import Link from "next/link";
import { ROUTES } from "@/app/routes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ActivitiesPage() {
  const activities = useQuery(api.activities.listActivities);
  const isLoading = false;

  return (
    <>
      <main className="">
        {isLoading && <p>Loading activities...</p>}

        {/* Activities list */}
        <ul role="list" className="">
          {activities?.map((activity) => (
            <Link
              key={activity.id}
              href={ROUTES.build.activity(String(activity.id))}
            >
              <h2>{activity.name}</h2>
            </Link>
          ))}
        </ul>
      </main>
    </>
  );
}
