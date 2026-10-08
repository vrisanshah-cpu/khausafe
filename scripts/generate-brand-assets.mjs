import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const svg = await readFile(path.join(root, "resources", "brand-icon.svg"));

for (const size of [48, 72, 96, 128, 192, 256, 512]) {
  await sharp(svg).resize(size, size).webp({ quality: 92 }).toFile(
    path.join(root, "public", "icons", `icon-${size}.webp`)
  );
}

await sharp(svg).resize(1024, 1024).png().toFile(path.join(root, "resources", "icon.png"));
await sharp(svg).resize(1024, 1024).png().toFile(
  path.join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png")
);

const androidSizes = { ldpi: 36, mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(androidSizes)) {
  const directory = path.join(root, "android", "app", "src", "main", "res", `mipmap-${density}`);
  for (const filename of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
    await sharp(svg).resize(size, size).png().toFile(path.join(directory, filename));
  }
}

console.log("Generated web, iOS, and Android brand icons.");
