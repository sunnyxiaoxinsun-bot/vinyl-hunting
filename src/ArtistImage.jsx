// ArtistImage.jsx
// Reads from /public/artists/{id}.jpg — run download-artist-images.mjs first
// Falls back to initials placeholder if image missing

import { useState } from "react";

const TIER_COLOR = {
  "blue chip":  "#D4AF37",
  "mid-career": "#CC3333",
  "emerging":   "#22AA55",
};

export default function ArtistImage({ artist, size = 128 }) {
  const [error, setError] = useState(false);
  const accent = TIER_COLOR[artist.tier] || "#CC3333";
  const src = `/artists/${artist.id}.jpg`;

  const box = {
    width: size, height: size, flexShrink: 0,
    borderRadius: 4, overflow: "hidden",
    background: "#0E0E0E", position: "relative",
    border: `1px solid ${accent}22`,
  };

  if (error) {
    const initials = artist.name.split(" ")
      .filter(Boolean).slice(0, 2).map(w => w[0]).join("");
    return (
      <div style={{ ...box, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 3 }}>
        <svg width={size} height={size} viewBox="0 0 64 64"
          style={{ position: "absolute", inset: 0 }}>
          {[0,1,2,3].map(i => (
            <circle key={i}
              cx={16 + (artist.id * (i+1) * 7) % 36}
              cy={16 + (artist.id * (i+1) * 11) % 36}
              r={4 + i * 4} fill="none"
              stroke={accent} strokeWidth="1" opacity={0.1 + i * 0.04} />
          ))}
        </svg>
        <div style={{ position: "relative",
          fontFamily: "Space Mono, monospace",
          fontSize: size * 0.26, fontWeight: "bold",
          color: accent, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {initials}
        </div>
        <div style={{ position: "relative", fontSize: size * 0.08,
          color: accent, opacity: 0.4, letterSpacing: "0.1em",
          textTransform: "uppercase", fontFamily: "Space Mono, monospace" }}>
          {artist.tier}
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <img src={src} alt={artist.name}
        style={{ width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top", display: "block" }}
        onError={() => setError(true)}
        loading="lazy" />
      <div style={{ position: "absolute", bottom: 3, right: 3,
        width: 5, height: 5, borderRadius: "50%",
        background: accent, boxShadow: `0 0 4px ${accent}88` }} />
    </div>
  );
}
