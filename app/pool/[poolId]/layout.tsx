import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Header from "@/components/shared/Header";

export default async function PoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ poolId: string }>;
}) {
  const { poolId } = await params;
  const supabase = await createClient();

  const { data: pool } = await supabase
    .from("pools")
    .select("*")
    .eq("id", poolId)
    .single();

  if (!pool) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header pool={pool} poolId={poolId} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
