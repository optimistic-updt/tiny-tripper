export const ROUTES = {
  // public
  home: "/",
  privacyPolicy: "/privacy",
  quiz: "/quiz",
  quizResults: "/quiz/results",
  // app
  activities: "/tt/activities",
  play: "/tt/play",
  newActivity: "/tt/create",
  build: {
    activity: (id: string) => `/tt/activities/${id}`,
    quizResults: (responseId: string) => `/quiz/results?id=${responseId}`,
  },
};
