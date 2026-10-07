async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  // Let's print from 85000 to 102000 in chunks
  console.log("Chunk 1 (85000 - 92000):");
  console.log(js.slice(85000, 92000));
  console.log("\n=====================\n");
  console.log("Chunk 2 (92000 - 99000):");
  console.log(js.slice(92000, 99000));
  console.log("\n=====================\n");
  console.log("Chunk 3 (99000 - 106000):");
  console.log(js.slice(99000, 106000));
}
run().catch(console.error);
