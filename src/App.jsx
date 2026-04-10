import { useState, useEffect } from "react";
import { VINYLS, SHOPS, AREAS, ERAS, GENRES, RARITIES } from "./data";
import { VINTAGE, VSTORES, VSTORE_AREAS, VINTAGE_CATEGORIES, VINTAGE_ERAS, VINTAGE_RARITIES } from "./vintage";
import { BARS, BAR_AREAS, BAR_TYPES } from "./bars";
import { BARS_LATAM, LATAM_AREAS } from "./bars_latam";
import { FILMS, THEATERS, THEATER_AREAS, FILM_ERAS, FILM_GENRES, FILM_COUNTRIES } from "./films";
import { FILMS_B2 } from "./films_b2";
import { FILMS_B3 } from "./films_b3";
import { FILMS_B4 } from "./films_b4";
import { SCREENPLAYS } from "./screenplays";
import { SOUNDTRACKS } from "./soundtracks";
import { ARTISTS, GALLERIES, GALLERY_AREAS, ART_CATEGORIES, ART_TIERS, ART_REGIONS } from "./art";

const ALL_BARS = [...BARS, ...BARS_LATAM];
const ALL_BAR_AREAS = [...BAR_AREAS, ...LATAM_AREAS];
const ALL_FILMS = [...FILMS, ...FILMS_B2, ...FILMS_B3, ...FILMS_B4];

const rarityColor = (r) => {
  if (r === "holy grail") return { bg:"#3D0000", text:"#FF6B6B", border:"#8B0000" };
  if (r === "very rare")  return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED" };
  if (r === "rare")       return { bg:"#0A1628", text:"#60A5FA", border:"#2563EB" };
  return { bg:"#0A1A0A", text:"#4ADE80", border:"#16A34A" };
};

const signalColor = (s) => {
  if (s === "very hot")    return { bg:"#0A2A0A", text:"#4ADE80", border:"#16A34A44" };
  if (s === "act now")     return { bg:"#2A0A00", text:"#FB923C", border:"#C2410C44" };
  if (s === "rising fast") return { bg:"#0A1628", text:"#60A5FA", border:"#2563EB44" };
  if (s === "rising")      return { bg:"#0A1A28", text:"#38BDF8", border:"#0284C744" };
  if (s === "proven")      return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED44" };
  if (s === "early stage") return { bg:"#1A1A1A", text:"#888",    border:"#33333344" };
  if (s === "watch")       return { bg:"#1A1400", text:"#FBBF24", border:"#92400E44" };
  return { bg:"#111", text:"#666", border:"#22222244" };
};

const eraColor = (era) => {
  const map = { "1930s":"#B45309","1930s-40s":"#B45309","1940s":"#92400E","1950s-60s":"#D97706","1950s":"#D97706","1960s":"#9333EA","1970s":"#DC2626","1980s":"#2563EB","1990s":"#059669","2000s":"#0891B2","2010s":"#7C3AED","2020s":"#DB2777" };
  return map[era] || "#6B7280";
};

const genreColor = (genre) => {
  const g = genre.toLowerCase();
  if (g.includes("horror"))     return { color:"#F87171", bg:"#2A0A0A", border:"#7F1D1D44" };
  if (g.includes("sci-fi"))     return { color:"#60A5FA", bg:"#0A1628", border:"#1D4ED844" };
  if (g.includes("comedy"))     return { color:"#FBBF24", bg:"#1A1400", border:"#92400E44" };
  if (g.includes("documentary"))return { color:"#34D399", bg:"#0A1A10", border:"#065F4644" };
  if (g.includes("animation"))  return { color:"#A78BFA", bg:"#150A2A", border:"#6D28D944" };
  if (g.includes("musical"))    return { color:"#F472B6", bg:"#1A0A14", border:"#9D174D44" };
  if (g.includes("western"))    return { color:"#D97706", bg:"#1A0E00", border:"#92400E44" };
  if (g.includes("thriller"))   return { color:"#FB923C", bg:"#1A0A00", border:"#C2410C44" };
  if (g.includes("noir"))       return { color:"#94A3B8", bg:"#0F1A28", border:"#33415544" };
  if (g.includes("romance"))    return { color:"#F9A8D4", bg:"#1A0A12", border:"#BE185D44" };
  if (g.includes("war"))        return { color:"#86EFAC", bg:"#0A1A0A", border:"#16653244" };
  if (g.includes("drama"))      return { color:"#C084FC", bg:"#1A0A2E", border:"#7C3AED44" };
  return { color:"#9CA3AF", bg:"#111", border:"#37415144" };
};

const isOpenNow = (hoursStr) => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const lower = hoursStr.toLowerCase();
  const parseTime = (t) => {
    const m = t.trim().match(/^(\d+)(?::(\d+))?(am|pm)$/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = m[2] ? parseInt(m[2]) : 0;
    if (m[3].toLowerCase() === "pm" && h !== 12) h += 12;
    if (m[3].toLowerCase() === "am" && h === 12) h = 0;
    return h + min / 60;
  };
  const dayNames = ["sun","mon","tue","wed","thu","fri","sat"];
  const segments = lower.split(",").map(s => s.trim());
  for (const seg of segments) {
    const rangeMatcher = seg.match(/([a-z]+)[-\-]([a-z]+)/);
    const singleMatcher = seg.match(/^([a-z]+)\s/);
    let covers = false;
    if (rangeMatcher) {
      const start = dayNames.indexOf(rangeMatcher[1]);
      const end = dayNames.indexOf(rangeMatcher[2]);
      if (start !== -1 && end !== -1) covers = start <= end ? (day >= start && day <= end) : (day >= start || day <= end);
    } else if (singleMatcher) {
      covers = dayNames.indexOf(singleMatcher[1]) === day;
    } else if (seg.startsWith("daily")) {
      covers = true;
    }
    if (covers) {
      const timeMatcher = seg.match(/(\d+(?::\d+)?(?:am|pm))[-\-](\d+(?::\d+)?(?:am|pm))/i);
      if (timeMatcher) {
        const open = parseTime(timeMatcher[1]);
        const close = parseTime(timeMatcher[2]);
        if (open !== null && close !== null) return hour >= open && hour < close;
      }
    }
  }
  return null;
};

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// -- HANGTAG ICON -------------------------------------------------------------
const HangTag = ({ size = 22, color = "#FF4444" }) => (
  <svg width={size} height={size * 1.55} viewBox="0 0 22 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="11" y1="0" x2="11" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="11" cy="6.5" r="2" fill="none" stroke={color} strokeWidth="1.5"/>
    <path d="M2 10 Q2 8 4 8 L18 8 Q20 8 20 10 L20 30 Q20 32 18 32 L4 32 Q2 32 2 30 Z" fill="#111" stroke={color} strokeWidth="1.5"/>
    <line x1="6" y1="15" x2="16" y2="15" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    <line x1="6" y1="19" x2="16" y2="19" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    <line x1="6" y1="23" x2="13" y2="23" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// -- VINYL ICON ----------------------------------------------------------------
const VinylDisc = ({ size = 30, color = "#FF4444" }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="14" fill="#0A0A0A" stroke={color} strokeWidth="1.5"/>
    <circle cx="15" cy="15" r="11" fill="none" stroke="#1a1a1a" strokeWidth="1"/>
    <circle cx="15" cy="15" r="7"  fill="none" stroke="#222" strokeWidth="1"/>
    <circle cx="15" cy="15" r="3"  fill={color}/>
    <circle cx="15" cy="15" r="1.2" fill="#0A0A0A"/>
  </svg>
);

// -- GLASS ICON ----------------------------------------------------------------
const GlassIcon = ({ size = 28, color = "#FF4444" }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4 L10 18 Q10 22 14 22 Q18 22 18 18 L21 4 Z" fill="#111" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="10" y1="18" x2="18" y2="18" stroke={color} strokeWidth="1" opacity="0.5"/>
    <line x1="14" y1="22" x2="14" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="10" y1="26" x2="18" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="9" x2="20" y2="9" stroke={color} strokeWidth="0.8" opacity="0.3"/>
  </svg>
);

// -- ART FRAME ICON -----------------------------------------------------------
const ArtFrameIcon = ({ size = 28, color = "#FF4444" }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="22" height="22" rx="1.5" fill="#111" stroke={color} strokeWidth="1.5"/>
    <rect x="7" y="7" width="14" height="14" rx="1" fill="#111" stroke={color} strokeWidth="0.8" opacity="0.6"/>
    <line x1="7" y1="17" x2="12" y2="12" stroke={color} strokeWidth="0.8" opacity="0.5"/>
    <circle cx="16" cy="12" r="2.5" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5"/>
    <line x1="3" y1="3" x2="0" y2="1" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <line x1="25" y1="3" x2="28" y2="1" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <line x1="3" y1="25" x2="0" y2="27" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <line x1="25" y1="25" x2="28" y2="27" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  // section: null = landing, "records" | "vintage" | "bars"
  const [section, setSection] = useState(null);

  // records tabs
  const [recTab, setRecTab] = useState("hunt");
  const [vinylSearch, setVinylSearch] = useState("");
  const [eraFilter, setEraFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [rarityFilter, setRarityFilter] = useState("All");
  const [findableOnly, setFindableOnly] = useState(false);
  const [vinylFavOnly, setVinylFavOnly] = useState(false);
  const [selectedVinyl, setSelectedVinyl] = useState(null);
  const [shopSearch, setShopSearch] = useState("");
  const [shopArea, setShopArea] = useState("all");
  const [shopFavOnly, setShopFavOnly] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  // vintage tabs
  const [vtgTab, setVtgTab] = useState("pieces");
  const [vintageSearch, setVintageSearch] = useState("");
  const [vCatFilter, setVCatFilter] = useState("All");
  const [vEraFilter, setVEraFilter] = useState("All");
  const [vRarFilter, setVRarFilter] = useState("All");
  const [vFindableOnly, setVFindableOnly] = useState(false);
  const [vFavOnly, setVFavOnly] = useState(false);
  const [selectedVintage, setSelectedVintage] = useState(null);
  const [vstoreSearch, setVstoreSearch] = useState("");
  const [vstoreArea, setVstoreArea] = useState("all");
  const [vstoreFavOnly, setVstoreFavOnly] = useState(false);
  const [selectedVstore, setSelectedVstore] = useState(null);

  // bars tabs
  const [barTab, setBarTab] = useState("bars");
  const [barSearch, setBarSearch] = useState("");
  const [barArea, setBarArea] = useState("all");
  const [barType, setBarType] = useState("all");
  const [barFavOnly, setBarFavOnly] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);

  // films tabs
  const [filmTab, setFilmTab] = useState("films");
  const [filmSearch, setFilmSearch] = useState("");
  const [filmEraFilter, setFilmEraFilter] = useState("All");
  const [filmGenreFilter, setFilmGenreFilter] = useState("All");
  const [filmCountryFilter, setFilmCountryFilter] = useState("All");
  const [filmFavOnly, setFilmFavOnly] = useState(false);
  const [filmAwardFilter, setFilmAwardFilter] = useState("All");
  const [filmYearFilter, setFilmYearFilter] = useState("All");
  const [filmScriptOnly, setFilmScriptOnly] = useState(false);
  const [filmPage, setFilmPage] = useState(0);
  const FILMS_PER_PAGE = 50;
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [theaterSearch, setTheaterSearch] = useState("");
  const [theaterArea, setTheaterArea] = useState("all");
  const [theaterFavOnly, setTheaterFavOnly] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState(null);

  // art tabs
  const [artTab, setArtTab] = useState("artists");
  const [artSearch, setArtSearch] = useState("");
  const [artCatFilter, setArtCatFilter] = useState("All");
  const [artTierFilter, setArtTierFilter] = useState("All");
  const [artFindableOnly, setArtFindableOnly] = useState(false);
  const [artFavOnly, setArtFavOnly] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [artRegion, setArtRegion] = useState("all");
  const [galleryArea, setGalleryArea] = useState("all");
  const [galleryFavOnly, setGalleryFavOnly] = useState(false);
  const [selectedGallery, setSelectedGallery] = useState(null);

  // favorites
  const [shopFavs,    setShopFavs]    = useState(() => { try { return JSON.parse(localStorage.getItem("shopFavs")||"[]");    } catch { return []; } });
  const [vinylFavs,   setVinylFavs]   = useState(() => { try { return JSON.parse(localStorage.getItem("vinylFavs")||"[]");   } catch { return []; } });
  const [vintageFavs, setVintageFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("vintageFavs")||"[]"); } catch { return []; } });
  const [vstoreFavs,  setVstoreFavs]  = useState(() => { try { return JSON.parse(localStorage.getItem("vstoreFavs")||"[]");  } catch { return []; } });
  const [barFavs,     setBarFavs]     = useState(() => { try { return JSON.parse(localStorage.getItem("barFavs")||"[]");     } catch { return []; } });
  const [filmFavs,    setFilmFavs]    = useState(() => { try { return JSON.parse(localStorage.getItem("filmFavs")||"[]");    } catch { return []; } });
  const [theaterFavs, setTheaterFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("theaterFavs")||"[]"); } catch { return []; } });
  const [artistFavs,  setArtistFavs]  = useState(() => { try { return JSON.parse(localStorage.getItem("artistFavs")||"[]");  } catch { return []; } });
  const [galleryFavs, setGalleryFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("galleryFavs")||"[]"); } catch { return []; } });

  useEffect(() => { try { localStorage.setItem("shopFavs",    JSON.stringify(shopFavs));    } catch {} }, [shopFavs]);
  useEffect(() => { try { localStorage.setItem("vinylFavs",   JSON.stringify(vinylFavs));   } catch {} }, [vinylFavs]);
  useEffect(() => { try { localStorage.setItem("vintageFavs", JSON.stringify(vintageFavs)); } catch {} }, [vintageFavs]);
  useEffect(() => { try { localStorage.setItem("vstoreFavs",  JSON.stringify(vstoreFavs));  } catch {} }, [vstoreFavs]);
  useEffect(() => { try { localStorage.setItem("barFavs",     JSON.stringify(barFavs));     } catch {} }, [barFavs]);
  useEffect(() => { try { localStorage.setItem("filmFavs",    JSON.stringify(filmFavs));    } catch {} }, [filmFavs]);
  useEffect(() => { try { localStorage.setItem("theaterFavs", JSON.stringify(theaterFavs)); } catch {} }, [theaterFavs]);
  useEffect(() => { try { localStorage.setItem("artistFavs",  JSON.stringify(artistFavs));  } catch {} }, [artistFavs]);
  useEffect(() => { try { localStorage.setItem("galleryFavs", JSON.stringify(galleryFavs)); } catch {} }, [galleryFavs]);

  const toggle = (setter) => (id, e) => {
    e.stopPropagation();
    setter(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  // filtered lists
  const filteredVinyls = VINYLS.filter(v => {
    const s = vinylSearch.toLowerCase();
    return (!s || v.artist.toLowerCase().includes(s) || v.title.toLowerCase().includes(s))
      && (eraFilter==="All" || v.era===eraFilter)
      && (genreFilter==="All" || v.genre.toLowerCase().includes(genreFilter.toLowerCase()))
      && (rarityFilter==="All" || v.rarity===rarityFilter)
      && (!findableOnly || v.findable)
      && (!vinylFavOnly || vinylFavs.includes(v.id));
  });

  const filteredShops = SHOPS.filter(s => {
    const q = shopSearch.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q))
      && (shopArea==="all" || s.area===shopArea)
      && (!shopFavOnly || shopFavs.includes(s.id));
  });

  const filteredVintage = VINTAGE.filter(v => {
    const s = vintageSearch.toLowerCase();
    return (!s || v.name.toLowerCase().includes(s) || v.brand.toLowerCase().includes(s) || v.category.toLowerCase().includes(s))
      && (vCatFilter==="All" || v.category===vCatFilter)
      && (vEraFilter==="All" || v.era===vEraFilter)
      && (vRarFilter==="All" || v.rarity===vRarFilter)
      && (!vFindableOnly || v.findable)
      && (!vFavOnly || vintageFavs.includes(v.id));
  });

  const filteredVstores = VSTORES.filter(s => {
    const q = vstoreSearch.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q))
      && (vstoreArea==="all" || s.area===vstoreArea)
      && (!vstoreFavOnly || vstoreFavs.includes(s.id));
  });

  const filteredBars = ALL_BARS.filter(b => {
    const q = barSearch.toLowerCase();
    return (!q || b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.notes.toLowerCase().includes(q))
      && (barArea==="all" || b.area===barArea)
      && (barType==="all" || b.type===barType)
      && (!barFavOnly || barFavs.includes(b.id));
  });

  const filteredFilms = ALL_FILMS.filter(f => {
    const s = filmSearch.toLowerCase();
    return (!s || f.title.toLowerCase().includes(s) || f.director.toLowerCase().includes(s) || f.country.toLowerCase().includes(s))
      && (filmEraFilter==="All" || f.era===filmEraFilter)
      && (filmGenreFilter==="All" || f.genre.toLowerCase().includes(filmGenreFilter.toLowerCase()))
      && (filmCountryFilter==="All" || f.country.toLowerCase().includes(filmCountryFilter.toLowerCase()))
      && (!filmFavOnly || filmFavs.includes(f.id))
      && (filmAwardFilter==="All" || (f.awards && f.awards.length > 0))
      && (filmYearFilter==="All" || (filmYearFilter==="2020s" && f.year>=2020) || (filmYearFilter==="2010s" && f.year>=2010 && f.year<2020) || (filmYearFilter==="2000s" && f.year>=2000 && f.year<2010) || (filmYearFilter==="1990s" && f.year>=1990 && f.year<2000) || (filmYearFilter==="1980s" && f.year>=1980 && f.year<1990) || (filmYearFilter==="1970s" && f.year>=1970 && f.year<1980) || (filmYearFilter==="pre-1970" && f.year<1970))
      && (!filmScriptOnly || SCREENPLAYS[f.id]);
  });
  const filmTotalPages = Math.ceil(filteredFilms.length / FILMS_PER_PAGE);
  const safeFilmPage = Math.min(filmPage, Math.max(0, filmTotalPages - 1));
  const pagedFilms = filteredFilms.slice(safeFilmPage * FILMS_PER_PAGE, (safeFilmPage + 1) * FILMS_PER_PAGE);

  const filteredTheaters = THEATERS.filter(t => {
    const q = theaterSearch.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
      && (theaterArea==="all" || t.area===theaterArea)
      && (!theaterFavOnly || theaterFavs.includes(t.id));
  });

  const filteredArtists = ARTISTS.filter(a => {
    const s = artSearch.toLowerCase();
    return (!s || a.name.toLowerCase().includes(s) || a.medium.toLowerCase().includes(s) || a.category.toLowerCase().includes(s))
      && (artCatFilter==="All" || a.category===artCatFilter)
      && (artTierFilter==="All" || a.tier===artTierFilter)
      && (artRegion==="all" || a.region===artRegion)
      && (!artFindableOnly || a.findable)
      && (!artFavOnly || artistFavs.includes(a.id));
  });

  const filteredGalleries = GALLERIES.filter(g => {
    const q = gallerySearch.toLowerCase();
    return (!q || g.name.toLowerCase().includes(q) || g.city.toLowerCase().includes(q) || g.specialty.toLowerCase().includes(q))
      && (galleryArea==="all" || g.area===galleryArea)
      && (!galleryFavOnly || galleryFavs.includes(g.id));
  });

  // -- STYLES -----------------------------------------------------------------
  const S = {
    app:        { background:"#0A0A0A", minHeight:"100vh", fontFamily:"'Space Mono','Courier New',monospace", color:"#E5E5E5", maxWidth:480, margin:"0 auto" },
    header:     { background:"#0A0A0A", borderBottom:"1px solid #1E1E1E", padding:"14px 16px 0", position:"sticky", top:0, zIndex:50 },
    logoRow:    { display:"flex", alignItems:"center", gap:10, marginBottom:12 },
    backBtn:    { background:"transparent", border:"none", color:"#555", fontFamily:"inherit", fontSize:9, letterSpacing:"0.1em", cursor:"pointer", padding:"0 0 12px 0", display:"flex", alignItems:"center", gap:5 },
    logoText:   { fontSize:17, letterSpacing:"0.06em", color:"#FFF" },
    logoSub:    { fontSize:9, color:"#555", letterSpacing:"0.12em", marginTop:1 },
    tabs:       { display:"flex" },
    tab:(a)=>   ({ flex:1, padding:"9px 0", fontSize:8, letterSpacing:"0.1em", textAlign:"center", cursor:"pointer", background:"transparent", border:"none", borderBottom:a?"2px solid #FF4444":"2px solid transparent", color:a?"#FF4444":"#555", fontFamily:"inherit", textTransform:"uppercase" }),
    body:       { padding:"14px 14px 80px" },

    // landing
    landing:    { padding:"24px 16px 80px" },
    landingTitle: { fontSize:13, color:"#333", letterSpacing:"0.15em", marginBottom:24, textAlign:"center" },
    sectionCard: { background:"#111", border:"1px solid #1E1E1E", borderRadius:12, padding:"20px 18px", marginBottom:12, cursor:"pointer", display:"flex", alignItems:"center", gap:16, transition:"border-color 0.15s" },
    sectionCardTitle: { fontSize:16, color:"#FFF", letterSpacing:"0.05em", marginBottom:4 },
    sectionCardSub: { fontSize:10, color:"#555", letterSpacing:"0.08em", lineHeight:1.6 },
    sectionCount: { fontSize:9, color:"#FF4444", letterSpacing:"0.1em", marginTop:6 },

    search:     { width:"100%", background:"#111", border:"1px solid #222", borderRadius:6, padding:"10px 12px", color:"#E5E5E5", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 },
    filterRow:  { display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" },
    sel:        { background:"#111", border:"1px solid #222", borderRadius:4, color:"#CCC", fontSize:9, padding:"6px 6px", fontFamily:"inherit", outline:"none", cursor:"pointer", letterSpacing:"0.04em" },
    toggle:(on)=>({ background:on?"#FF4444":"#111", border:`1px solid ${on?"#FF4444":"#222"}`, borderRadius:4, color:on?"#000":"#555", fontSize:9, padding:"6px 8px", fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.06em" }),
    countLine:  { fontSize:9, color:"#444", letterSpacing:"0.1em", marginBottom:10 },

    card:       { background:"#111", border:"1px solid #1E1E1E", borderRadius:8, padding:"12px", marginBottom:7, cursor:"pointer", position:"relative" },
    rank:       { fontSize:9, color:"#333", letterSpacing:"0.1em", marginBottom:3 },
    cardTitle:  { fontSize:14, color:"#FFF", marginBottom:2, lineHeight:1.3, paddingRight:24 },
    cardSub:    { fontSize:11, color:"#666", marginBottom:8 },
    pills:      { display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" },
    pill:(r)=>  ({ fontSize:8, padding:"3px 7px", borderRadius:99, background:rarityColor(r).bg, color:rarityColor(r).text, border:`1px solid ${rarityColor(r).border}`, letterSpacing:"0.08em", textTransform:"uppercase" }),
    era:(e)=>   ({ fontSize:8, padding:"3px 7px", borderRadius:99, background:eraColor(e)+"22", color:eraColor(e), border:`1px solid ${eraColor(e)}44` }),
    findPill:   { fontSize:8, padding:"3px 7px", borderRadius:99, background:"#0A2A0A", color:"#4ADE80", border:"1px solid #16A34A44" },
    typePill:(t)=>({ fontSize:8, padding:"3px 7px", borderRadius:99, letterSpacing:"0.08em", textTransform:"uppercase",
      background: t==="record" ? "#0A0A2E" : "#1A0A0A",
      color:      t==="record" ? "#818CF8" : "#FB923C",
      border:     `1px solid ${t==="record" ? "#4338CA44" : "#EA580C44"}` }),

    shopCard:   { background:"#111", border:"1px solid #1E1E1E", borderRadius:8, padding:"12px", marginBottom:7, cursor:"pointer", position:"relative" },
    shopName:   { fontSize:14, color:"#FFF", marginBottom:2, paddingRight:28 },
    shopCity:   { fontSize:10, color:"#FF4444", marginBottom:6, letterSpacing:"0.07em" },
    shopNotes:  { fontSize:12, color:"#777", lineHeight:1.55 },
    stars:      { display:"flex", gap:3, alignItems:"center", marginTop:6 },
    starNum:    { fontSize:11, color:"#FBBF24" },
    areaTabs:   { display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" },
    areaTab:(a)=>({ padding:"5px 10px", borderRadius:99, fontSize:8, letterSpacing:"0.08em", cursor:"pointer", background:a?"#FF4444":"#111", color:a?"#000":"#555", border:a?"1px solid #FF4444":"1px solid #222", fontFamily:"inherit", textTransform:"uppercase" }),
    favBtn:(on)=>({ position:"absolute", top:10, right:10, background:"transparent", border:"none", fontSize:16, cursor:"pointer", color:on?"#FF4444":"#333", padding:2 }),
    openBadge:(open)=>({ fontSize:8, padding:"3px 7px", borderRadius:99, background:open?"#0A2A0A":"#1A0A0A", color:open?"#4ADE80":"#666", border:`1px solid ${open?"#16A34A44":"#33111144"}`, letterSpacing:"0.08em" }),

    modal:      { position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:100, display:"flex", alignItems:"flex-end" },
    modalBox:   { background:"#111", borderRadius:"16px 16px 0 0", padding:"20px 18px 36px", width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"88vh", overflowY:"auto" },
    closeBtn:   { float:"right", background:"#1E1E1E", border:"none", color:"#666", borderRadius:4, padding:"5px 10px", cursor:"pointer", fontFamily:"inherit", fontSize:11 },
    mRank:      { fontSize:10, color:"#444", letterSpacing:"0.12em", marginBottom:5 },
    mTitle:     { fontSize:19, color:"#FFF", marginBottom:4, lineHeight:1.2 },
    mArtist:    { fontSize:13, color:"#777", marginBottom:12 },
    mMeta:      { background:"#0A0A0A", borderRadius:6, padding:"10px 12px", marginBottom:12, fontSize:12, color:"#666", lineHeight:1.9 },
    mMetaH:     { color:"#CCC" },
    mDesc:      { fontSize:13, color:"#999", lineHeight:1.75, marginBottom:12 },
    mValue:     { background:"#0A1A0A", border:"1px solid #16A34A33", borderRadius:6, padding:"10px 12px", fontSize:12, color:"#4ADE80" },
    actionBtn:  { display:"inline-flex", alignItems:"center", gap:5, fontSize:10, padding:"7px 12px", borderRadius:5, cursor:"pointer", fontFamily:"inherit", border:"none", letterSpacing:"0.06em", textDecoration:"none" },
    mapsBtn:    { background:"#1A1A2E", color:"#60A5FA", border:"1px solid #2563EB44" },
    websiteBtn: { background:"#1A1A1A", color:"#CCC", border:"1px solid #333" },
  };

  const SaveBtn = ({ isFav, onToggle }) => (
    <button style={{...S.actionBtn, background:isFav?"#3D0000":"#1A1A1A", color:isFav?"#FF6B6B":"#777", border:isFav?"1px solid #8B000044":"1px solid #333"}} onClick={onToggle}>
      {isFav ? "\u2665 Saved" : "\u2661 Save"}
    </button>
  );

  const ShopModal = ({ shop, favs, favSetter, onClose }) => {
    const open = isOpenNow(shop.hours);
    return (
      <div style={S.modal} onClick={onClose}>
        <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
          <button style={S.closeBtn} onClick={onClose}>CLOSE X</button>
          <div style={S.stars}>
            <span style={S.starNum}>{shop.rating}</span>
            <span style={{fontSize:12,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(shop.rating))}</span>
            {open !== null && <span style={{...S.openBadge(open), marginLeft:6}}>{open?"OPEN NOW":"CLOSED"}</span>}
          </div>
          <div style={{...S.mTitle, marginTop:8}}>{shop.name}</div>
          <div style={{...S.shopCity, fontSize:12, marginBottom:12}}>{shop.city}</div>
          <div style={{...S.pills, marginBottom:12}}>
            <span style={{fontSize:9,padding:"4px 9px",borderRadius:99,background:"#1A1A1A",color:"#666",border:"1px solid #222",letterSpacing:"0.06em"}}>{shop.specialty}</span>
          </div>
          <div style={S.mMeta}>
            <span style={S.mMetaH}>Address:</span> {shop.address}<br/>
            {shop.phone && <><span style={S.mMetaH}>Phone:</span> {shop.phone}<br/></>}
            {shop.hours && <><span style={S.mMetaH}>Hours:</span> {shop.hours}</>}
          </div>
          <div style={S.mDesc}>{shop.notes}</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:4}}>
            <a href={mapsUrl(shop.address)} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.mapsBtn}} onClick={e=>e.stopPropagation()}> Open in Maps</a>
            {shop.website && <a href={shop.website} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.websiteBtn}} onClick={e=>e.stopPropagation()}> Website</a>}
            <SaveBtn isFav={favs.includes(shop.id)} onToggle={e=>toggle(favSetter)(shop.id,e)} />
          </div>
        </div>
      </div>
    );
  };

  // -- HEADER ------------------------------------------------------------------
  const Header = ({ tabs, activeTab, onTab }) => (
    <div style={S.header}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      {section && (
        <button style={S.backBtn} onClick={() => setSection(null)}> ORIGINAL ISSUE</button>
      )}
      {!section && (
        <div style={S.logoRow}>
          <HangTag size={22} color="#FF4444" />
          <div>
            <div style={S.logoText}>ORIGINAL ISSUE</div>
            <div style={S.logoSub}>COLLECTOR'S FIELD GUIDE  WORLDWIDE</div>
          </div>
        </div>
      )}
      {tabs && (
        <div style={S.tabs}>
          {tabs.map(([k,l]) => (
            <button key={k} style={S.tab(activeTab===k)} onClick={() => onTab(k)}>{l}</button>
          ))}
        </div>
      )}
      {!tabs && section && <div style={{height:1}} />}
    </div>
  );

  // -- LANDING ------------------------------------------------------------------
  if (!section) {
    return (
      <div style={S.app}>
        <Header />
        <div style={S.landing}>
          <div style={S.landingTitle}>SELECT A SECTION</div>

          <div style={S.sectionCard} onClick={() => setSection("films")}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="8" width="32" height="20" rx="2" fill="#111" stroke="#FF4444" strokeWidth="1.5"/>
              <rect x="2" y="8" width="6" height="20" fill="#111" stroke="#FF4444" strokeWidth="1"/>
              <rect x="28" y="8" width="6" height="20" fill="#111" stroke="#FF4444" strokeWidth="1"/>
              <rect x="4" y="11" width="2" height="3" rx="0.5" fill="#FF4444" opacity="0.8"/>
              <rect x="4" y="16" width="2" height="3" rx="0.5" fill="#FF4444" opacity="0.8"/>
              <rect x="4" y="21" width="2" height="3" rx="0.5" fill="#FF4444" opacity="0.8"/>
              <rect x="30" y="11" width="2" height="3" rx="0.5" fill="#FF4444" opacity="0.8"/>
              <rect x="30" y="16" width="2" height="3" rx="0.5" fill="#FF4444" opacity="0.8"/>
              <rect x="30" y="21" width="2" height="3" rx="0.5" fill="#FF4444" opacity="0.8"/>
              <circle cx="18" cy="18" r="4" fill="none" stroke="#FF4444" strokeWidth="1.2"/>
              <circle cx="18" cy="18" r="1.5" fill="#FF4444"/>
            </svg>
            <div>
              <div style={S.sectionCardTitle}>FILMS</div>
              <div style={S.sectionCardSub}>Top 1200 films by era{"\n"}Independent theaters worldwide</div>
              <div style={S.sectionCount}>{ALL_FILMS.length} films  {THEATERS.length} theaters</div>
            </div>
          </div>

          <div style={S.sectionCard} onClick={() => setSection("art")}>
            <ArtFrameIcon size={36} color="#FF4444" />
            <div>
              <div style={S.sectionCardTitle}>ART</div>
              <div style={S.sectionCardSub}>Artists to collect by tier{"\n"}Galleries & auction houses worldwide</div>
              <div style={S.sectionCount}>{ARTISTS.length} artists  {GALLERIES.length} galleries</div>
            </div>
          </div>

          <div style={S.sectionCard} onClick={() => setSection("records")}>
            <VinylDisc size={40} color="#FF4444" />
            <div>
              <div style={S.sectionCardTitle}>RECORDS</div>
              <div style={S.sectionCardSub}>Top 500 records to hunt{"\n"}Record shops worldwide</div>
              <div style={S.sectionCount}>{VINYLS.length} records  {SHOPS.length} shops</div>
            </div>
          </div>

          <div style={S.sectionCard} onClick={() => setSection("vintage")}>
            <HangTag size={26} color="#FF4444" />
            <div>
              <div style={S.sectionCardTitle}>VINTAGE</div>
              <div style={S.sectionCardSub}>Top 100 pieces to find{"\n"}Vintage clothing shops</div>
              <div style={S.sectionCount}>{VINTAGE.length} pieces  {VSTORES.length} shops</div>
            </div>
          </div>

          <div style={S.sectionCard} onClick={() => setSection("bars")}>
            <GlassIcon size={36} color="#FF4444" />
            <div>
              <div style={S.sectionCardTitle}>BARS</div>
              <div style={S.sectionCardSub}>Record bars & great bars{"\n"}All cities worldwide</div>
              <div style={S.sectionCount}>{ALL_BARS.length} bars  {ALL_BAR_AREAS.length - 1} cities</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -- RECORDS SECTION -------------------------------------------------------
  if (section === "records") {
    return (
      <div style={S.app}>
        <Header tabs={[["hunt","RECORDS"],["shops","REC SHOPS"]]} activeTab={recTab} onTab={setRecTab} />
        <div style={S.body}>

          {recTab==="hunt" && <>
            <input style={S.search} placeholder="Search artist or title..." value={vinylSearch} onChange={e=>setVinylSearch(e.target.value)} />
            <div style={S.filterRow}>
              <select style={S.sel} value={eraFilter} onChange={e=>setEraFilter(e.target.value)}>{ERAS.map(e=><option key={e} value={e}>{e==="All"?"ERA":e}</option>)}</select>
              <select style={S.sel} value={genreFilter} onChange={e=>setGenreFilter(e.target.value)}>{GENRES.map(g=><option key={g} value={g}>{g==="All"?"GENRE":g}</option>)}</select>
              <select style={S.sel} value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}>{RARITIES.map(r=><option key={r} value={r}>{r==="All"?"RARITY":r}</option>)}</select>
              <button style={S.toggle(findableOnly)} onClick={()=>setFindableOnly(!findableOnly)}>FINDABLE</button>
              <button style={S.toggle(vinylFavOnly)} onClick={()=>setVinylFavOnly(!vinylFavOnly)}> SAVED</button>
            </div>
            <div style={S.countLine}>{filteredVinyls.length} / {VINYLS.length} RECORDS</div>
            {filteredVinyls.map(v=>(
              <div key={v.id} style={S.card} onClick={()=>setSelectedVinyl(v)}>
                <button style={S.favBtn(vinylFavs.includes(v.id))} onClick={e=>toggle(setVinylFavs)(v.id,e)}>{vinylFavs.includes(v.id)?"\u2665":"\u2661"}</button>
                <div style={S.rank}>#{v.rank}</div>
                <div style={S.cardTitle}>{v.title}</div>
                <div style={S.cardSub}>{v.artist}  {v.label}  {v.year}</div>
                <div style={S.pills}>
                  <span style={S.pill(v.rarity)}>{v.rarity}</span>
                  <span style={S.era(v.era)}>{v.era}</span>
                  <span style={{fontSize:8,color:"#444"}}>{v.genre}</span>
                  {v.findable && <span style={S.findPill}>CRATE-FINDABLE</span>}
                </div>
              </div>
            ))}
          </>}

          {recTab==="shops" && <>
            <input style={S.search} placeholder="Search name, city, or genre..." value={shopSearch} onChange={e=>setShopSearch(e.target.value)} />
            <div style={S.areaTabs}>{AREAS.map(({key,label})=><button key={key} style={S.areaTab(shopArea===key)} onClick={()=>setShopArea(key)}>{label}</button>)}</div>
            <div style={S.filterRow}><button style={S.toggle(shopFavOnly)} onClick={()=>setShopFavOnly(!shopFavOnly)}> SAVED</button></div>
            <div style={S.countLine}>{filteredShops.length} / {SHOPS.length} SHOPS</div>
            {filteredShops.map(s=>{
              const open = isOpenNow(s.hours);
              return (
                <div key={s.id} style={S.shopCard} onClick={()=>setSelectedShop(s)}>
                  <button style={S.favBtn(shopFavs.includes(s.id))} onClick={e=>toggle(setShopFavs)(s.id,e)}>{shopFavs.includes(s.id)?"\u2665":"\u2661"}</button>
                  <div style={S.shopName}>{s.name}</div>
                  <div style={S.shopCity}>{s.city}</div>
                  <div style={{...S.pills,marginBottom:7}}>
                    <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                    {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                  </div>
                  <div style={S.shopNotes}>{s.notes}</div>
                  <div style={S.stars}><span style={S.starNum}>{s.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(s.rating))}{"\u2606".repeat(5-Math.floor(s.rating))}</span></div>
                </div>
              );
            })}
          </>}
        </div>

        {selectedVinyl && (
          <div style={S.modal} onClick={()=>setSelectedVinyl(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedVinyl(null)}>CLOSE X</button>
              <div style={S.mRank}>#{selectedVinyl.rank} OF {VINYLS.length}</div>
              <div style={S.mTitle}>{selectedVinyl.title}</div>
              <div style={S.mArtist}>{selectedVinyl.artist}</div>
              <div style={{...S.pills,marginBottom:12}}>
                <span style={S.pill(selectedVinyl.rarity)}>{selectedVinyl.rarity}</span>
                <span style={S.era(selectedVinyl.era)}>{selectedVinyl.era}</span>
                {selectedVinyl.findable && <span style={S.findPill}>CRATE-FINDABLE</span>}
              </div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Label:</span> {selectedVinyl.label}<br/>
                <span style={S.mMetaH}>Year:</span> {selectedVinyl.year}<br/>
                <span style={S.mMetaH}>Genre:</span> {selectedVinyl.genre}
              </div>
              <div style={S.mDesc}>{selectedVinyl.description}</div>
              <div style={S.mValue}> Value range: {selectedVinyl.value}</div>
              <div style={{marginTop:12}}><SaveBtn isFav={vinylFavs.includes(selectedVinyl.id)} onToggle={e=>toggle(setVinylFavs)(selectedVinyl.id,e)} /></div>
            </div>
          </div>
        )}
        {selectedShop && <ShopModal shop={selectedShop} favs={shopFavs} favSetter={setShopFavs} onClose={()=>setSelectedShop(null)} />}
      </div>
    );
  }

  // -- VINTAGE SECTION -------------------------------------------------------
  if (section === "vintage") {
    return (
      <div style={S.app}>
        <Header tabs={[["pieces","VINTAGE"],["shops","VTGE SHOPS"]]} activeTab={vtgTab} onTab={setVtgTab} />
        <div style={S.body}>

          {vtgTab==="pieces" && <>
            <input style={S.search} placeholder="Search name, brand, or category..." value={vintageSearch} onChange={e=>setVintageSearch(e.target.value)} />
            <div style={S.filterRow}>
              <select style={S.sel} value={vCatFilter} onChange={e=>setVCatFilter(e.target.value)}>{VINTAGE_CATEGORIES.map(c=><option key={c} value={c}>{c==="All"?"CATEGORY":c}</option>)}</select>
              <select style={S.sel} value={vEraFilter} onChange={e=>setVEraFilter(e.target.value)}>{VINTAGE_ERAS.map(e=><option key={e} value={e}>{e==="All"?"ERA":e}</option>)}</select>
              <select style={S.sel} value={vRarFilter} onChange={e=>setVRarFilter(e.target.value)}>{VINTAGE_RARITIES.map(r=><option key={r} value={r}>{r==="All"?"RARITY":r}</option>)}</select>
              <button style={S.toggle(vFindableOnly)} onClick={()=>setVFindableOnly(!vFindableOnly)}>FINDABLE</button>
              <button style={S.toggle(vFavOnly)} onClick={()=>setVFavOnly(!vFavOnly)}> SAVED</button>
            </div>
            <div style={S.countLine}>{filteredVintage.length} / {VINTAGE.length} PIECES</div>
            {filteredVintage.map(v=>(
              <div key={v.id} style={S.card} onClick={()=>setSelectedVintage(v)}>
                <button style={S.favBtn(vintageFavs.includes(v.id))} onClick={e=>toggle(setVintageFavs)(v.id,e)}>{vintageFavs.includes(v.id)?"\u2665":"\u2661"}</button>
                <div style={S.rank}>#{v.rank}</div>
                <div style={S.cardTitle}>{v.name}</div>
                <div style={S.cardSub}>{v.brand}  {v.era}</div>
                <div style={S.pills}>
                  <span style={S.pill(v.rarity)}>{v.rarity}</span>
                  <span style={S.era(v.era)}>{v.era}</span>
                  <span style={{fontSize:8,color:"#444"}}>{v.category}</span>
                  {v.findable && <span style={S.findPill}>FINDABLE</span>}
                </div>
              </div>
            ))}
          </>}

          {vtgTab==="shops" && <>
            <input style={S.search} placeholder="Search name, city, or specialty..." value={vstoreSearch} onChange={e=>setVstoreSearch(e.target.value)} />
            <div style={S.areaTabs}>{VSTORE_AREAS.map(({key,label})=><button key={key} style={S.areaTab(vstoreArea===key)} onClick={()=>setVstoreArea(key)}>{label}</button>)}</div>
            <div style={S.filterRow}><button style={S.toggle(vstoreFavOnly)} onClick={()=>setVstoreFavOnly(!vstoreFavOnly)}> SAVED</button></div>
            <div style={S.countLine}>{filteredVstores.length} / {VSTORES.length} STORES</div>
            {filteredVstores.map(s=>{
              const open = isOpenNow(s.hours);
              return (
                <div key={s.id} style={S.shopCard} onClick={()=>setSelectedVstore(s)}>
                  <button style={S.favBtn(vstoreFavs.includes(s.id))} onClick={e=>toggle(setVstoreFavs)(s.id,e)}>{vstoreFavs.includes(s.id)?"\u2665":"\u2661"}</button>
                  <div style={S.shopName}>{s.name}</div>
                  <div style={S.shopCity}>{s.city}</div>
                  <div style={{...S.pills,marginBottom:7}}>
                    <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                    {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                  </div>
                  <div style={S.shopNotes}>{s.notes}</div>
                  <div style={S.stars}><span style={S.starNum}>{s.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(s.rating))}{"\u2606".repeat(5-Math.floor(s.rating))}</span></div>
                </div>
              );
            })}
          </>}
        </div>

        {selectedVintage && (
          <div style={S.modal} onClick={()=>setSelectedVintage(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedVintage(null)}>CLOSE X</button>
              <div style={S.mRank}>#{selectedVintage.rank} OF {VINTAGE.length}</div>
              <div style={S.mTitle}>{selectedVintage.name}</div>
              <div style={S.mArtist}>{selectedVintage.brand}</div>
              <div style={{...S.pills,marginBottom:12}}>
                <span style={S.pill(selectedVintage.rarity)}>{selectedVintage.rarity}</span>
                <span style={S.era(selectedVintage.era)}>{selectedVintage.era}</span>
                {selectedVintage.findable && <span style={S.findPill}>FINDABLE</span>}
              </div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Category:</span> {selectedVintage.category}<br/>
                <span style={S.mMetaH}>Era:</span> {selectedVintage.era}
              </div>
              <div style={S.mDesc}>{selectedVintage.description}</div>
              <div style={S.mValue}> Value range: {selectedVintage.value}</div>
              <div style={{marginTop:12}}><SaveBtn isFav={vintageFavs.includes(selectedVintage.id)} onToggle={e=>toggle(setVintageFavs)(selectedVintage.id,e)} /></div>
            </div>
          </div>
        )}
        {selectedVstore && <ShopModal shop={selectedVstore} favs={vstoreFavs} favSetter={setVstoreFavs} onClose={()=>setSelectedVstore(null)} />}
      </div>
    );
  }

  // -- FILMS SECTION ---------------------------------------------------------
  if (section === "films") {
    const awardBadge = (awards) => {
      if (!awards) return null;
      const a = awards;
      const oscarCats = (a.match(/Best [A-Z][^,;(]*/g)||[]).length;
      if (a.includes("Academy Award")) {
        if (oscarCats >= 7) return oscarCats + " Oscars";
        if (oscarCats >= 4) return oscarCats + " Oscars";
        if (oscarCats >= 2) return oscarCats + " Oscars";
        const first = a.match(/Best ([A-Za-z ]+)/);
        if (first) {
          const cat = first[1].trim().replace(/\(.*/,"").trim();
          const short = cat.replace("Adapted Screenplay","Screenplay").replace("Original Screenplay","Screenplay").replace("Foreign Language Film","Intl Film").replace("Documentary Feature","Documentary").replace("Animated Feature","Animation").replace("Supporting Actor","Supp. Actor").replace("Supporting Actress","Supp. Actress");
          return "Oscar: " + short.slice(0, 18);
        }
      }
      if (a.includes("Palme d")) return "Palme d'Or";
      if (a.includes("Golden Lion")) return "Golden Lion";
      if (a.includes("Golden Bear")) return "Golden Bear";
      if (a.includes("Grand Prix")) return "Cannes Grand Prix";
      if (a.includes("Grand Jury Prize")) return "Grand Jury";
      if (a.includes("Jury Prize")) return "Jury Prize";
      if (a.includes("Silver Lion")) return "Silver Lion";
      if (a.includes("Silver Bear")) return "Silver Bear";
      if (a.includes("BAFTA: Best Film") || a.includes("BAFTA: Best British")) return "BAFTA Best Film";
      if (a.includes("BAFTA")) { const bm = a.match(/BAFTA: ([^;,]+)/); return bm ? "BAFTA: " + bm[1].slice(0,14) : "BAFTA"; }
      if (a.includes("Sight & Sound") && a.includes("#1")) return "S&S: #1 Film";
      if (a.includes("Sight & Sound") && a.includes("Top 10")) return "S&S Top 10";
      if (a.includes("Sight & Sound")) return "Sight & Sound";
      if (a.includes("National Film Registry")) return "Natl Film Registry";
      if (a.includes("Golden Globe")) { const gm = a.match(/Golden Globe[s]?: ([^;,]+)/); return gm ? "GG: " + gm[1].slice(0,14) : "Golden Globe"; }
      if (a.includes("Independent Spirit")) return "Spirit Award";
      if (a.includes("FIPRESCI")) return "FIPRESCI Prize";
      if (a.includes("Felix Award")) return "Felix Award";
      if (a.includes("Volpi Cup")) return "Volpi Cup";
      if (a.includes("Honorary Oscar")) return "Honorary Oscar";
      const fallback = a.split(/[;,]/)[0].trim().slice(0, 22);
      return fallback || null;
    };
    return (
      <div style={S.app}>
        <Header tabs={[["films","FILMS"],["theaters","THEATERS"]]} activeTab={filmTab} onTab={setFilmTab} />
        <div style={S.body}>

          {filmTab==="films" && <>
            <input style={S.search} placeholder="Search title, director, or country..." value={filmSearch} onChange={e=>{setFilmSearch(e.target.value);setFilmPage(0);}} />
            <div style={S.filterRow}>
              <select style={S.sel} value={filmEraFilter} onChange={e=>{setFilmEraFilter(e.target.value);setFilmPage(0);}}>
                {FILM_ERAS.map(e=><option key={e} value={e}>{e==="All"?"ERA":e}</option>)}
              </select>
              <select style={S.sel} value={filmGenreFilter} onChange={e=>{setFilmGenreFilter(e.target.value);setFilmPage(0);}}>
                {FILM_GENRES.map(g=><option key={g} value={g}>{g==="All"?"GENRE":g}</option>)}
              </select>
              <select style={S.sel} value={filmCountryFilter} onChange={e=>{setFilmCountryFilter(e.target.value);setFilmPage(0);}}>
                {FILM_COUNTRIES.map(c=><option key={c} value={c}>{c==="All"?"COUNTRY":c}</option>)}
              </select>
              <button style={S.toggle(filmFavOnly)} onClick={()=>{setFilmFavOnly(!filmFavOnly);setFilmPage(0);}}>{filmFavOnly ? "\u2665" : "\u2661"} SAVED</button>
              <select style={S.sel} value={filmAwardFilter} onChange={e=>{setFilmAwardFilter(e.target.value);setFilmPage(0);}}>
                <option value="All">AWARDS</option>
                <option value="awarded">Has Award</option>
              </select>
              <select style={S.sel} value={filmYearFilter} onChange={e=>{setFilmYearFilter(e.target.value);setFilmPage(0);}}>
                <option value="All">DECADE</option>
                <option value="2020s">2020s</option>
                <option value="2010s">2010s</option>
                <option value="2000s">2000s</option>
                <option value="1990s">1990s</option>
                <option value="1980s">1980s</option>
                <option value="1970s">1970s</option>
                <option value="pre-1970">Pre-1970</option>
              </select>
              <button style={S.toggle(filmScriptOnly)} onClick={()=>{setFilmScriptOnly(!filmScriptOnly);setFilmPage(0);}}>SCRIPT</button>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={S.countLine}>{filteredFilms.length} films  {filmTotalPages > 1 ? "\u00b7 p." + (safeFilmPage+1) + "/" + filmTotalPages : ""}</span>
              {filmTotalPages > 1 && (
                <div style={{display:"flex",gap:4}}>
                  <button style={{...S.toggle(false),padding:"4px 10px",opacity:safeFilmPage===0?0.3:1}} onClick={()=>{setFilmPage(p=>Math.max(0,p-1));window.scrollTo(0,0);}}>&#8249; PREV</button>
                  <button style={{...S.toggle(false),padding:"4px 10px",opacity:safeFilmPage===filmTotalPages-1?0.3:1}} onClick={()=>{setFilmPage(p=>Math.min(filmTotalPages-1,p+1));window.scrollTo(0,0);}}>NEXT &#8250;</button>
                </div>
              )}
            </div>
            {pagedFilms.map(f=>(
              <div key={f.id} style={S.card} onClick={()=>setSelectedFilm(f)}>
                <button style={S.favBtn(filmFavs.includes(f.id))} onClick={e=>toggle(setFilmFavs)(f.id,e)}>{filmFavs.includes(f.id)?"\u2665":"\u2661"}</button>
                <div style={S.rank}>#{f.rank}</div>
                <div style={S.cardTitle}>{f.title}</div>
                <div style={S.cardSub}>{f.director}  {f.year}  {f.country}</div>
                <div style={S.pills}>
                  <span style={S.era(f.era)}>{f.era}</span>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:genreColor(f.genre).bg,color:genreColor(f.genre).color,border:`1px solid ${genreColor(f.genre).border}`}}>{f.genre}</span>
                  {f.awards && awardBadge(f.awards) && <span style={{fontSize:7,padding:"3px 7px",borderRadius:99,background:"#1A1400",color:"#FBBF24",border:"1px solid #92400E44",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{awardBadge(f.awards)}</span>}
                  {SCREENPLAYS[f.id] && <span style={{fontSize:7,padding:"3px 7px",borderRadius:99,background:"#0A1A0A",color:"#4ADE80",border:"1px solid #16A34A55",letterSpacing:"0.05em"}}>SCRIPT</span>}
                  {SOUNDTRACKS[f.id] && <span style={{fontSize:7,padding:"3px 7px",borderRadius:99,background:"#051205",color:"#1DB954",border:"1px solid #1DB95440",letterSpacing:"0.05em"}}>OST</span>}
                </div>
              </div>
            ))}
            {filmTotalPages > 1 && (
              <div style={{marginTop:16,paddingBottom:8}}>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                  {Array.from({length:filmTotalPages},(_,i)=>(
                    <button key={i} style={{...S.toggle(i===safeFilmPage),padding:"5px 9px",fontSize:9,minWidth:32}} onClick={()=>{setFilmPage(i);window.scrollTo(0,0);}}>{i+1}</button>
                  ))}
                </div>
                <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                  <button style={{...S.toggle(false),padding:"6px 18px",opacity:safeFilmPage===0?0.3:1}} onClick={()=>{setFilmPage(p=>Math.max(0,p-1));window.scrollTo(0,0);}}>&#8249; PREV</button>
                  <button style={{...S.toggle(false),padding:"6px 18px",opacity:safeFilmPage===filmTotalPages-1?0.3:1}} onClick={()=>{setFilmPage(p=>Math.min(filmTotalPages-1,p+1));window.scrollTo(0,0);}}>NEXT &#8250;</button>
                </div>
              </div>
            )}
          </>}

          {filmTab==="theaters" && <>
            <input style={S.search} placeholder="Search name, city, or notes..." value={theaterSearch} onChange={e=>setTheaterSearch(e.target.value)} />
            <div style={S.areaTabs}>{THEATER_AREAS.map(({key,label})=><button key={key} style={S.areaTab(theaterArea===key)} onClick={()=>setTheaterArea(key)}>{label}</button>)}</div>
            <div style={S.filterRow}><button style={S.toggle(theaterFavOnly)} onClick={()=>setTheaterFavOnly(!theaterFavOnly)}> SAVED</button></div>
            <div style={S.countLine}>{filteredTheaters.length} / {THEATERS.length} THEATERS</div>
            {filteredTheaters.map(t=>(
              <div key={t.id} style={S.shopCard} onClick={()=>setSelectedTheater(t)}>
                <button style={S.favBtn(theaterFavs.includes(t.id))} onClick={e=>toggle(setTheaterFavs)(t.id,e)}>{theaterFavs.includes(t.id)?"\u2665":"\u2661"}</button>
                <div style={S.shopName}>{t.name}</div>
                <div style={S.shopCity}>{t.city}</div>
                <div style={S.shopNotes}>{t.notes}</div>
                <div style={S.stars}><span style={S.starNum}>{t.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(t.rating))}{"\u2606".repeat(5-Math.floor(t.rating))}</span></div>
              </div>
            ))}
          </>}
        </div>

        {selectedFilm && (
          <div style={S.modal} onClick={()=>setSelectedFilm(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedFilm(null)}>CLOSE X</button>
              <div style={S.mRank}>#{selectedFilm.rank} OF {ALL_FILMS.length}</div>
              <div style={S.mTitle}>{selectedFilm.title}</div>
              <div style={S.mArtist}>{selectedFilm.director}</div>
              <div style={{...S.pills,marginBottom:12}}>
                <span style={S.era(selectedFilm.era)}>{selectedFilm.era}</span>
                <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:genreColor(selectedFilm.genre).bg,color:genreColor(selectedFilm.genre).color,border:`1px solid ${genreColor(selectedFilm.genre).border}`}}>{selectedFilm.genre}</span>
              </div>
              {selectedFilm.awards && (
                <div style={{background:"#1A1400",border:"1px solid #92400E44",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#FBBF24"}}>
                  <span style={{fontSize:8,letterSpacing:"0.1em",opacity:0.7}}>AWARD  </span>{selectedFilm.awards}
                </div>
              )}
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Year:</span> {selectedFilm.year}<br/>
                <span style={S.mMetaH}>Country:</span> {selectedFilm.country}<br/>
                <span style={S.mMetaH}>Genre:</span> {selectedFilm.genre}<br/>
                {(selectedFilm.watchOn || selectedFilm.value) && (
                  <><span style={S.mMetaH}>Where to watch:</span> {selectedFilm.watchOn || selectedFilm.value}</>
                )}
              </div>
              <div style={S.mDesc}>{selectedFilm.description}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                {SCREENPLAYS[selectedFilm.id] && (
                  <a href={SCREENPLAYS[selectedFilm.id].url} target="_blank" rel="noopener noreferrer"
                    style={{...S.actionBtn,background:"#0A1A0A",color:"#4ADE80",border:"1px solid #16A34A66",textDecoration:"none",display:"flex",alignItems:"center",gap:4,fontWeight:"bold"}}
                    onClick={e=>e.stopPropagation()}>
                    SCREENPLAY &rarr;
                    <span style={{fontSize:7,opacity:0.6,fontWeight:"normal"}}>{SCREENPLAYS[selectedFilm.id].source}</span>
                  </a>
                )}
                {SOUNDTRACKS[selectedFilm.id] && (
                  <a href={SOUNDTRACKS[selectedFilm.id].url} target="_blank" rel="noopener noreferrer"
                    style={{...S.actionBtn,background:"#051205",color:"#1DB954",border:"1px solid #1DB95466",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}
                    onClick={e=>e.stopPropagation()}>
                    <span style={{fontSize:11,lineHeight:1}}>&#9654;</span> SOUNDTRACK
                    <span style={{fontSize:7,opacity:0.6}}>{SOUNDTRACKS[selectedFilm.id].composer.split("/")[0].trim().slice(0,16)}</span>
                  </a>
                )}
                {selectedFilm.imdb && selectedFilm.imdb.startsWith("http") && (
                  <a href={selectedFilm.imdb} target="_blank" rel="noopener noreferrer"
                    style={{...S.actionBtn,background:"#1A1200",color:"#F5C518",border:"1px solid #F5C51844",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}
                    onClick={e=>e.stopPropagation()}>IMDb &rarr;</a>
                )}
                <SaveBtn isFav={filmFavs.includes(selectedFilm.id)} onToggle={e=>toggle(setFilmFavs)(selectedFilm.id,e)} />
              </div>
            </div>
          </div>
        )}

        {selectedTheater && (
          <div style={S.modal} onClick={()=>setSelectedTheater(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedTheater(null)}>CLOSE X</button>
              <div style={S.stars}>
                <span style={S.starNum}>{selectedTheater.rating}</span>
                <span style={{fontSize:12,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(selectedTheater.rating))}</span>
              </div>
              <div style={{...S.mTitle,marginTop:8}}>{selectedTheater.name}</div>
              <div style={{...S.shopCity,fontSize:12,marginBottom:12}}>{selectedTheater.city}</div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Address:</span> {selectedTheater.address}<br/>
                {selectedTheater.hours && <><span style={S.mMetaH}>Hours:</span> {selectedTheater.hours}</>}
              </div>
              <div style={S.mDesc}>{selectedTheater.notes}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                <a href={mapsUrl(selectedTheater.address)} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.mapsBtn}} onClick={e=>e.stopPropagation()}> Open in Maps</a>
                {selectedTheater.website && <a href={selectedTheater.website} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.websiteBtn}} onClick={e=>e.stopPropagation()}> Website</a>}
                <SaveBtn isFav={theaterFavs.includes(selectedTheater.id)} onToggle={e=>toggle(setTheaterFavs)(selectedTheater.id,e)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -- ART SECTION -----------------------------------------------------------
  if (section === "art") {
    return (
      <div style={S.app}>
        <Header tabs={[["artists","ARTISTS"],["galleries","GALLERIES"]]} activeTab={artTab} onTab={setArtTab} />
        <div style={S.body}>

          {artTab==="artists" && <>
            <input style={S.search} placeholder="Search artist, medium, or category..." value={artSearch} onChange={e=>setArtSearch(e.target.value)} />
            <div style={S.areaTabs}>{ART_REGIONS.map(({key,label})=><button key={key} style={S.areaTab(artRegion===key)} onClick={()=>setArtRegion(key)}>{label}</button>)}</div>
            <div style={S.filterRow}>
              <select style={S.sel} value={artCatFilter} onChange={e=>setArtCatFilter(e.target.value)}>{ART_CATEGORIES.map(c=><option key={c} value={c}>{c==="All"?"CATEGORY":c}</option>)}</select>
              <select style={S.sel} value={artTierFilter} onChange={e=>setArtTierFilter(e.target.value)}>{ART_TIERS.map(t=><option key={t} value={t}>{t==="All"?"TIER":t}</option>)}</select>
              <button style={S.toggle(artFindableOnly)} onClick={()=>setArtFindableOnly(!artFindableOnly)}>FINDABLE</button>
              <button style={S.toggle(artFavOnly)} onClick={()=>setArtFavOnly(!artFavOnly)}> SAVED</button>
            </div>
            <div style={S.countLine}>{filteredArtists.length} / {ARTISTS.length} ARTISTS</div>
            {filteredArtists.map(a=>(
              <div key={a.id} style={S.card} onClick={()=>setSelectedArtist(a)}>
                <button style={S.favBtn(artistFavs.includes(a.id))} onClick={e=>toggle(setArtistFavs)(a.id,e)}>{artistFavs.includes(a.id)?"\u2665":"\u2661"}</button>
                <div style={S.rank}>#{a.rank}</div>
                <div style={S.cardTitle}>{a.name}</div>
                <div style={S.cardSub}>{a.medium}  {a.era}</div>
                <div style={S.pills}>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:signalColor(a.signal).bg,color:signalColor(a.signal).text,border:`1px solid ${signalColor(a.signal).border}`,letterSpacing:"0.08em",textTransform:"uppercase"}}>{a.signal}</span>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222",letterSpacing:"0.06em"}}>{a.tier}</span>
                  <span style={{fontSize:8,color:"#444"}}>{a.category}</span>
                  {a.findable && <span style={S.findPill}>FINDABLE</span>}
                </div>
              </div>
            ))}
          </>}

          {artTab==="galleries" && <>
            <input style={S.search} placeholder="Search name, city, or specialty..." value={gallerySearch} onChange={e=>setGallerySearch(e.target.value)} />
            <div style={S.areaTabs}>{GALLERY_AREAS.map(({key,label})=><button key={key} style={S.areaTab(galleryArea===key)} onClick={()=>setGalleryArea(key)}>{label}</button>)}</div>
            <div style={S.filterRow}><button style={S.toggle(galleryFavOnly)} onClick={()=>setGalleryFavOnly(!galleryFavOnly)}> SAVED</button></div>
            <div style={S.countLine}>{filteredGalleries.length} / {GALLERIES.length} GALLERIES</div>
            {filteredGalleries.map(g=>{
              const open = g.hours ? isOpenNow(g.hours) : null;
              return (
                <div key={g.id} style={S.shopCard} onClick={()=>setSelectedGallery(g)}>
                  <button style={S.favBtn(galleryFavs.includes(g.id))} onClick={e=>toggle(setGalleryFavs)(g.id,e)}>{galleryFavs.includes(g.id)?"\u2665":"\u2661"}</button>
                  <div style={S.shopName}>{g.name}</div>
                  <div style={S.shopCity}>{g.city}</div>
                  <div style={{...S.pills,marginBottom:7}}>
                    <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{g.specialty}</span>
                    {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                  </div>
                  <div style={S.shopNotes}>{g.notes}</div>
                  <div style={S.stars}><span style={S.starNum}>{g.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(g.rating))}{"\u2606".repeat(5-Math.floor(g.rating))}</span></div>
                </div>
              );
            })}
          </>}
        </div>

        {selectedArtist && (()=>{
          const a = selectedArtist;
          const guideBlock = (title, color, items) => (
            <div style={{background:"#0A0A0A",border:`1px solid ${color}22`,borderRadius:8,padding:"10px 12px",marginBottom:10}}>
              <div style={{fontSize:9,color:color,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{title}</div>
              {items.map((item,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:i<items.length-1?7:0}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:color,marginTop:6,flexShrink:0}}/>
                  <div style={{fontSize:12,color:"#888",lineHeight:1.6}}>
                    {item.label && <span style={{color:"#CCC",fontWeight:"bold"}}>{item.label} </span>}
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          );

          const printsMediumGuide = a.category==="Prints Hunt" || a.medium.toLowerCase().includes("print");
          const photoMediumGuide  = a.category==="Photography" || a.medium.toLowerCase().includes("photo");

          return (
            <div style={S.modal} onClick={()=>setSelectedArtist(null)}>
              <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
                <button style={S.closeBtn} onClick={()=>setSelectedArtist(null)}>CLOSE X</button>
                <div style={S.mRank}>#{a.rank} OF {ARTISTS.length}</div>
                <div style={S.mTitle}>{a.name}</div>
                <div style={S.mArtist}>{a.medium}</div>
                <div style={{...S.pills,marginBottom:12}}>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:signalColor(a.signal).bg,color:signalColor(a.signal).text,border:`1px solid ${signalColor(a.signal).border}`,letterSpacing:"0.08em",textTransform:"uppercase"}}>{a.signal}</span>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222",letterSpacing:"0.06em"}}>{a.tier}</span>
                  {a.findable && <span style={S.findPill}>FINDABLE</span>}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                  {a.website && <a href={a.website} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.websiteBtn,fontSize:10,padding:"5px 10px"}} onClick={e=>e.stopPropagation()}>Website ↗</a>}
                  {a.artsy && <a href={a.artsy} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,background:"#0A0A0A",color:"#888",border:"1px solid #222",fontSize:10,padding:"5px 10px"}} onClick={e=>e.stopPropagation()}>Artsy ↗</a>}
                </div>
                <div style={S.mMeta}>
                  <span style={S.mMetaH}>Medium:</span> {a.medium}<br/>
                  <span style={S.mMetaH}>Era:</span> {a.era}<br/>
                  <span style={S.mMetaH}>Category:</span> {a.category}
                </div>
                <div style={S.mDesc}>{a.description}</div>
                <div style={S.mValue}> Value range: {a.value}</div>

                <div style={{height:1,background:"#1E1E1E",margin:"14px 0 12px"}}/>
                <div style={{fontSize:9,color:"#333",letterSpacing:"0.12em",marginBottom:12}}>COLLECTOR'S GUIDE</div>

                {/* BLUE CHIP TIPS */}
                {a.tier==="blue chip" && <>
                  {guideBlock("Market intelligence","#FBBF24",[
                    {label:"Bottom quintile is strongest.", text:"Works under $50K are achieving 157% of estimated value at auction on average right now. The high end is soft — the hunt market is the hot segment."},
                    {label:"Estate tax changed supply.", text:"The US estate tax exemption rose to $15M in 2025. Heirs no longer need forced sales. Supply is tightening — move on estate sales quickly when they come up."},
                    {label:"Prints vs paintings arbitrage.", text:"Blue chip prints are significantly undervalued relative to paintings by the same artist. A Warhol screenprint at $8K and a Warhol painting at $8M share the same signature. Hunt the prints."},
                  ])}
                  {guideBlock("Authentication — UV light","#60A5FA",[
                    {label:"365nm only.", text:"Do not use 395nm lights — too weak to reveal fluorescence differences. The 365nm torch reveals new varnish, repairs, and signatures added after the fact as dark matte patches against a warm green-yellow glow."},
                    {label:"Darken the room completely.", text:"Even dim ambient light washes out UV fluorescence. Do it at night or in a windowless space. Give your eyes 30–60 seconds to adjust before reading the surface."},
                    {label:"Signature added later.", text:"A signature applied after varnishing glows differently — usually brighter white — than paint applied before. Original signatures glow the same warm yellow as surrounding varnished areas."},
                  ])}
                  {guideBlock("Authentication — loupe","#4ADE80",[
                    {label:"10x triplet lens only.", text:"Three fused elements eliminate colour fringing. Higher magnification loses context. This is the auction house standard."},
                    {label:"Halftone dot grid = printed reproduction.", text:"Under 10x magnification, any offset or digital print resolves into a regular dot grid. Genuine brushwork has impasto texture — ridges, loaded marks. Flat plane under the loupe means printed."},
                    {label:"Signature edges.", text:"A genuine hand-signed signature has slightly irregular, feathered edges where the brush or pen met the canvas texture. Printed or stamped signatures have mechanically sharp edges — unmistakable under 10x."},
                  ])}
                  {guideBlock("Where to hunt","#C084FC",[
                    {label:"Estate sales first.", text:"Families rarely know what they have. Show up day one, early. Dealers arrive the night before — you beat them by getting there when the doors open."},
                    {label:"Regional auction houses.", text:"Not Christie's — smaller houses have overlooked lots with low reserves. Search Invaluable.com and Bidsquare for regional auction listings."},
                    {label:"eBay with precision.", text:"Search '[artist name] unsigned' or '[artist name] attributed.' Filter by completed sales to gauge real prices, not asking prices."},
                  ])}
                </>}

                {/* MID-CAREER TIPS */}
                {a.tier==="mid-career" && <>
                  {guideBlock("Buying strategy","#60A5FA",[
                    {label:"Gallery is the default.", text:"If the artist has gallery representation, buy through the gallery. Bypassing them harms the artist and eliminates your provenance chain. The gallery invoice is a legal document."},
                    {label:"Tell them you're not flipping.", text:"Galleries track this obsessively. Explicitly say: 'I collect with a long-term view — I'm not a flipper.' This determines your waitlist position and access to best works."},
                    {label:"Ask for payment plans.", text:"Galleries rarely discount primary market prices — it undermines the artist's market. But they often offer payment plans, first access to future works, or inclusion of a smaller piece."},
                    {label:"Build the relationship first.", text:"Return for more than one show. Galleries track who comes back. Consistent presence signals seriousness. Don't lead with price questions."},
                  ])}
                  {a.medium.toLowerCase().includes("paint") && guideBlock("Identifying a genuine work","#4ADE80",[
                    {label:"Craquelure continuity.", text:"Real age cracks follow the contours of the paint layer — thicker paint cracks differently than thin areas. Under a loupe, genuine crack edges show slightly weathered, rounded profiles. Artificial cracks are too uniform."},
                    {label:"Stretcher bars.", text:"Pre-1940s bars are hand-cut with mortise and tenon joints. Machine-cut uniform bars suggest post-war or later origin. The back of the canvas holds gallery labels, stamps, and inscriptions — never clean the reverse."},
                    {label:"Raking light.", text:"Hold the work at an angle to a single light source. Inpainted (retouched) areas sit slightly above or below the original paint plane — visible as subtle topography invisible in flat lighting."},
                  ])}
                  {(a.medium.toLowerCase().includes("female") || ["Jadé Fadojutimi","Loie Hollowell","Flora Yukhnovich","Issy Wood","Shara Hughes","Mickalene Thomas"].includes(a.name)) && guideBlock("Female artist arbitrage","#F472B6",[
                    {label:"Gap is closing but not closed.", text:"Female artists account for 37% of sales by value in 2026, up from 28% in 2018. At comparable career stages, female artists are still priced below male counterparts. This structural gap is the clearest arbitrage in contemporary art."},
                    {label:"Institutional momentum is real.", text:"Museum acquisition rates for female artists have increased significantly. Each institutional acquisition raises floor prices and validates secondary market positions."},
                  ])}
                  {guideBlock("Documentation checklist","#FBBF24",[
                    {label:"Gallery invoice.", text:"Title, date, medium, dimensions, price, artist name. This is your primary market record and legal provenance document. Never lose it."},
                    {label:"Certificate of Authenticity.", text:"Signed by the gallery and ideally countersigned by the artist. Photographed with the work."},
                    {label:"Condition report.", text:"A written note of any pre-existing condition issues at time of purchase. Protects you on resale."},
                    {label:"Installation photos.", text:"The work hung in its first home adds personal provenance history that increases auction desirability."},
                  ])}
                </>}

                {/* EMERGING TIPS */}
                {a.tier==="emerging" && <>
                  {guideBlock("Pre-gallery signals — act on these","#4ADE80",[
                    {label:"Group show at a commercial gallery.", text:"Not a nonprofit or artist-run space — a commercial gallery. When a gallery includes an unrepresented artist in a group show, they are almost always auditioning them. Buy before the solo show announcement."},
                    {label:"Multiple galleries showing interest.", text:"When you hear the same name from two unrelated gallerists in a short period, the market is forming. Competition for signing accelerates timelines dramatically — move immediately."},
                    {label:"Major prize shortlist.", text:"Turner Prize, Frieze Artist Award, Deutsche Börse Photography Prize, Hugo Boss Prize. Shortlisting alone triggers gallery interest within weeks."},
                    {label:"Institutional acquisition.", text:"When a museum — even a small one — acquires a work, galleries move fast. Artists often quietly mention this on Instagram."},
                  ])}
                  {guideBlock("How to approach the artist directly","#60A5FA",[
                    {label:"Engage genuinely first.", text:"Follow, comment with substance, attend their shows. Don't lead with 'I want to buy.' Lead with real engagement. This takes weeks, not a single DM."},
                    {label:"Request a studio visit.", text:"Normal and expected — artists welcome serious collectors. You see work that hasn't been shown and build the relationship that makes you a priority buyer."},
                    {label:"What to say.", text:"'I've been following your work for a while — [specific series] resonates with me. I'm building a collection with real intention. Would you be open to a studio visit?'"},
                    {label:"Once they sign with a gallery.", text:"Transition to buying through the gallery. Your early collector status gives you waitlist priority and preferential access."},
                  ])}
                  {guideBlock("Documentation — non-negotiable","#FBBF24",[
                    {label:"Signed invoice.", text:"Title, date, medium, dimensions, price. Your provenance starts here."},
                    {label:"Certificate of Authenticity signed by artist.", text:"Essential for any future resale. Get it at point of purchase — harder to obtain later."},
                    {label:"Photograph with the artist.", text:"Documents the relationship and the acquisition. Adds personal provenance history."},
                    {label:"Never buy without these.", text:"An undocumented work from an emerging artist has limited resale value regardless of how good it is."},
                  ])}
                  {guideBlock("Where to find them first","#C084FC",[
                    {label:"MFA thesis shows.", text:"Yale, Columbia, UCLA, Goldsmiths, RCA. The gallerists with clipboards are your competition. Watch who they circle."},
                    {label:"Satellite fairs.", text:"NADA, Untitled Art Fair, Material Art Fair — run alongside Art Basel, Frieze, Armory. Pre-gallery prices."},
                    {label:"Follow gallerists on Instagram.", text:"Watch who mid-tier gallerists follow, like, and comment on. That activity map is live scouting intelligence."},
                    {label:"Nonprofit curators.", text:"The curators at artist-run spaces are the earliest eyes on talent. Ask them directly who's about to break through."},
                  ])}
                </>}

                {/* PRINTS-SPECIFIC TIPS */}
                {printsMediumGuide && guideBlock("Identifying genuine prints","#FB923C",[
                  {label:"Plate marks.", text:"The indentation around an etching or engraving from the printing plate. Genuine impressions have them — reproductions don't."},
                  {label:"No halftone dots.", text:"Under a 10x loupe, offset-printed reproductions show a regular dot grid. Original prints show continuous tonal gradation or hand-drawn lines with no dot pattern."},
                  {label:"Watermarks.", text:"Hold the paper to light. Many papers have watermarks datable to a specific mill and decade. Helps confirm age."},
                  {label:"Edition numbering.", text:"Pencil-signed and numbered prints (e.g. 12/50) were standard post-1880s. Earlier prints often unsigned or stamped in ink. Beware re-strikes from worn plates — they lack the crispness of early impressions."},
                  {label:"Benday dots = reproduction.", text:"Roy Lichtenstein used Benday dots as subject matter — his prints are the exception. For all other artists, dots under magnification mean reproduction."},
                ])}

                {/* PHOTOGRAPHY-SPECIFIC TIPS */}
                {photoMediumGuide && guideBlock("Dating photographic prints","#38BDF8",[
                  {label:"Albumen prints (1850–1900).", text:"Warm sepia tone, thin paper mounted on card, prone to yellowing at edges. Surface slightly shiny."},
                  {label:"Silver gelatin (1880s–1990s).", text:"The dominant 20th-century format. Matte or glossy. Fading patterns and paper stock help narrow the decade. Genuine examples have slight warmth in the blacks — cold, neutral blacks suggest a modern reprint."},
                  {label:"Chromogenic / C-print (1950s–present).", text:"Color prints. Early ones have characteristic color shifts as dyes age — cyan shadows, warm highlights. Modern reprints are too clean."},
                  {label:"Modern paper glows bright blue-white under UV.", text:"Optical brighteners added to paper since the 1950s blaze under UV. An 'early' print blazing bright blue-white is modern paper."},
                  {label:"Photographer's stamp on reverse.", text:"Studio stamps, negative numbers, and agency markings on the back are provenance gold. Never found on reproductions."},
                ])}

                {/* ERA IDENTIFICATION */}
                {guideBlock("Era identification at a glance","#888",[
                  {text:"Pre-1900 — academic realism, dark varnished tones, ornate gilded frames, canvas aging with genuine craquelure."},
                  {text:"1900–1930s — Art Nouveau, Art Deco, Cubism — geometric forms, bold line, flat colour. Linen canvas, hand-cut stretcher bars."},
                  {text:"1940s–50s — Abstract Expressionism, WPA-style. Titanium white first available 1920 — anachronistic in 'pre-war' works."},
                  {text:"1960s–70s — Pop Art, silkscreen, high contrast, saturated colour. Synthetic canvas becomes common."},
                  {text:"1980s–90s — Neo-expressionism, neon palette, conceptual photography. Machine-cut stretcher bars standard."},
                ])}

                <div style={{marginTop:12}}><SaveBtn isFav={artistFavs.includes(a.id)} onToggle={e=>toggle(setArtistFavs)(a.id,e)} /></div>
              </div>
            </div>
          );
        })()}

        {selectedGallery && (
          <div style={S.modal} onClick={()=>setSelectedGallery(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedGallery(null)}>CLOSE X</button>
              <div style={S.stars}>
                <span style={S.starNum}>{selectedGallery.rating}</span>
                <span style={{fontSize:12,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(selectedGallery.rating))}</span>
              </div>
              <div style={{...S.mTitle,marginTop:8}}>{selectedGallery.name}</div>
              <div style={{...S.shopCity,fontSize:12,marginBottom:12}}>{selectedGallery.city}</div>
              <div style={{...S.pills,marginBottom:12}}>
                <span style={{fontSize:9,padding:"4px 9px",borderRadius:99,background:"#1A1A1A",color:"#666",border:"1px solid #222",letterSpacing:"0.06em"}}>{selectedGallery.specialty}</span>
              </div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Address:</span> {selectedGallery.address}<br/>
                {selectedGallery.hours && <><span style={S.mMetaH}>Hours:</span> {selectedGallery.hours}</>}
              </div>
              <div style={S.mDesc}>{selectedGallery.notes}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                <a href={mapsUrl(selectedGallery.address)} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.mapsBtn}} onClick={e=>e.stopPropagation()}> Open in Maps</a>
                {selectedGallery.website && <a href={selectedGallery.website} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.websiteBtn}} onClick={e=>e.stopPropagation()}> Website</a>}
                <SaveBtn isFav={galleryFavs.includes(selectedGallery.id)} onToggle={e=>toggle(setGalleryFavs)(selectedGallery.id,e)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -- BARS SECTION ----------------------------------------------------------
  return (
    <div style={S.app}>
      <Header tabs={[["bars","BARS"]]} activeTab={barTab} onTab={setBarTab} />
      <div style={S.body}>
        <input style={S.search} placeholder="Search name, city, or vibe..." value={barSearch} onChange={e=>setBarSearch(e.target.value)} />
        <div style={S.areaTabs}>{ALL_BAR_AREAS.map(({key,label})=><button key={key} style={S.areaTab(barArea===key)} onClick={()=>setBarArea(key)}>{label}</button>)}</div>
        <div style={S.filterRow}>
          {BAR_TYPES.map(({key,label})=>(
            <button key={key} style={S.toggle(barType===key)} onClick={()=>setBarType(key)}>{label}</button>
          ))}
          <button style={S.toggle(barFavOnly)} onClick={()=>setBarFavOnly(!barFavOnly)}> SAVED</button>
        </div>
        <div style={S.countLine}>{filteredBars.length} / {ALL_BARS.length} BARS</div>
        {filteredBars.map(b=>{
          const open = isOpenNow(b.hours);
          return (
            <div key={b.id} style={S.shopCard} onClick={()=>setSelectedBar(b)}>
              <button style={S.favBtn(barFavs.includes(b.id))} onClick={e=>toggle(setBarFavs)(b.id,e)}>{barFavs.includes(b.id)?"\u2665":"\u2661"}</button>
              <div style={S.shopName}>{b.name}</div>
              <div style={S.shopCity}>{b.city}</div>
              <div style={{...S.pills,marginBottom:7}}>
                <span style={S.typePill(b.type)}>{b.type==="record"?"RECORD BAR":"GREAT BAR"}</span>
                {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
              </div>
              <div style={S.shopNotes}>{b.notes}</div>
              <div style={S.stars}><span style={S.starNum}>{b.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(b.rating))}{"\u2606".repeat(5-Math.floor(b.rating))}</span></div>
            </div>
          );
        })}
      </div>

      {selectedBar && (()=>{
        const open = isOpenNow(selectedBar.hours);
        return (
          <div style={S.modal} onClick={()=>setSelectedBar(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedBar(null)}>CLOSE X</button>
              <div style={S.stars}>
                <span style={S.starNum}>{selectedBar.rating}</span>
                <span style={{fontSize:12,color:"#FBBF24"}}>{"\u2605".repeat(Math.floor(selectedBar.rating))}</span>
                {open !== null && <span style={{...S.openBadge(open),marginLeft:6}}>{open?"OPEN NOW":"CLOSED"}</span>}
              </div>
              <div style={{...S.pills,margin:"8px 0 4px"}}>
                <span style={S.typePill(selectedBar.type)}>{selectedBar.type==="record"?"RECORD BAR":"GREAT BAR"}</span>
              </div>
              <div style={{...S.mTitle,marginTop:8}}>{selectedBar.name}</div>
              <div style={{...S.shopCity,fontSize:12,marginBottom:12}}>{selectedBar.city}</div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Address:</span> {selectedBar.address}<br/>
                {selectedBar.hours && <><span style={S.mMetaH}>Hours:</span> {selectedBar.hours}</>}
              </div>
              <div style={S.mDesc}>{selectedBar.notes}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                <a href={mapsUrl(selectedBar.address)} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.mapsBtn}} onClick={e=>e.stopPropagation()}> Open in Maps</a>
                {selectedBar.website && <a href={selectedBar.website} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.websiteBtn}} onClick={e=>e.stopPropagation()}> Website</a>}
                <SaveBtn isFav={barFavs.includes(selectedBar.id)} onToggle={e=>toggle(setBarFavs)(selectedBar.id,e)} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // This return is never reached -- films section handled below
}

// Films section is inlined via the section === "films" check added to the main component
