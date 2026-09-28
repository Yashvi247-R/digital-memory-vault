"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type MemoryFavoriteButtonProps = {
  memoryId: string;
  initialFavorite: boolean;
};

export default function MemoryFavoriteButton({
  memoryId,
  initialFavorite,
}: MemoryFavoriteButtonProps) {
  const [favorite, setFavorite] =
    useState(initialFavorite);

  const [loading, setLoading] = useState(false);

  async function toggleFavorite() {
    if (loading) return;

    setLoading(true);

    const nextValue = !favorite;

    const supabase = createClient();

    const { error } = await supabase
      .from("memories")
      .update({
        is_favorite: nextValue,
      })
      .eq("id", memoryId);

    if (!error) {
      setFavorite(nextValue);
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      aria-label={
        favorite
          ? "Remove from favorites"
          : "Add to favorites"
      }
      className={`rounded-lg border p-2 transition ${
        favorite
          ? "text-red-500"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Heart
        className={`h-5 w-5 ${
          favorite ? "fill-current" : ""
        }`}
      />
    </button>
  );
}