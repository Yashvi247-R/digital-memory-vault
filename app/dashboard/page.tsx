import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, bio")
    .eq("id", userId)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Digital Memory Vault</p>
            <h1 className="mt-2 text-3xl font-bold">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <p className="mt-2 text-slate-400">
              Your private space for memories.
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/memories/new"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
          >
            <h2 className="text-xl font-semibold">Create Memory</h2>
            <p className="mt-2 text-sm text-slate-400">
              Save a new memory with photos, videos, details and more.
            </p>
          </Link>

          <Link
            href="/memories"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
          >
            <h2 className="text-xl font-semibold">My Memories</h2>
            <p className="mt-2 text-sm text-slate-400">
              View and manage your saved memories.
            </p>
          </Link>

          <Link
            href="/timeline"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
          >
            <h2 className="text-xl font-semibold">Timeline</h2>
            <p className="mt-2 text-sm text-slate-400">
              Explore your memories chronologically.
            </p>
          </Link>

          <Link
            href="/search"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
          >
            <h2 className="text-xl font-semibold">Search</h2>
            <p className="mt-2 text-sm text-slate-400">
              Find memories using different details.
            </p>
          </Link>

          <Link
            href="/favorites"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
          >
            <h2 className="text-xl font-semibold">Favorites</h2>
            <p className="mt-2 text-sm text-slate-400">
              View your favorite memories.
            </p>
          </Link>

          <Link
            href="/vault"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600"
          >
            <h2 className="text-xl font-semibold">Vault</h2>
            <p className="mt-2 text-sm text-slate-400">
              View memories waiting for their unlock date.
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Account</h2>

          <div className="mt-4 space-y-2 text-sm text-slate-400">
            {profile?.username && (
              <p>
                Username:{" "}
                <span className="text-white">{profile.username}</span>
              </p>
            )}

            <p>
              User ID:{" "}
              <span className="break-all text-slate-300">{userId}</span>
            </p>

            {profile?.bio && (
              <p>
                Bio: <span className="text-slate-300">{profile.bio}</span>
              </p>
            )}
          </div>

          <Link
            href="/profile"
            className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </main>
  );
}