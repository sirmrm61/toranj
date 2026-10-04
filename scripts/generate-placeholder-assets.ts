/**
 * Generates code-drawn placeholder artwork so the site and the WebGL hero work before the
 * real photos / AI-generated assets (scripts/generate-assets.ts) are available.
 * Output: public/gowns-media/*.webp and public/landing/* (+ landing.json).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { catalog, type CatalogGown } from "../src/content/catalog";

const ROOT = path.join(process.cwd(), "public");
const W = 768;
const H = 1152;
// Eye centres in the bride image, in pixels (shared by every gown — same pose, PRD §5).
const EYES = [
  { x: 362, y: 248 },
  { x: 406, y: 248 },
];

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function skirtPath(style: CatalogGown["style"]) {
  switch (style) {
    case "PUFFY":
      return "M330 560 C250 700 90 880 60 1120 Q384 1160 708 1120 C678 880 518 700 438 560 Z";
    case "MERMAID":
      return "M335 560 C318 700 322 820 338 900 C300 980 220 1060 170 1130 Q384 1160 598 1130 C548 1060 468 980 430 900 C446 820 450 700 433 560 Z";
    case "SIMPLE":
      return "M338 560 C320 760 280 960 262 1130 Q384 1150 506 1130 C488 960 448 760 430 560 Z";
    default:
      return "M335 560 C290 720 190 940 140 1125 Q384 1160 628 1125 C578 940 478 720 433 560 Z";
  }
}

type Variant = "front" | "back";

function brideSvg(g: Pick<CatalogGown, "hex" | "style" | "type">, opts: { variant: Variant; background: boolean; irises: boolean }) {
  const dress = g.hex;
  const dressDark = shade(g.hex, 0.82);
  const skin = "#e9c4a6";
  const hair = "#3b2618";
  const bridal = g.type === "BRIDAL";
  const back = opts.variant === "back";
  const bg = opts.background
    ? `<defs><radialGradient id="studio" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#f7f1ea"/><stop offset="1" stop-color="#ddd0c0"/></radialGradient></defs>
       <rect width="${W}" height="${H}" fill="url(#studio)"/>
       <ellipse cx="384" cy="1125" rx="330" ry="26" fill="#000" opacity=".12"/>`
    : "";
  const face = back
    ? `<ellipse cx="384" cy="250" rx="66" ry="84" fill="${hair}"/>`
    : `<ellipse cx="384" cy="252" rx="60" ry="78" fill="${skin}"/>
       ${EYES.map((e) => `<ellipse cx="${e.x}" cy="${e.y}" rx="12" ry="6.5" fill="#fbf8f4"/><path d="M${e.x - 13} ${e.y - 2} Q${e.x} ${e.y - 11} ${e.x + 13} ${e.y - 2}" stroke="#2a1a10" stroke-width="2.4" fill="none"/>`).join("")}
       ${opts.irises ? EYES.map((e) => `<circle cx="${e.x}" cy="${e.y}" r="5.2" fill="#4a2f1d"/><circle cx="${e.x}" cy="${e.y}" r="2.3" fill="#120a05"/><circle cx="${e.x + 1.6}" cy="${e.y - 1.6}" r="1.1" fill="#fff"/>`).join("") : ""}
       <path d="M346 228 Q362 218 376 226 M392 226 Q406 218 422 228" stroke="${hair}" stroke-width="3" fill="none"/>
       <path d="M384 258 Q380 276 386 282" stroke="#c99a7c" stroke-width="2" fill="none"/>
       <path d="M370 300 Q384 310 398 300 Q384 304 370 300 Z" fill="#b5534f"/>`;
  const lace = `<pattern id="lace" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="2.2" fill="#fff" opacity=".55"/><circle cx="0" cy="0" r="1.4" fill="#fff" opacity=".4"/><circle cx="18" cy="18" r="1.4" fill="#fff" opacity=".4"/></pattern>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${bg}
  <defs>
    <linearGradient id="dress" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dress}"/><stop offset="1" stop-color="${dressDark}"/></linearGradient>
    ${lace}
  </defs>
  ${bridal ? `<path d="M330 200 C250 400 210 700 230 950 L540 950 C560 700 520 400 438 200 Z" fill="#fff" opacity=".28"/>` : ""}
  <ellipse cx="384" cy="232" rx="88" ry="104" fill="${hair}"/>
  <circle cx="384" cy="150" r="40" fill="${hair}"/>
  <rect x="366" y="312" width="36" height="66" rx="14" fill="${skin}"/>
  <path d="M300 392 C286 470 292 540 320 600 L338 594 C318 540 314 470 330 400 Z" fill="${skin}"/>
  <path d="M468 392 C482 470 476 540 448 600 L430 594 C450 540 454 470 438 400 Z" fill="${skin}"/>
  <path d="M308 378 Q384 362 460 378 L436 560 L332 560 Z" fill="${skin}"/>
  <path d="${skirtPath(g.style)}" fill="url(#dress)"/>
  <path d="${skirtPath(g.style)}" fill="url(#lace)" opacity=".7"/>
  <path d="M322 420 Q384 446 446 420 L433 562 Q384 576 335 562 Z" fill="url(#dress)"/>
  <path d="M322 420 Q384 446 446 420 L433 562 Q384 576 335 562 Z" fill="url(#lace)"/>
  ${back ? `<path d="M384 430 L384 560" stroke="${dressDark}" stroke-width="3"/>${[450, 475, 500, 525, 550].map((y) => `<path d="M372 ${y} L396 ${y + 12} M396 ${y} L372 ${y + 12}" stroke="${dressDark}" stroke-width="1.6"/>`).join("")}` : ""}
  <path d="M335 562 Q384 576 433 562" stroke="${shade(g.hex, 0.7)}" stroke-width="7" fill="none"/>
  ${[0.25, 0.42, 0.58, 0.75].map((t) => `<path d="M${340 + t * 88} 600 C${300 + t * 168} 800 ${180 + t * 408} 980 ${130 + t * 508} 1120" stroke="${dressDark}" stroke-width="2" opacity=".35" fill="none"/>`).join("")}
  ${face}
  ${bridal && !back ? `<g transform="translate(384 600)">${[[-18, -6], [0, -14], [18, -6], [-10, 10], [10, 10], [0, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#f4f0ea" stroke="#e2d6c8"/>`).join("")}<path d="M-4 22 L-8 70 M4 22 L8 70" stroke="#6c7f4f" stroke-width="4"/></g>` : ""}
  <path d="M330 168 Q384 140 438 168" stroke="#e9d9b2" stroke-width="6" fill="none" opacity=".9"/>
</svg>`;
}

function groomSvg() {
  const suit = "#1d2033";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <circle cx="384" cy="220" r="66" fill="#2a1c12"/>
  <ellipse cx="384" cy="252" rx="56" ry="74" fill="#d8ae8e"/>
  <rect x="362" y="318" width="44" height="60" rx="14" fill="#d8ae8e"/>
  <path d="M268 392 Q384 350 500 392 L520 760 L248 760 Z" fill="${suit}"/>
  <path d="M352 380 L384 470 L416 380 Z" fill="#fff"/>
  <path d="M374 392 L384 404 L394 392 L384 470 Z" fill="#111"/>
  <path d="M276 760 L300 1120 L376 1120 L384 820 L392 1120 L468 1120 L492 760 Z" fill="${suit}"/>
  <path d="M248 400 C220 520 222 640 240 760 L272 756 C262 640 266 520 290 420 Z" fill="${suit}"/>
  <path d="M520 400 C548 520 546 640 528 760 L496 756 C506 640 502 520 478 420 Z" fill="${suit}"/>
  <circle cx="430" cy="430" r="9" fill="#f2efe8"/>
</svg>`;
}

function backgroundSvg(w: number, h: number) {
  const arches = [0.18, 0.5, 0.82]
    .map((x) => {
      const cx = x * w;
      const aw = w * 0.2;
      return `<path d="M${cx - aw / 2} ${h} L${cx - aw / 2} ${h * 0.42} A${aw / 2} ${aw / 2} 0 0 1 ${cx + aw / 2} ${h * 0.42} L${cx + aw / 2} ${h} Z" fill="url(#arch)" opacity=".9"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b211c"/><stop offset=".65" stop-color="#4a372b"/><stop offset="1" stop-color="#1b1411"/></linearGradient>
    <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dfb5" stop-opacity=".55"/><stop offset="1" stop-color="#8a6a4a" stop-opacity=".25"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%"><stop offset="0" stop-color="#ffe7bd" stop-opacity=".45"/><stop offset="1" stop-color="#ffe7bd" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#wall)"/>
  ${arches}
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <rect y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="#140f0c" opacity=".6"/>
</svg>`;
}

const webp = (svg: string, q = 82) => sharp(Buffer.from(svg)).webp({ quality: q, alphaQuality: 90 });

async function main() {
  await mkdir(path.join(ROOT, "gowns-media"), { recursive: true });
  await mkdir(path.join(ROOT, "landing"), { recursive: true });

  for (const g of catalog) {
    const dir = path.join(ROOT, "gowns-media");
    await webp(brideSvg(g, { variant: "front", background: true, irises: true })).toFile(path.join(dir, `${g.key}-1.webp`));
    await webp(brideSvg(g, { variant: "back", background: true, irises: false })).toFile(path.join(dir, `${g.key}-2.webp`));
    // Detail shot: zoom into the bodice.
    const front = await sharp(Buffer.from(brideSvg(g, { variant: "front", background: true, irises: true }))).png().toBuffer();
    await sharp(front).extract({ left: 224, top: 340, width: 320, height: 480 }).resize(W, H).webp({ quality: 82 }).toFile(path.join(dir, `${g.key}-3.webp`));
  }

  const heroGowns = catalog.filter((g) => g.hero);
  const landingDir = path.join(ROOT, "landing");
  for (const g of heroGowns) {
    const svg = brideSvg(g, { variant: "front", background: false, irises: false });
    await webp(svg, 85).toFile(path.join(landingDir, `bride-${g.key}.webp`));
    // Depth map: blurred silhouette + vertical falloff (white = near).
    const alpha = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel("alpha").blur(24).toBuffer();
    await sharp(alpha).linear(0.85, 20).webp({ quality: 70 }).toFile(path.join(landingDir, `depth-${g.key}.webp`));
  }
  await webp(groomSvg(), 80).toFile(path.join(landingDir, "groom.webp"));
  await webp(backgroundSvg(1920, 1200), 78).toFile(path.join(landingDir, "background.webp"));

  // Static poster for the fallback slider / LCP image.
  const first = heroGowns[0];
  const bride = await sharp(Buffer.from(brideSvg(first, { variant: "front", background: false, irises: true }))).resize({ height: 1000 }).png().toBuffer();
  const groom = await sharp(Buffer.from(groomSvg())).resize({ height: 760 }).blur(1.5).modulate({ brightness: 0.75 }).png().toBuffer();
  await sharp(Buffer.from(backgroundSvg(1920, 1200)))
    .composite([
      { input: groom, left: 560, top: 360 },
      { input: bride, left: 960 - 333, top: 170 },
    ])
    .webp({ quality: 78 })
    .toFile(path.join(landingDir, "poster.webp"));
  for (const g of heroGowns) {
    const b = await sharp(Buffer.from(brideSvg(g, { variant: "front", background: false, irises: true }))).resize({ height: 1000 }).png().toBuffer();
    const composed = await sharp(Buffer.from(backgroundSvg(1920, 1200)))
      .composite([
        { input: groom, left: 560, top: 360 },
        { input: b, left: 960 - 333, top: 170 },
      ])
      .png()
      .toBuffer();
    await sharp(composed)
      .resize(1280)
      .webp({ quality: 72 })
      .toFile(path.join(landingDir, `poster-${g.key}.webp`));
  }

  const config = {
    generated: "placeholder",
    imageSize: { w: W, h: H },
    eyes: EYES.map((e) => ({ u: e.x / W, v: e.y / H })),
    eyeSize: { rx: 12 / W, ry: 6.5 / H },
    irisRadius: 5.2 / W,
    head: { u: 384 / W, v: 250 / H, radius: 150 / W },
    eyeTravel: 4.2 / W,
    background: "/landing/background.webp",
    groom: "/landing/groom.webp",
    poster: "/landing/poster.webp",
    gowns: heroGowns.map((g) => ({
      key: g.key,
      slug: g.slug,
      name: g.name,
      tagline: g.tagline,
      transition: g.hero,
      image: `/landing/bride-${g.key}.webp`,
      depth: `/landing/depth-${g.key}.webp`,
      poster: `/landing/poster-${g.key}.webp`,
    })),
  };
  await writeFile(path.join(landingDir, "landing.json"), JSON.stringify(config, null, 2));
  console.info(`Placeholder assets written for ${catalog.length} gowns (${heroGowns.length} in the hero).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
