"use client";

import { useEffect, useState } from "react";

type MemoryCountdownProps = {
  unlockDate: string;
};

function getTimeRemaining(targetDate: number) {
  const difference = Math.max(
    0,
    targetDate - Date.now()
  );

  const totalSeconds = Math.floor(
    difference / 1000
  );

  const days = Math.floor(
    totalSeconds / (60 * 60 * 24)
  );

  const hours = Math.floor(
    (totalSeconds % (60 * 60 * 24)) /
      (60 * 60)
  );

  const minutes = Math.floor(
    (totalSeconds % (60 * 60)) / 60
  );

  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    finished: difference === 0,
  };
}

export default function MemoryCountdown({
  unlockDate,
}: MemoryCountdownProps) {
  const targetDate = new Date(
    unlockDate
  ).getTime();

  const [remaining, setRemaining] =
    useState(() =>
      getTimeRemaining(targetDate)
    );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = getTimeRemaining(
        targetDate
      );

      setRemaining(next);

      if (next.finished) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [targetDate]);

  if (remaining.finished) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <div className="text-4xl">🔓</div>

        <h2 className="mt-3 text-xl font-semibold">
          Memory Unlocked
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Refresh the page to open your memory.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-8">
      <div className="text-5xl">🔒</div>

      <h1 className="mt-4 text-2xl font-bold">
        Memory Locked
      </h1>

      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        This memory is waiting for you.
      </p>

      <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-4">
        <TimeBox
          value={remaining.days}
          label="Days"
        />

        <TimeBox
          value={remaining.hours}
          label="Hours"
        />

        <TimeBox
          value={remaining.minutes}
          label="Minutes"
        />

        <TimeBox
          value={remaining.seconds}
          label="Seconds"
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Opens on{" "}
        {new Date(unlockDate).toLocaleString(
          "en-IN"
        )}
      </p>
    </div>
  );
}

function TimeBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-muted p-3 sm:p-4">
      <div className="text-xl font-bold sm:text-2xl">
        {value}
      </div>

      <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {label}
      </div>
    </div>
  );
}