import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar userName={session.name} />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
