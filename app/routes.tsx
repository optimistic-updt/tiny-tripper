export const ROUTES = {
  // public
  home: "/",
  privacyPolicy: "/privacy",
  // app
  activities: "/app/activities",
  play: "/app/play",
  newActivity: "/app/create",
  build: {
    activity: (id: string) => `/app/activities/${id}`,
  },
};
