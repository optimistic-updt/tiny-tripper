import { Navbar } from "./Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="background-app-light dark:background-app-dark h-screen">
      {children}
      <Navbar />
    </div>
  );
}
