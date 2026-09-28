"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type MediaItem = {
  id: string;
  media_type: "image" | "video";
  file_name: string;
  storage_path: string;
};

type MediaWithUrl = MediaItem & {
  signedUrl: string;
};

type MemoryMediaGalleryProps = {
  memoryId: string;
};

export default function MemoryMediaGallery({
  memoryId,
}: MemoryMediaGalleryProps) {
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  async function loadMedia() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error: mediaError } =
      await supabase
        .from("memory_media")
        .select(
          "id, media_type, file_name, storage_path"
        )
        .eq("memory_id", memoryId)
        .order("created_at", {
          ascending: true,
        });

    if (mediaError) {
      setError(mediaError.message);
      setLoading(false);
      return;
    }

    const mediaWithUrls: MediaWithUrl[] = [];

    for (const item of data ?? []) {
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("memory-media")
          .createSignedUrl(
            item.storage_path,
            60 * 60
          );

      if (!signedError && signedData?.signedUrl) {
        mediaWithUrls.push({
          ...item,
          signedUrl: signedData.signedUrl,
        });
      }
    }

    setMedia(mediaWithUrls);
    setLoading(false);
  }

  useEffect(() => {
    loadMedia();
  }, [memoryId]);

  async function deleteMedia(item: MediaWithUrl) {
    const confirmed = window.confirm(
      `Delete ${item.file_name}?`
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error: storageError } =
      await supabase.storage
        .from("memory-media")
        .remove([item.storage_path]);

    if (storageError) {
      setError(storageError.message);
      return;
    }

    const { error: databaseError } =
      await supabase
        .from("memory_media")
        .delete()
        .eq("id", item.id)
        .eq("memory_id", memoryId);

    if (databaseError) {
      setError(databaseError.message);
      return;
    }

    setMedia((current) =>
      current.filter(
        (mediaItem) => mediaItem.id !== item.id
      )
    );

    setSelectedIndex(null);
  }

  function showPrevious() {
    if (selectedIndex === null || media.length === 0) {
      return;
    }

    setSelectedIndex(
      selectedIndex === 0
        ? media.length - 1
        : selectedIndex - 1
    );
  }

  function showNext() {
    if (selectedIndex === null || media.length === 0) {
      return;
    }

    setSelectedIndex(
      selectedIndex === media.length - 1
        ? 0
        : selectedIndex + 1
    );
  }

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (selectedIndex === null) return;

      if (event.key === "Escape") {
        setSelectedIndex(null);
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [selectedIndex, media.length]);

  if (loading) {
    return (
      <section className="rounded-2xl border bg-card p-6">
        <div className="animate-pulse">
          Loading your memories...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        {error}
      </section>
    );
  }

  if (media.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">
          Photos & Videos
        </h2>

        <p className="text-sm text-muted-foreground">
          No photos or videos added yet.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            Photos & Videos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {media.length}{" "}
            {media.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item, index) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border bg-muted"
            >
              {item.media_type === "image" ? (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex(index)
                  }
                  className="block aspect-square w-full"
                >
                  <img
                    src={item.signedUrl}
                    alt={item.file_name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </button>
              ) : (
                <div className="aspect-video">
                  <video
                    src={item.signedUrl}
                    controls
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => deleteMedia(item)}
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100"
                aria-label={`Delete ${item.file_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {selectedIndex !== null &&
        media[selectedIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <button
              type="button"
              onClick={() => setSelectedIndex(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label="Close image viewer"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-6"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex max-h-[90vh] max-w-[90vw] items-center justify-center">
              <img
                src={media[selectedIndex].signedUrl}
                alt={media[selectedIndex].file_name}
                className="max-h-[85vh] max-w-full rounded-lg object-contain"
              />
            </div>

            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-6"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
              {selectedIndex + 1} / {media.length}
            </div>
          </div>
        )}
    </>
  );
}