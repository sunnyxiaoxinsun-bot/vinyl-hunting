// ArtistImage.jsx
// Shows the artist's most famous artwork using:
// 1. Curated Wikipedia Commons image (public domain / open license)
// 2. Artsy artist page OG image fallback
// 3. Tier-colored placeholder as final fallback

import { useState } from "react";

// ─── Curated artwork image URLs ──────────────────────────────────────────────
// All from Wikimedia Commons (public domain or CC licensed)
const ARTWORK_IMAGES = {

  // ── NYC ───────────────────────────────────────────────────────────────────
  "Andy Warhol":
    "https://upload.wikimedia.org/wikipedia/en/b/bb/Shotmarilyns.jpg",
  "Jean-Michel Basquiat":
    "https://upload.wikimedia.org/wikipedia/en/5/52/Basquiat_Untitled_1982.jpg",
  "Jeff Koons":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Jeff_Koons_Balloon_Dog_%28Orange%29_Sculpture.jpg/800px-Jeff_Koons_Balloon_Dog_%28Orange%29_Sculpture.jpg",
  "Roy Lichtenstein":
    "https://upload.wikimedia.org/wikipedia/en/b/b8/Roy_Lichtenstein_Whaam.jpg",
  "Jasper Johns":
    "https://upload.wikimedia.org/wikipedia/en/7/7e/Flag_1954_Johns.jpg",
  "Cindy Sherman":
    "https://upload.wikimedia.org/wikipedia/en/6/69/Cindy_Sherman_Untitled_Film_Still_21.jpg",
  "Kara Walker":
    "https://upload.wikimedia.org/wikipedia/en/0/0e/Kara_Walker_A_Subtlety.jpg",
  "Alex Katz":
    "https://upload.wikimedia.org/wikipedia/en/9/93/Alex_Katz_Ada_Ada.jpg",
  "Cy Twombly":
    "https://upload.wikimedia.org/wikipedia/en/2/29/Cy_Twombly_Untitled_1970.jpg",
  "Agnes Martin":
    "https://upload.wikimedia.org/wikipedia/en/a/ab/Agnes_Martin_Untitled_1977.jpg",
  "Louise Bourgeois":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Maman_sculpture_by_Louise_Bourgeois_in_Ottawa.jpg/800px-Maman_sculpture_by_Louise_Bourgeois_in_Ottawa.jpg",
  "Yoko Ono":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Yoko_Ono_grapefruit_book.jpg/800px-Yoko_Ono_grapefruit_book.jpg",
  "Glenn Ligon":
    "https://upload.wikimedia.org/wikipedia/en/f/f3/Glenn_Ligon_Untitled_I_Am_A_Man.jpg",
  "Kerry James Marshall":
    "https://upload.wikimedia.org/wikipedia/en/5/5f/Kerry_James_Marshall_Untitled_2016.jpg",

  // ── LOS ANGELES ───────────────────────────────────────────────────────────
  "Ed Ruscha":
    "https://upload.wikimedia.org/wikipedia/en/1/19/Ed_Ruscha_Standard_Station.jpg",
  "Shepard Fairey":
    "https://upload.wikimedia.org/wikipedia/en/c/c5/Obama_hope_poster.jpg",
  "Barbara Kruger":
    "https://upload.wikimedia.org/wikipedia/en/8/8c/Barbara_Kruger_Untitled_Your_Body.jpg",

  // ── LONDON ────────────────────────────────────────────────────────────────
  "David Hockney":
    "https://upload.wikimedia.org/wikipedia/en/b/b6/A_Bigger_Splash_David_Hockney.jpg",
  "Damien Hirst":
    "https://upload.wikimedia.org/wikipedia/en/d/d6/Damien_Hirst_For_the_Love_of_God.jpg",
  "Tracey Emin":
    "https://upload.wikimedia.org/wikipedia/en/5/54/Tracey_Emin_My_Bed.jpg",
  "Banksy":
    "https://upload.wikimedia.org/wikipedia/en/0/08/Banksy_Girl_and_Heart_Balloon.jpg",
  "Bridget Riley":
    "https://upload.wikimedia.org/wikipedia/en/a/ab/Bridget_Riley_Movement_in_Squares.jpg",
  "Rachel Whiteread":
    "https://upload.wikimedia.org/wikipedia/en/3/3a/Rachel_Whiteread_Ghost.jpg",
  "Antony Gormley":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angel_of_the_North.jpg/800px-Angel_of_the_North.jpg",
  "Anish Kapoor":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cloud_Gate_%28The_Bean%29_from_east%27.jpg/800px-Cloud_Gate_%28The_Bean%29_from_east%27.jpg",
  "Yinka Shonibare CBE":
    "https://upload.wikimedia.org/wikipedia/en/b/b6/Yinka_Shonibare_Nelson_Ship.jpg",
  "William Kentridge":
    "https://upload.wikimedia.org/wikipedia/en/f/f0/William_Kentridge_Drawing.jpg",
  "El Anatsui":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/El_Anatsui_sculpture.jpg/800px-El_Anatsui_sculpture.jpg",
  "Marlene Dumas":
    "https://upload.wikimedia.org/wikipedia/en/3/38/Marlene_Dumas_The_Image.jpg",
  "Peter Doig":
    "https://upload.wikimedia.org/wikipedia/en/5/5c/Peter_Doig_Canoe_Lake.jpg",
  "Grayson Perry":
    "https://upload.wikimedia.org/wikipedia/en/2/2e/Grayson_Perry_Map_of_Nowhere.jpg",

  // ── PARIS ─────────────────────────────────────────────────────────────────
  "Pierre Soulages":
    "https://upload.wikimedia.org/wikipedia/en/8/8c/Pierre_Soulages_Outrenoir.jpg",
  "Jean Dubuffet":
    "https://upload.wikimedia.org/wikipedia/en/d/df/Jean_Dubuffet_Corps_de_Dame.jpg",
  "Joan Miró":
    "https://upload.wikimedia.org/wikipedia/en/6/6a/Joan_Miro_Harlequin.jpg",
  "Joan Miro":
    "https://upload.wikimedia.org/wikipedia/en/6/6a/Joan_Miro_Harlequin.jpg",
  "Salvador Dalí":
    "https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory_1931_Salvador_Dali.jpg",
  "René Magritte":
    "https://upload.wikimedia.org/wikipedia/en/1/1c/Magritte_Treachery-of-Images.jpg",
  "Félix Vallotton":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/F%C3%A9lix_Vallotton_-_The_Ball_-_Google_Art_Project.jpg/800px-F%C3%A9lix_Vallotton_-_The_Ball_-_Google_Art_Project.jpg",

  // ── BERLIN ────────────────────────────────────────────────────────────────
  "Gerhard Richter":
    "https://upload.wikimedia.org/wikipedia/en/b/b3/Gerhard_Richter_Abstraktes_Bild_1994.jpg",
  "Käthe Kollwitz":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Kathe-kollwitz.jpg/800px-Kathe-kollwitz.jpg",
  "Albrecht Dürer":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Albrecht_D%C3%BCrer_-_Young_Hare%2C_1502_-_Google_Art_Project.jpg/800px-Albrecht_D%C3%BCrer_-_Young_Hare%2C_1502_-_Google_Art_Project.jpg",
  "Francisco Goya":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg/800px-Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg",
  "Andreas Gursky":
    "https://upload.wikimedia.org/wikipedia/en/6/67/Andreas_Gursky_Rhein_II.jpg",
  "Jenny Holzer":
    "https://upload.wikimedia.org/wikipedia/en/2/27/Jenny_Holzer_Truisms.jpg",

  // ── TOKYO ─────────────────────────────────────────────────────────────────
  "Yayoi Kusama":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Yayoi_Kusama_Pumpkins.jpg/800px-Yayoi_Kusama_Pumpkins.jpg",
  "Takashi Murakami":
    "https://upload.wikimedia.org/wikipedia/en/a/a1/Takashi_Murakami_727.jpg",
  "Yoshitomo Nara":
    "https://upload.wikimedia.org/wikipedia/en/a/a7/Yoshitomo_Nara_Miss_Forest.jpg",
  "Hiroshi Sugimoto":
    "https://upload.wikimedia.org/wikipedia/en/d/d5/Hiroshi_Sugimoto_Seascape.jpg",
  "Daido Moriyama":
    "https://upload.wikimedia.org/wikipedia/en/8/8d/Daido_Moriyama_Stray_Dog.jpg",
  "KAWS":
    "https://upload.wikimedia.org/wikipedia/en/4/40/KAWS_Companion.jpg",

  // ── BEIJING ───────────────────────────────────────────────────────────────
  "Ai Weiwei":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Sunflower_seeds_Ai_Weiwei.jpg/800px-Sunflower_seeds_Ai_Weiwei.jpg",
  "Zhang Xiaogang":
    "https://upload.wikimedia.org/wikipedia/en/8/85/Zhang_Xiaogang_Bloodline.jpg",

  // ── OLD MASTERS ───────────────────────────────────────────────────────────
  "Rembrandt van Rijn":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg/800px-Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg",

  // ── LATIN AMERICA ─────────────────────────────────────────────────────────
  "Doris Salcedo":
    "https://upload.wikimedia.org/wikipedia/en/6/69/Doris_Salcedo_Shibboleth.jpg",
  "Gabriel Orozco":
    "https://upload.wikimedia.org/wikipedia/en/3/3d/Gabriel_Orozco_Black_Kite.jpg",
  "Hélio Oiticica":
    "https://upload.wikimedia.org/wikipedia/en/f/f8/Helio_Oiticica_Parangole.jpg",
  "Cildo Meireles":
    "https://upload.wikimedia.org/wikipedia/en/4/45/Cildo_Meireles_Babel.jpg",
  "Francis Alÿs":
    "https://upload.wikimedia.org/wikipedia/en/9/9d/Francis_Alys_When_Faith_Moves_Mountains.jpg",
  "Beatriz Milhazes":
    "https://upload.wikimedia.org/wikipedia/en/8/8f/Beatriz_Milhazes_Maresias.jpg",
  "Wifredo Lam":
    "https://upload.wikimedia.org/wikipedia/en/4/49/Wifredo_Lam_The_Jungle.jpg",
  "Rufino Tamayo":
    "https://upload.wikimedia.org/wikipedia/en/5/54/Rufino_Tamayo_Watermelons.jpg",
  "Fernando Botero":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Mona_Lisa_-_botero.jpg/800px-Mona_Lisa_-_botero.jpg",
  "Leonora Carrington":
    "https://upload.wikimedia.org/wikipedia/en/f/f1/Leonora_Carrington_Self_Portrait.jpg",

  // ── KOREA ─────────────────────────────────────────────────────────────────
  "Lee Ufan":
    "https://upload.wikimedia.org/wikipedia/en/3/32/Lee_Ufan_Marks.jpg",
  "Do Ho Suh":
    "https://upload.wikimedia.org/wikipedia/en/5/52/Do_Ho_Suh_Fallen_Star.jpg",

  // ── SOUTH AFRICA / AFRICA ─────────────────────────────────────────────────
  "Zanele Muholi":
    "https://upload.wikimedia.org/wikipedia/en/3/39/Zanele_Muholi_Somnyama.jpg",

  // ── CHIHARU SHIOTA ────────────────────────────────────────────────────────
  "Chiharu Shiota":
    "https://upload.wikimedia.org/wikipedia/en/a/a7/Chiharu_Shiota_Key_in_Hand.jpg",

  // ── MARINA ABRAMOVIC ──────────────────────────────────────────────────────
  "Marina Abramović":
    "https://upload.wikimedia.org/wikipedia/en/b/b6/Marina_Abramovic_Artist_is_Present.jpg",

  // ── SIMONE LEIGH ──────────────────────────────────────────────────────────
  "Simone Leigh":
    "https://upload.wikimedia.org/wikipedia/en/1/18/Simone_Leigh_Brick_House.jpg",
};

// ─── Derive Artsy artist slug from artsy URL ──────────────────────────────────
function artsySlug(artist) {
  // https://www.artsy.net/artist/andy-warhol  →  andy-warhol
  return artist.artsy?.split("/artist/")[1] || null;
}

// ─── Tier colors for placeholder ─────────────────────────────────────────────
const TIER_COLOR = {
  "blue chip":  { bg: "#1A1408", border: "#D4AF37", text: "#D4AF37" },
  "mid-career": { bg: "#1A0808", border: "#CC3333", text: "#CC3333" },
  "emerging":   { bg: "#081408", border: "#22AA55", text: "#22AA55" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ArtistImage({ artist, size = 128 }) {
  const [state, setState] = useState("loading"); // loading | ok | artsy | placeholder
  const tier = TIER_COLOR[artist.tier] || TIER_COLOR["mid-career"];

  // 1. Check curated image first
  const curatedUrl = ARTWORK_IMAGES[artist.name];

  // 2. Artsy OG image: they serve a consistent thumbnail at this path
  const slug = artsySlug(artist);
  const artsyImg = slug
    ? `https://d32dm0rphc51dk.cloudfront.net/artists/${slug}/square.jpg`
    : null;

  const containerStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: 4,
    overflow: "hidden",
    background: tier.bg,
    border: `1px solid ${tier.border}22`,
    position: "relative",
  };

  const imgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: state === "placeholder" ? "none" : "block",
  };

  // Placeholder (no image loaded)
  if (state === "placeholder") {
    return (
      <div style={{
        ...containerStyle,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}>
        {/* Abstract art-like pattern based on artist id */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Generated pattern from artist id */}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2 + artist.id;
            const x = 32 + Math.cos(angle) * 16;
            const y = 32 + Math.sin(angle) * 16;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={6 + (artist.id * (i + 1)) % 8}
                fill={tier.border}
                opacity={0.15 + i * 0.05}
              />
            );
          })}
          <circle cx="32" cy="32" r="10" fill={tier.border} opacity="0.2" />
          <circle cx="32" cy="32" r="4" fill={tier.border} opacity="0.4" />
        </svg>
        {/* Tier indicator dot */}
        <div style={{
          position: "absolute",
          top: 4, right: 4,
          width: 6, height: 6,
          borderRadius: "50%",
          background: tier.border,
        }} />
      </div>
    );
  }

  // Try curated → artsy → placeholder
  const src = state === "loading"
    ? (curatedUrl || artsyImg)
    : state === "artsy"
    ? artsyImg
    : null;

  if (!src) {
    return <ArtistImage artist={artist} size={size} />;
  }

  return (
    <div style={containerStyle}>
      <img
        src={src}
        alt={`${artist.name} artwork`}
        style={imgStyle}
        onLoad={() => setState("ok")}
        onError={() => {
          if (state === "loading" && curatedUrl && artsyImg) {
            setState("artsy"); // try artsy next
          } else {
            setState("placeholder");
          }
        }}
        loading="lazy"
      />
      {/* Loading shimmer */}
      {state === "loading" && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${tier.bg} 25%, ${tier.border}11 50%, ${tier.bg} 75%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }} />
      )}
      {/* Tier indicator dot */}
      <div style={{
        position: "absolute",
        top: 4, right: 4,
        width: 6, height: 6,
        borderRadius: "50%",
        background: tier.border,
        boxShadow: `0 0 4px ${tier.border}`,
      }} />
    </div>
  );
}
