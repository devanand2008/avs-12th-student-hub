// Backward-compatible entry point; npm run dev uses the same launcher.
process.argv.splice(2, 0, "dev");
await import("./start-web.mjs");
