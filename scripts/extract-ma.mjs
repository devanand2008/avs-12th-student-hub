async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  // Find const ma = ... or function ma(...)
  const maPos = js.indexOf("ma=");
  console.log("ma= at:", maPos);
  if (maPos !== -1) {
    console.log(js.slice(maPos, maPos + 8000));
  }
}
run().catch(console.error);
