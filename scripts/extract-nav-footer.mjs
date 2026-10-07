async function run() {
  const jsUrl = "https://avs-12-hub.netlify.app/assets/index-CrWsQVn5.js";
  const js = await fetch(jsUrl).then((r) => r.text());

  const laPos = js.indexOf("la=");
  if (laPos !== -1) {
    console.log("la= (Navbar) definition:");
    console.log(js.slice(laPos, laPos + 3500));
  }
  const daPos = js.indexOf("da=");
  if (daPos !== -1) {
    console.log("da= (Footer) definition:");
    console.log(js.slice(daPos, daPos + 3000));
  }
}
run().catch(console.error);
