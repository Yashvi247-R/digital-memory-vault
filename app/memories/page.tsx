import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MemoriesPage() {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();

  if (!claims) {
    redirect("/login");
  }

  const userId = claims.claims.sub;

  const { data: memories, error } = await supabase
    .from("memories")
    .select(
      "id, title, memory_date, description, location, mood, is_favorite, created_at"
    )
    .eq("user_id", userId)
    .order("memory_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              My Memories
            </h1>

            <p className="mt-2 text-muted-foreground">
              Your private collection of memories.
            </p>
          </div>

          <Link
            href="/memories/new"
            className="rounded-lg bg-black px-5 py-3 text-center text-sm font-medium text-white hover:opacity-90"
          >
            + Create Memory
          </Link>
        </div>

        {memories.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <h2 className="text-xl font-semibold">
              No memories yet
            </h2>

            <p className="mt-2 text-muted-foreground">
              Create your first memory and start building your vault.
            </p>

            <Link
              href="/memories/new"
              className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Create Your First Memory
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {memories.map((memory) => (
              <Link
                key={memory.id}
                href={`/memories/${memory.id}`}
                className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold group-hover:underline">
                    {memory.title}
                  </h2>

                  {memory.is_favorite && (
                    <span aria-label="Favorite">❤️</span>
                  )}
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {new Date(memory.memory_date).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>

                {memory.location && (
                  <p className="mt-2 text-sm">
                    📍 {memory.location}
                  </p>
                )}

                {memory.mood && (
                  <p className="mt-2 text-sm">
                    ❤️ {memory.mood}
                  </p>
                )}

                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">
                  {memory.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}