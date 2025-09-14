export const ROUTES = {
  // public
  home: "/",
  privacyPolicy: "/privacy",
  // app
  activities: "/tt/activities",
  play: "/tt/play",
  newActivity: "/tt/create",
  build: {
    activity: (id: string) => `/tt/activities/${id}`,
  },
};
