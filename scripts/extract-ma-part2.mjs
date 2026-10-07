async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  console.log("Chunk 82000 - 90000:");
  console.log(js.slice(82000, 90000));
  console.log("\n=====================\n");
  console.log("Chunk 90000 - 97000:");
  console.log(js.slice(90000, 97000));
}
run().catch(console.error);
