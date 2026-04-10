// ArtistPixel.jsx
// Deterministic 32x32 pixel art portraits for each artist.
// Each portrait is seeded by the artist's id — same artist always gets the same portrait.
// Portraits are stylised: abstract region of face + color palette from tier/medium/region.

import { useEffect, useRef } from "react";

// ── Seeded RNG (mulberry32) ────────────────────────────────────────────────
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Color palettes by tier + region ───────────────────────────────────────
const PALETTES = {
  "blue chip": {
    skin:   ["#C68642","#8D5524","#F1C27D","#E0AC69","#FDBCB4","#D4956A"],
    bg:     ["#0A0A0A","#0D0D12","#07070F","#0A0A10"],
    accent: ["#FFD700","#FFC200","#FFB300","#E8A000"],
    cloth:  ["#1A1A2E","#0D1B2A","#16213E","#1B1B2F","#2C1654"],
    art:    ["#FFD700","#C9A84C","#B8860B","#DAA520"],
  },
  "mid-career": {
    skin:   ["#C68642","#8D5524","#F1C27D","#E0AC69","#FDBCB4","#A0522D","#D2691E"],
    bg:     ["#0A0A0A","#080810","#0A0A14","#060612"],
    accent: ["#FF4444","#E03030","#FF6B35","#FF5252"],
    cloth:  ["#1A1A1A","#222222","#1E1E2A","#2A1A1A","#1A2A1A"],
    art:    ["#FF4444","#CC3333","#FF6B35","#E84545"],
  },
  "emerging": {
    skin:   ["#C68642","#8D5524","#F1C27D","#E0AC69","#FDBCB4","#7B3F00","#BC8A5F"],
    bg:     ["#0A0A0A","#0A0A0A","#0C0C0C","#070707"],
    accent: ["#4ADE80","#22C55E","#86EFAC","#00FF88"],
    cloth:  ["#1A2A1A","#0F1F0F","#1E2A1E","#162816","#0D1F0D"],
    art:    ["#4ADE80","#22C55E","#34D399","#6EE7B7"],
  },
};

// Region-based background tint
const REGION_TINT = {
  nyc:          "#0A0A0A",  la:          "#0A0808",
  bay:          "#080A0A",  chicago:     "#08080A",
  tokyo:        "#0A080A",  seoul:       "#0A0A0A",
  beijing:      "#0A0808",  shanghai:    "#080A08",
  london:       "#080808",  paris:       "#0A0A08",
  berlin:       "#08080A",  taipei:      "#08090A",
  hk:           "#090808",  cdmx:        "#0A0908",
  saopaulo:     "#090A08",  buenosaires: "#09090A",
  bogota:       "#090A09",  lima:        "#0A0908",
  seattle:      "#08090A",  portland:    "#08090A",
  austin:       "#0A0908",  global:      "#090909",
};

// Medium-based art-style indicator patterns
const MEDIUM_STYLE = {
  "paintings":        "gestural",
  "prints":           "geometric",
  "sculpture":        "blocks",
  "photography":      "photo",
  "installation":     "abstract",
  "video":            "scanline",
  "performance":      "figure",
  "ceramics":         "organic",
  "drawings":         "line",
  "textile":          "grid",
  "default":          "gestural",
};

function getMediumStyle(medium) {
  const m = (medium || "").toLowerCase();
  for (const [key, val] of Object.entries(MEDIUM_STYLE)) {
    if (m.includes(key)) return val;
  }
  return "gestural";
}

function getPalette(tier) {
  return PALETTES[tier] || PALETTES["mid-career"];
}

function pick(arr, r) {
  return arr[Math.floor(r() * arr.length)];
}

// ── Draw a 32x32 pixel portrait ────────────────────────────────────────────
function drawPortrait(ctx, artist, pixelSize) {
  const size = 32;
  const r = rng(artist.id * 1337 + 7);

  const palette  = getPalette(artist.tier);
  const bgColor  = REGION_TINT[artist.region] || "#0A0A0A";
  const skin     = pick(palette.skin, r);
  const accent   = pick(palette.accent, r);
  const cloth    = pick(palette.cloth, r);
  const artColor = pick(palette.art, r);
  const style    = getMediumStyle(artist.medium);

  const px = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  };

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size * pixelSize, size * pixelSize);

  // ── Art piece in background (medium-style specific) ─────────────────────
  const artX = Math.floor(r() * 14) + 2;
  const artY = Math.floor(r() * 8) + 2;

  if (style === "geometric") {
    // Geometric squares/rectangles
    for (let i = 0; i < 6; i++) {
      const gx = artX + Math.floor(r() * 10);
      const gy = artY + Math.floor(r() * 6);
      const gw = Math.floor(r() * 4) + 1;
      const gh = Math.floor(r() * 4) + 1;
      const alpha = 0.3 + r() * 0.5;
      ctx.globalAlpha = alpha;
      for (let dx = 0; dx < gw; dx++)
        for (let dy = 0; dy < gh; dy++)
          px(gx + dx, gy + dy, artColor);
      ctx.globalAlpha = 1;
    }
  } else if (style === "photo") {
    // Photo grid — small tiled rectangles in sepia/gray
    for (let i = 0; i < 20; i++) {
      const gx = artX + Math.floor(r() * 12);
      const gy = artY + Math.floor(r() * 8);
      ctx.globalAlpha = 0.15 + r() * 0.25;
      px(gx, gy, artColor);
      ctx.globalAlpha = 1;
    }
    // Thin horizontal lines suggesting a photograph
    ctx.globalAlpha = 0.2;
    for (let row = artY; row < artY + 7; row += 2)
      for (let col = artX; col < artX + 10; col++)
        px(col, row, artColor);
    ctx.globalAlpha = 1;
  } else if (style === "blocks") {
    // Sculptural block shapes
    const blockSizes = [[3,4],[2,5],[4,2],[1,6]];
    for (let i = 0; i < 3; i++) {
      const [bw, bh] = blockSizes[Math.floor(r() * blockSizes.length)];
      const bx = artX + Math.floor(r() * 10);
      const by = artY + Math.floor(r() * 6);
      const alpha = 0.2 + r() * 0.4;
      ctx.globalAlpha = alpha;
      for (let dx = 0; dx < bw; dx++)
        for (let dy = 0; dy < bh; dy++)
          px(bx + dx, by + dy, artColor);
      ctx.globalAlpha = 1;
      // Shadow edge
      ctx.globalAlpha = 0.15;
      for (let dy = 0; dy < bh; dy++) px(bx + bw, by + dy, "#000");
      for (let dx = 0; dx < bw; dx++) px(bx + dx, by + bh, "#000");
      ctx.globalAlpha = 1;
    }
  } else if (style === "scanline") {
    // Video — horizontal scanlines
    ctx.globalAlpha = 0.2;
    for (let row = artY; row < artY + 10; row += 1) {
      const intensity = r() > 0.5 ? artColor : "#FFFFFF";
      for (let col = artX; col < artX + 14; col++) {
        if (r() > 0.4) px(col, row, intensity);
      }
    }
    ctx.globalAlpha = 1;
  } else if (style === "grid") {
    // Textile — woven grid pattern
    ctx.globalAlpha = 0.25;
    for (let row = artY; row < artY + 8; row++) {
      for (let col = artX; col < artX + 12; col++) {
        const c = (row + col) % 2 === 0 ? artColor : "#222";
        px(col, row, c);
      }
    }
    ctx.globalAlpha = 1;
  } else if (style === "line") {
    // Drawing — sketch lines
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const ly = artY + Math.floor(r() * 8);
      const lx = artX + Math.floor(r() * 4);
      const ll = Math.floor(r() * 8) + 2;
      for (let col = lx; col < lx + ll; col++) px(col, ly, artColor);
    }
    ctx.globalAlpha = 1;
  } else if (style === "organic") {
    // Ceramics — organic blobs
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 12; i++) {
      const ox = artX + Math.floor(r() * 10);
      const oy = artY + Math.floor(r() * 8);
      const ow = Math.floor(r() * 3) + 1;
      const oh = Math.floor(r() * 3) + 1;
      for (let dx = 0; dx < ow; dx++)
        for (let dy = 0; dy < oh; dy++)
          px(ox + dx, oy + dy, artColor);
    }
    ctx.globalAlpha = 1;
  } else {
    // Gestural — painterly marks
    for (let i = 0; i < 15; i++) {
      const mx = artX + Math.floor(r() * 12);
      const my = artY + Math.floor(r() * 8);
      const ml = Math.floor(r() * 5) + 1;
      const vert = r() > 0.5;
      ctx.globalAlpha = 0.15 + r() * 0.35;
      for (let k = 0; k < ml; k++) {
        if (vert) px(mx, my + k, artColor);
        else      px(mx + k, my, artColor);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ── Face / figure ────────────────────────────────────────────────────────
  // Face position: center-ish, varied by seed
  const faceX = 12 + Math.floor(r() * 6);  // 12-17
  const faceY = 8  + Math.floor(r() * 4);  // 8-11

  // Neck
  px(faceX + 2, faceY + 8, skin);
  px(faceX + 3, faceY + 8, skin);
  px(faceX + 2, faceY + 9, skin);
  px(faceX + 3, faceY + 9, skin);

  // Shoulders / torso  (cloth color)
  for (let x = faceX - 1; x <= faceX + 6; x++) px(x, faceY + 10, cloth);
  for (let x = faceX;     x <= faceX + 5; x++) px(x, faceY + 11, cloth);
  for (let x = faceX + 1; x <= faceX + 4; x++) px(x, faceY + 12, cloth);

  // Head shape (7 wide, 7 tall roughly)
  const headPixels = [
    // row 0
    [1,0],[2,0],[3,0],[4,0],[5,0],
    // row 1
    [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    // row 2-4 (full width)
    [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
    [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    // row 5
    [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    // row 6
    [1,6],[2,6],[3,6],[4,6],[5,6],
    // row 7
    [2,7],[3,7],[4,7],
  ];
  headPixels.forEach(([dx, dy]) => px(faceX + dx, faceY + dy, skin));

  // Hair — top and sides, color derived from seed
  const hairColors = ["#1A0A00","#0A0A0A","#3B2005","#1C1008","#5C3010","#6B3A2A","#F0E0C0","#E0C090","#C0A060"];
  const hair = pick(hairColors, r);
  const hairStyle = Math.floor(r() * 4); // 0=short, 1=medium, 2=long, 3=bald

  if (hairStyle !== 3) {
    // Top of head
    for (let dx = 1; dx <= 5; dx++) px(faceX + dx, faceY, hair);
    if (hairStyle >= 1) {
      // Sides
      px(faceX, faceY + 1, hair);
      px(faceX + 6, faceY + 1, hair);
      px(faceX, faceY + 2, hair);
    }
    if (hairStyle >= 2) {
      // Long — hangs down
      px(faceX, faceY + 3, hair);
      px(faceX + 6, faceY + 3, hair);
      px(faceX, faceY + 4, hair);
      px(faceX + 6, faceY + 4, hair);
    }
  } else {
    // Bald — just highlight
    ctx.globalAlpha = 0.3;
    px(faceX + 1, faceY, "#FFFFFF");
    px(faceX + 2, faceY, "#FFFFFF");
    ctx.globalAlpha = 1;
  }

  // Eyes — position slightly varied
  const eyeY = faceY + 3;
  const eyeLX = faceX + 1 + (r() > 0.5 ? 1 : 0);
  const eyeRX = faceX + 4 + (r() > 0.5 ? 1 : 0);

  // Eye whites
  px(eyeLX,     eyeY, "#EEE");
  px(eyeLX + 1, eyeY, "#EEE");
  px(eyeRX,     eyeY, "#EEE");
  px(eyeRX + 1, eyeY, "#EEE");

  // Pupils
  const pupilColors = ["#1A0A00","#0A1A0A","#0A0A1A","#1A1A00","#0A0A00"];
  const pupil = pick(pupilColors, r);
  px(eyeLX + 1, eyeY, pupil);
  px(eyeRX,     eyeY, pupil);

  // Eye color glint
  ctx.globalAlpha = 0.5;
  px(eyeLX,     eyeY, accent);
  px(eyeRX + 1, eyeY, accent);
  ctx.globalAlpha = 1;

  // Nose
  const noseY = faceY + 5;
  px(faceX + 3, noseY, "#AA7050");

  // Mouth
  const mouthY = faceY + 6;
  const mouthStyle = Math.floor(r() * 3); // 0=neutral, 1=smile, 2=stern
  if (mouthStyle === 1) {
    px(faceX + 2, mouthY, "#802020");
    px(faceX + 3, mouthY, "#CC4040");
    px(faceX + 4, mouthY, "#CC4040");
    px(faceX + 5, mouthY, "#802020");
    // smile curve
    px(faceX + 1, mouthY + 1, "#AA3030");
    px(faceX + 5, mouthY + 1, "#AA3030");
  } else if (mouthStyle === 2) {
    // straight serious line
    px(faceX + 2, mouthY, "#802020");
    px(faceX + 3, mouthY, "#802020");
    px(faceX + 4, mouthY, "#802020");
  } else {
    px(faceX + 2, mouthY, "#AA4040");
    px(faceX + 3, mouthY, "#CC5050");
    px(faceX + 4, mouthY, "#AA4040");
  }

  // ── Glasses (30% of artists have them) ───────────────────────────────────
  if (r() < 0.30) {
    const glassColor = r() > 0.5 ? "#888" : accent;
    ctx.globalAlpha = 0.7;
    // Left lens outline
    px(eyeLX - 1, eyeY - 1, glassColor);
    px(eyeLX,     eyeY - 1, glassColor);
    px(eyeLX + 1, eyeY - 1, glassColor);
    px(eyeLX + 2, eyeY - 1, glassColor);
    px(eyeLX - 1, eyeY, glassColor);
    px(eyeLX + 2, eyeY, glassColor);
    px(eyeLX - 1, eyeY + 1, glassColor);
    px(eyeLX,     eyeY + 1, glassColor);
    px(eyeLX + 1, eyeY + 1, glassColor);
    px(eyeLX + 2, eyeY + 1, glassColor);
    // Right lens outline
    px(eyeRX - 1, eyeY - 1, glassColor);
    px(eyeRX,     eyeY - 1, glassColor);
    px(eyeRX + 1, eyeY - 1, glassColor);
    px(eyeRX + 2, eyeY - 1, glassColor);
    px(eyeRX - 1, eyeY, glassColor);
    px(eyeRX + 2, eyeY, glassColor);
    px(eyeRX - 1, eyeY + 1, glassColor);
    px(eyeRX,     eyeY + 1, glassColor);
    px(eyeRX + 1, eyeY + 1, glassColor);
    px(eyeRX + 2, eyeY + 1, glassColor);
    // Bridge
    px(eyeLX + 2, eyeY, glassColor);
    px(eyeRX - 1, eyeY, glassColor);
    ctx.globalAlpha = 1;
  }

  // ── Accessory: hat (15% chance) ───────────────────────────────────────────
  if (r() < 0.15) {
    const hatColor = r() > 0.5 ? accent : cloth;
    ctx.globalAlpha = 0.85;
    // brim
    for (let dx = -1; dx <= 7; dx++) px(faceX + dx, faceY - 1, hatColor);
    // crown
    for (let dy = -4; dy <= -1; dy++)
      for (let dx = 1; dx <= 5; dx++) px(faceX + dx, faceY + dy, hatColor);
    ctx.globalAlpha = 1;
  }

  // ── Signal indicator: small colored dot at top-right ─────────────────────
  const signalDotColors = {
    "very hot":    "#FB923C",
    "act now":     "#FB923C",
    "rising fast": "#60A5FA",
    "rising":      "#60A5FA",
    "proven":      "#4ADE80",
    "stable":      "#888888",
    "early stage": "#A78BFA",
    "watch":       "#A78BFA",
    "default":     "#444444",
  };
  const dotColor = signalDotColors[artist.signal] || signalDotColors.default;
  px(29, 1, dotColor);
  px(30, 1, dotColor);
  px(29, 2, dotColor);
  px(30, 2, dotColor);

  // ── Bottom strip: accent color bar ───────────────────────────────────────
  ctx.globalAlpha = 0.6;
  for (let x = 0; x < 32; x++) {
    px(x, 30, accent);
    px(x, 31, accent);
  }
  ctx.globalAlpha = 0.2;
  for (let x = 0; x < 32; x++) px(x, 29, accent);
  ctx.globalAlpha = 1;
}

// ── React component ────────────────────────────────────────────────────────
export default function ArtistPixel({ artist, size = 128 }) {
  const canvasRef = useRef(null);
  const pixelSize = size / 32;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !artist) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawPortrait(ctx, artist, pixelSize);
  }, [artist, pixelSize]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        imageRendering: "pixelated",
        display: "block",
        borderRadius: 4,
      }}
    />
  );
}
