import { Container, Flex, Heading, Button } from "@radix-ui/themes";
import { Navbar } from "./Navbar";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ActivityListPrefetch } from "@/components/ActivityListPrefetch";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="background-app-light dark:background-app-dark">
      <ActivityListPrefetch />
      <Container px="5" py="2">
        <Flex justify="between">
          <Heading as="h1" size="6" weight="bold">
            Tiny Tripper
          </Heading>

          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="soft" size="2">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </Flex>
      </Container>

      <Flex
        direction="column"
        align="center"
        // 72px is height of navbar
        style={{ height: "calc(100dvh - 118px)" }}
      >
        {children}
      </Flex>

      <Navbar />
    </div>
  );
}
