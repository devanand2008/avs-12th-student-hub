import sharp from "sharp";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="0" fill="#071a3d"/><rect x="90" y="90" width="332" height="332" rx="82" fill="#2563eb"/><path d="M146 220l110-55 110 55-110 55z" fill="white"/><path d="M181 253v47q75 58 150 0v-47l-75 37z" fill="#bfdbfe"/><path d="M366 220v91" stroke="white" stroke-width="9" stroke-linecap="round"/><circle cx="366" cy="317" r="10" fill="#38bdf8"/></svg>`;
for (const size of [192, 512])
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
await sharp(Buffer.from(svg)).png().toFile("public/icon-maskable.png");
