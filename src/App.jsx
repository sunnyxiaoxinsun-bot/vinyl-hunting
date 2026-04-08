import { useState, useEffect } from "react";
import { VINYLS, SHOPS, AREAS, ERAS, GENRES, RARITIES } from "./data";

const rarityColor = (r) => {
  if (r === "holy grail") return { bg:"#3D0000", text:"#FF6B6B", border:"#8B0000" };
  if (r === "very rare") return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED" };
  if (r === "rare") return { bg:"#0A1628", text:"#60A5FA", border:"#2563EB" };
  return { bg:"#0A1A0A", text:"#4ADE80", border:"#16A34A" };
};

const eraColor = (era) => {
  const map = { "1930s":"#B45309","1940s":"#92400E","1950s":"#D97706","1960s":"#9333EA","1970s":"#DC2626","1980s":"#2563EB","1990s":"#059669","2000s":"#0891B2","2010s":"#7C3AED","2020s":"#DB2777" };
  return map[era] || "#6B7280";
};

const isOpenNow = (hoursStr) => {
  if (!hoursStr || hoursStr.toLowerCase().includes("check")) return null;
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const hour = now.getHours() + now.getMinutes() / 60;
  const lower = hoursStr.toLowerCase();

  // Parse a time like "11am" or "9pm" to a decimal hour
  const parseTime = (t) => {
    const m = t.trim().match(/^(\d+)(?::(\d+))?(am|pm)$/i);
    if (!m) return null;
    let h = parseInt(m[1]);
    const min = m[2] ? parseInt(m[2]) : 0;
    if (m[3].toLowerCase() === "pm" && h !== 12) h += 12;
    if (m[3].toLowerCase() === "am" && h === 12) h = 0;
    return h + min / 60;
  };

  // Try to find today's range. We look for patterns like "mon–sat 11am–8pm, sun 12pm–6pm"
  const dayNames = ["sun","mon","tue","wed","thu","fri","sat"];
  const todayName = dayNames[day];

  // Split by comma to get segments
  const segments = lower.split(",").map(s => s.trim());
  for (const seg of segments) {
    // Check if this segment covers today
    const rangeMatcher = seg.match(/([a-z]+)[–\-]([a-z]+)/);
    const singleMatcher = seg.match(/^([a-z]+)\s/);
    let covers = false;

    if (rangeMatcher) {
      const start = dayNames.indexOf(rangeMatcher[1]);
      const end = dayNames.indexOf(rangeMatcher[2]);
      if (start !== -1 && end !== -1) {
        covers = start <= end ? (day >= start && day <= end) : (day >= start || day <= end);
      }
    } else if (singleMatcher) {
      covers = dayNames.indexOf(singleMatcher[1]) === day;
    } else if (seg.startsWith("daily")) {
      covers = true;
    }

    if (covers) {
      const timeMatcher = seg.match(/(\d+(?::\d+)?(?:am|pm))[–\-](\d+(?::\d+)?(?:am|pm))/i);
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

export default function App() {
  const [tab, setTab] = useState("hunt");
  const [vinylSearch, setVinylSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [eraFilter, setEraFilter] = useState("All");
  const [genreFilter, setGenreFilter] = useState("All");
  const [rarityFilter, setRarityFilter] = useState("All");
  const [findableOnly, setFindableOnly] = useState(false);
  const [shopArea, setShopArea] = useState("all");
  const [selectedVinyl, setSelectedVinyl] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("shopFavorites") || "[]"); }
    catch { return []; }
  });
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("shopFavorites", JSON.stringify(favorites)); }
    catch {}
  }, [favorites]);

  const toggleFav = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filteredVinyls = VINYLS.filter(v => {
    const s = vinylSearch.toLowerCase();
    return (!s || v.artist.toLowerCase().includes(s) || v.title.toLowerCase().includes(s))
      && (eraFilter === "All" || v.era === eraFilter)
      && (genreFilter === "All" || v.genre.toLowerCase().includes(genreFilter.toLowerCase()))
      && (rarityFilter === "All" || v.rarity === rarityFilter)
      && (!findableOnly || v.findable);
  });

  const filteredShops = SHOPS.filter(s => {
    const q = shopSearch.toLowerCase();
    return (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q))
      && (shopArea === "all" || s.area === shopArea)
      && (!favOnly || favorites.includes(s.id));
  });

  const S = {
    app:{ background:"#0A0A0A", minHeight:"100vh", fontFamily:"'Space Mono','Courier New',monospace", color:"#E5E5E5", maxWidth:480, margin:"0 auto" },
    header:{ background:"#0A0A0A", borderBottom:"1px solid #1E1E1E", padding:"14px 16px 0", position:"sticky", top:0, zIndex:50 },
    logoRow:{ display:"flex", alignItems:"center", gap:10, marginBottom:12 },
    disc:{ width:30, height:30, borderRadius:"50%", background:"radial-gradient(circle at 50% 50%, #FF4444 0%, #FF4444 8%, #0A0A0A 8%, #0A0A0A 20%, #1a1a1a 20%, #1a1a1a 40%, #111 40%, #111 60%, #1a1a1a 60%, #1a1a1a 80%, #111 80%)", border:"2px solid #FF4444", boxShadow:"0 0 10px #FF444455", flexShrink:0 },
    logoText:{ fontSize:17, letterSpacing:"0.06em", color:"#FFF" },
    logoSub:{ fontSize:9, color:"#555", letterSpacing:"0.12em", marginTop:1 },
    tabs:{ display:"flex" },
    tab:(a)=>({ flex:1, padding:"9px 0", fontSize:9, letterSpacing:"0.12em", textAlign:"center", cursor:"pointer", background:"transparent", border:"none", borderBottom:a?"2px solid #FF4444":"2px solid transparent", color:a?"#FF4444":"#555", fontFamily:"inherit", textTransform:"uppercase" }),
    body:{ padding:"14px 14px 80px" },
    search:{ width:"100%", background:"#111", border:"1px solid #222", borderRadius:6, padding:"10px 12px", color:"#E5E5E5", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 },
    filterRow:{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" },
    sel:{ background:"#111", border:"1px solid #222", borderRadius:4, color:"#CCC", fontSize:9, padding:"6px 6px", fontFamily:"inherit", outline:"none", cursor:"pointer", letterSpacing:"0.04em" },
    toggle:(on)=>({ background:on?"#FF4444":"#111", border:`1px solid ${on?"#FF4444":"#222"}`, borderRadius:4, color:on?"#000":"#555", fontSize:9, padding:"6px 8px", fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.06em" }),
    countLine:{ fontSize:9, color:"#444", letterSpacing:"0.1em", marginBottom:10 },
    card:{ background:"#111", border:"1px solid #1E1E1E", borderRadius:8, padding:"12px", marginBottom:7, cursor:"pointer" },
    rank:{ fontSize:9, color:"#333", letterSpacing:"0.1em", marginBottom:3 },
    cardTitle:{ fontSize:14, color:"#FFF", marginBottom:2, lineHeight:1.3 },
    cardSub:{ fontSize:11, color:"#666", marginBottom:8 },
    pills:{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" },
    pill:(r)=>({ fontSize:8, padding:"3px 7px", borderRadius:99, background:rarityColor(r).bg, color:rarityColor(r).text, border:`1px solid ${rarityColor(r).border}`, letterSpacing:"0.08em", textTransform:"uppercase" }),
    era:(e)=>({ fontSize:8, padding:"3px 7px", borderRadius:99, background:eraColor(e)+"22", color:eraColor(e), border:`1px solid ${eraColor(e)}44` }),
    findPill:{ fontSize:8, padding:"3px 7px", borderRadius:99, background:"#0A2A0A", color:"#4ADE80", border:"1px solid #16A34A44" },
    modal:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:100, display:"flex", alignItems:"flex-end" },
    modalBox:{ background:"#111", borderRadius:"16px 16px 0 0", padding:"20px 18px 36px", width:"100%", maxWidth:480, margin:"0 auto", maxHeight:"88vh", overflowY:"auto" },
    closeBtn:{ float:"right", background:"#1E1E1E", border:"none", color:"#666", borderRadius:4, padding:"5px 10px", cursor:"pointer", fontFamily:"inherit", fontSize:11 },
    mRank:{ fontSize:10, color:"#444", letterSpacing:"0.12em", marginBottom:5 },
    mTitle:{ fontSize:19, color:"#FFF", marginBottom:4, lineHeight:1.2 },
    mArtist:{ fontSize:13, color:"#777", marginBottom:12 },
    mMeta:{ background:"#0A0A0A", borderRadius:6, padding:"10px 12px", marginBottom:12, fontSize:12, color:"#666", lineHeight:1.9 },
    mMetaH:{ color:"#CCC" },
    mDesc:{ fontSize:13, color:"#999", lineHeight:1.75, marginBottom:12 },
    mValue:{ background:"#0A1A0A", border:"1px solid #16A34A33", borderRadius:6, padding:"10px 12px", fontSize:12, color:"#4ADE80" },
    shopCard:{ background:"#111", border:"1px solid #1E1E1E", borderRadius:8, padding:"12px", marginBottom:7, cursor:"pointer", position:"relative" },
    shopName:{ fontSize:14, color:"#FFF", marginBottom:2, paddingRight:28 },
    shopCity:{ fontSize:10, color:"#FF4444", marginBottom:6, letterSpacing:"0.07em" },
    shopNotes:{ fontSize:12, color:"#777", lineHeight:1.55 },
    stars:{ display:"flex", gap:3, alignItems:"center", marginTop:6 },
    starNum:{ fontSize:11, color:"#FBBF24" },
    areaTabs:{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" },
    areaTab:(a)=>({ padding:"5px 10px", borderRadius:99, fontSize:8, letterSpacing:"0.08em", cursor:"pointer", background:a?"#FF4444":"#111", color:a?"#000":"#555", border:a?"1px solid #FF4444":"1px solid #222", fontFamily:"inherit", textTransform:"uppercase" }),
    favBtn:(on)=>({ position:"absolute", top:10, right:10, background:"transparent", border:"none", fontSize:16, cursor:"pointer", color:on?"#FF4444":"#333", padding:2 }),
    openBadge:(open)=>({ fontSize:8, padding:"3px 7px", borderRadius:99, background:open?"#0A2A0A":"#1A0A0A", color:open?"#4ADE80":"#666", border:`1px solid ${open?"#16A34A44":"#33111144"}`, letterSpacing:"0.08em" }),
    actionBtn:{ display:"inline-flex", alignItems:"center", gap:5, fontSize:10, padding:"7px 12px", borderRadius:5, cursor:"pointer", fontFamily:"inherit", border:"none", letterSpacing:"0.06em", textDecoration:"none" },
    mapsBtn:{ background:"#1A1A2E", color:"#60A5FA", border:"1px solid #2563EB44" },
    websiteBtn:{ background:"#1A1A1A", color:"#CCC", border:"1px solid #333" },
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div style={S.logoRow}>
          <div style={S.disc} />
          <div>
            <div style={S.logoText}>VINYL HUNTER</div>
            <div style={S.logoSub}>COLLECTOR'S FIELD GUIDE · WORLDWIDE</div>
          </div>
        </div>
        <div style={S.tabs}>
          {[["hunt","THE 500"],["shops","SHOPS"]].map(([k,l])=>(
            <button key={k} style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={S.body}>
        {tab==="hunt" && <>
          <input style={S.search} placeholder="Search artist or title..." value={vinylSearch} onChange={e=>setVinylSearch(e.target.value)} />
          <div style={S.filterRow}>
            <select style={S.sel} value={eraFilter} onChange={e=>setEraFilter(e.target.value)}>
              {ERAS.map(e=><option key={e}>{e}</option>)}
            </select>
            <select style={S.sel} value={genreFilter} onChange={e=>setGenreFilter(e.target.value)}>
              {GENRES.map(g=><option key={g}>{g}</option>)}
            </select>
            <select style={S.sel} value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}>
              {RARITIES.map(r=><option key={r} value={r}>{r==="All"?"All rarities":r}</option>)}
            </select>
            <button style={S.toggle(findableOnly)} onClick={()=>setFindableOnly(!findableOnly)}>FINDABLE</button>
          </div>
          <div style={S.countLine}>{filteredVinyls.length} / {VINYLS.length} RECORDS</div>
          {filteredVinyls.map(v=>(
            <div key={v.id} style={S.card} onClick={()=>setSelectedVinyl(v)}>
              <div style={S.rank}>#{v.rank}</div>
              <div style={S.cardTitle}>{v.title}</div>
              <div style={S.cardSub}>{v.artist} · {v.label} · {v.year}</div>
              <div style={S.pills}>
                <span style={S.pill(v.rarity)}>{v.rarity}</span>
                <span style={S.era(v.era)}>{v.era}</span>
                <span style={{fontSize:8,color:"#444"}}>{v.genre}</span>
                {v.findable && <span style={S.findPill}>CRATE-FINDABLE</span>}
              </div>
            </div>
          ))}
        </>}

        {tab==="shops" && <>
          <input style={S.search} placeholder="Search name, city, or genre..." value={shopSearch} onChange={e=>setShopSearch(e.target.value)} />
          <div style={S.areaTabs}>
            {AREAS.map(({key,label})=>(
              <button key={key} style={S.areaTab(shopArea===key)} onClick={()=>setShopArea(key)}>{label}</button>
            ))}
          </div>
          <div style={S.filterRow}>
            <button style={S.toggle(favOnly)} onClick={()=>setFavOnly(!favOnly)}>♥ SAVED</button>
          </div>
          <div style={S.countLine}>{filteredShops.length} / {SHOPS.length} SHOPS</div>
          {filteredShops.map(s=>{
            const open = isOpenNow(s.hours);
            return (
              <div key={s.id} style={S.shopCard} onClick={()=>setSelectedShop(s)}>
                <button style={S.favBtn(favorites.includes(s.id))} onClick={e=>toggleFav(s.id,e)}>
                  {favorites.includes(s.id) ? "♥" : "♡"}
                </button>
                <div style={S.shopName}>{s.name}</div>
                <div style={S.shopCity}>{s.city}</div>
                <div style={{...S.pills, marginBottom:7}}>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                  {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                </div>
                <div style={S.shopNotes}>{s.notes}</div>
                <div style={S.stars}>
                  <span style={S.starNum}>{s.rating}</span>
                  <span style={{fontSize:11,color:"#FBBF24"}}>{"★".repeat(Math.floor(s.rating))}{"☆".repeat(5-Math.floor(s.rating))}</span>
                </div>
              </div>
            );
          })}
        </>}
      </div>

      {selectedVinyl && (
        <div style={S.modal} onClick={()=>setSelectedVinyl(null)}>
          <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
            <button style={S.closeBtn} onClick={()=>setSelectedVinyl(null)}>CLOSE ✕</button>
            <div style={S.mRank}>#{selectedVinyl.rank} OF {VINYLS.length}</div>
            <div style={S.mTitle}>{selectedVinyl.title}</div>
            <div style={S.mArtist}>{selectedVinyl.artist}</div>
            <div style={{...S.pills, marginBottom:12}}>
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
            <div style={S.mValue}>💰 Value range: {selectedVinyl.value}</div>
          </div>
        </div>
      )}

      {selectedShop && (()=>{
        const open = isOpenNow(selectedShop.hours);
        return (
          <div style={S.modal} onClick={()=>setSelectedShop(null)}>
            <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
              <button style={S.closeBtn} onClick={()=>setSelectedShop(null)}>CLOSE ✕</button>
              <div style={S.stars}>
                <span style={S.starNum}>{selectedShop.rating}</span>
                <span style={{fontSize:12,color:"#FBBF24"}}>{"★".repeat(Math.floor(selectedShop.rating))}</span>
                {open !== null && <span style={{...S.openBadge(open), marginLeft:6}}>{open?"OPEN NOW":"CLOSED"}</span>}
              </div>
              <div style={{...S.mTitle, marginTop:8}}>{selectedShop.name}</div>
              <div style={{...S.shopCity, fontSize:12, marginBottom:12}}>{selectedShop.city}</div>
              <div style={{...S.pills, marginBottom:12}}>
                <span style={{fontSize:9,padding:"4px 9px",borderRadius:99,background:"#1A1A1A",color:"#666",border:"1px solid #222",letterSpacing:"0.06em"}}>{selectedShop.specialty}</span>
              </div>
              <div style={S.mMeta}>
                <span style={S.mMetaH}>Address:</span> {selectedShop.address}<br/>
                {selectedShop.phone && <><span style={S.mMetaH}>Phone:</span> {selectedShop.phone}<br/></>}
                {selectedShop.hours && <><span style={S.mMetaH}>Hours:</span> {selectedShop.hours}</>}
              </div>
              <div style={S.mDesc}>{selectedShop.notes}</div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:4}}>
                <a
                  href={mapsUrl(selectedShop.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{...S.actionBtn, ...S.mapsBtn}}
                  onClick={e=>e.stopPropagation()}
                >
                  📍 Open in Maps
                </a>
                {selectedShop.website && (
                  <a
                    href={selectedShop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{...S.actionBtn, ...S.websiteBtn}}
                    onClick={e=>e.stopPropagation()}
                  >
                    🌐 Website
                  </a>
                )}
                <button
                  style={{...S.actionBtn, background: favorites.includes(selectedShop.id)?"#3D0000":"#1A1A1A", color: favorites.includes(selectedShop.id)?"#FF6B6B":"#777", border: favorites.includes(selectedShop.id)?"1px solid #8B000044":"1px solid #333"}}
                  onClick={e=>toggleFav(selectedShop.id,e)}
                >
                  {favorites.includes(selectedShop.id) ? "♥ Saved" : "♡ Save"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

