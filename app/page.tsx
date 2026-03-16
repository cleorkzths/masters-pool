import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Find the most recent active pool
  const { data: pool } = await supabase
    .from("pools")
    .select("id")
    .order("year", { ascending: false })
    .limit(1)
    .single();

  if (pool) {
    redirect(`/pool/${pool.id}`);
  }

  return (
    <div className="min-h-screen masters-header flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Masters Pool</h1>
        <p className="text-green-200">No active pool found. Contact your admin to set one up.</p>
      </div>
    </div>
  );
}
