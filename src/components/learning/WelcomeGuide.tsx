"use client";

import { fetchCurrentSession } from "@/lib/current-session-client";
import { useEffect, useState } from "react";
export default function WelcomeGuide() {
  // Public help remains available if the optional authentication probe fails.
  const [signedOut, setSignedOut] = useState(true);
  useEffect(() => {
    const c = new AbortController();
    fetchCurrentSession(c.signal)
      .then((r) => setSignedOut(r.status === 401))
      .catch(() => {});
    return () => c.abort();
  }, []);
  if (!signedOut) return null;
  return (
    <section
      className="mx-auto my-6 w-full max-w-4xl rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm sm:p-6"
      aria-label="Student welcome video"
    >
      <h2 className="text-xl font-bold text-slate-900">
        New to Skill Up? Start here
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Watch the 5-minute app guide with English and Tamil captions: create
        your account, sign in, find notes and videos, practise questions and
        review progress.
      </p>
      <details className="mt-4">
        <summary className="cursor-pointer rounded-lg bg-blue-50 p-3 font-bold text-blue-800">
          Watch app instructions · செயலி வழிகாட்டி
        </summary>
        <video
          controls
          playsInline
          preload="none"
          poster="/skillup-logo.png"
          className="mt-4 w-full rounded-xl bg-slate-950"
          aria-label="Skill Up student instruction video"
        >
          <source src="/media/student-guide.mp4" type="video/mp4" />
          <track
            kind="captions"
            src="/media/student-guide.vtt"
            srcLang="en"
            label="English and Tamil"
          />
          Your browser cannot play this video. Use the instructions below.
        </video>
        <p className="mt-2 text-xs text-slate-500">
          The recorded walkthrough uses a demonstration account. Follow the
          current app labels when screens differ.
        </p>
      </details>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Create an account with your own email and password, or sign in.</li>
        <li>
          Choose a subject and chapter to open notes, videos or one-mark
          practice.
        </li>
        <li>
          Submit your quiz, review feedback and see your points on the Learning
          scoreboard.
        </li>
      </ol>
    </section>
  );
}
