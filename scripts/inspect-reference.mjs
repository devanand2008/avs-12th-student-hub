async function run() {
  const html = await fetch("https://avs-12-hub.netlify.app/").then((r) => r.text());
  console.log("HTML length:", html.length);

  // Extract all script and link tags
  const jsUrls = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  const cssUrls = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
  console.log("JS URLs:", jsUrls);
  console.log("CSS URLs:", cssUrls);

  const jsUrl = jsUrls.find((u) => u.includes("index-")) || jsUrls[0];
  if (jsUrl) {
    const fullJsUrl = new URL(jsUrl, "https://avs-12-hub.netlify.app/").href;
    console.log("Fetching JS from:", fullJsUrl);
    const js = await fetch(fullJsUrl).then((r) => r.text());

    // Search for JSX components / titles / text
    const stringMatches = js.match(/"([^"\\]{10,120})"/g) || [];
    const keywords = [
      "AVS",
      "Joshua",
      "Salem",
      "Autonomous",
      "Vice Principal",
      "Handwritten",
      "One Mark",
      "NotebookLM",
      "Biology",
      "Computer Science",
      "Hero",
      "Dashboard",
      "Learning Hub",
      "Welcome",
      "Study Assistant",
      "Stream",
      "Notes",
      "Videos",
      "Quiz",
      "Practice",
      "Contact",
    ];

    const found = new Set();
    for (const s of stringMatches) {
      const clean = s.slice(1, -1);
      if (keywords.some((k) => clean.toLowerCase().includes(k.toLowerCase()))) {
        found.add(clean);
      }
    }
    console.log("KEY STRINGS FOUND (" + found.size + "):");
    console.log(Array.from(found).slice(0, 80));
  }
}

run().catch(console.error);
