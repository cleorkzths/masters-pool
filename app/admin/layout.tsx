import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="masters-header text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-green-200 hover:text-white text-sm">
              ← Back to Pool
            </Link>
            <span className="text-white font-bold">Admin</span>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-green-100 hover:text-white">Dashboard</Link>
            <Link href="/admin/scores" className="text-green-100 hover:text-white">Scores</Link>
            <Link href="/admin/players" className="text-green-100 hover:text-white">Players</Link>
            <Link href="/admin/entries" className="text-green-100 hover:text-white">Entries</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
