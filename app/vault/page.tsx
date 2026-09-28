import Link from "next/link";
import {
  CalendarDays,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type VaultMemory = {
  id: string;
  memory_date: string;
  unlock_date: string | null;
  is_favorite: boolean;
};

export default async function VaultPage() {
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
      "Unable to verify vault time."
    );
  }

  const {
    data: memories,
    error: memoriesError,
  } = await supabase
    .from("memories")
    .select(
      "id, memory_date, unlock_date, is_favorite"
    )
    .eq("user_id", userId)
    .not("unlock_date", "is", null)
    .order("unlock_date", {
      ascending: true,
    });

  if (memoriesError) {
    throw new Error(
      "Unable to load vault memories."
    );
  }

  const memoryList =
    (memories ?? []) as VaultMemory[];

  const lockedMemories =
    memoryList.filter(
      (memory) =>
        memory.unlock_date &&
        new Date(
          memory.unlock_date
        ).getTime() >
          new Date(
            databaseTime
          ).getTime()
    );

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← Dashboard
          </Link>

          <div className="mt-6 rounded-3xl border bg-card p-7 shadow-sm sm:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Your Vault
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  A private space for memories
                  waiting for their future
                  moment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vault information */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-2xl font-bold">
              {lockedMemories.length}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Locked memories
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="text-2xl">
              🔐
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Private storage
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="text-2xl">
              ⏳
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Waiting for the future
            </p>
          </div>
        </div>

        {/* Empty state */}
        {lockedMemories.length === 0 && (
          <div className="mt-8 rounded-3xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Your vault is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Memories with future unlock dates
              will appear here.
            </p>

            <Link
              href="/memories/new"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Create Future Memory
            </Link>
          </div>
        )}

        {/* Locked memories */}
        {lockedMemories.length > 0 && (
          <div className="mt-8">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Waiting to be unlocked
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                The contents remain hidden until
                their unlock date.
              </p>
            </div>

            <div className="space-y-4">
              {lockedMemories.map(
                (memory) => {
                  const unlockDate =
                    new Date(
                      memory.unlock_date!
                    );

                  const memoryDate =
                    new Date(
                      `${memory.memory_date}T00:00:00`
                    );

                  return (
                    <div
                      key={memory.id}
                      className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <Lock className="h-5 w-5" />
                          </div>

                          <div>
                            <h3 className="font-semibold">
                              Memory Capsule
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                              Content hidden until
                              unlock.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:min-w-[280px]">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Memory date
                            </div>

                            <p className="mt-1 text-sm font-medium">
                              {memoryDate.toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" />
                              Unlocks
                            </div>

                            <p className="mt-1 text-sm font-medium">
                              {unlockDate.toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Security message */}
        <div className="mt-8 rounded-2xl border bg-card p-5 text-center text-sm text-muted-foreground">
          🔐 Your locked memory content remains
          private until its unlock date.
        </div>
      </div>
    </main>
  );
}