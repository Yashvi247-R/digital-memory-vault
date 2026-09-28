"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("PWA service worker registered successfully.");
      } catch (error) {
        console.error("PWA service worker registration failed:", error);
      }
    };

    void registerServiceWorker();
  }, []);

  return null;
}
