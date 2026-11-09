import { loadEnvConfig } from "@next/env";
import additionalRows from "../src/lib/additional-materials-resources.json";
import { requireSupabase } from "../src/lib/supabase/server";

loadEnvConfig(process.cwd());

async function checkAllVideos() {
  const client = requireSupabase();
  const { data: dbRows } = await client
    .from("learning_resources")
    .select("id, kind, resource");

  const dbMap = new Map((dbRows || []).map(r => [r.id, r.resource]));
  
  const allVideoResources = (additionalRows as any[])
    .filter(r => r.kind === "video")
    .map(r => {
      const stored = dbMap.get(r.resource.id);
      return stored || r.resource;
    });

  console.log(`Checking ${allVideoResources.length} total videos for playback/availability...`);

  const results = {
    ok: 0,
    notFound: 0,
    failed: 0,
    byCategory: {
      supabaseStorage: { total: 0, ok: 0, broken: 0 },
      github20261020: { total: 0, ok: 0, broken: 0 },
      github20261025: { total: 0, ok: 0, broken: 0 },
      other: { total: 0, ok: 0, broken: 0 }
    },
    brokenList: [] as any[]
  };

  // Check with concurrency 10
  const queue = [...allVideoResources];
  const workers = Array.from({ length: 10 }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const url = item.videoUrl;
      let category: keyof typeof results.byCategory = "other";
      if (url.includes("supabase.co")) category = "supabaseStorage";
      else if (url.includes("video-lessons-2026-10-20")) category = "github20261020";
      else if (url.includes("learning-materials-2026-10-25")) category = "github20261025";

      results.byCategory[category].total++;

      try {
        const resp = await fetch(url, {
          method: "HEAD",
          headers: { Range: "bytes=0-1024" },
          signal: AbortSignal.timeout(10000)
        });

        if (resp.status === 200 || resp.status === 206) {
          results.ok++;
          results.byCategory[category].ok++;
        } else {
          results.notFound++;
          results.byCategory[category].broken++;
          results.brokenList.push({ id: item.id, title: item.title, url, status: resp.status, inDb: dbMap.has(item.id) });
        }
      } catch (err: any) {
        results.failed++;
        results.byCategory[category].broken++;
        results.brokenList.push({ id: item.id, title: item.title, url, error: err.message, inDb: dbMap.has(item.id) });
      }
    }
  });

  await Promise.all(workers);

  console.log("\n=== VIDEO AVAILABILITY REPORT ===");
  console.log(`Total videos checked: ${allVideoResources.length}`);
  console.log(`Accessible (200/206): ${results.ok}`);
  console.log(`Broken (404/error): ${results.notFound + results.failed}`);
  console.log("\nBreakdown by category:");
  console.log(JSON.stringify(results.byCategory, null, 2));

  console.log(`\nSample broken videos (up to 10):`);
  console.log(JSON.stringify(results.brokenList.slice(0, 10), null, 2));

  console.log(`\nBroken videos in DB vs not in DB:`);
  const brokenInDb = results.brokenList.filter(b => b.inDb).length;
  const brokenNotInDb = results.brokenList.filter(b => !b.inDb).length;
  console.log(`In DB: ${brokenInDb}, Not in DB (only in JSON): ${brokenNotInDb}`);
}

checkAllVideos().catch(console.error);
