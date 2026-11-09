import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt =
  "joshuaskillup — Skill Up Tamil Nadu Class 12 learning resources";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(
    join(process.cwd(), "public", "skillup-logo.png"),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 60,
        background: "linear-gradient(120deg, #071330, #153e78)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* The supplied site logo is embedded unchanged; no remote image/font dependency. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            alt=""
            width={112}
            height={112}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 700,
                letterSpacing: -2,
              }}
            >
              joshuaskillup
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "#9ddfff",
                marginTop: 8,
              }}
            >
              Skill Up · Learn in English &amp; Tamil
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            Tamil Nadu Class 12
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              marginTop: 20,
              color: "#d9eaff",
            }}
          >
            Notes · MCQ Practice · Interactive 3D Models
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 25,
              marginTop: 16,
              color: "#b9d5f8",
            }}
          >
            Textbooks · Video Lessons · AI Study Tools
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 19,
            color: "#9ddfff",
            borderTop: "1px solid #4a6b9b",
            paddingTop: 20,
          }}
        >
          avs-12th-student-hub.vercel.app
        </div>
      </div>
    </div>,
    size,
  );
}
