import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FindMyPicks from "@/components/picker/FindMyPicks";

export default async function FindPage({
  params,
}: {
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
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Find My Picks</h1>
      <p className="text-gray-500 text-sm mb-6">
        Enter the name you used when you submitted your team.
      </p>
      <FindMyPicks poolId={poolId} />
    </div>
  );
}
