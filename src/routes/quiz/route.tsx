import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container, Flex } from "@radix-ui/themes";

export const Route = createFileRoute("/quiz")({
  component: QuizLayout,
});

function QuizLayout() {
  return (
    <div className="min-h-screen">
      <Container size="2" className="py-8 px-4">
        <Flex direction="column" align="center" minHeight="100vh">
          <Outlet />
        </Flex>
      </Container>
    </div>
  );
}
