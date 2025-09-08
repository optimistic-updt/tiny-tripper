import { Button, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import { ROUTES } from "./routes";

export default function Home() {
  return (
    <>
      <main className="">
        <section className="">
          {/* <img
            src="/images/max-goncharov-iN6FWLaWqKs-unsplash.jpg"
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
            alt="your toddler"
            className="absolute inset-0 -z-10 h-full w-full object-cover bg-blend-multiply"
          /> */}
          {/* <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div> */}
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center">
              <Heading as="h1">Remove the Decision Fatigue 😩</Heading>
              <Text>
                {/* Your toddler&apos;s next adventure, just a tap away!  */}
                Tiny Tripper recommends engaging, age-appropriate activities to
                do with your kid(s).
              </Text>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href={ROUTES.play}>
                  <Button size="3">Try it Now</Button>
                </Link>

                {/* <a
                  href="#what-is-it"
                  className="text-sm font-semibold leading-6 text-white"
                >
                  Live demo <span aria-hidden="true">→</span>
                </a> */}
              </div>
            </div>
          </div>
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
        </section>
      </main>
    </>
  );
}
