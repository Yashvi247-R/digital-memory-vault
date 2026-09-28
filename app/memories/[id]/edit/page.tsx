import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MemoryForm from "@/components/memories/memory-form";

type EditMemoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditMemoryPage({
  params,
}: EditMemoryPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    redirect("/login");
  }

  const userId = claims.claims.sub;

  const { data: memory, error } = await supabase
    .from("memories")
    .select(
      "id, title, memory_date, description, location, mood, music, unlock_date"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !memory) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/memories/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Memory
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Memory
          </h1>

          <p className="mt-2 text-muted-foreground">
            Update the details of your memory.
          </p>
        </div>

        <MemoryForm
          userId={userId}
          memory={memory}
        />
      </div>
    </main>
  );
}