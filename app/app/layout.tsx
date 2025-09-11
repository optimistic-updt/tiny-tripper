import { Navbar } from "./Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="background-app-light dark:background-app-dark h-full min-h-screen relative pb-20">
      {children}
      <Navbar />
    </div>
  );
}
