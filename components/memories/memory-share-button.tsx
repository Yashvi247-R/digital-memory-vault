"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function MemoryShareButton() {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Memory",
          text: "View this memory in Digital Memory Vault.",
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);

      setShared(true);

      setTimeout(() => {
        setShared(false);
      }, 2000);
    } catch {
      // User cancelled the native share dialog.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted"
    >
      {shared ? (
        <>
          <Check className="h-4 w-4" />
          Link Copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </button>
  );
}