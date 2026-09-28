import Link from "next/link";
import { Lock } from "lucide-react";

import MemoryCountdown from "@/components/memories/memory-countdown";

type LockedMemoryProps = {
  unlockDate: string;
};

export default function LockedMemory({
  unlockDate,
}: LockedMemoryProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/memories"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to Memories
        </Link>

        <div className="mt-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Lock className="h-8 w-8" />
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight">
              A memory is waiting for you
            </h1>

            <p className="mt-2 text-muted-foreground">
              This time capsule is still locked.
            </p>
          </div>

          <MemoryCountdown
            unlockDate={unlockDate}
          />

          <div className="mt-6 rounded-2xl border bg-card p-5 text-center text-sm text-muted-foreground">
            🔐 Your memory content remains private until
            the unlock date.
          </div>
        </div>
      </div>
    </main>
  );
}