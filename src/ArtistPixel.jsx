// ArtistPixel.jsx — 64×64 pixel art dioramas
// Each panel: signature artwork element + styled artist silhouette + atmosphere

import { useEffect, useRef } from "react";

// ─── Seeded RNG ──────────────────────────────────────────────────────────────
function mkRng(seed) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ─── Pixel helpers ───────────────────────────────────────────────────────────
function makeDrawer(ctx, scale) {
  return {
    px(x, y, color, alpha = 1) {
      if (x < 0 || y < 0 || x >= 64 || y >= 64) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
      ctx.globalAlpha = 1;
    },
    rect(x, y, w, h, color, alpha = 1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
      ctx.globalAlpha = 1;
    },
    hline(x, y, len, color, alpha = 1) {
      for (let i = 0; i < len; i++) this.px(x + i, y, color, alpha);
    },
    vline(x, y, len, color, alpha = 1) {
      for (let i = 0; i < len; i++) this.px(x, y + i, color, alpha);
    },
    circle(cx, cy, r, color, alpha = 1) {
      for (let dx = -r; dx <= r; dx++)
        for (let dy = -r; dy <= r; dy++)
          if (dx * dx + dy * dy <= r * r) this.px(cx + dx, cy + dy, color, alpha);
    },
    // Draw text using a tiny 3×5 bitmap font
    text3x5(str, x, y, color, alpha = 1) {
      const chars = {
        'A':[[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
        'B':[[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
        'C':[[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
        'D':[[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
        'E':[[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
        'F':[[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
        'G':[[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
        'H':[[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
        'I':[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
        'J':[[0,1,1],[0,0,1],[0,0,1],[1,0,1],[0,1,0]],
        'K':[[1,0,1],[1,1,0],[1,0,0],[1,1,0],[1,0,1]],
        'L':[[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
        'M':[[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,0,1]],
        'N':[[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
        'O':[[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
        'P':[[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
        'Q':[[0,1,0],[1,0,1],[1,0,1],[1,1,1],[0,1,1]],
        'R':[[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
        'S':[[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
        'T':[[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
        'U':[[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
        'V':[[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
        'W':[[1,0,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1]],
        'X':[[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],
        'Y':[[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
        'Z':[[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
        ' ':[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
      };
      let cx = x;
      for (const ch of str.toUpperCase()) {
        const bitmap = chars[ch] || chars[' '];
        for (let row = 0; row < 5; row++)
          for (let col = 0; col < 3; col++)
            if (bitmap[row][col]) this.px(cx + col, y + row, color, alpha);
        cx += 4;
      }
    }
  };
}

// ─── Color palettes ──────────────────────────────────────────────────────────
const TIER_PALETTE = {
  "blue chip": {
    bg: "#08080E", sky: "#0D0D1A", ground: "#111118",
    accent: "#D4AF37", accent2: "#C09B20", glow: "#FFD700",
    frame: "#2A2416", nameColor: "#D4AF37",
  },
  "mid-career": {
    bg: "#0A080A", sky: "#120D12", ground: "#110A11",
    accent: "#CC3333", accent2: "#992222", glow: "#FF4444",
    frame: "#2A1616", nameColor: "#FF5555",
  },
  "emerging": {
    bg: "#080A08", sky: "#0A120A", ground: "#0A110A",
    accent: "#22AA55", accent2: "#188840", glow: "#44CC77",
    frame: "#162A16", nameColor: "#44DD88",
  },
};

const SIGNAL_COLOR = {
  "very hot":    "#FF6B35",
  "act now":     "#FF6B35",
  "rising fast": "#60A5FA",
  "rising":      "#4488EE",
  "proven":      "#4ADE80",
  "stable":      "#555566",
  "early stage": "#A78BFA",
  "watch":       "#8B7ACC",
};

const REGION_SKY = {
  nyc: "#0A0A18", la: "#14080A", bay: "#080C12",
  chicago: "#09090F", london: "#080909", paris: "#0B0A0D",
  berlin: "#080808", tokyo: "#0E0810", seoul: "#0A0A10",
  beijing: "#100808", shanghai: "#100C08", taipei: "#09100C",
  hk: "#100C0A", cdmx: "#0D0A08", saopaulo: "#0A0D08",
  buenosaires: "#09090B", bogota: "#080B09", lima: "#0D0A06",
  seattle: "#08090B", portland: "#08090B", austin: "#0E0A07",
  global: "#090909",
};

// ─── ARTWORK SIGNATURES ───────────────────────────────────────────────────────
// hand-crafted pixel art for each named artist's most famous work/style
// returns a draw function that paints the artwork into a region
const ARTWORK_SIGNATURES = {
  // ── ANDY WARHOL: Marilyn silkscreen grid ──
  "Andy Warhol": (d, r) => {
    const cols = ["#FF6B9D","#FFD700","#FF4488","#66AAFF","#FFAA00","#AA44FF"];
    const cols2 = ["#CC5577","#CCAA00","#CC2266","#4488CC","#CC8800","#882299"];
    for (let i = 0; i < 4; i++) {
      const px = 6 + (i % 2) * 14, py = 4 + Math.floor(i / 2) * 14;
      const c = cols[i], c2 = cols2[i];
      d.rect(px, py, 12, 12, c);
      // face oval
      d.circle(px + 6, py + 6, 4, c2);
      // hair
      d.rect(px + 2, py + 1, 8, 3, "#FFD700");
      // eyes
      d.px(px + 4, py + 5, "#000"); d.px(px + 8, py + 5, "#000");
      // lips
      d.hline(px + 3, py + 8, 6, "#FF0033");
    }
    // grid lines
    for (let x = 0; x < 30; x++) d.px(18 + x, 4, "#111", 0.5);
    for (let x = 0; x < 30; x++) d.px(18 + x, 18, "#111", 0.5);
    for (let y = 0; y < 30; y++) d.px(18, 4 + y, "#111", 0.5);
  },

  // ── JEAN-MICHEL BASQUIAT: Crown + text scrawl ──
  "Jean-Michel Basquiat": (d, r) => {
    // Dark background
    d.rect(4, 4, 38, 30, "#1A1000");
    // Crown (3-point)
    const crownX = 10, crownY = 6;
    d.rect(crownX, crownY + 4, 18, 8, "#D4AF37");
    d.vline(crownX + 2, crownY, 4, "#D4AF37");
    d.vline(crownX + 9, crownY - 2, 6, "#D4AF37");
    d.vline(crownX + 16, crownY, 4, "#D4AF37");
    d.px(crownX + 9, crownY - 3, "#D4AF37");
    // Skull-like face
    d.circle(18, 22, 7, "#F4E0A0");
    d.px(15, 21, "#000"); d.px(21, 21, "#000");
    d.px(15, 22, "#000"); d.px(21, 22, "#000");
    d.hline(15, 25, 7, "#000");
    // Text scrawl
    for (let i = 0; i < 5; i++) {
      const lx = 6 + Math.floor(r() * 20), ly = 28 + i * 2;
      d.hline(lx, ly, Math.floor(r() * 8) + 2, "#FF4444", 0.6);
    }
    // Crossed-out word box
    d.rect(26, 8, 14, 8, "#222");
    d.hline(26, 12, 14, "#AAFFAA", 0.4);
    d.hline(27, 10, 12, "#666", 0.5);
    d.hline(27, 11, 10, "#666", 0.5);
    d.hline(27, 13, 11, "#666", 0.5);
    // © symbol
    d.px(36, 9, "#FFFF00"); d.px(37, 9, "#FFFF00");
    d.px(35, 10, "#FFFF00"); d.px(38, 10, "#FFFF00");
    d.px(36, 11, "#FFFF00"); d.px(37, 11, "#FFFF00");
  },

  // ── DAVID HOCKNEY: Swimming pool ──
  "David Hockney": (d, r) => {
    // Sky
    d.rect(4, 4, 38, 16, "#87CEEB");
    // Pool
    d.rect(4, 20, 38, 14, "#0088CC");
    // Pool ripples
    for (let i = 0; i < 5; i++) {
      d.hline(6, 22 + i * 2, Math.floor(r() * 12) + 8, "#66BBFF", 0.5);
      d.hline(14 + i * 2, 23 + i * 2, Math.floor(r() * 8) + 4, "#44AAEE", 0.4);
    }
    // Pool edge/tile
    d.rect(4, 19, 38, 2, "#F5F5DC");
    // Diving board
    d.rect(28, 12, 12, 2, "#DDDDDD");
    d.rect(36, 14, 2, 6, "#BBBBBB");
    // Palm tree
    d.vline(8, 8, 12, "#8B6914");
    d.circle(8, 8, 4, "#228B22");
    d.circle(6, 10, 2, "#2DA22D");
    d.circle(10, 10, 2, "#2DA22D");
    // Splash
    d.px(22, 19, "#FFFFFF"); d.px(20, 18, "#FFFFFF");
    d.px(24, 18, "#FFFFFF"); d.px(22, 17, "#FFFFFF");
  },

  // ── YAYOI KUSAMA: Polka dots ──
  "Yayoi Kusama": (d, r) => {
    d.rect(4, 4, 38, 30, "#FF0044");
    const dotPositions = [
      [8,6],[16,6],[24,6],[32,6],[38,8],
      [6,12],[12,10],[20,12],[28,10],[36,12],
      [10,16],[18,16],[26,16],[34,16],
      [8,20],[14,22],[22,20],[30,22],[38,20],
      [6,26],[16,26],[24,26],[32,26],
      [10,30],[20,30],[30,30],
    ];
    dotPositions.forEach(([x, y]) => {
      d.circle(x, y, 2, "#FFFFFF");
    });
    // Infinity room mirror effect
    for (let i = 0; i < 4; i++) {
      d.rect(4 + i * 4, 4 + i * 3, 38 - i * 8, 30 - i * 6, "transparent");
      // Just dots in decreasing sizes
      d.circle(23, 19, 5 - i, "#FF0044", 0.1 + i * 0.1);
    }
  },

  // ── TAKASHI MURAKAMI: Flowers ──
  "Takashi Murakami": (d, r) => {
    const bg = "#FFEE00";
    d.rect(4, 4, 38, 30, bg);
    // Multiple smiling flowers
    const flowers = [
      { cx: 14, cy: 14, rc: "#FF66AA", pc: "#FF99CC" },
      { cx: 30, cy: 12, rc: "#44AAFF", pc: "#88CCFF" },
      { cx: 22, cy: 26, rc: "#FF4400", pc: "#FF7744" },
      { cx: 8, cy: 26, rc: "#AA44FF", pc: "#CC88FF" },
      { cx: 36, cy: 26, rc: "#44CC44", pc: "#88EE88" },
    ];
    flowers.forEach(({ cx, cy, rc, pc }) => {
      // Petals
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const px = cx + Math.round(Math.cos(angle) * 4);
        const py = cy + Math.round(Math.sin(angle) * 4);
        d.circle(px, py, 2, pc);
      }
      // Center
      d.circle(cx, cy, 3, "#FFFF00");
      // Face
      d.px(cx - 1, cy - 1, "#000"); d.px(cx + 1, cy - 1, "#000");
      d.px(cx - 1, cy + 1, "#333"); d.px(cx, cy + 1, "#333"); d.px(cx + 1, cy + 1, "#333");
    });
    // DOB character hint in corner
    d.circle(38, 7, 3, "#FFFFFF");
    d.px(37, 6, "#000"); d.px(39, 6, "#000");
    d.hline(37, 8, 3, "#FF0000");
  },

  // ── YOSHITOMO NARA: Angry child ──
  "Yoshitomo Nara": (d, r) => {
    d.rect(4, 4, 38, 30, "#F5F5F5");
    // Soft background
    d.rect(4, 22, 38, 12, "#EEEEDD");
    // Big head
    d.circle(23, 17, 11, "#FFEEDD");
    // Hair
    d.rect(12, 6, 22, 5, "#2A1A00");
    d.rect(12, 11, 3, 4, "#2A1A00");
    d.rect(30, 11, 3, 4, "#2A1A00");
    // Angry eyes (slanted)
    d.px(18, 14, "#000"); d.px(19, 13, "#000"); // left eye angry
    d.px(27, 14, "#000"); d.px(26, 13, "#000"); // right eye angry
    d.px(18, 15, "#330000"); d.px(27, 15, "#330000");
    // Frown
    d.hline(19, 21, 9, "#AA3333");
    d.px(18, 20, "#AA3333"); d.px(28, 20, "#AA3333");
    // Small body
    d.rect(18, 28, 10, 6, "#3344AA");
    // Arms out (defiant)
    d.hline(10, 29, 8, "#FFEEDD");
    d.hline(28, 29, 8, "#FFEEDD");
    // Red stars / circles in bg
    d.circle(8, 8, 2, "#FF4444", 0.7);
    d.circle(38, 8, 2, "#FF4444", 0.7);
  },

  // ── GERHARD RICHTER: Blur/squeegee ──
  "Gerhard Richter": (d, r) => {
    // Photo-realist blur effect
    const rows = 30, cols = 38;
    const baseColors = ["#5577AA","#3355AA","#6688BB","#7799CC","#2244AA","#AA8844","#CC9955","#BBAA66"];
    for (let y = 0; y < rows; y++) {
      const rowColor = baseColors[Math.floor((y / rows) * baseColors.length)];
      for (let x = 0; x < cols; x++) {
        const blur = r() * 0.4;
        d.px(4 + x, 4 + y, rowColor, 0.6 + blur * 0.4);
      }
    }
    // Squeegee horizontal smear marks
    for (let i = 0; i < 8; i++) {
      const sy = 6 + i * 3;
      const smearColor = ["#FFFFFF","#CCCCCC","#AAAAAA","#888888"][i % 4];
      d.hline(4, sy, Math.floor(r() * 20) + 10, smearColor, 0.2 + r() * 0.3);
    }
    // A faint photographic figure
    d.rect(18, 8, 10, 20, "#000000", 0.15);
    d.circle(23, 12, 4, "#CCCCCC", 0.2);
  },

  // ── BANKSY: Girl with balloon ──
  "Banksy": (d, r) => {
    d.rect(4, 4, 38, 30, "#EEEEEE");
    // Brick wall suggestion
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * 5;
      for (let col = 0; col < 5; col++) {
        d.rect(4 + col * 8 + offset, 4 + row * 4, 7, 3, "#DDDDCC", 0.3);
      }
    }
    // Girl silhouette (black)
    d.rect(14, 22, 6, 10, "#111"); // body/dress
    d.circle(17, 20, 3, "#111"); // head
    // Hair
    d.rect(15, 17, 4, 3, "#111");
    // Arm reaching up
    d.vline(19, 16, 6, "#111");
    d.hline(19, 16, 4, "#111");
    // Red balloon
    d.circle(26, 10, 5, "#FF0000");
    d.vline(26, 15, 4, "#CC0000");
    // string
    d.vline(22, 16, 5, "#555", 0.6);
    // GRAFFITI tag
    d.text3x5("THIS IS", 6, 6, "#FF0000", 0.15);
  },

  // ── KAWS: Companion X eyes ──
  "KAWS": (d, r) => {
    d.rect(4, 4, 38, 30, "#F0F0F0");
    // Companion head (large round)
    d.circle(23, 18, 13, "#FFFFFF");
    d.circle(23, 18, 13, "#111111", 0.2); // outline hint
    // Mickey-like ears
    d.circle(12, 8, 5, "#FFFFFF");
    d.circle(34, 8, 5, "#FFFFFF");
    // X eyes (the signature)
    // Left X
    d.px(16, 14, "#000"); d.px(17, 15, "#000"); d.px(18, 16, "#000");
    d.px(18, 14, "#000"); d.px(17, 15, "#000"); d.px(16, 16, "#000");
    // Right X
    d.px(26, 14, "#000"); d.px(27, 15, "#000"); d.px(28, 16, "#000");
    d.px(28, 14, "#000"); d.px(27, 15, "#000"); d.px(26, 16, "#000");
    // Stitched mouth
    d.hline(18, 21, 10, "#555");
    d.px(19, 20, "#555"); d.px(21, 20, "#555"); d.px(23, 20, "#555");
    d.px(25, 20, "#555"); d.px(27, 20, "#555");
    // Grey shadow
    d.circle(23, 18, 13, "#999", 0.05);
  },

  // ── JEAN DUBUFFET: Art Brut raw scrawl ──
  "Jean Dubuffet": (d, r) => {
    d.rect(4, 4, 38, 30, "#F5E8C0");
    // Primitivist figure
    d.circle(22, 12, 6, "#F5E8C0"); // head
    d.rect(18, 18, 8, 10, "#F5E8C0"); // body
    // Rough outlines (Art Brut style)
    d.circle(22, 12, 6, "#333", 0.0); // placeholder
    // Manual outlined head
    d.hline(17, 7, 10, "#333");
    d.hline(16, 8, 12, "#333");
    d.vline(16, 8, 8, "#333");
    d.vline(28, 8, 8, "#333");
    d.hline(16, 16, 12, "#333");
    // Eyes (primitive)
    d.rect(19, 10, 2, 2, "#333");
    d.rect(23, 10, 2, 2, "#333");
    // Body outline
    d.rect(17, 17, 10, 11, "#333");
    // Limbs (chunky)
    d.rect(10, 19, 7, 3, "#F5E8C0");
    d.hline(10, 18, 7, "#333"); d.hline(10, 22, 7, "#333");
    d.rect(27, 19, 7, 3, "#F5E8C0");
    d.hline(27, 18, 7, "#333"); d.hline(27, 22, 7, "#333");
    // Graffiti texture
    for (let i = 0; i < 6; i++) {
      d.hline(6 + Math.floor(r() * 10), 28 + i % 2, Math.floor(r() * 8) + 2, "#8B4513", 0.5);
    }
  },

  // ── JOAN MIRO: Biomorphic shapes ──
  "Joan Miro": (d, r) => {
    d.rect(4, 4, 38, 30, "#FAFAE0");
    // Primary color shapes
    d.circle(12, 12, 6, "#FF0000");
    d.circle(30, 8, 4, "#FFFF00");
    d.rect(20, 18, 12, 8, "#0000FF");
    // Black outline elements
    d.circle(12, 12, 6, "#000", 0.0);
    // Thin black connecting lines
    d.hline(12, 12, 18, "#000");
    d.vline(30, 12, 10, "#000");
    d.hline(18, 22, 12, "#000");
    // Stars and dots
    d.px(8, 20, "#000"); d.px(8, 21, "#000");
    d.px(9, 20, "#000"); d.px(9, 21, "#000");
    d.px(36, 24, "#000"); d.px(37, 24, "#000");
    // Biomorphic blob
    d.circle(22, 14, 3, "#000");
    d.px(22, 11, "#000"); d.px(22, 17, "#000");
    d.px(19, 14, "#000"); d.px(25, 14, "#000");
    // Ladder motif
    d.vline(6, 8, 20, "#000");
    for (let i = 0; i < 5; i++) d.hline(6, 10 + i * 4, 4, "#000");
    // Bird-like form
    d.circle(35, 18, 3, "#FF0000");
    d.hline(32, 18, 5, "#000");
    d.px(35, 15, "#000"); d.px(36, 15, "#000"); d.px(35, 14, "#000");
  },

  // ── FRIDA KAHLO / CDMX folk: Self-portrait with flowers ──
  "Frida Kahlo": (d, r) => {
    d.rect(4, 4, 38, 30, "#1A4A1A");
    // Foliage bg
    for (let i = 0; i < 10; i++) {
      d.circle(6 + Math.floor(r() * 32), 4 + Math.floor(r() * 14), 2, "#2A6A2A", 0.7);
    }
    // Face
    d.circle(23, 18, 9, "#C68642");
    // Flower crown
    const flowerColors = ["#FF4444","#FF8800","#FFFF00","#FF44AA","#FF0088"];
    for (let i = 0; i < 5; i++) {
      const fx = 16 + i * 3, fy = 10;
      d.circle(fx, fy, 2, flowerColors[i]);
    }
    d.rect(14, 12, 18, 2, "#228B22");
    // Unibrow (signature)
    d.hline(17, 14, 12, "#333");
    // Eyes
    d.px(19, 16, "#222"); d.px(27, 16, "#222");
    // Dress (Tehuana)
    d.rect(14, 27, 18, 7, "#CC2200");
    d.hline(14, 27, 18, "#FFD700");
    for (let i = 0; i < 6; i++) d.px(15 + i * 3, 29, "#FFD700");
  },

  // ── SHEPHERD FAIREY: HOPE poster style ──
  "Shepard Fairey": (d, r) => {
    d.rect(4, 4, 38, 30, "#CC1111");
    // Face posterization (4-color)
    // Background layer
    d.rect(4, 4, 38, 30, "#0044AA");
    // Shadow layer
    d.rect(10, 6, 24, 28, "#CC1111");
    // Face shape
    d.circle(23, 16, 10, "#F5E6C8");
    // Shadow halftone on face
    for (let y = 0; y < 20; y += 2) {
      for (let x = 0; x < 20; x += 2) {
        if (r() > 0.5) d.px(13 + x, 6 + y, "#CC6600", 0.4);
      }
    }
    // HOPE text block at bottom
    d.rect(4, 28, 38, 6, "#0044AA");
    d.text3x5("HOPE", 10, 29, "#FFFFFF");
    // Eyes (strong outline)
    d.rect(17, 13, 4, 3, "#2A1A00");
    d.rect(25, 13, 4, 3, "#2A1A00");
  },

  // ── JEFF KOONS: Balloon dog ──
  "Jeff Koons": (d, r) => {
    d.rect(4, 4, 38, 30, "#F0F0F0");
    // Balloon dog body (orange chrome)
    const orange = "#FF6600", shine = "#FFAA44", dark = "#CC4400";
    // Legs
    d.vline(14, 22, 10, orange); d.vline(15, 22, 10, orange);
    d.vline(28, 22, 10, orange); d.vline(29, 22, 10, orange);
    // Body balloon
    d.circle(22, 20, 6, orange);
    d.circle(21, 18, 2, shine, 0.6);
    // Neck
    d.rect(19, 12, 6, 6, orange);
    // Head balloon
    d.circle(22, 10, 5, orange);
    d.circle(21, 8, 2, shine, 0.6);
    // Ears
    d.circle(17, 8, 3, orange); d.circle(27, 8, 3, orange);
    // Tail
    d.circle(29, 20, 2, orange);
    d.circle(31, 18, 2, orange);
    // Ground reflection (Koons trademark)
    d.rect(10, 32, 26, 2, "#DDDDDD");
    d.circle(22, 32, 6, "#EE5500", 0.2);
  },

  // ── DAMIEN HIRST: Spot painting ──
  "Damien Hirst": (d, r) => {
    d.rect(4, 4, 38, 30, "#FFFFFF");
    const spotColors = [
      "#FF0000","#0000FF","#FFFF00","#FF8800","#00AA00",
      "#FF00FF","#00FFFF","#8800FF","#FF6688","#00DDAA",
      "#FFAA00","#0088FF","#FF4400","#44FF00","#AA00FF",
    ];
    // 5x4 grid of spots
    let ci = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        d.circle(9 + col * 8, 9 + row * 7, 3, spotColors[ci % spotColors.length]);
        ci++;
      }
    }
  },

  // ── TRACEY EMIN: Neon text ──
  "Tracey Emin": (d, r) => {
    d.rect(4, 4, 38, 30, "#080808");
    // Neon pink glow effect
    const neonPink = "#FF1493", neonGlow = "#FF69B4";
    // "I Love You" neon sign feel
    // Large heart
    d.px(16, 12, neonGlow); d.px(17, 11, neonGlow); d.px(18, 12, neonGlow);
    d.px(20, 12, neonGlow); d.px(21, 11, neonGlow); d.px(22, 12, neonGlow);
    d.px(15, 13, neonGlow); d.px(16, 13, neonPink); d.px(17, 13, neonPink);
    d.px(18, 13, neonPink); d.px(19, 13, neonPink); d.px(20, 13, neonPink);
    d.px(21, 13, neonPink); d.px(22, 13, neonPink); d.px(23, 13, neonGlow);
    for (let row = 14; row <= 19; row++) {
      const width = 10 - (row - 14);
      d.hline(19 - width / 2, row, width, neonPink);
    }
    d.px(23, 20, neonPink);
    // Glow halos
    d.circle(19, 15, 8, neonGlow, 0.08);
    d.circle(19, 15, 10, neonGlow, 0.04);
    // Handwriting-like squiggles
    for (let i = 0; i < 3; i++) {
      d.hline(8, 24 + i * 2, Math.floor(r() * 14) + 6, neonGlow, 0.3);
    }
  },

  // ── CHIHARU SHIOTA: Red thread installation ──
  "Chiharu Shiota": (d, r) => {
    d.rect(4, 4, 38, 30, "#0A0505");
    // Dense red thread web
    for (let i = 0; i < 40; i++) {
      const x1 = 4 + Math.floor(r() * 38);
      const y1 = 4 + Math.floor(r() * 30);
      const x2 = 4 + Math.floor(r() * 38);
      const y2 = 4 + Math.floor(r() * 30);
      // Draw line as series of points
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const x = Math.round(x1 + (x2 - x1) * t);
        const y = Math.round(y1 + (y2 - y1) * t);
        d.px(x, y, "#CC0000", 0.4 + r() * 0.3);
      }
    }
    // Hanging keys (signature motif)
    for (let i = 0; i < 5; i++) {
      const kx = 8 + i * 7, ky = 14;
      d.vline(kx, ky, 6, "#888888");
      d.circle(kx, ky + 7, 2, "#AAAAAA");
      d.px(kx - 1, ky + 9, "#888"); d.px(kx + 1, ky + 9, "#888");
    }
  },

  // ── GERHARD RICHTER alt: blurred photo ──
  "Luc Tuymans": (d, r) => {
    // Tuymans: washed out, desaturated palette
    d.rect(4, 4, 38, 30, "#D8D0C0");
    // Pale figure
    d.circle(23, 14, 8, "#C8BCA8");
    d.rect(16, 22, 14, 12, "#BCAC9C");
    // Washed-out face features
    d.px(20, 13, "#8A7A6A", 0.5); d.px(26, 13, "#8A7A6A", 0.5);
    d.hline(20, 17, 6, "#9A8A7A", 0.4);
    // Desaturation overlay
    d.rect(4, 4, 38, 30, "#D8D0C0", 0.2);
    // Dark corner shadows
    d.rect(4, 4, 8, 8, "#888070", 0.3);
    d.rect(34, 4, 8, 8, "#888070", 0.3);
  },

  // ── AI WEIWEI: Sunflower seeds / architecture ──
  "Ai Weiwei": (d, r) => {
    d.rect(4, 4, 38, 30, "#1A1A0A");
    // Field of sunflower seeds (Tate installation)
    for (let y = 16; y < 34; y++) {
      for (let x = 4; x < 42; x++) {
        if (r() > 0.3) {
          const shade = r() > 0.5 ? "#888866" : "#666644";
          d.px(x, y, shade, 0.8);
        }
      }
    }
    // Traditional vase silhouette (dropping the Han dynasty urn)
    d.circle(23, 11, 5, "#CC8822");
    d.rect(19, 11, 8, 8, "#CC8822");
    d.rect(17, 16, 12, 2, "#CC8822");
    // Cracking/falling
    d.vline(22, 16, 4, "#AA6610", 0.5);
    d.px(20, 18, "#444"); d.px(24, 19, "#444");
  },

  // ── FRANCIS ALYS: Pushcart/action ──
  "Francis Alys": (d, r) => {
    d.rect(4, 4, 38, 30, "#8B7355");
    // Street/ground
    d.rect(4, 25, 38, 9, "#6B5335");
    // Ice block melting
    d.rect(18, 16, 8, 10, "#AACCFF", 0.8);
    d.rect(18, 16, 8, 10, "#FFFFFF", 0.2);
    // Melt puddle
    d.rect(16, 25, 12, 3, "#4488CC", 0.4);
    // Figure pushing
    d.circle(30, 18, 3, "#FFDAB9");
    d.rect(28, 21, 4, 6, "#2244AA");
    d.hline(24, 22, 6, "#FFDAB9");
    // City perspective lines
    for (let i = 0; i < 5; i++) {
      d.px(4 + i * 3, 4 + i, "#7A6345", 0.4);
    }
  },

  // ── EL ANATSUI: Bottle cap tapestry ──
  "El Anatsui": (d, r) => {
    const cols = ["#8B0000","#CC4400","#FFD700","#B8860B","#8B6914","#CC8800","#FF6600","#993300"];
    for (let y = 4; y < 34; y++) {
      for (let x = 4; x < 42; x += 2) {
        const c = cols[Math.floor(r() * cols.length)];
        d.rect(x, y, 2, 1, c, 0.7 + r() * 0.3);
      }
    }
    // Copper wire connections
    for (let i = 0; i < 8; i++) {
      const wy = 6 + i * 3;
      d.hline(4, wy, 38, "#B87333", 0.15);
    }
  },

  // ── JR: Giant paste-up face ──
  "JR": (d, r) => {
    d.rect(4, 4, 38, 30, "#F5F5F0");
    // Wheat-paste paper texture
    d.rect(10, 6, 24, 26, "#EEEEEE");
    // Giant portrait face (black and white)
    d.circle(22, 18, 10, "#E8E8E0");
    // Strong contrast features
    d.rect(17, 14, 4, 3, "#111"); // left eye dark
    d.rect(23, 14, 4, 3, "#111"); // right eye dark
    d.circle(18, 15, 2, "#FFFFFF"); d.circle(24, 15, 2, "#FFFFFF"); // whites
    d.px(18, 15, "#000"); d.px(24, 15, "#000"); // pupils
    // Nose strong shadow
    d.rect(20, 19, 4, 4, "#888");
    // Mouth
    d.hline(18, 24, 8, "#333");
    // Torn paper edges
    for (let i = 0; i < 6; i++) {
      d.px(10 + Math.floor(r() * 3), 6 + i * 4, "#CCCCCC");
      d.px(32 + Math.floor(r() * 3), 6 + i * 4, "#CCCCCC");
    }
    // B&W stamp
    d.rect(28, 28, 8, 4, "#000");
    d.px(30, 29, "#FFF"); d.px(31, 29, "#FFF"); d.px(32, 29, "#FFF");
  },

  // ── KARA WALKER: Silhouette cut paper ──
  "Kara Walker": (d, r) => {
    d.rect(4, 4, 38, 30, "#F5F0E8");
    // Classic black silhouettes on white
    // Female figure in antebellum dress
    d.circle(23, 12, 4, "#111"); // head
    // Voluminous dress
    d.rect(19, 16, 8, 8, "#111");
    d.rect(15, 22, 16, 4, "#111");
    d.rect(12, 24, 22, 2, "#111");
    // Hair up
    d.rect(21, 8, 4, 4, "#111");
    d.px(23, 7, "#111"); d.px(22, 7, "#111"); d.px(24, 7, "#111");
    // Reaching arm
    d.hline(19, 17, 8, "#111");
    d.vline(19, 14, 4, "#111");
    d.hline(10, 14, 9, "#111");
    // Shadow ground
    d.rect(4, 30, 38, 4, "#111", 0.3);
  },

  // ── DAMIAN ORTEGA: Cosmic Thing exploded VW ──
  "Damian Ortega": (d, r) => {
    d.rect(4, 4, 38, 30, "#0A0A0A");
    // Suspended parts of VW Beetle
    const parts = [
      {x: 22, y: 7, w: 8, h: 3, c: "#888"},  // roof
      {x: 18, y: 12, w: 14, h: 4, c: "#999"}, // door
      {x: 14, y: 18, w: 18, h: 5, c: "#777"}, // body
      {x: 12, y: 24, w: 6, h: 3, c: "#666"},  // front wheel well
      {x: 28, y: 24, w: 6, h: 3, c: "#666"},  // rear wheel well
      {x: 8, y: 14, w: 4, h: 4, c: "#888"},   // door panel
      {x: 34, y: 14, w: 4, h: 4, c: "#888"},  // fender
      {x: 20, y: 29, w: 6, h: 3, c: "#555"},  // engine
    ];
    parts.forEach(p => d.rect(p.x, p.y, p.w, p.h, p.c));
    // Suspension strings
    parts.forEach(p => d.vline(p.x + p.w / 2, 4, p.y - 4, "#CCC", 0.3));
    // Wheels
    d.circle(14, 27, 3, "#333");
    d.circle(30, 27, 3, "#333");
    d.circle(14, 27, 2, "#555");
    d.circle(30, 27, 2, "#555");
  },

  // ── ADRIANA VAREJAO: Broken azulejo tile ──
  "Adriana Varejao": (d, r) => {
    // Blue Portuguese tiles
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 5; tx++) {
        const bx = 4 + tx * 8, by = 4 + ty * 8;
        d.rect(bx, by, 7, 7, "#4488CC");
        // Tile pattern
        d.rect(bx + 1, by + 1, 5, 5, "#2266AA");
        d.px(bx + 3, by + 1, "#66AAEE");
        d.px(bx + 1, by + 3, "#66AAEE");
        d.px(bx + 5, by + 3, "#66AAEE");
        d.px(bx + 3, by + 5, "#66AAEE");
      }
    }
    // Cracked break revealing flesh/baroque underneath
    const crackX = 18;
    for (let y = 4; y < 34; y++) {
      d.vline(crackX + (y % 3 === 0 ? 1 : 0), y, 1, "#111");
    }
    // Fleshy pink bleeding through crack
    for (let y = 8; y < 28; y++) {
      d.px(crackX + 1, y, "#FF9988", 0.6);
      d.px(crackX + 2, y, "#FFB8A8", 0.3);
    }
  },

  // ── CECILY BROWN: Abstract gestural with figures ──
  "Cecily Brown": (d, r) => {
    const colors = ["#8B0000","#CC4400","#FF8800","#FFD700","#884400","#AA2200"];
    for (let i = 0; i < 50; i++) {
      const x = 4 + Math.floor(r() * 38);
      const y = 4 + Math.floor(r() * 30);
      const len = Math.floor(r() * 8) + 2;
      const c = colors[Math.floor(r() * colors.length)];
      const vert = r() > 0.5;
      if (vert) d.vline(x, y, len, c, 0.3 + r() * 0.5);
      else d.hline(x, y, len, c, 0.3 + r() * 0.5);
    }
    // Emerging figures hint
    d.circle(18, 16, 4, "#FFDDCC", 0.3);
    d.circle(28, 14, 3, "#FFDDCC", 0.3);
    d.rect(15, 20, 6, 8, "#CC4400", 0.2);
  },

  // ── PETER DOIG: Canoe/landscape ──
  "Peter Doig": (d, r) => {
    // Dark lake/night landscape
    d.rect(4, 4, 38, 14, "#1A2A3A"); // sky with stars
    d.rect(4, 18, 38, 16, "#0A1A2A"); // water
    // Stars
    for (let i = 0; i < 12; i++) {
      d.px(5 + Math.floor(r() * 36), 5 + Math.floor(r() * 12), "#FFFFFF", 0.7);
    }
    // Snow-covered trees
    d.vline(10, 8, 10, "#8B7355"); d.circle(10, 8, 3, "#FFFFFF");
    d.vline(36, 6, 12, "#8B7355"); d.circle(36, 6, 4, "#FFFFFF");
    // Reflection in water
    d.vline(10, 18, 8, "#4A5A6A", 0.5);
    d.vline(36, 18, 8, "#4A5A6A", 0.5);
    // Moon / reflection stripe
    d.circle(23, 11, 3, "#F0E0C0");
    d.hline(16, 22, 14, "#C0B090", 0.3); // moon reflection
    // Canoe
    d.rect(14, 24, 18, 3, "#8B4513");
    d.rect(13, 25, 20, 1, "#A0522D");
    // Lone figure in canoe
    d.circle(23, 23, 2, "#332211");
  },

  // ── JULIE MEHRETU: Architectural abstraction ──
  "Julie Mehretu": (d, r) => {
    d.rect(4, 4, 38, 30, "#FAFAFA");
    // Architectural plan lines
    for (let i = 0; i < 8; i++) {
      d.hline(4, 8 + i * 3, 38, "#CCCCCC", 0.4);
    }
    for (let i = 0; i < 8; i++) {
      d.vline(8 + i * 4, 4, 30, "#CCCCCC", 0.4);
    }
    // Explosive gestural marks over top
    for (let i = 0; i < 25; i++) {
      const cx = 10 + Math.floor(r() * 24), cy = 8 + Math.floor(r() * 20);
      const len = Math.floor(r() * 12) + 2;
      const angle = r() * Math.PI * 2;
      const ex = cx + Math.round(Math.cos(angle) * len);
      const ey = cy + Math.round(Math.sin(angle) * len);
      const colors = ["#FF0000","#0000FF","#000000","#FF8800","#8800FF"];
      const c = colors[Math.floor(r() * colors.length)];
      // Draw line
      const steps = Math.max(Math.abs(ex - cx), Math.abs(ey - cy));
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        d.px(Math.round(cx + (ex - cx) * t), Math.round(cy + (ey - cy) * t), c, 0.6);
      }
    }
    // Stencilled circles
    d.circle(23, 18, 6, "#000000", 0.0);
    d.hline(17, 18, 12, "#000", 0.15);
    d.vline(23, 12, 12, "#000", 0.15);
  },

  // ── HIROSHI SUGIMOTO: Seascape ──
  "Hiroshi Sugimoto": (d, r) => {
    // Perfect horizon line — his signature
    const horizon = 19;
    // Sky gradient (dark at top, lighter toward horizon)
    for (let y = 4; y < horizon; y++) {
      const t = (y - 4) / (horizon - 4);
      const gray = Math.round(20 + t * 40);
      const hex = gray.toString(16).padStart(2, "0");
      d.hline(4, y, 38, `#${hex}${hex}${hex}`);
    }
    // Sea (slightly lighter)
    for (let y = horizon; y < 34; y++) {
      const t = (y - horizon) / (34 - horizon);
      const gray = Math.round(35 + t * 20);
      const hex = gray.toString(16).padStart(2, "0");
      d.hline(4, y, 38, `#${hex}${hex}${hex}`);
    }
    // Horizon line (strong)
    d.hline(4, horizon, 38, "#888888");
    // Subtle wave texture on water
    for (let i = 0; i < 6; i++) {
      d.hline(6 + Math.floor(r() * 8), horizon + 2 + i * 2, Math.floor(r() * 16) + 4, "#777777", 0.3);
    }
  },

  // ── DAIDO MORIYAMA: Grainy black/white street ──
  "Daido Moriyama": (d, r) => {
    d.rect(4, 4, 38, 30, "#111");
    // High contrast grain
    for (let y = 4; y < 34; y++) {
      for (let x = 4; x < 42; x++) {
        const v = r();
        if (v > 0.7) d.px(x, y, "#FFFFFF", v - 0.5);
        else if (v < 0.1) d.px(x, y, "#000000");
      }
    }
    // Dog silhouette (his famous stray dog photo)
    d.rect(16, 22, 14, 7, "#000");
    d.circle(27, 21, 4, "#000");
    d.px(28, 18, "#000"); // ear
    d.rect(16, 29, 2, 3, "#000"); // leg
    d.rect(20, 29, 2, 3, "#000");
    d.rect(24, 29, 2, 3, "#000");
    d.rect(27, 29, 2, 3, "#000");
    d.vline(29, 22, 5, "#000"); // tail
    d.px(30, 22, "#000"); d.px(31, 22, "#000");
  },

  // ── KEIICHI TANAAMI: Psychedelic dense ──
  "Keiichi Tanaami": (d, r) => {
    const psychColors = ["#FF0066","#FF6600","#FFFF00","#00FF66","#0066FF","#CC00FF","#FF0099"];
    d.rect(4, 4, 38, 30, "#000000");
    // Dense circular patterns
    for (let ring = 1; ring <= 6; ring++) {
      const c = psychColors[ring % psychColors.length];
      d.circle(23, 19, ring * 3, c, 0.3);
    }
    // Floating eyeballs
    for (let i = 0; i < 4; i++) {
      const ex = 8 + i * 9, ey = 8 + (i % 2) * 8;
      d.circle(ex, ey, 3, "#FFFFFF");
      d.circle(ex, ey, 2, psychColors[i]);
      d.circle(ex, ey, 1, "#000");
    }
    // Playboy-bunny-style silhouette hint
    d.circle(23, 19, 2, "#FFFF00");
    // Kaleidoscope lines
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const ex = 23 + Math.round(Math.cos(angle) * 15);
      const ey = 19 + Math.round(Math.sin(angle) * 12);
      d.px(ex, ey, psychColors[a % psychColors.length], 0.6);
    }
  },

  // ── EDGAR DEGAS style / ballet ──
  // (for ballet/figurative type artists)
  // Generic gestural painting

  // ── ROY LICHTENSTEIN: Whaam! ──────────────────────────────────────────────
  "Roy Lichtenstein": (d) => {
    // Left panel: jet firing
    d.rect(0, 0, 32, 64, "#FFFF00");
    d.rect(0, 0, 32, 64, "#FFFF00");
    // Ben-Day dot pattern on yellow
    for (let dy = 0; dy < 64; dy += 4)
      for (let dx = 0; dx < 32; dx += 4)
        d.circle(dx+2, dy+2, 1, "#FFD700");
    // Jet body
    d.rect(4,26,20,8,"#2244AA");
    d.rect(2,28,6,4,"#1A3399");
    d.rect(20,20,8,6,"#2244AA");
    d.rect(20,32,8,6,"#2244AA");
    d.rect(6,32,18,6,"#2244AA");
    // Missile firing left→right
    d.rect(22,29,8,2,"#FF0000");
    d.px(30,29,"#FF8800"); d.px(31,29,"#FF8800");
    // Speech bubble
    d.rect(2,3,24,10,"#FFFFFF");
    d.hline(2,3,24,"#000"); d.hline(2,12,24,"#000");
    d.vline(2,3,9,"#000"); d.vline(25,3,9,"#000");
    d.hline(4,5,8,"#000",0.3); d.hline(4,7,6,"#000",0.3); d.hline(4,9,10,"#000",0.3);
    // Right panel: explosion
    d.rect(32,0,32,64,"#FFFFFF");
    // Explosion burst
    const ec=["#FF0000","#FF6600","#FFFF00","#FF4400"];
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2;
      for(let r=2;r<18;r+=1){
        d.px(48+Math.round(Math.cos(a)*r), 32+Math.round(Math.sin(a)*r), ec[i%4], 0.7);
      }
    }
    d.circle(48,32,10,"#FF0000"); d.circle(48,32,7,"#FF8800"); d.circle(48,32,4,"#FFFF00"); d.circle(48,32,2,"#FFFFFF");
    // WHAAM text box
    d.rect(34,4,28,9,"#FFFFFF");
    d.hline(34,4,28,"#000"); d.hline(34,12,28,"#000");
    d.vline(34,4,8,"#000"); d.vline(61,4,8,"#000");
    for(let x=36;x<60;x+=5){ d.vline(x,5,6,"#000",0.4); d.hline(x,7,3,"#000",0.3); }
    // Panel divider
    d.vline(32,0,64,"#000");
  },

  // ── JASPER JOHNS: Flag ────────────────────────────────────────────────────
  "Jasper Johns": (d) => {
    // 13 stripes
    for(let i=0;i<13;i++) d.rect(0,i*5,64,5,i%2===0?"#BF0A30":"#FFFFFF");
    // Blue canton
    d.rect(0,0,26,25,"#002868");
    // Stars (rows of 6 and 5 alternating)
    for(let row=0;row<5;row++){
      const cols = row%2===0?6:5;
      const ox = row%2===0?2:4;
      for(let col=0;col<cols;col++){
        const sx=ox+col*4, sy=2+row*4;
        d.px(sx+1,sy,"#FFF"); d.px(sx,sy+1,"#FFF");
        d.px(sx+1,sy+1,"#FFF"); d.px(sx+2,sy+1,"#FFF"); d.px(sx+1,sy+2,"#FFF");
      }
    }
    // Encaustic wax texture overlay
    for(let y=0;y<64;y+=5) d.hline(0,y,64,"#FFFFFF",0.04);
    for(let x=0;x<64;x+=5) d.vline(x,0,64,"#FFFFFF",0.02);
  },

  // ── BRIDGET RILEY: Movement in Squares ────────────────────────────────────
  "Bridget Riley": (d) => {
    d.fill("#FFFFFF");
    // Columns narrowing toward centre then widening — classic Op Art compression
    const widths=[6,5,5,4,4,3,2,2,3,4,4,5,5,6];
    let x=0;
    widths.forEach((w,i)=>{ d.rect(x,0,w,64,i%2===0?"#000":"#FFF"); x+=w; });
    // Horizontal lines to emphasise square→rectangle distortion
    for(let row=0;row<13;row++){
      const y=row*5;
      d.hline(0,y,64,"#CCCCCC",0.06);
    }
  },

  // ── AGNES MARTIN: Untitled #10 — delicate pencil grid ────────────────────
  "Agnes Martin": (d) => {
    d.fill("#F8F4EA");
    for(let i=0;i<18;i++){
      const y=4+i*3;
      d.hline(6,y,52,"#CCBBAA",0.25+(i%4)*0.04);
      d.hline(6,y+1,52,"#DECCBB",0.1);
    }
    for(let i=0;i<10;i++){
      const x=6+i*6;
      d.vline(x,4,54,"#DDCCBB",0.06);
    }
    // Warm wash bands
    for(let i=0;i<4;i++) d.rect(6,4+i*14,52,12,"#F0EAD6",0.12);
  },

  // ── CY TWOMBLY: Bacchus scrawl ────────────────────────────────────────────
  "Cy Twombly": (d,r) => {
    d.fill("#F5F0E4");
    // Looping red scrawls
    for(let loop=0;loop<7;loop++){
      const cx=14+Math.floor(r()*36), cy=10+Math.floor(r()*44);
      const rad=6+Math.floor(r()*12);
      for(let a=0;a<Math.PI*2;a+=0.12){
        const jx=cx+Math.round(Math.cos(a)*(rad+(r()-0.5)*4));
        const jy=cy+Math.round(Math.sin(a)*(rad+(r()-0.5)*4));
        d.px(jx,jy,"#CC2200",0.5+r()*0.4);
        d.px(jx+1,jy,"#CC2200",0.2);
      }
    }
    // Ghost pencil text
    for(let i=0;i<5;i++){
      d.hline(4+Math.floor(r()*20),8+Math.floor(r()*50),Math.floor(r()*14)+3,"#888",0.12);
    }
    // Drips
    for(let i=0;i<4;i++) d.vline(10+i*14,30+Math.floor(r()*20),Math.floor(r()*8)+2,"#CC2200",0.3);
  },

  // ── ELLSWORTH KELLY: Blue Green Red ──────────────────────────────────────
  "Ellsworth Kelly": (d) => {
    d.rect(0,0,22,64,"#228833");
    d.rect(21,0,22,64,"#1144CC");
    d.rect(42,0,22,64,"#CC1111");
    d.vline(21,0,64,"#FFFFFF",0.8);
    d.vline(42,0,64,"#FFFFFF",0.8);
  },

  // ── FRANK STELLA: Harran II protractor ───────────────────────────────────
  "Frank Stella": (d) => {
    d.fill("#111");
    const cols=["#FF0000","#FF8800","#FFDD00","#00CC44","#0088FF","#8800FF","#FF0088","#00CCCC"];
    // Top half — concentric semicircles
    for(let i=0;i<8;i++){
      const r=28-i*3;
      for(let dx=-r;dx<=r;dx++)
        for(let dy=-r;dy<=0;dy++){
          const d2=dx*dx+dy*dy;
          if(d2<=r*r&&d2>=(r-2)*(r-2)) d.px(32+dx,32+dy,cols[i]);
        }
    }
    // Bottom half — same but offset colors
    for(let i=0;i<8;i++){
      const r=28-i*3;
      for(let dx=-r;dx<=r;dx++)
        for(let dy=0;dy<=r;dy++){
          const d2=dx*dx+dy*dy;
          if(d2<=r*r&&d2>=(r-2)*(r-2)) d.px(32+dx,32+dy,cols[(i+4)%8]);
        }
    }
    d.hline(4,32,56,"#111",0.8);
  },

  // ── ED RUSCHA: Standard Station ──────────────────────────────────────────
  "Ed Ruscha": (d) => {
    d.fill("#000");
    d.rect(0,0,64,32,"#0A0816");
    // Horizon glow
    d.rect(0,28,64,8,"#331400");
    // Station canopy — dramatic diagonal
    d.line(0,20,56,28,"#FF6600");
    d.line(0,18,56,26,"#FF8800");
    d.line(0,22,56,30,"#CC4400");
    // Canopy top face
    d.rect(0,16,50,5,"#FF8800");
    // Flood lights
    d.circle(28,22,4,"#FFFFFF"); d.circle(28,22,2,"#FFFFCC");
    d.circle(12,18,3,"#FFFFFF"); d.circle(12,18,2,"#FFFFCC");
    // Station building
    d.rect(6,30,32,14,"#EEEEEE");
    d.rect(8,32,10,8,"#FFEE88"); d.rect(22,32,10,8,"#FFEE88");
    d.rect(6,30,32,2,"#CCCCCC");
    // Pumps
    d.rect(46,34,5,10,"#DDD"); d.rect(56,34,5,10,"#DDD");
    d.rect(46,30,5,6,"#AAA"); d.rect(56,30,5,6,"#AAA");
    // Forecourt
    d.rect(0,42,64,22,"#888888");
    d.hline(0,42,64,"#666");
  },

  // ── ALEX KATZ: Ada ────────────────────────────────────────────────────────
  "Alex Katz": (d) => {
    d.fill("#2244AA");
    // Ada face — flat graphic
    d.circle(32,26,16,"#F4CFA4");
    // Hair — flat black, 60s bob
    d.rect(14,10,36,16,"#1A1200");
    d.rect(12,16,6,18,"#1A1200");
    d.rect(46,16,6,18,"#1A1200");
    d.rect(14,26,4,12,"#1A1200");
    d.rect(46,26,4,12,"#1A1200");
    // Eye shadow
    d.rect(20,21,8,4,"#7AAEC8"); d.rect(36,21,8,4,"#7AAEC8");
    // Eyes
    d.rect(21,22,6,3,"#223355"); d.rect(37,22,6,3,"#223355");
    d.px(22,22,"#FFFFFF"); d.px(38,22,"#FFFFFF");
    // Nose
    d.px(31,29,"#D8A888"); d.px(33,29,"#D8A888");
    // Lips — flat red
    d.rect(25,33,14,5,"#CC2244"); d.hline(25,35,14,"#AA1133");
    d.rect(27,32,10,1,"#DD3355");
    // Neck + red top
    d.rect(28,42,8,8,"#F4CFA4");
    d.rect(18,48,28,16,"#CC3322");
    d.hline(18,48,28,"#AA2211");
  },

  // ── CHUCK CLOSE: Grid portrait ────────────────────────────────────────────
  "Chuck Close": (d,r) => {
    d.fill("#444");
    const G=4;
    // Face data — 16×16 luminance grid (0-9)
    const fd=[
      [0,0,2,4,5,5,5,4,2,0,0,0,0,0,0,0],
      [0,2,5,6,7,7,7,6,5,2,0,0,0,0,0,0],
      [2,5,7,8,9,9,8,7,5,2,0,0,0,0,0,0],
      [4,7,8,1,7,7,1,8,7,4,0,0,0,0,0,0],
      [5,7,7,2,8,8,2,7,7,5,0,0,0,0,0,0],
      [5,6,5,4,6,6,4,5,6,5,0,0,0,0,0,0],
      [4,5,6,7,5,5,7,6,5,4,0,0,0,0,0,0],
      [3,4,5,6,7,7,6,5,4,3,0,0,0,0,0,0],
      [3,4,4,5,6,6,5,4,4,3,0,0,0,0,0,0],
      [2,3,4,5,5,5,5,4,3,2,0,0,0,0,0,0],
      [2,3,3,4,4,4,4,3,3,2,0,0,0,0,0,0],
      [1,2,3,3,3,3,3,3,2,1,0,0,0,0,0,0],
      [0,1,2,2,2,2,2,2,1,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
    ];
    for(let row=0;row<14;row++) for(let col=0;col<10;col++){
      const v=fd[row][col]||0;
      const gx=7+col*G, gy=4+row*G;
      const b=Math.round(v*24+16);
      const h=b.toString(16).padStart(2,"0");
      d.rect(gx,gy,G-1,G-1,`#${h}${h}${h}`);
      // Grid lines
      d.hline(gx,gy,G,"#555",0.4); d.vline(gx,gy,G,"#555",0.4);
      // Internal dots
      if(v>4){ d.circle(gx+G/2,gy+G/2,1,"#FFFFFF",v*0.03); }
    }
  },

  // ── KERRY JAMES MARSHALL: Black figure portrait ───────────────────────────
  "Kerry James Marshall": (d) => {
    d.fill("#331800");
    d.rect(0,38,64,26,"#221000");
    d.hline(0,38,64,"#442200");
    // Jet-black figure
    d.circle(32,26,11,"#000");
    d.rect(22,37,20,27,"#000");
    d.rect(14,40,8,20,"#000"); d.rect(42,40,8,20,"#000");
    // Gold halo ring
    d.ring(32,22,14,"#D4AF37",0.5);
    d.ring(32,22,15,"#D4AF37",0.25);
    // White eyes bright
    d.circle(28,24,3,"#FFF"); d.circle(36,24,3,"#FFF");
    d.circle(28,24,1,"#000"); d.circle(36,24,1,"#000");
    // Red heart motifs
    d.px(8,10,"#FF4444"); d.px(9,9,"#FF4444"); d.px(10,9,"#FF4444");
    d.px(11,10,"#FF4444"); d.px(9,11,"#FF4444"); d.px(10,11,"#FF4444");
    d.px(54,10,"#FF4444"); d.px(53,9,"#FF4444"); d.px(52,9,"#FF4444");
    d.px(51,10,"#FF4444"); d.px(53,11,"#FF4444"); d.px(52,11,"#FF4444");
    // Lush garden
    d.circle(8,50,4,"#FF6600",0.7); d.circle(56,50,4,"#FFAA00",0.7);
    d.circle(20,56,3,"#FF4400",0.5); d.circle(44,56,3,"#FF8800",0.5);
  },

  // ── SIMONE LEIGH: Brick House ─────────────────────────────────────────────
  "Simone Leigh": (d) => {
    d.fill("#1A0800");
    const B="#9A7418",BH="#C4A030",BD="#6A4808";
    // Thatch base
    for(let y=44;y<64;y++){
      const sp=(y-44)*0.7;
      d.hline(Math.round(22-sp),y,Math.round(20+sp*2),"#4A3800");
      d.hline(Math.round(22-sp),y,Math.round(20+sp*2),"#6A5200",0.3);
    }
    // Torso column
    d.rect(24,18,16,28,B); d.rect(24,18,16,28,BH,0.15);
    // Breasts
    d.circle(28,28,5,B); d.circle(36,28,5,B);
    d.circle(27,26,2,BH,0.3); d.circle(35,26,2,BH,0.3);
    // Arms
    d.rect(18,22,6,16,B); d.rect(40,22,6,16,B);
    // Architectural head/dome
    d.circle(32,12,11,B); d.circle(32,12,9,BH,0.2);
    d.rect(22,5,20,10,B); d.circle(32,8,10,B);
    // Cowrie shells on head
    for(let i=0;i<5;i++){ d.rect(23+i*4,6,3,7,BD); d.px(24+i*4,9,BH); }
    // Pedestal
    d.rect(20,44,24,5,"#555"); d.rect(18,47,28,4,"#444");
  },

  // ── BEATRIZ MILHAZES: Maresias circles ───────────────────────────────────
  "Beatriz Milhazes": (d) => {
    d.fill("#FFFFFF");
    const C=[["#FF6699","#FF3366","#CC0044"],["#FFDD00","#FFAA00","#FF8800"],
             ["#00AAFF","#0066CC","#0044AA"],["#00CC66","#009944","#007722"],
             ["#CC44AA","#AA2288","#882266"],["#FF6600","#CC4400","#AA2200"]];
    [[16,16,14],[48,48,14],[48,16,12],[16,48,12],[32,32,10],[8,32,7],[56,32,7],[32,8,7],[32,56,7]].forEach(([cx,cy,r],i)=>{
      const ci=C[i%C.length];
      d.circle(cx,cy,r,ci[0]); d.circle(cx,cy,Math.round(r*0.75),ci[1]); d.circle(cx,cy,Math.round(r*0.5),ci[2]);
    });
    // White dots at intersections
    [[24,24],[40,24],[24,40],[40,40],[32,20],[32,44],[20,32],[44,32]].forEach(([x,y])=>d.circle(x,y,2,"#FFFFFF"));
  },

  // ── CILDO MEIRELES: Babel radio tower ─────────────────────────────────────
  "Cildo Meireles": (d) => {
    d.fill("#080808");
    // Tower of stacked radios
    for(let l=0;l<18;l++){
      const y=56-l*3, w=8+Math.floor(l*0.4), x=32-w/2;
      d.rect(x,y,w,3,"#333"); d.hline(x,y,w,"#444");
      d.px(x+1,y+1,"#555"); d.px(x+3,y+1,"#555");
      d.px(x+w-2,y+1,"#888");
      const gc=l%3===0?"#FF4400":l%3===1?"#0044FF":"#00AA44";
      d.px(x+2,y+1,gc,0.4);
    }
    d.rect(0,58,64,6,"#111");
    // Sound waves
    for(let i=1;i<=5;i++) d.ring(32,28,i*5,"#333333",0.25);
    d.circle(32,28,18,"#FF6600",0.03); d.circle(32,28,10,"#FF6600",0.04);
  },

  // ── HÉLIO OITICICA: Parangolé dancing ─────────────────────────────────────
  "Hélio Oiticica": (d) => {
    d.fill("#0A0A0A");
    const C=["#FF6600","#FFDD00","#00AA44","#0066CC","#CC0044","#FF8800"];
    // Swirling cape
    for(let i=0;i<14;i++){
      const a=(i/14)*Math.PI*2;
      const cx=32+Math.round(Math.cos(a)*22), cy=34+Math.round(Math.sin(a)*14);
      d.circle(cx,cy,4,C[i%C.length],0.7);
      d.line(32,34,cx,cy,C[i%C.length],0.15);
    }
    // Figure
    d.circle(32,26,7,"#D4B896");
    d.rect(28,33,8,12,"#333");
    d.line(28,37,16,26,"#D4B896");
    d.line(36,37,48,26,"#D4B896");
    // Cape flow
    for(let i=0;i<6;i++){
      d.line(28,38,8+i*4,60,C[i],0.5);
      d.line(36,38,32+i*4,60,C[(i+3)%6],0.4);
    }
  },

  // ── DORIS SALCEDO: Shibboleth (crack) ─────────────────────────────────────
  "Doris Salcedo": (d,r) => {
    // Concrete floor with crack running full length
    for(let y=0;y<64;y++){
      const g=Math.round(112+(y/64)*46);
      const h=g.toString(16).padStart(2,"0");
      d.hline(0,y,64,`#${h}${h}${h}`);
    }
    let cx=28;
    for(let y=0;y<64;y++){
      cx+=Math.round((r()-0.5)*3); cx=Math.max(20,Math.min(44,cx));
      d.px(cx,y,"#000"); d.px(cx+1,y,"#111");
      if(y>16&&y<48){ d.px(cx-1,y,"#222"); d.px(cx+2,y,"#222"); }
      d.px(cx+3,y,"#333",0.4);
    }
    // Concrete grid texture
    for(let y=0;y<64;y+=8) d.hline(0,y,64,"#AAAAAA",0.05);
    for(let x=0;x<64;x+=10) d.vline(x,0,64,"#AAAAAA",0.04);
  },

  // ── MARINA ABRAMOVIC: The Artist is Present ───────────────────────────────
  "Marina Abramović": (d) => {
    d.fill("#F8F8F8");
    // MoMA atrium white space
    d.rect(0,50,64,14,"#EEEEEE"); d.hline(0,50,64,"#CCCCCC");
    // Table
    d.rect(18,30,28,4,"#C8A870"); d.vline(22,34,18,"#A87840"); d.vline(42,34,18,"#A87840");
    // Artist left — long red dress
    d.rect(8,18,12,14,"#CC0000"); d.circle(14,16,6,"#C09060");
    d.rect(10,14,8,8,"#111111"); d.rect(8,14,2,12,"#111111"); d.rect(18,14,2,12,"#111111");
    // Visitor right
    d.rect(44,20,12,12,"#336699"); d.circle(50,18,5,"#D4B090");
    // Gaze line between them — charged invisible space
    d.hline(20,22,24,"#FFFF00",0.04);
    d.hline(20,23,24,"#FFAA00",0.03);
    // Queue dots
    for(let i=0;i<6;i++) d.px(60,14+i*6,"#888");
    // Marble floor lines
    for(let x=8;x<60;x+=10) d.vline(x,50,14,"#DDDDDD",0.4);
  },

  // ── BARBARA KRUGER: Your body is a battleground ───────────────────────────
  "Barbara Kruger": (d) => {
    d.fill("#FFFFFF");
    // Split face left=photo right=negative
    d.rect(32,0,32,64,"#BBBBBB"); d.rect(0,0,32,64,"#333333");
    // Face
    d.circle(32,24,16,"#888888");
    d.circle(24,20,4,"#222"); d.circle(24,20,2,"#FFF");
    d.circle(40,20,4,"#DDD"); d.circle(40,20,2,"#000");
    d.rect(24,28,16,4,"#666");
    // Red banner strips
    d.rect(0,28,64,10,"#FF0000"); d.rect(0,44,64,10,"#FF0000");
    // White text suggestion
    for(let x=4;x<60;x+=5){
      d.vline(x,30,6,"#FFF",0.6); d.vline(x+2,30,6,"#FFF",0.4);
      d.vline(x,46,6,"#FFF",0.6); d.vline(x+2,46,6,"#FFF",0.4);
    }
    d.hline(4,32,56,"#FFF",0.3); d.hline(4,48,56,"#FFF",0.3);
  },

  // ── CINDY SHERMAN: Untitled Film Still #21 ────────────────────────────────
  "Cindy Sherman": (d,r) => {
    d.fill("#222");
    // Kitchen sink, back-turned woman
    d.rect(0,32,64,32,"#444"); d.rect(0,32,64,6,"#555");
    d.rect(10,36,44,22,"#3A3A3A"); d.hline(10,36,44,"#666");
    // Window
    d.rect(18,4,28,26,"#888"); d.hline(18,16,28,"#666"); d.vline(32,4,26,"#666");
    // Figure back to camera
    d.rect(20,14,24,20,"#CCC"); d.circle(32,12,7,"#D0B090");
    d.rect(26,5,12,9,"#1A1000"); d.rect(24,8,4,8,"#1A1000"); d.rect(36,8,4,8,"#1A1000");
    d.rect(14,18,6,12,"#D0B090"); d.rect(44,18,6,12,"#D0B090");
    // Grain
    for(let y=0;y<64;y++) for(let x=0;x<64;x++)
      if((x*11+y*7)%19===0) d.px(x,y,"#FFF",0.04+r()*0.04);
  },

  // ── ZENG FANZHI: Mask series ──────────────────────────────────────────────
  "Zeng Fanzhi": (d) => {
    d.fill("#BB1A00");
    d.rect(0,0,64,64,"#991500",0.4);
    // Suit
    d.rect(14,30,36,34,"#1A2A44"); d.rect(18,30,28,8,"#CC0000");
    // White mask
    d.circle(32,22,14,"#FFFFFF");
    d.rect(22,18,6,5,"#FFCC88"); d.rect(36,18,6,5,"#FFCC88");
    // Painted smile
    d.hline(23,28,18,"#FF0000"); d.px(22,27,"#FF0000"); d.px(41,27,"#FF0000");
    // Mask outline ring
    d.ring(32,22,13,"#FFFFFF",0.6); d.ring(32,22,14,"#FFFFFF",0.3);
    // Expressionist streaks
    for(let i=0;i<6;i++) d.vline(8+i*9,0,64,"#881100",0.12);
  },

  // ── ZHANG XIAOGANG: Bloodline ─────────────────────────────────────────────
  "Zhang Xiaogang": (d) => {
    d.fill("#C4B484");
    // Three muted family portraits
    [[12,14],[28,10],[44,14]].forEach(([cx,cy],i)=>{
      d.circle(cx+8,cy+10,8,"#D8CCAA");
      d.rect(cx+2,cy+5,12,6,"#111");
      d.rect(cx,cy+8,2,10,"#111"); d.rect(cx+14,cy+8,2,10,"#111");
      d.rect(cx+4,cy+7,5,2,"#333"); d.rect(cx+9,cy+7,5,2,"#333");
      d.circle(cx+6,cy+12,2,"#222"); d.circle(cx+11,cy+12,2,"#222");
      d.hline(cx+4,cy+16,10,"#AA6655");
      d.rect(cx+4,cy+20,12,5,i===1?"#2A3A55":"#1A2A44");
    });
    // Red bloodline
    d.line(20,32,44,28,"#CC0000",0.7);
    d.hline(8,34,48,"#CC0000",0.25);
    // Muted photo texture
    for(let y=0;y<64;y+=4) d.hline(0,y,64,"#C4B484",0.05);
  },

  // ── REMBRANDT: Self Portrait with Two Circles ─────────────────────────────
  "Rembrandt van Rijn": (d,r) => {
    d.fill("#1A1000");
    // Two circles in background
    d.circle(20,22,17,"#2A1800",0.7); d.ring(20,22,16,"#3A2400",0.5);
    d.circle(44,28,14,"#221400",0.6); d.ring(44,28,13,"#302000",0.4);
    // Coat
    d.rect(18,32,28,32,"#2A1A00");
    // Lit face (warm raking light from left)
    d.circle(32,22,11,"#B07030");
    d.rect(22,14,20,12,"#AA6820");
    d.rect(32,14,12,12,"#CC8840");
    d.rect(22,14,10,12,"#5A2800",0.6);
    // Beret
    d.rect(21,6,22,10,"#222"); d.rect(19,12,26,4,"#333");
    d.rect(21,10,22,4,"#1A1A1A");
    // Eyes — left lit, right in shadow
    d.circle(28,22,3,"#CC9060"); d.px(27,21,"#EEB060"); d.px(28,21,"#EEB060");
    d.circle(36,22,3,"#664420");
    // Impasto light patches
    for(let i=0;i<6;i++) d.px(32+Math.floor(r()*10),16+Math.floor(r()*8),"#EEB060",0.3);
  },

  // ── FRANCISCO GOYA: Saturn Devouring His Son ─────────────────────────────
  "Francisco Goya": (d,r) => {
    d.fill("#0A0808");
    d.rect(0,0,64,64,"#111008",0.7);
    // Giant Saturn head — wild eyes
    d.circle(24,20,12,"#C08040");
    d.circle(20,18,4,"#FFFFFF"); d.circle(28,18,4,"#FFFFFF");
    d.circle(20,18,2,"#000"); d.circle(28,18,2,"#000");
    d.circle(19,17,1,"#FFF"); d.circle(27,17,1,"#FFF");
    // Open mouth
    d.rect(18,24,12,8,"#000"); d.rect(18,25,12,4,"#AA0000");
    d.hline(18,24,12,"#CC1111");
    // Gnarly hands
    d.rect(12,28,8,6,"#8A5A20"); d.rect(36,28,8,6,"#8A5A20");
    // Small figure being devoured
    d.rect(20,22,8,16,"#C09050");
    d.circle(24,20,4,"#C09050");
    // Dark streaks
    for(let i=0;i<8;i++) d.vline(4+i*7,0,64,"#1A1008",0.2+r()*0.2);
    d.hline(20,36,8,"#AA0000",0.5);
  },

  // ── KÄTHE KOLLWITZ: The Mothers ───────────────────────────────────────────
  "Käthe Kollwitz": (d) => {
    d.fill("#E8E0CC");
    // Central mother
    d.circle(32,24,8,"#888878"); d.rect(24,32,16,22,"#666656");
    d.rect(22,30,20,4,"#777766");
    // Child held to chest
    d.circle(32,34,4,"#999989"); d.rect(28,36,8,8,"#888878");
    // Surrounding huddled figures
    d.circle(18,28,6,"#777767"); d.rect(12,34,14,18,"#555545");
    d.circle(46,28,6,"#777767"); d.rect(40,34,14,18,"#555545");
    // Protective arms
    d.hline(12,40,40,"#555545",0.4);
    d.rect(8,38,6,14,"#444434"); d.rect(50,38,6,14,"#444434");
    // Charcoal texture
    for(let y=0;y<64;y++) d.hline(0,y,64,"#888878",0.02+(y%6===0?0.04:0));
    for(let y=4;y<64;y+=6) d.hline(2,y,60,"#666656",0.08);
  },

  // ── DO HO SUH: Translucent fabric home ────────────────────────────────────
  "Do Ho Suh": (d) => {
    d.fill("#060612");
    const F="#00EEBB", FD="#00AABB";
    // Building behind (Korean apartment)
    d.rect(2,4,10,56,"#0D1A2A",0.6); d.rect(52,4,10,56,"#0D1A2A",0.6);
    for(let r=0;r<8;r++){
      d.rect(2,6+r*7,10,5,"#FFEE88",0.1+(r%2)*0.1);
      d.rect(52,6+r*7,10,5,"#FFEE88",0.08+(r%3)*0.08);
    }
    // Translucent house outline
    d.rect(14,22,36,30,F,0.08);
    d.hline(14,22,36,F,0.7); d.hline(14,52,36,F,0.7);
    d.vline(14,22,30,F,0.7); d.vline(50,22,30,F,0.7);
    // Roof
    d.line(14,22,32,10,F,0.7); d.line(50,22,32,10,F,0.7);
    // Windows
    d.rect(18,28,10,10,FD,0.25); d.rect(36,28,10,10,FD,0.25);
    d.rect(27,38,10,14,FD,0.2);
    // Fabric fold lines
    for(let i=0;i<5;i++) d.hline(14,24+i*5,36,F,0.04);
    for(let i=0;i<5;i++) d.vline(16+i*7,22,30,F,0.04);
    // Hanging threads
    for(let i=0;i<5;i++) d.vline(16+i*8,52,8,F,0.2);
  },

  // ── MARINA ABRAMOVIC (already above, alias) ───────────────────────────────

  // ── JENNY HOLZER: LED Truisms ─────────────────────────────────────────────
  "Jenny Holzer": (d) => {
    d.fill("#000");
    d.rect(2,18,60,24,"#110800");
    // LED dot matrix
    for(let y=0;y<5;y++) for(let x=0;x<60;x++){
      const lit=(x*3+y)%7<3;
      if(lit) d.px(3+x,26+y,"#FF8800",0.7+y*0.05);
      else if((x+y)%4===0) d.px(3+x,26+y,"#220800",0.5);
    }
    // Second line
    for(let y=0;y<4;y++) for(let x=0;x<60;x++)
      if((x*5+y)%9<4) d.px(3+x,34+y,"#FF8800",0.4);
    d.rect(2,18,60,24,"#FF6600",0.03);
    // Building
    d.rect(0,44,20,20,"#111"); d.rect(44,44,20,20,"#111");
    for(let i=0;i<3;i++){
      d.rect(2,46+i*6,7,4,"#FFEE88",0.25);
      d.rect(46,46+i*6,7,4,"#FFEE88",0.2);
    }
  },

  // ── BARKLEY L. HENDRICKS: Lawdy Mama portrait ─────────────────────────────
  "Barkley L. Hendricks": (d) => {
    // Gold/metallic background (his actual ground)
    d.fill("#D4AF37");
    for(let y=0;y<64;y++) d.hline(0,y,64,"#C09B20",0.3+(y%4===0?0.1:0));
    // Full-length stylish figure
    d.circle(32,14,8,"#C08050");
    // Afro
    d.circle(32,12,10,"#1A0A00"); d.circle(25,10,5,"#1A0A00"); d.circle(39,10,5,"#1A0A00");
    // Cool shades
    d.rect(25,13,6,3,"#111"); d.rect(33,13,6,3,"#111"); d.hline(25,13,14,"#333");
    // Bright shirt
    d.rect(22,22,20,14,"#FF6600"); d.hline(22,22,20,"#FF8800");
    // Collar
    d.px(28,22,"#FFFFFF"); d.px(36,22,"#FFFFFF");
    // Flared trousers
    d.rect(24,36,16,20,"#1A1A30");
    d.rect(22,48,8,16,"#1A1A30"); d.rect(34,48,8,16,"#1A1A30");
    // Platform shoes
    d.rect(20,60,10,4,"#1A1A30"); d.rect(34,60,10,4,"#1A1A30");
    d.rect(20,62,10,2,"#FF6600"); d.rect(34,62,10,2,"#FF6600");
    // Arms
    d.rect(14,24,8,10,"#FF6600"); d.rect(42,24,8,10,"#FF6600");
  },

  // ── WILLIAM KENTRIDGE: Drawing for The Nose ──────────────────────────────
  "William Kentridge": (d,r) => {
    d.fill("#F0ECD8");
    // Erased ghost shapes
    for(let i=0;i<12;i++) d.hline(4+Math.floor(r()*40),8+Math.floor(r()*50),Math.floor(r()*16)+4,"#D8D0BC",0.4);
    // Man in hat — profile — with enormous nose
    d.circle(28,28,8,"#D4B090");
    d.rect(44,25,14,6,"#D4B090"); d.circle(54,30,5,"#C8A078");
    d.rect(18,12,20,4,"#222"); d.rect(20,8,16,6,"#222");
    d.rect(22,38,12,16,"#333"); d.rect(20,38,14,4,"#444");
    d.px(26,26,"#222"); d.px(27,26,"#222");
    // Erasure circles (palimpsest)
    d.circle(26,28,9,"#EEE8D4",0.4);
    // Charcoal marks
    for(let i=0;i<5;i++) d.hline(4,8+i*4,Math.floor(r()*18)+4,"#555",0.15+r()*0.2);
    d.line(44,28,54,56,"#6A4820",0.4);
  },

  // ── HIROSHI SUGIMOTO: Seascape ────────────────────────────────────────────
  // (already in file above — skip duplicate)

  // ── ANISH KAPOOR: Cloud Gate (Chicago Bean) ───────────────────────────────
  "Anish Kapoor": (d) => {
    d.fill("#87CEEB");
    // Sky reflection
    for(let y=0;y<32;y++){
      const g=Math.round(120+y*1.5);
      d.hline(0,y,64,`#${Math.round(g*0.5).toString(16).padStart(2,"0")}${Math.round(g*0.76).toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}`);
    }
    // Chicago skyline silhouette in top reflection
    [8,14,20,28,38,44,50,58].forEach((bx,i)=>{
      const bh=4+[6,10,14,8,12,8,10,6][i];
      d.rect(bx,10-bh,4,bh,"#1A2A3A",0.5);
    });
    // The Bean — polished ellipse reflecting everything
    d.circle(32,40,22,"#DDDDDD");
    d.circle(32,40,20,"#CCCCCC");
    // Reflections on surface
    d.circle(32,40,20,"#87CEEB",0.3);
    d.circle(26,36,6,"#AAAACC",0.4);
    d.circle(38,44,5,"#BBBBDD",0.3);
    d.circle(32,36,3,"#FFFFFF",0.5);
    // Arch underneath
    d.rect(14,50,36,8,"#CCCCCC");
    d.rect(18,52,28,6,"#BBBBBB");
    d.circle(32,50,12,"#DDDDDD"); d.circle(32,50,10,"#CCCCCC");
    // Ground / plaza
    d.rect(0,56,64,8,"#888888");
    d.hline(0,56,64,"#AAAAAA");
    // Tiny figures reflected
    for(let i=0;i<5;i++) d.px(14+i*9,54,"#555");
  },

  // ── FELIX VALLOTTON: The Bath — stark woodcut ──────────────────────────────
  "Félix Vallotton": (d) => {
    d.fill("#F5F0E0");
    // His stark black-and-white woodcuts
    // Interior scene — bathroom
    d.rect(0,0,64,64,"#F5F0E0");
    // Dark walls/shadows as solid black masses
    d.rect(0,0,20,64,"#111"); // left shadow
    d.rect(44,0,20,64,"#111"); // right shadow
    d.rect(0,0,64,8,"#111");  // ceiling
    d.rect(0,54,64,10,"#111"); // floor
    // Bathtub — white against black
    d.rect(20,32,24,22,"#F5F0E0");
    d.rect(22,34,20,18,"#E8E0CC");
    d.hline(20,32,24,"#333"); d.hline(20,54,24,"#333");
    d.vline(20,32,22,"#333"); d.vline(44,32,22,"#333");
    // Figure in bath — flat silhouette
    d.rect(22,36,20,14,"#C8A880");
    d.circle(32,34,6,"#C8A880");
    d.rect(28,28,8,8,"#1A1200"); // hair
    // Towel hanging
    d.rect(48,18,6,18,"#FFFFFF"); d.hline(48,18,6,"#333"); d.hline(48,36,6,"#333");
    // Mirror reflection (his formal device)
    d.rect(22,8,20,18,"#E0D8C8"); d.rect(24,10,16,14,"#D8D0C0");
    d.hline(22,8,20,"#333"); d.vline(22,8,18,"#333"); d.hline(22,26,20,"#333"); d.vline(42,8,18,"#333");
  },

  // ── JR: Giants wheat-paste portrait ──────────────────────────────────────
  // (already covered above — skip)

  // ── WIFREDO LAM: The Jungle ───────────────────────────────────────────────
  "Wifredo Lam": (d,r) => {
    d.fill("#1A2A0A");
    // Dense jungle — tall stalks
    for(let x=2;x<64;x+=5){
      const h=30+Math.floor(r()*24);
      d.vline(x,64-h,h,"#2A4A10");
      d.vline(x+1,64-h+4,h-4,"#3A5A18");
      // Leaf
      d.hline(x-2,64-h,6,"#3A6A18",0.7);
    }
    // Hybrid figure (Afro-Cuban syncretic)
    d.circle(32,24,8,"#C8A060");
    // Horns / mask element
    d.vline(28,14,10,"#8B4513"); d.px(27,14,"#8B4513"); d.px(29,14,"#8B4513");
    d.vline(36,14,10,"#8B4513"); d.px(35,14,"#8B4513"); d.px(37,14,"#8B4513");
    // Multiple arms (surrealist body)
    d.line(24,30,10,20,"#C8A060"); d.line(24,30,8,38,"#C8A060");
    d.line(40,30,54,20,"#C8A060"); d.line(40,30,56,38,"#C8A060");
    d.line(28,32,20,48,"#C8A060"); d.line(36,32,44,48,"#C8A060");
    // Eyes — white, large
    d.circle(29,23,3,"#FFFFFF"); d.circle(35,23,3,"#FFFFFF");
    d.circle(29,23,1,"#000"); d.circle(35,23,1,"#000");
    // Body
    d.rect(26,32,12,20,"#C8A060");
  },

  // ── LEONORA CARRINGTON: Surrealist painting ───────────────────────────────
  "Leonora Carrington": (d,r) => {
    d.fill("#1A1228");
    // Moonlit surrealist interior
    d.circle(54,8,6,"#F0E080"); // moon
    for(let i=0;i<8;i++) d.px(Math.floor(r()*60)+2,Math.floor(r()*20)+2,"#FFFFFF",0.5);
    // White horse (her signature)
    d.rect(14,30,24,16,"#FFFFFF"); d.circle(34,26,7,"#FFFFFF");
    d.rect(36,22,8,10,"#FFFFFF"); // neck
    d.circle(42,20,5,"#FFFFFF"); // head
    // Mane flowing
    for(let i=0;i<4;i++) d.vline(34+i*2,16,8,"#EEEECC",0.7);
    // Legs
    d.rect(16,46,4,10,"#FFFFFF"); d.rect(22,46,4,10,"#FFFFFF");
    d.rect(28,46,4,10,"#FFFFFF"); d.rect(34,46,4,10,"#FFFFFF");
    // Mysterious robed figure
    d.rect(6,28,10,24,"#4A2A6A"); d.circle(11,26,5,"#FFDDAA");
    // Eye / orb
    d.circle(52,32,4,"#FF8800"); d.circle(52,32,3,"#FFCC00"); d.circle(52,32,1,"#000");
    // Candles
    d.vline(58,38,14,"#FFCC44"); d.circle(58,38,2,"#FFFF88");
    d.vline(4,38,14,"#FFCC44"); d.circle(4,38,2,"#FFFF88");
  },

  // ── RUFINO TAMAYO: Watermelons / mestizo modernity ────────────────────────
  "Rufino Tamayo": (d,r) => {
    d.fill("#8B1A00");
    // Ochre/earth tones — his palette
    d.rect(0,0,64,64,"#CC4400",0.3);
    // Watermelon — his recurring motif
    d.circle(32,36,16,"#006600");
    d.circle(32,36,14,"#008800");
    d.circle(32,36,12,"#CC2200"); // red flesh
    d.circle(32,36,10,"#EE3300");
    // Seeds
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+0.3;
      d.px(32+Math.round(Math.cos(a)*6),36+Math.round(Math.sin(a)*6),"#111");
    }
    // Slice showing
    d.rect(16,36,32,16,"#CC2200"); d.hline(16,36,32,"#006600");
    // Pre-Columbian sun motif
    d.circle(32,16,8,"#FFAA00");
    for(let i=0;i<8;i++){
      const a=(i/8)*Math.PI*2;
      d.px(32+Math.round(Math.cos(a)*12),16+Math.round(Math.sin(a)*10),"#FFAA00");
    }
    d.circle(32,16,4,"#FFDD00");
    // Night sky
    for(let i=0;i<10;i++) d.px(Math.floor(r()*60)+2,Math.floor(r()*12)+2,"#FFFFFF",0.5);
  },

  // ── GEORG BASELITZ: Inverted figure ──────────────────────────────────────
  "Georg Baselitz": (d) => {
    d.fill("#FFFFF0");
    // INVERTED figure — the painting is upside down
    // Feet at top
    d.rect(22,4,8,8,"#C09060"); d.rect(34,4,8,8,"#C09060");
    // Legs (upside down, at top)
    d.rect(22,10,8,20,"#CC4400"); d.rect(34,10,8,20,"#CC4400");
    // Body
    d.rect(20,28,24,16,"#AA3300");
    // Arms hanging down (up in image = down for figure)
    d.rect(10,36,10,14,"#C09060"); d.rect(44,36,10,14,"#C09060");
    // Head at bottom of canvas
    d.circle(32,54,8,"#C09060");
    // Crude hair
    d.rect(26,58,12,6,"#2A1800");
    // Eyes  
    d.px(29,52,"#111"); d.px(35,52,"#111");
    // Painterly marks
    for(let i=0;i<8;i++){
      const lx=Math.round(Math.random()*50+4);
      const ly=Math.round(Math.random()*54+4);
      d.hline(lx,ly,Math.round(Math.random()*8)+2,"#AA3300",0.2);
    }
  },

  // ── DIANA AL-HADID: Suspended sculpture ──────────────────────────────────
  "Diana Al-Hadid": (d,r) => {
    d.fill("#0A0A14");
    // Dripping, suspended architectural forms
    const cols=["#C8A880","#A88860","#E0C0A0","#888888","#DDCCAA"];
    // Main form — tapering tower with drips
    d.rect(22,8,20,40,"#C8A880");
    d.rect(24,6,16,8,"#DDCCAA"); d.rect(26,4,12,6,"#C8A880");
    // Drips falling off
    for(let i=0;i<8;i++){
      const dx=22+Math.floor(r()*20), dy=44+Math.floor(r()*4);
      const dl=Math.floor(r()*12)+4;
      d.vline(dx,dy,dl,cols[Math.floor(r()*cols.length)],0.6);
      d.circle(dx,dy+dl,2,"#A88860",0.5);
    }
    // Architectural cut-outs
    d.rect(26,14,4,8,"#0A0A14"); d.rect(34,14,4,8,"#0A0A14");
    d.rect(28,24,8,6,"#0A0A14");
    // Suspended wires/threads
    for(let i=0;i<5;i++) d.vline(24+i*4,0,8,"#888",0.4);
  },

};


// ─── GENERIC SCENE GENERATORS by medium/style ────────────────────────────────
function drawGenericScene(d, artist, r, pal) {
  const med = (artist.medium || "").toLowerCase();
  const cat = (artist.category || "").toLowerCase();
  const reg = artist.region;

  if (med.includes("photo")) {
    drawPhotographyScene(d, artist, r, pal);
  } else if (med.includes("sculpt") || med.includes("ceramic") || med.includes("install")) {
    drawSculptureScene(d, artist, r, pal);
  } else if (med.includes("video") || med.includes("film") || med.includes("perform")) {
    drawVideoScene(d, artist, r, pal);
  } else if (med.includes("print") || cat.includes("print")) {
    drawPrintsScene(d, artist, r, pal);
  } else if (med.includes("textile") || med.includes("weav") || med.includes("tapestry")) {
    drawTextileScene(d, artist, r, pal);
  } else if (cat.includes("urban") || med.includes("mural") || med.includes("stencil")) {
    drawUrbanScene(d, artist, r, pal);
  } else {
    drawPaintingScene(d, artist, r, pal);
  }
}

function drawPaintingScene(d, artist, r, pal) {
  // Full-canvas abstract painting — gestural, full 64x64
  d.fill(pal.bg);
  // Large gestural strokes across full canvas
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(r() * 58) + 2;
    const y = Math.floor(r() * 58) + 2;
    const len = Math.floor(r() * 22) + 4;
    const c = r() > 0.6 ? pal.accent : r() > 0.3 ? pal.accent2 : "#FFFFFF";
    const a = 0.2 + r() * 0.5;
    if (r() > 0.5) d.hline(x, y, len, c, a);
    else d.vline(x, y, len, c, a);
  }
  // Impasto blobs
  for (let i = 0; i < 8; i++) {
    d.circle(Math.floor(r()*56)+4, Math.floor(r()*56)+4, Math.floor(r()*5)+2, pal.accent, 0.2+r()*0.3);
  }
  // Dark edge framing (stretcher bars)
  d.hline(0,0,64,"#000",0.3); d.hline(0,63,64,"#000",0.3);
  d.vline(0,0,64,"#000",0.3); d.vline(63,0,64,"#000",0.3);
}

function drawPhotographyScene(d, artist, r, pal) {
  // Full-canvas darkroom / large format print
  d.fill("#080808");
  // Red safelight atmosphere
  d.circle(32, 8, 16, "#CC2200", 0.1);
  d.circle(32, 8, 24, "#CC2200", 0.05);
  d.circle(32, 8, 4, "#FF4400", 0.5);
  // Large print hanging — takes up most of canvas
  d.hline(4, 12, 56, "#555");
  d.vline(8, 12, 2, "#888"); d.vline(32, 12, 2, "#888"); d.vline(56, 12, 2, "#888");
  // Two large prints
  d.rect(6, 14, 22, 32, "#F0F0F0");
  d.rect(36, 14, 22, 32, "#F0F0F0");
  // Photo content on left — figure
  d.rect(8, 16, 18, 28, "#DDDDDD", 0.5);
  d.circle(17, 22, 5, "#AAAAAA");
  d.rect(12, 27, 10, 14, "#999999");
  // Photo content on right — landscape
  d.rect(38, 16, 18, 14, "#888888", 0.6); // sky
  d.rect(38, 30, 18, 14, "#AAAAAA", 0.6); // ground
  d.hline(38, 30, 18, "#777");
  // Film grain texture on prints
  for (let y = 14; y < 46; y++) {
    for (let x of [[6,28],[36,58]]) {
      if ((x[0]+y*3) % 7 === 0) d.px(x[0]+Math.floor(r()*22), y, "#FFFFFF", 0.06);
    }
  }
  // Developer tray
  d.rect(10, 50, 44, 10, "#222");
  d.rect(12, 51, 40, 8, "#1A1A3A");
  d.hline(12, 55, 40, "#333", 0.5);
}

function drawSculptureScene(d, artist, r, pal) {
  d.rect(4, 4, 38, 30, pal.bg);
  // Pedestal
  d.rect(14, 24, 16, 8, "#555");
  d.rect(12, 30, 20, 4, "#444");
  // Abstract sculpture on top
  const sType = Math.floor(r() * 4);
  if (sType === 0) {
    // Vertical geometric
    d.rect(19, 10, 8, 14, pal.accent);
    d.rect(17, 8, 12, 4, pal.accent2);
    d.rect(20, 6, 6, 4, pal.accent);
  } else if (sType === 1) {
    // Sphere + base
    d.circle(23, 17, 7, pal.accent);
    d.circle(21, 14, 3, "#FFFFFF", 0.2);
    d.rect(18, 24, 10, 2, pal.accent2);
  } else if (sType === 2) {
    // Twisted form
    for (let i = 0; i < 6; i++) {
      d.rect(18 + Math.sin(i) * 2, 10 + i * 2, 8, 3, i % 2 === 0 ? pal.accent : pal.accent2);
    }
  } else {
    // Stacked blocks (Judd-like)
    for (let i = 0; i < 4; i++) {
      d.rect(17, 10 + i * 3, 14, 2, i % 2 === 0 ? pal.accent : pal.accent2);
    }
  }
  // Studio wall
  d.rect(4, 4, 38, 2, "#222");
  // Cast shadows
  d.rect(16, 30, 16, 2, "#000", 0.3);
}

function drawVideoScene(d, artist, r, pal) {
  d.rect(4, 4, 38, 30, "#000");
  // Multiple screens in dark space
  for (let i = 0; i < 3; i++) {
    const sx = 6 + i * 12, sy = 8;
    d.rect(sx, sy, 10, 8, "#111");
    d.rect(sx + 1, sy + 1, 8, 6, "#222");
    // Screen content
    for (let y = 0; y < 4; y++) {
      d.hline(sx + 1, sy + 1 + y, 8, pal.accent, 0.1 + r() * 0.3);
    }
    d.px(sx + 4, sy + 3, pal.glow);
    d.px(sx + 5, sy + 4, pal.glow, 0.5);
    // Cable from screen
    d.vline(sx + 5, sy + 9, 4, "#333");
  }
  // Projector beam
  d.rect(4, 5, 6, 4, "#444");
  d.rect(4, 4, 6, 6, "#333");
  d.circle(7, 7, 2, "#FFFF88", 0.8);
  // Beam
  for (let y = 7; y < 18; y++) {
    d.hline(10, y, 6 + y, "#FFFF00", 0.02);
  }
  // Floor monitor
  d.rect(10, 24, 22, 9, "#111");
  d.rect(11, 25, 20, 7, pal.accent, 0.3);
  for (let x = 11; x < 31; x++) d.px(x, 27, pal.accent2, 0.5);
}

function drawPrintsScene(d, artist, r, pal) {
  d.rect(4, 4, 38, 30, "#1A1208");
  // Etching press
  d.rect(8, 18, 28, 10, "#5A3A1A");
  d.rect(6, 16, 32, 4, "#6A4A2A");
  // Roller
  d.rect(8, 14, 28, 4, "#888");
  d.hline(8, 16, 28, "#666");
  // Print coming out
  d.rect(10, 22, 24, 8, "#FAFAF0");
  d.rect(10, 22, 24, 8, "#F0E8D0", 0.3);
  // Printed marks on paper
  for (let i = 0; i < 6; i++) {
    d.hline(12, 24 + i, Math.floor(r() * 14) + 4, pal.accent, 0.5);
  }
  d.circle(22, 26, 4, pal.accent, 0.2);
  // Ink roller in corner
  d.rect(34, 10, 4, 8, pal.accent);
  d.rect(35, 8, 2, 10, "#333");
  // Hanging printed sheets
  for (let i = 0; i < 2; i++) {
    d.rect(4 + i * 14, 4, 10, 12, "#FAFAF0");
    d.rect(4 + i * 14, 4, 10, 12, pal.accent, 0.1);
  }
}

function drawTextileScene(d, artist, r, pal) {
  d.rect(4, 4, 38, 30, "#0A0808");
  // Loom structure
  d.rect(8, 4, 2, 30, "#5A3A1A");
  d.rect(34, 4, 2, 30, "#5A3A1A");
  // Horizontal threads
  const threadColors = [pal.accent, pal.accent2, "#FFFFFF", "#888888", pal.glow];
  for (let y = 6; y < 32; y++) {
    const c = threadColors[(y - 6) % threadColors.length];
    d.hline(10, y, 24, c, 0.3 + (y % 3 === 0 ? 0.4 : 0));
  }
  // Woven pattern emerging
  for (let y = 8; y < 28; y += 2) {
    for (let x = 10; x < 34; x += 2) {
      if ((x + y) % 4 === 0) d.px(x, y, pal.accent, 0.6);
    }
  }
  // Weaving shuttle
  d.rect(12, 18, 12, 3, "#8B6914");
  d.px(11, 19, pal.accent); d.px(24, 19, pal.accent);
}

function drawUrbanScene(d, artist, r, pal) {
  d.rect(4, 4, 38, 30, "#888");
  // Brick wall texture
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * 5;
    for (let col = 0; col < 5; col++) {
      d.rect(4 + col * 8 + offset - 4, 4 + row * 4, 7, 3, "#7A6A5A");
    }
  }
  // Spray paint can
  d.rect(34, 10, 4, 10, pal.accent);
  d.rect(35, 8, 2, 4, "#DDDDDD");
  d.circle(36, 8, 1, "#FFFFFF");
  // Spray cloud
  d.circle(22, 18, 10, pal.accent, 0.3);
  d.circle(22, 18, 8, pal.accent, 0.3);
  // Tag or stencil
  const tagC = pal.accent;
  for (let i = 0; i < 8; i++) {
    const tx = 10 + Math.floor(r() * 12), ty = 12 + Math.floor(r() * 10);
    d.px(tx, ty, tagC, 0.6 + r() * 0.3);
  }
  // Artist figure
  d.circle(10, 18, 3, "#222");
  d.rect(8, 21, 4, 8, "#333");
  d.hline(6, 23, 8, "#222");
}

// ─── ARTIST SILHOUETTES (bottom of canvas) ───────────────────────────────────
function drawArtistSilhouette(d, artist, r, pal) {
  // Place in lower-left or lower-right
  const side = r() > 0.5 ? "left" : "right";
  const baseX = side === "left" ? 6 : 30;
  const baseY = 46;

  const silColor = "#111111";
  const accentSil = pal.accent;

  // Head
  d.circle(baseX + 3, baseY - 8, 3, silColor);

  // Hair style seeded by artist id
  const hairR = mkRng(artist.id * 7);
  const hairStyle = Math.floor(hairR() * 5);
  if (hairStyle === 0) { // short
    d.rect(baseX + 1, baseY - 12, 5, 2, silColor);
  } else if (hairStyle === 1) { // long
    d.vline(baseX, baseY - 10, 6, silColor);
    d.vline(baseX + 6, baseY - 10, 6, silColor);
    d.rect(baseX + 1, baseY - 12, 5, 3, silColor);
  } else if (hairStyle === 2) { // afro
    d.circle(baseX + 3, baseY - 9, 5, silColor);
  } else if (hairStyle === 3) { // bun
    d.rect(baseX + 1, baseY - 12, 5, 2, silColor);
    d.circle(baseX + 4, baseY - 13, 2, silColor);
  } else { // bald/shaved
    d.circle(baseX + 3, baseY - 8, 3, silColor);
  }

  // Body
  d.rect(baseX, baseY - 5, 6, 9, silColor);

  // Outfit hint from tier
  if (artist.tier === "blue chip") {
    // Formal — collar hint
    d.px(baseX + 2, baseY - 4, accentSil);
    d.px(baseX + 4, baseY - 4, accentSil);
  } else if (artist.tier === "emerging") {
    // Casual — slightly different
    d.px(baseX + 3, baseY - 3, accentSil);
  }

  // Arms
  d.rect(baseX - 2, baseY - 4, 2, 5, silColor);
  d.rect(baseX + 6, baseY - 4, 2, 5, silColor);

  // Legs
  d.rect(baseX + 1, baseY + 4, 2, 5, silColor);
  d.rect(baseX + 3, baseY + 4, 2, 5, silColor);

  // Shadow
  d.hline(baseX - 1, baseY + 9, 8, "#000", 0.2);
}

// ─── FRAME + UI CHROME ───────────────────────────────────────────────────────
function drawFrame(ctx, artist, scale, pal) {
  const S = scale;
  const W = 64 * S;

  // Outer border
  ctx.strokeStyle = pal.frame;
  ctx.lineWidth = S;
  ctx.strokeRect(S / 2, S / 2, W - S, W - S);

  // Signal dot (top right corner)
  const signalC = SIGNAL_COLOR[artist.signal] || "#555";
  ctx.fillStyle = signalC;
  ctx.fillRect(W - 5 * S, S, 4 * S, 4 * S);

  // Findable indicator (bottom left)
  if (artist.findable) {
    ctx.fillStyle = "#4ADE80";
    ctx.fillRect(S, W - 5 * S, 4 * S, 4 * S);
  }

  // Region code (bottom right, tiny)
  ctx.fillStyle = pal.nameColor;
  ctx.globalAlpha = 0.4;
  ctx.font = `${S * 4}px monospace`;
  ctx.fillText((artist.region || "").toUpperCase().slice(0, 3), W - 14 * S, W - 2 * S);
  ctx.globalAlpha = 1;
}

// ─── MAIN DRAW ───────────────────────────────────────────────────────────────
function drawArtistPortrait(ctx, artist, canvasSize) {
  const scale = canvasSize / 64;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const r = mkRng(artist.id * 31337);
  const pal = TIER_PALETTE[artist.tier] || TIER_PALETTE["mid-career"];
  const d = makeDrawer(ctx, scale);

  // ── Background atmosphere ────────────────────────────────────────────────
  const skyColor = REGION_SKY[artist.region] || "#090909";
  d.rect(0, 0, 64, 64, skyColor);

  // Very subtle vignette
  for (let ring = 1; ring <= 8; ring++) {
    d.rect(64 - ring, 0, ring, 64, "#000", 0.03);
    d.rect(0, 0, ring, 64, "#000", 0.03);
    d.rect(0, 0, 64, ring, "#000", 0.03);
    d.rect(0, 64 - ring, 64, ring, "#000", 0.03);
  }

  // ── Artwork zone (top ~55% of canvas) ───────────────────────────────────
  const artworkFn = ARTWORK_SIGNATURES[artist.name];
  if (artworkFn) {
    artworkFn(d, r);
  } else {
    drawGenericScene(d, artist, r, pal);
  }

  // ── Frame & chrome ───────────────────────────────────────────────────────
  drawFrame(ctx, artist, scale, pal);

  // ── Subtle scanline overlay ──────────────────────────────────────────────
  for (let y = 0; y < 64; y += 2) {
    d.hline(0, y, 64, "#000", 0.06);
  }
}

// ─── React component ─────────────────────────────────────────────────────────
export default function ArtistPixel({ artist, size = 128 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !artist) return;
    const ctx = canvas.getContext("2d");
    drawArtistPortrait(ctx, artist, size);
  }, [artist, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated", display: "block", borderRadius: 4 }}
    />
  );
}
