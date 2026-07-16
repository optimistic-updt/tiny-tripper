import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Container, Flex, Heading, Button } from "@radix-ui/themes";
import { Show, SignInButton, UserButton } from "@clerk/tanstack-react-start";
import { Navbar } from "@/components/Navbar";
import { ActivityListPrefetch } from "@/components/ActivityListPrefetch";

export const Route = createFileRoute("/tt")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="background-app-light dark:background-app-dark">
      <ActivityListPrefetch />
      <Container px="5" py="2">
        <Flex justify="between">
          <Heading as="h1" size="6" weight="bold">
            Tiny Tripper
          </Heading>

          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="soft" size="2">
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </Flex>
      </Container>

      <Flex
        direction="column"
        align="center"
        // 72px is height of navbar
        style={{ height: "calc(100dvh - 118px)" }}
      >
        <Outlet />
      </Flex>

      <Navbar />
    </div>
  );
}
