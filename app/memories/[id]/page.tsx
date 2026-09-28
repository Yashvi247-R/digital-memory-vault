import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  CalendarDays,
  Heart,
  Music,
  Users,
  Tag,
  Lock,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import DeleteMemoryButton from "@/components/memories/delete-memory-button";
import MemoryMediaUpload from "@/components/memories/memory-media-upload";
import MemoryMediaGallery from "@/components/memories/memory-media-gallery";
import MemoryFavoriteButton from "@/components/memories/memory-favorite-button";
import MemoryShareButton from "@/components/memories/memory-share-button";
import LockedMemory from "@/components/memories/locked-memory";

type MemoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MemoryDetailPage({
  params,
}: MemoryPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  if (!userId) {
    redirect("/login");
  }

  /*
   * Get database time first.
   * This is the authoritative time for unlock checking.
   */
  const { data: databaseTime, error: timeError } =
    await supabase.rpc("get_database_time");

  if (timeError || !databaseTime) {
    throw new Error(
      "Unable to verify memory unlock time."
    );
  }

  /*
   * First fetch only the unlock date.
   * We don't load the private memory content
   * until we know it is unlocked.
   */
  const { data: lockInfo, error: lockError } =
    await supabase
      .from("memories")
      .select("id, unlock_date")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

  if (lockError || !lockInfo) {
    redirect("/memories");
  }

  const unlockDate = lockInfo.unlock_date;

  const isLocked =
    unlockDate &&
    new Date(unlockDate).getTime() >
      new Date(databaseTime).getTime();

  /*
   * Locked memory:
   * return before loading any private content.
   */
  if (isLocked) {
    return (
      <LockedMemory
        unlockDate={unlockDate}
      />
    );
  }

  /*
   * Memory is unlocked.
   * Now it is safe to load the complete memory.
   */
  const { data: memory, error } = await supabase
    .from("memories")
    .select(
      `
      id,
      user_id,
      title,
      memory_date,
      description,
      location,
      mood,
      music,
      unlock_date,
      is_favorite,
      created_at,
      updated_at,
      memory_people (
        id,
        person_name
      ),
      memory_tags (
        id,
        tag
      )
      `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !memory) {
    redirect("/memories");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Top navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/memories"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Back to Memories
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <MemoryFavoriteButton
              memoryId={memory.id}
              initialFavorite={memory.is_favorite}
            />

            <MemoryShareButton />

            <Link
              href={`/memories/${memory.id}/edit`}
              className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Edit
            </Link>

            <DeleteMemoryButton
              memoryId={memory.id}
            />
          </div>
        </div>

        {/* Header */}
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Private Memory
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {memory.title}
                </h1>
              </div>

              {memory.is_favorite && (
                <div className="rounded-full bg-red-500/10 p-3 text-red-500">
                  <Heart className="h-5 w-5 fill-current" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
                <CalendarDays className="h-4 w-4" />

                {new Date(
                  memory.memory_date
                ).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              {memory.location && (
                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {memory.location}
                </div>
              )}

              {memory.mood && (
                <div className="rounded-full bg-muted px-4 py-2 text-sm">
                  ❤️ {memory.mood}
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-6 sm:p-8">
            <h2 className="mb-3 text-lg font-semibold">
              About this memory
            </h2>

            <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
              {memory.description}
            </p>
          </div>
        </section>

        {/* People / Music / Tags */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="font-semibold">
                People
              </h2>
            </div>

            {memory.memory_people.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memory.memory_people.map(
                  (person) => (
                    <span
                      key={person.id}
                      className="rounded-full bg-muted px-3 py-1 text-sm"
                    >
                      {person.person_name}
                    </span>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No people added.
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Music className="h-5 w-5" />
              <h2 className="font-semibold">
                Music
              </h2>
            </div>

            {memory.music ? (
              <p className="text-sm text-muted-foreground">
                {memory.music}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No music added.
              </p>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <h2 className="font-semibold">
                Tags
              </h2>
            </div>

            {memory.memory_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memory.memory_tags.map(
                  (item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-muted px-3 py-1 text-sm"
                    >
                      #{item.tag}
                    </span>
                  )
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tags added.
              </p>
            )}
          </section>
        </div>

        {/* Unlocked indicator */}
        {memory.unlock_date && (
          <section className="mt-6 rounded-2xl border bg-card p-5">
            <div className="font-semibold">
              🔓 Memory Unlocked
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back to this moment.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Unlocked on{" "}
              {new Date(
                memory.unlock_date
              ).toLocaleString("en-IN")}
            </p>
          </section>
        )}

        {/* Media */}
        <section className="mt-6 space-y-6">
          <MemoryMediaGallery
            memoryId={memory.id}
          />

          <MemoryMediaUpload
            memoryId={memory.id}
          />
        </section>

        {/* Bottom actions */}
        <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
          <Link
            href={`/memories/${memory.id}/edit`}
            className="rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Edit Memory
          </Link>

          <MemoryShareButton />

          <DeleteMemoryButton
            memoryId={memory.id}
          />
        </div>
      </div>
    </main>
  );
}