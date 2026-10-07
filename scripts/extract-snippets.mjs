async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  // Let's find where the Landing / Home page is defined
  // Look for sections, hero, navbar
  console.log("Looking for hero section...");
  const match = js.match(/(?:function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{[^}]*AVS 12th Hub[^}]+)/g) || [];
  console.log("Matches:", match.length);

  // Let's print snippets around 'AVS 12th Hub'
  let pos = 0;
  while ((pos = js.indexOf("AVS 12th Hub", pos + 1)) !== -1) {
    console.log("--- Snippet around AVS 12th Hub at pos", pos, "---");
    console.log(js.slice(Math.max(0, pos - 300), Math.min(js.length, pos + 500)));
    console.log("\n=====================\n");
  }
}
run().catch(console.error);
