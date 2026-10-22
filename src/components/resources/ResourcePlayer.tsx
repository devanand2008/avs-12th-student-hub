"use client";
import { useEffect, useRef, useState } from "react";
import { youtubeEmbedUrl } from "@/lib/media";

export default function ResourcePlayer({
  url,
  title,
  supported,
}: {
  url: string;
  title: string;
  supported: boolean;
}) {
  const [started, setStarted] = useState(false),
    [attempt, setAttempt] = useState(0),
    [state, setState] = useState(
      "Choose Play to load YouTube. No video connection is made before you choose.",
    );
  const frame = useRef<HTMLIFrameElement>(null),
    embed = youtubeEmbedUrl(url);
  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(
      () =>
        setState((s) =>
          s === "Playing"
            ? s
            : "If the player is still unavailable, open the original video or retry below.",
        ),
      18000,
    );
    function message(event: MessageEvent) {
      if (
        event.origin !== "https://www.youtube-nocookie.com" ||
        event.source !== frame.current?.contentWindow
      )
        return;
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.event === "onError")
          setState(
            "YouTube could not play this video here. It may be unavailable or restricted. Open the original video.",
          );
        if (data.event === "onStateChange" && data.info === 1)
          setState("Playing");
        if (data.event === "onReady")
          setState("Player ready. Use the YouTube controls to play.");
      } catch {}
    }
    window.addEventListener("message", message);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", message);
    };
  }, [started, attempt]);
  function subscribe() {
    const target = frame.current?.contentWindow;
    target?.postMessage(
      JSON.stringify({ event: "listening", id: "skillup-resource-player" }),
      "https://www.youtube-nocookie.com",
    );
    for (const event of ["onReady", "onError", "onStateChange"])
      target?.postMessage(
        JSON.stringify({
          event: "command",
          func: "addEventListener",
          args: [event],
        }),
        "https://www.youtube-nocookie.com",
      );
  }
  if (!supported || !embed)
    return (
      <p className="rounded-2xl bg-amber-50 p-5">
        In-app playback is unavailable. Use the original YouTube link below.
      </p>
    );
  return (
    <section aria-label="Video player" className="space-y-4">
      <div className="aspect-video min-h-[200px] overflow-hidden rounded-3xl bg-slate-950 text-white">
        {started ? (
          <iframe
            key={attempt}
            ref={frame}
            title={title}
            src={`${embed}?enablejsapi=1&rel=0`}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={subscribe}
            onError={() =>
              setState(
                "The video player could not load. Open the original video below.",
              )
            }
          />
        ) : (
          <div className="grid h-full place-content-center gap-4 p-6 text-center">
            <span className="text-sm text-blue-200">YOUTUBE LESSON</span>
            <button
              className="rounded-full bg-blue-600 px-8 py-3 font-bold hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-4"
              onClick={() => {
                setStarted(true);
                setState("Loading YouTube player…");
              }}
            >
              Play lesson
            </button>
            <p className="max-w-sm text-sm text-slate-300">
              Loads the privacy-enhanced YouTube player when you choose to
              watch.
            </p>
          </div>
        )}
      </div>
      <p role="status" aria-live="polite" className="text-sm text-slate-600">
        {state}
      </p>
      {started && (
        <div className="flex flex-wrap gap-4 text-sm">
          <button
            className="font-bold text-blue-700 underline"
            onClick={() => {
              setAttempt((a) => a + 1);
              setState("Loading YouTube player…");
            }}
          >
            Retry player
          </button>
          <button
            className="text-slate-600 underline"
            onClick={() =>
              setState(
                "YouTube may block embedding or require an account, region or age check. Use the original video link; Skill Up cannot bypass these restrictions.",
              )
            }
          >
            Video not playing?
          </button>
        </div>
      )}
    </section>
  );
}
