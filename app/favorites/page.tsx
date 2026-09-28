import Link from "next/link";
import { CalendarDays, Heart, Lock, MapPin } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type Memory = {
  id: string;
  title: string;
  memory_date: string;
  description: string;
  location: string | null;
  mood: string | null;
  music: string | null;
  unlock_date: string | null;
  is_favorite: boolean;
};

export default async function FavoritesPage() {
  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  const {
    data: databaseTime,
    error: timeError,
  } = await supabase.rpc("get_database_time");

  if (timeError || !databaseTime) {
    throw new Error(
      "Unable to verify memory unlock time."
    );
  }

  const {
    data: memories,
    error: memoriesError,
  } = await supabase
    .from("memories")
    .select(
      "id, title, memory_date, description, location, mood, music, unlock_date, is_favorite"
    )
    .eq("user_id", userId)
    .eq("is_favorite", true)
    .order("memory_date", {
      ascending: false,
    });

  if (memoriesError) {
    throw new Error(
      "Unable to load favorite memories."
    );
  }

  const memoryList =
    (memories ?? []) as Memory[];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Dashboard
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Heart className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Favorites
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                The memories that mean a little
                more to you.
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {memoryList.length === 0 && (
          <div className="mt-10 rounded-3xl border bg-card p-10 text-center shadow-sm">
            <div className="text-5xl">
              ♡
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No favorite memories yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Open a memory and tap the heart
              button to keep it here.
            </p>

            <Link
              href="/memories"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Browse Memories
            </Link>
          </div>
        )}

        {/* Favorites */}
        {memoryList.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {memoryList.map((memory) => {
              const locked =
                memory.unlock_date &&
                new Date(
                  memory.unlock_date
                ).getTime() >
                  new Date(
                    databaseTime
                  ).getTime();

              const formattedDate =
                new Date(
                  `${memory.memory_date}T00:00:00`
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                );

              /*
               * Locked favorite:
               * do not reveal private content.
               */
              if (locked) {
                return (
                  <div
                    key={memory.id}
                    className="rounded-2xl border bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                        <Lock className="h-5 w-5" />
                      </div>

                      <Heart className="h-5 w-5 fill-current" />
                    </div>

                    <h2 className="mt-5 font-semibold">
                      Favorite Memory Locked
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This favorite memory is
                      still waiting for its
                      unlock date.
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formattedDate}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={memory.id}
                  href={`/memories/${memory.id}`}
                  className="group block rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold transition group-hover:text-primary">
                        {memory.title}
                      </h2>

                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />

                        {formattedDate}
                      </div>
                    </div>

                    <Heart className="h-5 w-5 shrink-0 fill-current" />
                  </div>

                  {memory.location && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />

                      {memory.location}
                    </div>
                  )}

                  {memory.mood && (
                    <span className="mt-4 inline-flex rounded-full bg-muted px-3 py-1 text-xs">
                      {memory.mood}
                    </span>
                  )}

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {memory.description}
                  </p>

                  {memory.music && (
                    <p className="mt-4 text-sm">
                      🎵 {memory.music}
                    </p>
                  )}

                  <div className="mt-5 text-sm font-medium">
                    Open Memory →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}