import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Theme } from "@radix-ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiny Tripper",
  description:
    "Recommend the BEST activity to do with your kids based on your location.",
  icons: {
    icon: "/convex.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <ClerkProvider dynamic>
            <ConvexClientProvider>
              <Theme accentColor="tomato" radius="large">
                {children}
              </Theme>
            </ConvexClientProvider>
          </ClerkProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
