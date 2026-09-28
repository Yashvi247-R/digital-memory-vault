"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type ProfileFormProps = {
  userId: string;
  initialProfile: Profile | null;
};

export default function ProfileForm({
  userId,
  initialProfile,
}: ProfileFormProps) {
  const [fullName, setFullName] = useState(
    initialProfile?.full_name ?? ""
  );

  const [username, setUsername] = useState(
    initialProfile?.username ?? ""
  );

  const [avatarUrl, setAvatarUrl] = useState(
    initialProfile?.avatar_url ?? ""
  );

  const [bio, setBio] = useState(
    initialProfile?.bio ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Profile updated successfully.");
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium"
        >
          Full Name
        </label>

        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Enter your full name"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium"
        >
          Username
        </label>

        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Enter a username"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="avatarUrl"
          className="mb-2 block text-sm font-medium"
        >
          Avatar URL
        </label>

        <input
          id="avatarUrl"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://example.com/avatar.jpg"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-2 block text-sm font-medium"
        >
          Bio
        </label>

        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Tell something about yourself"
          rows={4}
          className="w-full resize-none rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}