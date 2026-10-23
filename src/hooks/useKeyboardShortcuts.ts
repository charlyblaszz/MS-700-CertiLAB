"use client";

import { useEffect } from "react";

interface ShortcutOptions {
  enabled: boolean;
  previous: () => void;
  next: () => void;
  toggleReview: () => void;
  toggleReveal: () => void;
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  useEffect(() => {
    if (!options.enabled) return undefined;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        options.previous();
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        options.next();
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        options.toggleReview();
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        options.toggleReveal();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [options]);
}
