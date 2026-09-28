"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

type MemoryFormProps = {
  userId: string;
  memory?: Memory;
};

export default function MemoryForm({
  userId,
  memory,
}: MemoryFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(memory?.title ?? "");
  const [memoryDate, setMemoryDate] = useState(
    memory?.memory_date ?? ""
  );
  const [description, setDescription] = useState(
    memory?.description ?? ""
  );
  const [location, setLocation] = useState(
    memory?.location ?? ""
  );
  const [mood, setMood] = useState(memory?.mood ?? "");
  const [music, setMusic] = useState(memory?.music ?? "");
  const [unlockDate, setUnlockDate] = useState(
    memory?.unlock_date
      ? new Date(memory.unlock_date)
          .toISOString()
          .slice(0, 16)
      : ""
  );

  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addPerson() {
    const value = personInput.trim();

    if (!value) return;

    if (!people.includes(value)) {
      setPeople([...people, value]);
    }

    setPersonInput("");
  }

  function removePerson(person: string) {
    setPeople(people.filter((item) => item !== person));
  }

  function addTag() {
    const value = tagInput.trim();

    if (!value) return;

    if (!tags.includes(value)) {
      setTags([...tags, value]);
    }

    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((item) => item !== tag));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    if (!title.trim()) {
      setError("Memory title is required.");
      setLoading(false);
      return;
    }

    if (!memoryDate) {
      setError("Memory date is required.");
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      setLoading(false);
      return;
    }

    const memoryData = {
      user_id: userId,
      title: title.trim(),
      memory_date: memoryDate,
      description: description.trim(),
      location: location.trim() || null,
      mood: mood || null,
      music: music.trim() || null,
      unlock_date: unlockDate
        ? new Date(unlockDate).toISOString()
        : null,
    };

    let memoryId = memory?.id;

    if (memory) {
      const { error: updateError } = await supabase
        .from("memories")
        .update(memoryData)
        .eq("id", memory.id)
        .eq("user_id", userId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      await supabase
        .from("memory_people")
        .delete()
        .eq("memory_id", memory.id);

      await supabase
        .from("memory_tags")
        .delete()
        .eq("memory_id", memory.id);
    } else {
      const { data, error: insertError } = await supabase
        .from("memories")
        .insert(memoryData)
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      memoryId = data.id;
    }

    if (people.length > 0 && memoryId) {
      const { error: peopleError } = await supabase
        .from("memory_people")
        .insert(
          people.map((person) => ({
            memory_id: memoryId,
            person_name: person,
          }))
        );

      if (peopleError) {
        setError(peopleError.message);
        setLoading(false);
        return;
      }
    }

    if (tags.length > 0 && memoryId) {
      const { error: tagsError } = await supabase
        .from("memory_tags")
        .insert(
          tags.map((tag) => ({
            memory_id: memoryId,
            tag,
          }))
        );

      if (tagsError) {
        setError(tagsError.message);
        setLoading(false);
        return;
      }
    }

    router.push(`/memories/${memoryId}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium"
        >
          Memory Title *
        </label>

        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="College Trip 2026"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="memoryDate"
          className="mb-2 block text-sm font-medium"
        >
          Date *
        </label>

        <input
          id="memoryDate"
          type="date"
          value={memoryDate}
          onChange={(event) => setMemoryDate(event.target.value)}
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="location"
          className="mb-2 block text-sm font-medium"
        >
          Location
        </label>

        <input
          id="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Pune"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="people"
          className="mb-2 block text-sm font-medium"
        >
          People
        </label>

        <div className="flex gap-2">
          <input
            id="people"
            value={personInput}
            onChange={(event) => setPersonInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addPerson();
              }
            }}
            placeholder="Person's name"
            className="min-w-0 flex-1 rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
          />

          <button
            type="button"
            onClick={addPerson}
            className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Add
          </button>
        </div>

        {people.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {people.map((person) => (
              <button
                key={person}
                type="button"
                onClick={() => removePerson(person)}
                className="rounded-full border px-3 py-1 text-sm"
              >
                {person} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="mood"
          className="mb-2 block text-sm font-medium"
        >
          Mood / Feeling
        </label>

        <select
          id="mood"
          value={mood}
          onChange={(event) => setMood(event.target.value)}
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        >
          <option value="">Select mood</option>
          <option value="Happy">Happy</option>
          <option value="Excited">Excited</option>
          <option value="Peaceful">Peaceful</option>
          <option value="Love">Love</option>
          <option value="Nostalgic">Nostalgic</option>
          <option value="Sad">Sad</option>
          <option value="Grateful">Grateful</option>
          <option value="Proud">Proud</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="music"
          className="mb-2 block text-sm font-medium"
        >
          Music / Song
        </label>

        <input
          id="music"
          value={music}
          onChange={(event) => setMusic(event.target.value)}
          placeholder="Song title"
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium"
        >
          Description *
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Write about this memory..."
          rows={7}
          className="w-full resize-none rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
          required
        />
      </div>

      <div>
        <label
          htmlFor="tags"
          className="mb-2 block text-sm font-medium"
        >
          Tags
        </label>

        <div className="flex gap-2">
          <input
            id="tags"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="travel"
            className="min-w-0 flex-1 rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
          />

          <button
            type="button"
            onClick={addTag}
            className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted"
          >
            Add
          </button>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="rounded-full border px-3 py-1 text-sm"
              >
                #{tag} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="unlockDate"
          className="mb-2 block text-sm font-medium"
        >
          Future Unlock Date
        </label>

        <input
          id="unlockDate"
          type="datetime-local"
          value={unlockDate}
          onChange={(event) => setUnlockDate(event.target.value)}
          className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
        />

        <p className="mt-2 text-xs text-muted-foreground">
          Future unlock behavior will be fully implemented in Phase 9.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Saving..."
          : memory
            ? "Update Memory"
            : "Save Memory"}
      </button>
    </form>
  );
}