import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white">
            <LockKeyhole size={26} />
          </div>

          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-stone-500">
            <Sparkles size={16} />
            Digital Memory Vault
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Your memories deserve a place in time.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600">
            Save today. Remember forever.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-stone-900 px-7 py-3 font-medium text-white transition hover:bg-stone-700"
            >
              Create Your Vault
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-stone-300 bg-white px-7 py-3 font-medium text-stone-900 transition hover:bg-stone-100"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}