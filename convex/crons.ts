import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Tier 1 of the scraping change-tracking pipeline. Every hour, look at all
// active `scrapingSources` rows whose interval has elapsed and run their
// detector. See docs/change-tracking.md.
crons.interval(
  "scrape-source-tick",
  { hours: 1 },
  internal.changeTracking.tick,
);

export default crons;
