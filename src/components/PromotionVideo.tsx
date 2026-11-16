"use client";
import { useState } from "react";
import Link from "next/link";
export default function PromotionVideo() {
  const [failed, setFailed] = useState(false);
  return (
    <section
      aria-labelledby="app-tour-title"
      className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2"
    >
      <div>
        <h2 id="app-tour-title" className="text-3xl font-bold">
          See how Skill Up works
        </h2>
        <p className="mt-4 text-slate-600">
          Watch our app introduction and discover notes, video lessons, practice
          and the 3D Learning Lab. Use the player controls to turn on sound or
          pause.
        </p>
        <h3 className="mt-6 text-xl font-semibold">Create your account</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
          <li>
            Open Create Account and enter your student and school details.
          </li>
          <li>Enter your email address and choose your own password.</li>
          <li>
            Submit the form and follow the confirmation shown. Use your email
            and password when signing in.
          </li>
        </ol>
        <Link
          href="/register"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
        >
          Create Account
        </Link>
        <Link
          href="/login"
          className="ml-4 inline-flex py-3 font-semibold text-blue-700"
        >
          Sign in
        </Link>
      </div>
      <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
        <video
          aria-label="Skill Up app introduction"
          className="aspect-[9/16] w-full"
          src="https://github.com/devanand2008/avs-12th-student-hub/releases/download/learning-materials-2026-10-25/71515a079c14d4e8b0a9603847414a0719faed8ca665585e27ef7e207dc7080e.mp4"
          poster="/images/skillup-promotion.jpg"
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          onError={() => setFailed(true)}
        />
        {failed && (
          <p role="status" className="p-4 text-white">
            The video could not load. Please try again when your connection
            improves.
          </p>
        )}
      </div>
    </section>
  );
}
