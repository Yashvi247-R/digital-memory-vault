import Link from "next/link";
import { CalendarDays, Lock, MapPin, Tag } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type TimelinePageProps = {
  searchParams: Promise<{
    order?: string;
    year?: string;
    mood?: string;
    tag?: string;
  }>;
};

type TimelineMemory = {
  id: string;
  title: string;
  memory_date: string;
  description: string;
  location: string | null;
  mood: string | null;
  unlock_date: string | null;
};

type MemoryTag = {
  memory_id: string;
  tag: string;
};

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const params = await searchParams;

  const order =
    params.order === "oldest"
      ? "oldest"
      : "newest";

  const selectedYear =
    typeof params.year === "string"
      ? params.year
      : "";

  const selectedMood =
    typeof params.mood === "string"
      ? params.mood
      : "";

  const selectedTag =
    typeof params.tag === "string"
      ? params.tag
      : "";

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  /*
   * Use database time so locked memories
   * are determined by the server/database,
   * not by the user's computer clock.
   */
  const {
    data: databaseTime,
    error: timeError,
  } = await supabase.rpc("get_database_time");

  if (timeError || !databaseTime) {
    throw new Error(
      "Unable to verify memory unlock time."
    );
  }

  const { data: memories, error: memoriesError } =
    await supabase
      .from("memories")
      .select(
        "id, title, memory_date, description, location, mood, unlock_date"
      )
      .eq("user_id", userId)
      .order("memory_date", {
        ascending: order === "oldest",
      });

  if (memoriesError) {
    throw new Error(
      "Unable to load timeline memories."
    );
  }

  const memoryList =
    (memories ?? []) as TimelineMemory[];

  const memoryIds = memoryList.map(
    (memory) => memory.id
  );

  let tags: MemoryTag[] = [];

  if (memoryIds.length > 0) {
    const { data: tagData, error: tagError } =
      await supabase
        .from("memory_tags")
        .select("memory_id, tag")
        .in("memory_id", memoryIds);

    if (tagError) {
      throw new Error(
        "Unable to load memory tags."
      );
    }

    tags = (tagData ?? []) as MemoryTag[];
  }

  const tagsByMemory = new Map<
    string,
    string[]
  >();

  for (const item of tags) {
    const current =
      tagsByMemory.get(item.memory_id) ?? [];

    current.push(item.tag);

    tagsByMemory.set(
      item.memory_id,
      current
    );
  }

  /*
   * Create filter options from the user's own
   * memories only.
   */
  const years = Array.from(
    new Set(
      memoryList.map((memory) =>
        new Date(
          `${memory.memory_date}T00:00:00`
        ).getFullYear()
      )
    )
  ).sort((a, b) => b - a);

  const moods = Array.from(
    new Set(
      memoryList
        .map((memory) => memory.mood)
        .filter(
          (mood): mood is string =>
            Boolean(mood)
        )
    )
  ).sort();

  const availableTags = Array.from(
    new Set(tags.map((item) => item.tag))
  ).sort();

  /*
   * Apply filters.
   */
  const filteredMemories =
    memoryList.filter((memory) => {
      const memoryYear =
        new Date(
          `${memory.memory_date}T00:00:00`
        ).getFullYear();

      if (
        selectedYear &&
        String(memoryYear) !== selectedYear
      ) {
        return false;
      }

      if (
        selectedMood &&
        memory.mood !== selectedMood
      ) {
        return false;
      }

      if (selectedTag) {
        const memoryTags =
          tagsByMemory.get(memory.id) ?? [];

        if (!memoryTags.includes(selectedTag)) {
          return false;
        }
      }

      return true;
    });

  /*
   * Group memories by year and month.
   */
  const grouped = new Map<
    string,
    Map<string, TimelineMemory[]>
  >();

  for (const memory of filteredMemories) {
    const date = new Date(
      `${memory.memory_date}T00:00:00`
    );

    const year = String(
      date.getFullYear()
    );

    const month = date.toLocaleString(
      "en-IN",
      {
        month: "long",
      }
    );

    if (!grouped.has(year)) {
      grouped.set(
        year,
        new Map()
      );
    }

    const yearGroup =
      grouped.get(year)!;

    if (!yearGroup.has(month)) {
      yearGroup.set(
        month,
        []
      );
    }

    yearGroup
      .get(month)!
      .push(memory);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your Timeline
            </h1>

            <p className="mt-2 text-muted-foreground">
              Walk through your memories,
              one moment at a time.
            </p>
          </div>

          <Link
            href="/memories/new"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            + Create Memory
          </Link>
        </div>

        {/* Filters */}
        <form
          method="GET"
          className="mt-8 rounded-2xl border bg-card p-4 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="order"
                className="mb-2 block text-sm font-medium"
              >
                Order
              </label>

              <select
                id="order"
                name="order"
                defaultValue={order}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="year"
                className="mb-2 block text-sm font-medium"
              >
                Year
              </label>

              <select
                id="year"
                name="year"
                defaultValue={selectedYear}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  All years
                </option>

                {years.map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="mood"
                className="mb-2 block text-sm font-medium"
              >
                Mood
              </label>

              <select
                id="mood"
                name="mood"
                defaultValue={selectedMood}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  All moods
                </option>

                {moods.map((mood) => (
                  <option
                    key={mood}
                    value={mood}
                  >
                    {mood}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tag"
                className="mb-2 block text-sm font-medium"
              >
                Tag
              </label>

              <select
                id="tag"
                name="tag"
                defaultValue={selectedTag}
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  All tags
                </option>

                {availableTags.map((tag) => (
                  <option
                    key={tag}
                    value={tag}
                  >
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Apply Filters
            </button>

            <Link
              href="/timeline"
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition hover:bg-muted"
            >
              Clear Filters
            </Link>
          </div>
        </form>

        {/* Result count */}
        <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />

          <span>
            {filteredMemories.length}{" "}
            {filteredMemories.length === 1
              ? "memory"
              : "memories"}
          </span>
        </div>

        {/* Empty state */}
        {filteredMemories.length === 0 && (
          <div className="mt-8 rounded-3xl border bg-card p-10 text-center shadow-sm">
            <div className="text-5xl">
              📅
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No memories found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try changing your filters or
              create your first memory.
            </p>

            <Link
              href="/memories/new"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Create Memory
            </Link>
          </div>
        )}

        {/* Timeline */}
        {filteredMemories.length > 0 && (
          <div className="relative mt-10">
            <div className="absolute bottom-0 left-[11px] top-0 w-px bg-border sm:left-[15px]" />

            <div className="space-y-12">
              {Array.from(
                grouped.entries()
              ).map(
                ([year, months]) => (
                  <section
                    key={year}
                    className="relative"
                  >
                    <div className="relative flex items-center gap-4">
                      <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        •
                      </div>

                      <h2 className="text-2xl font-bold">
                        {year}
                      </h2>
                    </div>

                    <div className="ml-6 mt-8 space-y-10 border-l border-border pl-6 sm:ml-8 sm:pl-8">
                      {Array.from(
                        months.entries()
                      ).map(
                        ([month, monthMemories]) => (
                          <div
                            key={`${year}-${month}`}
                          >
                            <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              {month}
                            </h3>

                            <div className="space-y-5">
                              {monthMemories.map(
                                (memory) => {
                                  const isLocked =
                                    memory.unlock_date &&
                                    new Date(
                                      memory.unlock_date
                                    ).getTime() >
                                      new Date(
                                        databaseTime
                                      ).getTime();

                                  const date =
                                    new Date(
                                      `${memory.memory_date}T00:00:00`
                                    );

                                  const formattedDate =
                                    date.toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      }
                                    );

                                  const memoryTags =
                                    tagsByMemory.get(
                                      memory.id
                                    ) ?? [];

                                  return (
                                    <div
                                      key={
                                        memory.id
                                      }
                                      className="relative"
                                    >
                                      <div className="absolute -left-[33px] top-6 z-10 h-3 w-3 rounded-full border-2 border-background bg-primary sm:-left-[41px]" />

                                      {isLocked ? (
                                        <div className="rounded-2xl border bg-card p-5 shadow-sm">
                                          <div className="flex items-start gap-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                                              <Lock className="h-5 w-5" />
                                            </div>

                                            <div>
                                              <p className="text-sm font-semibold">
                                                Memory Locked
                                              </p>

                                              <p className="mt-1 text-sm text-muted-foreground">
                                                This memory
                                                will appear
                                                here when
                                                it becomes
                                                available.
                                              </p>

                                              <p className="mt-3 text-xs text-muted-foreground">
                                                {formattedDate}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <Link
                                          href={`/memories/${memory.id}`}
                                          className="block rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="text-lg font-semibold">
                                                  {
                                                    memory.title
                                                  }
                                                </h4>

                                                {memory.mood && (
                                                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                                                    {
                                                      memory.mood
                                                    }
                                                  </span>
                                                )}
                                              </div>

                                              <p className="mt-2 text-sm text-muted-foreground">
                                                {
                                                  formattedDate
                                                }
                                              </p>

                                              {memory.location && (
                                                <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                                                  <MapPin className="h-4 w-4" />

                                                  <span>
                                                    {
                                                      memory.location
                                                    }
                                                  </span>
                                                </div>
                                              )}

                                              <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                                                {
                                                  memory.description
                                                }
                                              </p>
                                            </div>

                                            <span className="shrink-0 text-sm font-medium">
                                              Open →
                                            </span>
                                          </div>

                                          {memoryTags.length >
                                            0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                              {memoryTags.map(
                                                (
                                                  tag
                                                ) => (
                                                  <span
                                                    key={
                                                      tag
                                                    }
                                                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                                                  >
                                                    <Tag className="h-3 w-3" />
                                                    {
                                                      tag
                                                    }
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </Link>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}