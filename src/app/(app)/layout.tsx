import { redirect } from "next/navigation";
import { getVerifiedSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getVerifiedSession();
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
