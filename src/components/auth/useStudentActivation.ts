"use client";
import { useEffect, useState } from "react";
import type { StudentActivationMode } from "@/lib/auth/activation";

export function useStudentActivation() {
  const [mode, setMode] = useState<StudentActivationMode | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/config", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (
          !controller.signal.aborted &&
          ["admin", "sms"].includes(data.studentActivationMode)
        )
          setMode(data.studentActivationMode);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return mode;
}
