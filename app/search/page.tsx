import Link from "next/link";
import {
  CalendarDays,
  Lock,
  MapPin,
  Search as SearchIcon,
  Tag,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type Memory = {
  id: string;
  title: string;
  memory_date: string;
  description: string;
  location: string | null;
  mood: string | null;
  music: string | null;
  unlock_date: string | null;
};

type Person = {
  memory_id: string;
  person_name: string;
};

type MemoryTag = {
  memory_id: string;
  tag: string;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const query =
    typeof params.q === "string"
      ? params.q.trim()
      : "";

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  /*
   * Database time is used to determine
   * whether a memory is locked.
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

  /*
   * Get only this user's memories.
   *
   * RLS also protects this query at the
   * database level.
   */
  const {
    data: memories,
    error: memoriesError,
  } = await supabase
    .from("memories")
    .select(
      "id, title, memory_date, description, location, mood, music, unlock_date"
    )
    .eq("user_id", userId)
    .order("memory_date", {
      ascending: false,
    });

  if (memoriesError) {
    throw new Error(
      "Unable to load memories."
    );
  }

  const memoryList =
    (memories ?? []) as Memory[];

  const memoryIds = memoryList.map(
    (memory) => memory.id
  );

  let people: Person[] = [];
  let tags: MemoryTag[] = [];

  if (memoryIds.length > 0) {
    const [
      peopleResult,
      tagsResult,
    ] = await Promise.all([
      supabase
        .from("memory_people")
        .select("memory_id, person_name")
        .in("memory_id", memoryIds),

      supabase
        .from("memory_tags")
        .select("memory_id, tag")
        .in("memory_id", memoryIds),
    ]);

    if (peopleResult.error) {
      throw new Error(
        "Unable to load memory people."
      );
    }

    if (tagsResult.error) {
      throw new Error(
        "Unable to load memory tags."
      );
    }

    people =
      (peopleResult.data ?? []) as Person[];

    tags =
      (tagsResult.data ?? []) as MemoryTag[];
  }

  /*
   * Create lookup maps.
   */
  const peopleByMemory = new Map<
    string,
    string[]
  >();

  for (const person of people) {
    const current =
      peopleByMemory.get(
        person.memory_id
      ) ?? [];

    current.push(person.person_name);

    peopleByMemory.set(
      person.memory_id,
      current
    );
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
   * Search across:
   * - Title
   * - Description
   * - Location
   * - People
   * - Tags
   * - Music
   * - Date
   */
  const normalizedQuery =
    query.toLowerCase();

  const results = query
    ? memoryList.filter((memory) => {
        const memoryPeople =
          peopleByMemory.get(memory.id) ??
          [];

        const memoryTags =
          tagsByMemory.get(memory.id) ??
          [];

        const searchableText = [
          memory.title,
          memory.description,
          memory.location ?? "",
          memory.music ?? "",
          memory.memory_date,
          ...memoryPeople,
          ...memoryTags,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedQuery
        );
      })
    : [];

  const isLocked = (
    unlockDate: string | null
  ) => {
    if (!unlockDate) {
      return false;
    }

    return (
      new Date(unlockDate).getTime() >
      new Date(databaseTime).getTime()
    );
  };

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

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Search Memories
          </h1>

          <p className="mt-2 text-muted-foreground">
            Find a moment by its story, place,
            people, music, tags or date.
          </p>
        </div>

        {/* Search form */}
        <form
          method="GET"
          className="mt-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search your memories..."
                autoComplete="off"
                className="w-full rounded-2xl border bg-card py-3.5 pl-12 pr-4 outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-primary px-6 py-3.5 font-medium text-primary-foreground transition hover:opacity-90"
            >
              Search
            </button>
          </div>
        </form>

        {/* Search information */}
        {query && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Search results for{" "}
              <span className="font-medium text-foreground">
                “{query}”
              </span>
            </p>

            <Link
              href="/search"
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Clear
            </Link>
          </div>
        )}

        {/* No query */}
        {!query && (
          <div className="mt-10 rounded-3xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <SearchIcon className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Search your memory vault
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Search using a title, description,
              location, person, tag, music or
              date.
            </p>

            <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
              {[
                "College",
                "Pune",
                "Friends",
                "Travel",
                "2026",
              ].map((example) => (
                <Link
                  key={example}
                  href={`/search?q=${encodeURIComponent(
                    example
                  )}`}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
                >
                  {example}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && results.length > 0 && (
          <div className="mt-8">
            <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
              <SearchIcon className="h-4 w-4" />

              <span>
                {results.length}{" "}
                {results.length === 1
                  ? "memory"
                  : "memories"}{" "}
                found
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {results.map((memory) => {
                const locked = isLocked(
                  memory.unlock_date
                );

                const memoryPeople =
                  peopleByMemory.get(
                    memory.id
                  ) ?? [];

                const memoryTags =
                  tagsByMemory.get(
                    memory.id
                  ) ?? [];

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
                 * Important:
                 *
                 * If locked, do not show any
                 * private memory content.
                 */
                if (locked) {
                  return (
                    <div
                      key={memory.id}
                      className="rounded-2xl border bg-card p-6 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Lock className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="font-semibold">
                            Memory Locked
                          </h2>

                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            A matching memory
                            exists, but its
                            private content is
                            still locked.
                          </p>

                          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />

                            {formattedDate}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={memory.id}
                    href={`/memories/${memory.id}`}
                    className="group block rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-xl font-semibold transition group-hover:text-primary">
                          {memory.title}
                        </h2>

                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4 shrink-0" />

                          <span>
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-medium">
                        Open →
                      </span>
                    </div>

                    {memory.location && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />

                        <span>
                          {memory.location}
                        </span>
                      </div>
                    )}

                    {memory.description && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {memory.description}
                      </p>
                    )}

                    {memory.music && (
                      <p className="mt-4 text-sm">
                        🎵 {memory.music}
                      </p>
                    )}

                    {memoryPeople.length >
                      0 && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                        <Users className="mt-0.5 h-4 w-4 shrink-0" />

                        <span>
                          {memoryPeople.join(
                            ", "
                          )}
                        </span>
                      </div>
                    )}

                    {memoryTags.length >
                      0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {memoryTags.map(
                          (tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* No results */}
        {query && results.length === 0 && (
          <div className="mt-10 rounded-3xl border bg-card p-10 text-center shadow-sm">
            <div className="text-5xl">
              🔎
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No memories found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              We couldn't find a memory matching
              “{query}”.
            </p>

            <p className="mt-4 text-sm text-muted-foreground">
              Try another title, place, person,
              tag, song or date.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}