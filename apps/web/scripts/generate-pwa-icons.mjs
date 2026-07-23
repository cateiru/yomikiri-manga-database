// icon.svg から PWA 用 PNG アイコン一式を生成するワンオフスクリプト。
// icon.svg（デザイン）を更新した場合はこのスクリプトを再実行して
// public/icons/*.png と apple-icon.png を再生成すること。
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE_SVG = path.join(ROOT, "src/app/icon.svg");

async function generate() {
  const svg = await readFile(SOURCE_SVG);

  await sharp(svg).resize(192, 192).png().toFile(path.join(ROOT, "public/icons/icon-192.png"));
  await sharp(svg).resize(512, 512).png().toFile(path.join(ROOT, "public/icons/icon-512.png"));

  await sharp(svg).resize(180, 180).png().toFile(path.join(ROOT, "src/app/apple-icon.png"));

  // maskable アイコン: 512x512 の白背景キャンバスに、中心 80% の
  // セーフゾーン（410px）へ縮小した元アイコンを合成する
  const SAFE_ZONE = Math.round(512 * 0.8);
  const inner = await sharp(svg).resize(SAFE_ZONE, SAFE_ZONE).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(path.join(ROOT, "public/icons/icon-512-maskable.png"));
}

generate();
