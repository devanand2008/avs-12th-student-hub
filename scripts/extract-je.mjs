async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  const jePos = js.indexOf("Je=");
  if (jePos !== -1) {
    console.log("Je= definition:");
    console.log(js.slice(jePos, jePos + 2000));
  }
}
run().catch(console.error);
