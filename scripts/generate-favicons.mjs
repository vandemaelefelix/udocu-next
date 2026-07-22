/**
 * Generates the full cross-platform favicon set from the SVG masters in
 * scripts/favicons/. Uses `sharp` for crisp SVG -> PNG rasterization and
 * ImageMagick (`magick`) to bundle the small PNGs into a multi-size .ico.
 *
 * Run from the repo root:  node scripts/generate-favicons.mjs
 *
 * Outputs:
 *   src/app/icon.svg                                (u glyph, served as-is)
 *   src/app/favicon.ico                             (u glyph, 16/32/48)
 *   src/app/apple-icon.png                          (wordmark, 180)
 *   public/web-app-manifest-192x192.png             (wordmark, 192)
 *   public/web-app-manifest-512x512.png             (wordmark, 512)
 *   public/web-app-manifest-maskable-512x512.png    (wordmark, inset for safe zone)
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const masters = join(root, "scripts", "favicons");
const appDir = join(root, "src", "app");
const publicDir = join(root, "public");
mkdirSync(publicDir, { recursive: true });

// Render an SVG master to a square PNG. Rasterize at 4x then downscale for crisp edges.
async function png(svg, size, out) {
  await sharp(readFileSync(join(masters, svg)), { density: 288 })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`✓ ${out}  (${size}x${size})`);
}

// 1. Scalable SVG icon (modern browser tabs) — the u glyph, served verbatim.
copyFileSync(join(masters, "u-glyph.svg"), join(appDir, "icon.svg"));
console.log(`✓ ${join(appDir, "icon.svg")}`);

// 2. Apple touch icon + PWA manifest icons (full wordmark).
await png("wordmark.svg", 180, join(appDir, "apple-icon.png"));
await png("wordmark.svg", 192, join(publicDir, "web-app-manifest-192x192.png"));
await png("wordmark.svg", 512, join(publicDir, "web-app-manifest-512x512.png"));
await png(
  "wordmark-maskable.svg",
  512,
  join(publicDir, "web-app-manifest-maskable-512x512.png"),
);

// 3. Multi-size favicon.ico (u glyph, 16/32/48) via ImageMagick.
const tmp = [16, 32, 48].map((s) => join(publicDir, `.ico-${s}.png`));
await Promise.all(
  tmp.map((out, i) => png("u-glyph.svg", [16, 32, 48][i], out)),
);
try {
  execFileSync("magick", [...tmp, join(appDir, "favicon.ico")], {
    stdio: "inherit",
  });
  console.log(`✓ ${join(appDir, "favicon.ico")}  (16/32/48)`);
} catch {
  console.error(
    "! Could not build favicon.ico — install ImageMagick (`brew install imagemagick`) and re-run.",
  );
} finally {
  tmp.forEach((f) => rmSync(f, { force: true }));
}
