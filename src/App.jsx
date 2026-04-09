import { useState, useEffect } from "react";
import { VINYLS, SHOPS, AREAS, ERAS, GENRES, RARITIES } from "./data";
import { VINTAGE, VSTORES, VSTORE_AREAS, VINTAGE_CATEGORIES, VINTAGE_ERAS, VINTAGE_RARITIES } from "./vintage";
import { BARS, BAR_AREAS, BAR_TYPES } from "./bars";
import { BARS_LATAM, LATAM_AREAS } from "./bars_latam";

const ALL_BARS = [...BARS, ...BARS_LATAM];
const ALL_BAR_AREAS = [
  ...BAR_AREAS,
  ...LATAM_AREAS,
];
import { FILMS, THEATERS, THEATER_AREAS, FILM_ERAS, FILM_GENRES, FILM_COUNTRIES, FILM_RARITIES } from "./films";

const rarityColor = (r) => {
  if (r === "holy grail") return { bg:"#3D0000", text:"#FF6B6B", border:"#8B0000" };
  if (r === "very rare")  return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED" };
  if (r === "rare")       return { bg:"#0A1628", text:"#60A5FA", border:"#2563EB" };
  return { bg:"#0A1A0A", text:"#4ADE80", border:"#16A34A" };
};

const eraColor = (era) => {
  const map = { "1930s":"#B45309","1930s-40s":"#B45309","1940s":"#92400E","1950s-60s":"#D97706","1950s":"#D97706","1960s":"#9333EA","1970s":"#DC2626","1980s":"#2563EB","1990s":"#059669","2000s":"#0891B2","2010s":"#7C3AED","2020s":"#DB2777" };
  return map[era] || "#6B7280";
};

const isOpenNow = (hoursStr) => {
  if (!hoursStr || hoursStr.toLowerCase().includes("check")) return null;
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
  const [filmRarityFilter, setFilmRarityFilter] = useState("All");
  const [filmFindableOnly, setFilmFindableOnly] = useState(false);
  const [filmFavOnly, setFilmFavOnly] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [theaterSearch, setTheaterSearch] = useState("");
  const [theaterArea, setTheaterArea] = useState("all");
  const [theaterFavOnly, setTheaterFavOnly] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState(null);

  // favorites
  const [shopFavs,    setShopFavs]    = useState(() => { try { return JSON.parse(localStorage.getItem("shopFavs")||"[]");    } catch { return []; } });
  const [vinylFavs,   setVinylFavs]   = useState(() => { try { return JSON.parse(localStorage.getItem("vinylFavs")||"[]");   } catch { return []; } });
  const [vintageFavs, setVintageFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("vintageFavs")||"[]"); } catch { return []; } });
  const [vstoreFavs,  setVstoreFavs]  = useState(() => { try { return JSON.parse(localStorage.getItem("vstoreFavs")||"[]");  } catch { return []; } });
  const [barFavs,     setBarFavs]     = useState(() => { try { return JSON.parse(localStorage.getItem("barFavs")||"[]");     } catch { return []; } });
  const [filmFavs,    setFilmFavs]    = useState(() => { try { return JSON.parse(localStorage.getItem("filmFavs")||"[]");    } catch { return []; } });
  const [theaterFavs, setTheaterFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("theaterFavs")||"[]"); } catch { return []; } });

  useEffect(() => { try { localStorage.setItem("shopFavs",    JSON.stringify(shopFavs));    } catch {} }, [shopFavs]);
  useEffect(() => { try { localStorage.setItem("vinylFavs",   JSON.stringify(vinylFavs));   } catch {} }, [vinylFavs]);
  useEffect(() => { try { localStorage.setItem("vintageFavs", JSON.stringify(vintageFavs)); } catch {} }, [vintageFavs]);
  useEffect(() => { try { localStorage.setItem("vstoreFavs",  JSON.stringify(vstoreFavs));  } catch {} }, [vstoreFavs]);
  useEffect(() => { try { localStorage.setItem("barFavs",     JSON.stringify(barFavs));     } catch {} }, [barFavs]);
  useEffect(() => { try { localStorage.setItem("filmFavs",    JSON.stringify(filmFavs));    } catch {} }, [filmFavs]);
  useEffect(() => { try { localStorage.setItem("theaterFavs", JSON.stringify(theaterFavs)); } catch {} }, [theaterFavs]);

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

  const filteredFilms = FILMS.filter(f => {
    const s = filmSearch.toLowerCase();
    return (!s || f.title.toLowerCase().includes(s) || f.director.toLowerCase().includes(s) || f.country.toLowerCase().includes(s))
      && (filmEraFilter==="All" || f.era===filmEraFilter)
      && (filmGenreFilter==="All" || f.genre.toLowerCase().includes(filmGenreFilter.toLowerCase()))
      && (filmCountryFilter==="All" || f.country.toLowerCase().includes(filmCountryFilter.toLowerCase()))
      && (filmRarityFilter==="All" || f.rarity===filmRarityFilter)
      && (!filmFindableOnly || f.findable)
      && (!filmFavOnly || filmFavs.includes(f.id));
  });

  const filteredTheaters = THEATERS.filter(t => {
    const q = theaterSearch.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
      && (theaterArea==="all" || t.area===theaterArea)
      && (!theaterFavOnly || theaterFavs.includes(t.id));
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
      {isFav ? " Saved" : " Save"}
    </button>
  );

  const ShopModal = ({ shop, favs, favSetter, onClose }) => {
    const open = isOpenNow(shop.hours);
    return (
      <div style={S.modal} onClick={onClose}>
        <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
          <button style={S.closeBtn} onClick={onClose}>CLOSE </button>
          <div style={S.stars}>
            <span style={S.starNum}>{shop.rating}</span>
            <span style={{fontSize:12,color:"#FBBF24"}}>{"".repeat(Math.floor(shop.rating))}</span>
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
              <div style={S.sectionCardSub}>Top 300 films by era{"\n"}Independent theaters worldwide</div>
              <div style={S.sectionCount}>{FILMS.length} films  {THEATERS.length} theaters</div>
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
              <select style={S.sel} value={eraFilter} onChange={e=>setEraFilter(e.target.value)}>{ERAS.map(e=><option key={e}>{e}</option>)}</select>
              <select style={S.sel} value={genreFilter} onChange={e=>setGenreFilter(e.target.value)}>{GENRES.map(g=><option key={g}>{g}</option>)}</select>
              <select style={S.sel} value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}>{RARITIES.map(r=><option key={r} value={r}>{r==="All"?"All rarities":r}</option>)}</select>
              <button style={S.toggle(findableOnly)} onClick={()=>setFindableOnly(!findableOnly)}>FINDABLE</button>
              <button style={S.toggle(vinylFavOnly)} onClick={()=>setVinylFavOnly(!vinylFavOnly)}> SAVED</button>
            </div>
            <div style={S.countLine}>{filteredVinyls.length} / {VINYLS.length} RECORDS</div>
            {filteredVinyls.map(v=>(
              <div key={v.id} style={S.card} onClick={()=>setSelectedVinyl(v)}>
                <button style={S.favBtn(vinylFavs.includes(v.id))} onClick={e=>toggle(setVinylFavs)(v.id,e)}>{vinylFavs.includes(v.id)?"":""}</button>
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
                  <button style={S.favBtn(shopFavs.includes(s.id))} onClick={e=>toggle(setShopFavs)(s.id,e)}>{shopFavs.includes(s.id)?"":""}</button>
                  <div style={S.shopName}>{s.name}</div>
                  <div style={S.shopCity}>{s.city}</div>
                  <div style={{...S.pills,marginBottom:7}}>
                    <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                    {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                  </div>
                  <div style={S.shopNotes}>{s.notes}</div>
                  <div style={S.stars}><span style={S.starNum}>{s.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"".repeat(Math.floor(s.rating))}{"".repeat(5-Math.floor(s.rating))}</span></div>
                </div>
              );
            })}
          </>}
        </div>

        {selectedVinyl && (
          <div style={S.modal} onClick={()=>setSelectedVinyl(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedVinyl(null)}>CLOSE </button>
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
              <select style={S.sel} value={vCatFilter} onChange={e=>setVCatFilter(e.target.value)}>{VINTAGE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
              <select style={S.sel} value={vEraFilter} onChange={e=>setVEraFilter(e.target.value)}>{VINTAGE_ERAS.map(e=><option key={e}>{e}</option>)}</select>
              <select style={S.sel} value={vRarFilter} onChange={e=>setVRarFilter(e.target.value)}>{VINTAGE_RARITIES.map(r=><option key={r} value={r}>{r==="All"?"All rarities":r}</option>)}</select>
              <button style={S.toggle(vFindableOnly)} onClick={()=>setVFindableOnly(!vFindableOnly)}>FINDABLE</button>
              <button style={S.toggle(vFavOnly)} onClick={()=>setVFavOnly(!vFavOnly)}> SAVED</button>
            </div>
            <div style={S.countLine}>{filteredVintage.length} / {VINTAGE.length} PIECES</div>
            {filteredVintage.map(v=>(
              <div key={v.id} style={S.card} onClick={()=>setSelectedVintage(v)}>
                <button style={S.favBtn(vintageFavs.includes(v.id))} onClick={e=>toggle(setVintageFavs)(v.id,e)}>{vintageFavs.includes(v.id)?"":""}</button>
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
                  <button style={S.favBtn(vstoreFavs.includes(s.id))} onClick={e=>toggle(setVstoreFavs)(s.id,e)}>{vstoreFavs.includes(s.id)?"":""}</button>
                  <div style={S.shopName}>{s.name}</div>
                  <div style={S.shopCity}>{s.city}</div>
                  <div style={{...S.pills,marginBottom:7}}>
                    <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                    {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                  </div>
                  <div style={S.shopNotes}>{s.notes}</div>
                  <div style={S.stars}><span style={S.starNum}>{s.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"".repeat(Math.floor(s.rating))}{"".repeat(5-Math.floor(s.rating))}</span></div>
                </div>
              );
            })}
          </>}
        </div>

        {selectedVintage && (
          <div style={S.modal} onClick={()=>setSelectedVintage(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedVintage(null)}>CLOSE </button>
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
    const filmRarityBadge = (r) => {
      if (r === "very rare") return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED" };
      if (r === "cult")      return { bg:"#1A0A14", text:"#F472B6", border:"#BE185D" };
      return { bg:"#0A1A0A", text:"#4ADE80", border:"#16A34A" };
    };
    return (
      <div style={S.app}>
        <Header tabs={[["films","FILMS"],["theaters","THEATERS"]]} activeTab={filmTab} onTab={setFilmTab} />
        <div style={S.body}>

          {filmTab==="films" && <>
            <input style={S.search} placeholder="Search title, director, or country..." value={filmSearch} onChange={e=>setFilmSearch(e.target.value)} />
            <div style={S.filterRow}>
              <select style={S.sel} value={filmEraFilter} onChange={e=>setFilmEraFilter(e.target.value)}>{FILM_ERAS.map(e=><option key={e}>{e}</option>)}</select>
              <select style={S.sel} value={filmGenreFilter} onChange={e=>setFilmGenreFilter(e.target.value)}>{FILM_GENRES.map(g=><option key={g}>{g}</option>)}</select>
              <select style={S.sel} value={filmCountryFilter} onChange={e=>setFilmCountryFilter(e.target.value)}>{FILM_COUNTRIES.map(c=><option key={c}>{c}</option>)}</select>
              <select style={S.sel} value={filmRarityFilter} onChange={e=>setFilmRarityFilter(e.target.value)}>{FILM_RARITIES.map(r=><option key={r} value={r}>{r==="All"?"All":r}</option>)}</select>
              <button style={S.toggle(filmFindableOnly)} onClick={()=>setFilmFindableOnly(!filmFindableOnly)}>FINDABLE</button>
              <button style={S.toggle(filmFavOnly)} onClick={()=>setFilmFavOnly(!filmFavOnly)}> SAVED</button>
            </div>
            <div style={S.countLine}>{filteredFilms.length} / {FILMS.length} FILMS</div>
            {filteredFilms.map(f=>(
              <div key={f.id} style={S.card} onClick={()=>setSelectedFilm(f)}>
                <button style={S.favBtn(filmFavs.includes(f.id))} onClick={e=>toggle(setFilmFavs)(f.id,e)}>{filmFavs.includes(f.id)?"":""}</button>
                <div style={S.rank}>#{f.rank}</div>
                <div style={S.cardTitle}>{f.title}</div>
                <div style={S.cardSub}>{f.director}  {f.year}  {f.country}</div>
                <div style={S.pills}>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:filmRarityBadge(f.rarity).bg,color:filmRarityBadge(f.rarity).text,border:`1px solid ${filmRarityBadge(f.rarity).border}`,letterSpacing:"0.08em",textTransform:"uppercase"}}>{f.rarity}</span>
                  <span style={S.era(f.era)}>{f.era}</span>
                  <span style={{fontSize:8,color:"#444"}}>{f.genre}</span>
                  {f.findable && <span style={S.findPill}>IN REP CINEMA</span>}
                </div>
              </div>
            ))}
          </>}

          {filmTab==="theaters" && <>
            <input style={S.search} placeholder="Search name, city, or notes..." value={theaterSearch} onChange={e=>setTheaterSearch(e.target.value)} />
            <div style={S.areaTabs}>{THEATER_AREAS.map(({key,label})=><button key={key} style={S.areaTab(theaterArea===key)} onClick={()=>setTheaterArea(key)}>{label}</button>)}</div>
            <div style={S.filterRow}><button style={S.toggle(theaterFavOnly)} onClick={()=>setTheaterFavOnly(!theaterFavOnly)}> SAVED</button></div>
            <div style={S.countLine}>{filteredTheaters.length} / {THEATERS.length} THEATERS</div>
            {filteredTheaters.map(t=>(
              <div key={t.id} style={S.shopCard} onClick={()=>setSelectedTheater(t)}>
                <button style={S.favBtn(theaterFavs.includes(t.id))} onClick={e=>toggle(setTheaterFavs)(t.id,e)}>{theaterFavs.includes(t.id)?"":""}</button>
                <div style={S.shopName}>{t.name}</div>
                <div style={S.shopCity}>{t.city}</div>
                <div style={S.shopNotes}>{t.notes}</div>
                <div style={S.stars}><span style={S.starNum}>{t.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"".repeat(Math.floor(t.rating))}{"".repeat(5-Math.floor(t.rating))}</span></div>
              </div>
            ))}
          </>}
        </div>

        {selectedFilm && (
          <div style={S.modal} onClick={()=>setSelectedFilm(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedFilm(null)}>CLOSE </button>
              <div style={S.mRank}>#{selectedFilm.rank} OF {FILMS.length}</div>
              <div style={S.mTitle}>{selectedFilm.title}</div>
              <div style={S.mArtist}>{selectedFilm.director}</div>
              <div style={{...S.pills,marginBottom:12}}>
                <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:filmRarityBadge(selectedFilm.rarity).bg,color:filmRarityBadge(selectedFilm.rarity).text,border:`1px solid ${filmRarityBadge(selectedFilm.rarity).border}`,letterSpacing:"0.08em",textTransform:"uppercase"}}>{selectedFilm.rarity}</span>
                <span style={S.era(selectedFilm.era)}>{selectedFilm.era}</span>
                {selectedFilm.findable && <span style={S.findPill}>IN REP CINEMA</span>}
              </div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Year:</span> {selectedFilm.year}<br/>
                <span style={S.mMetaH}>Country:</span> {selectedFilm.country}<br/>
                <span style={S.mMetaH}>Genre:</span> {selectedFilm.genre}<br/>
                <span style={S.mMetaH}>Where to see:</span> {selectedFilm.value}
              </div>
              <div style={S.mDesc}>{selectedFilm.description}</div>
              <div style={{marginTop:12}}><SaveBtn isFav={filmFavs.includes(selectedFilm.id)} onToggle={e=>toggle(setFilmFavs)(selectedFilm.id,e)} /></div>
            </div>
          </div>
        )}

        {selectedTheater && (
          <div style={S.modal} onClick={()=>setSelectedTheater(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedTheater(null)}>CLOSE </button>
              <div style={S.stars}>
                <span style={S.starNum}>{selectedTheater.rating}</span>
                <span style={{fontSize:12,color:"#FBBF24"}}>{"".repeat(Math.floor(selectedTheater.rating))}</span>
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
              <button style={S.favBtn(barFavs.includes(b.id))} onClick={e=>toggle(setBarFavs)(b.id,e)}>{barFavs.includes(b.id)?"":""}</button>
              <div style={S.shopName}>{b.name}</div>
              <div style={S.shopCity}>{b.city}</div>
              <div style={{...S.pills,marginBottom:7}}>
                <span style={S.typePill(b.type)}>{b.type==="record"?"RECORD BAR":"GREAT BAR"}</span>
                {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
              </div>
              <div style={S.shopNotes}>{b.notes}</div>
              <div style={S.stars}><span style={S.starNum}>{b.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"".repeat(Math.floor(b.rating))}{"".repeat(5-Math.floor(b.rating))}</span></div>
            </div>
          );
        })}
      </div>

      {selectedBar && (()=>{
        const open = isOpenNow(selectedBar.hours);
        return (
          <div style={S.modal} onClick={()=>setSelectedBar(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedBar(null)}>CLOSE </button>
              <div style={S.stars}>
                <span style={S.starNum}>{selectedBar.rating}</span>
                <span style={{fontSize:12,color:"#FBBF24"}}>{"".repeat(Math.floor(selectedBar.rating))}</span>
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
