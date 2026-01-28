import { Container, Flex } from "@radix-ui/themes";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Container size="2" className="py-8 px-4">
        <Flex direction="column" align="center" minHeight="100vh">
          {children}
        </Flex>
      </Container>
    </div>
  );
}
