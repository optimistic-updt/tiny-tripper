import { Container, Flex, Heading } from "@radix-ui/themes";
import { Navbar } from "./Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="background-app-light dark:background-app-dark h-full min-h-screen relative pb-20">
      <Container px="5" py="2">
        <Flex justify="between">
          <Heading as="h1" size="6" weight="bold">
            Tiny Tripper
          </Heading>

          {/* <UserButton /> */}
        </Flex>
      </Container>

      {children}

      <Navbar />
    </div>
  );
}
