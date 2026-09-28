import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MemoryForm from "@/components/memories/memory-form";

export default async function NewMemoryPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    redirect("/login");
  }

  const userId = claims.claims.sub;

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/memories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Memories
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Memory
          </h1>

          <p className="mt-2 text-muted-foreground">
            Capture an important moment and keep it safely in your vault.
          </p>
        </div>

        <MemoryForm userId={userId} />
      </div>
    </main>
  );
}