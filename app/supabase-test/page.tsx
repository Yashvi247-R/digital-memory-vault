import { createClient } from "@/lib/supabase/server";

export default async function SupabaseTestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getSession();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">
          Supabase Connection Test
        </h1>

        {error ? (
          <p className="mt-4 text-red-600">
            Supabase error: {error.message}
          </p>
        ) : (
          <p className="mt-4 text-green-600">
            Supabase connection is working.
          </p>
        )}

        <pre className="mt-6 overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}