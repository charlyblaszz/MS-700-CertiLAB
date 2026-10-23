"use client";

import { useEffect, useState } from "react";

export function useExamTimer(startedAt?: number, active = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || !active) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, active]);

  return startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}
