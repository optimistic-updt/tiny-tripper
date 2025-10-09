// convex/convex.config.ts
import geospatial from "@convex-dev/geospatial/convex.config";
import workflow from "@convex-dev/workflow/convex.config";

import { defineApp } from "convex/server";

const app = defineApp();
app.use(geospatial);
app.use(workflow);

export default app;
