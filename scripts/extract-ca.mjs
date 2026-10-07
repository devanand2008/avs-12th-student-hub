async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  const caPos = js.indexOf("ca=");
  if (caPos !== -1) {
    console.log("ca= definition:");
    console.log(js.slice(caPos, caPos + 4000));
  }
}
run().catch(console.error);
