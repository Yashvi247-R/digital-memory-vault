"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";

type MemoryMediaUploadProps = {
  memoryId: string;
  onUploaded?: () => void;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export default function MemoryMediaUpload({
  memoryId,
  onUploaded,
}: MemoryMediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError("");

    const selectedFiles = Array.from(event.target.files ?? []);

    for (const file of selectedFiles) {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        setError(
          `${file.name}: Only JPG, PNG, WEBP, MP4, WEBM and MOV files are allowed.`
        );
        return;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        setError(`${file.name}: Image must be smaller than 10 MB.`);
        return;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        setError(`${file.name}: Video must be smaller than 50 MB.`);
        return;
      }
    }

    setFiles(selectedFiles);
  }

  async function handleUpload() {
    if (!files.length) {
      setError("Please select at least one file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const supabase = createClient();

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("You must be logged in to upload media.");
      }

      const userId = userData.user.id;

      let completed = 0;

      for (const file of files) {
        const safeFileName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        const filePath = `${userId}/${memoryId}/${crypto.randomUUID()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("memory-media")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Unable to upload ${file.name}: ${uploadError.message}`
          );
        }

        const mediaType = file.type.startsWith("video/")
          ? "video"
          : "image";

        const { error: databaseError } = await supabase
          .from("memory_media")
          .insert({
            memory_id: memoryId,
            media_type: mediaType,
            file_name: file.name,
            storage_path: filePath,
            file_size: file.size,
            mime_type: file.type,
          });

        if (databaseError) {
          await supabase.storage
            .from("memory-media")
            .remove([filePath]);

          throw new Error(
            `Media database record failed: ${databaseError.message}`
          );
        }

        completed += 1;
        setProgress(Math.round((completed / files.length) * 100));
      }

      setFiles([]);
      setProgress(100);
      onUploaded?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload this file. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  function removeSelectedFile(index: number) {
    setFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== index)
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Photos & Videos
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Add photos or videos to this memory.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/50">
        <Upload className="mb-3 h-8 w-8" />

        <span className="font-medium">
          Choose photos or videos
        </span>

        <span className="mt-1 text-sm text-muted-foreground">
          Images up to 10 MB · Videos up to 50 MB
        </span>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {file.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeSelectedFile(index)}
                disabled={uploading}
                className="rounded-lg p-2 hover:bg-muted"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Media"}
      </button>
    </div>
  );
}