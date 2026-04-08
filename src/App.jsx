import { useState, useEffect } from "react";
import { VINYLS, SHOPS, AREAS, ERAS, GENRES, RARITIES } from "./data";
import { VINTAGE, VSTORES, VSTORE_AREAS, VINTAGE_CATEGORIES, VINTAGE_ERAS, VINTAGE_RARITIES } from "./vintage";

const rarityColor = (r) => {
  if (r === "holy grail") return { bg:"#3D0000", text:"#FF6B6B", border:"#8B0000" };
  if (r === "very rare") return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED" };
  if (r === "rare") return { bg:"#0A1628", text:"#60A5FA", border:"#2563EB" };
  return { bg:"#0A1A0A", text:"#4ADE80", border:"#16A34A" };
};

const eraColor = (era) => {
  const map = { "1930s":"#B45309","1930s–40s":"#B45309","1940s":"#92400E","1950s–60s":"#D97706","1950s":"#D97706","1960s":"#9333EA","1970s":"#DC2626","1980s":"#2563EB","1990s":"#059669","2000s":"#0891B2","2010s":"#7C3AED","2020s":"#DB2777" };
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
    const rangeMatcher = seg.match(/([a-z]+)[–\-]([a-z]+)/);
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

  const [shopFavs, setShopFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("shopFavs")||"[]"); } catch { return []; } });
  const [vinylFavs, setVinylFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("vinylFavs")||"[]"); } catch { return []; } });
  const [vintageFavs, setVintageFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("vintageFavs")||"[]"); } catch { return []; } });
  const [vstoreFavs, setVstoreFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("vstoreFavs")||"[]"); } catch { return []; } });

  useEffect(() => { try { localStorage.setItem("shopFavs", JSON.stringify(shopFavs)); } catch {} }, [shopFavs]);
  useEffect(() => { try { localStorage.setItem("vinylFavs", JSON.stringify(vinylFavs)); } catch {} }, [vinylFavs]);
  useEffect(() => { try { localStorage.setItem("vintageFavs", JSON.stringify(vintageFavs)); } catch {} }, [vintageFavs]);
  useEffect(() => { try { localStorage.setItem("vstoreFavs", JSON.stringify(vstoreFavs)); } catch {} }, [vstoreFavs]);

  const toggle = (setter) => (id, e) => {
    e.stopPropagation();
    setter(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

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

  const S = {
    app:{ background:"#0A0A0A", minHeight:"100vh", fontFamily:"'Space Mono','Courier New',monospace", color:"#E5E5E5", maxWidth:480, margin:"0 auto" },
    header:{ background:"#0A0A0A", borderBottom:"1px solid #1E1E1E", padding:"14px 16px 0", position:"sticky", top:0, zIndex:50 },
    logoRow:{ display:"flex", alignItems:"center", gap:10, marginBottom:12 },
    disc:{ width:30, height:30, borderRadius:"50%", background:"radial-gradient(circle at 50% 50%, #FF4444 0%, #FF4444 8%, #0A0A0A 8%, #0A0A0A 20%, #1a1a1a 20%, #1a1a1a 40%, #111 40%, #111 60%, #1a1a1a 60%, #1a1a1a 80%, #111 80%)", border:"2px solid #FF4444", boxShadow:"0 0 10px #FF444455", flexShrink:0 },
    logoText:{ fontSize:17, letterSpacing:"0.06em", color:"#FFF" },
    logoSub:{ fontSize:9, color:"#555", letterSpacing:"0.12em", marginTop:1 },
    tabs:{ display:"flex" },
    tab:(a)=>({ flex:1, padding:"9px 0", fontSize:8, letterSpacing:"0.1em", textAlign:"center", cursor:"pointer", background:"transparent", border:"none", borderBottom:a?"2px solid #FF4444":"2px solid transparent", color:a?"#FF4444":"#555", fontFamily:"inherit", textTransform:"uppercase" }),
    body:{ padding:"14px 14px 80px" },
    search:{ width:"100%", background:"#111", border:"1px solid #222", borderRadius:6, padding:"10px 12px", color:"#E5E5E5", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 },
    filterRow:{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" },
    sel:{ background:"#111", border:"1px solid #222", borderRadius:4, color:"#CCC", fontSize:9, padding:"6px 6px", fontFamily:"inherit", outline:"none", cursor:"pointer", letterSpacing:"0.04em" },
    toggle:(on)=>({ background:on?"#FF4444":"#111", border:`1px solid ${on?"#FF4444":"#222"}`, borderRadius:4, color:on?"#000":"#555", fontSize:9, padding:"6px 8px", fontFamily:"inherit", cursor:"pointer", letterSpacing:"0.06em" }),
    countLine:{ fontSize:9, color:"#444", letterSpacing:"0.1em", marginBottom:10 },
    card:{ background:"#111", border:"1px solid #1E1E1E", borderRadius:8, padding:"12px", marginBottom:7, cursor:"pointer", position:"relative" },
    rank:{ fontSize:9, color:"#333", letterSpacing:"0.1em", marginBottom:3 },
    cardTitle:{ fontSize:14, color:"#FFF", marginBottom:2, lineHeight:1.3, paddingRight:24 },
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

  const SaveBtn = ({ isFav, onToggle }) => (
    <button style={{...S.actionBtn, background:isFav?"#3D0000":"#1A1A1A", color:isFav?"#FF6B6B":"#777", border:isFav?"1px solid #8B000044":"1px solid #333"}} onClick={onToggle}>
      {isFav ? "♥ Saved" : "♡ Save"}
    </button>
  );

  const ShopModal = ({ shop, favs, favSetter, onClose }) => {
    const open = isOpenNow(shop.hours);
    return (
      <div style={S.modal} onClick={onClose}>
        <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
          <button style={S.closeBtn} onClick={onClose}>CLOSE ✕</button>
          <div style={S.stars}>
            <span style={S.starNum}>{shop.rating}</span>
            <span style={{fontSize:12,color:"#FBBF24"}}>{"★".repeat(Math.floor(shop.rating))}</span>
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
            <a href={mapsUrl(shop.address)} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.mapsBtn}} onClick={e=>e.stopPropagation()}>📍 Open in Maps</a>
            {shop.website && <a href={shop.website} target="_blank" rel="noopener noreferrer" style={{...S.actionBtn,...S.websiteBtn}} onClick={e=>e.stopPropagation()}>🌐 Website</a>}
            <SaveBtn isFav={favs.includes(shop.id)} onToggle={e=>toggle(favSetter)(shop.id,e)} />
          </div>
        </div>
      </div>
    );
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
          {[["hunt","RECORDS"],["shops","REC SHOPS"],["vintage","TOP 100"],["vstores","VINTAGE"]].map(([k,l])=>(
            <button key={k} style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={S.body}>

        {tab==="hunt" && <>
          <input style={S.search} placeholder="Search artist or title..." value={vinylSearch} onChange={e=>setVinylSearch(e.target.value)} />
          <div style={S.filterRow}>
            <select style={S.sel} value={eraFilter} onChange={e=>setEraFilter(e.target.value)}>{ERAS.map(e=><option key={e}>{e}</option>)}</select>
            <select style={S.sel} value={genreFilter} onChange={e=>setGenreFilter(e.target.value)}>{GENRES.map(g=><option key={g}>{g}</option>)}</select>
            <select style={S.sel} value={rarityFilter} onChange={e=>setRarityFilter(e.target.value)}>{RARITIES.map(r=><option key={r} value={r}>{r==="All"?"All rarities":r}</option>)}</select>
            <button style={S.toggle(findableOnly)} onClick={()=>setFindableOnly(!findableOnly)}>FINDABLE</button>
            <button style={S.toggle(vinylFavOnly)} onClick={()=>setVinylFavOnly(!vinylFavOnly)}>♥ SAVED</button>
          </div>
          <div style={S.countLine}>{filteredVinyls.length} / {VINYLS.length} RECORDS</div>
          {filteredVinyls.map(v=>(
            <div key={v.id} style={S.card} onClick={()=>setSelectedVinyl(v)}>
              <button style={S.favBtn(vinylFavs.includes(v.id))} onClick={e=>toggle(setVinylFavs)(v.id,e)}>{vinylFavs.includes(v.id)?"♥":"♡"}</button>
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
          <div style={S.areaTabs}>{AREAS.map(({key,label})=><button key={key} style={S.areaTab(shopArea===key)} onClick={()=>setShopArea(key)}>{label}</button>)}</div>
          <div style={S.filterRow}><button style={S.toggle(shopFavOnly)} onClick={()=>setShopFavOnly(!shopFavOnly)}>♥ SAVED</button></div>
          <div style={S.countLine}>{filteredShops.length} / {SHOPS.length} SHOPS</div>
          {filteredShops.map(s=>{
            const open = isOpenNow(s.hours);
            return (
              <div key={s.id} style={S.shopCard} onClick={()=>setSelectedShop(s)}>
                <button style={S.favBtn(shopFavs.includes(s.id))} onClick={e=>toggle(setShopFavs)(s.id,e)}>{shopFavs.includes(s.id)?"♥":"♡"}</button>
                <div style={S.shopName}>{s.name}</div>
                <div style={S.shopCity}>{s.city}</div>
                <div style={{...S.pills, marginBottom:7}}>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                  {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                </div>
                <div style={S.shopNotes}>{s.notes}</div>
                <div style={S.stars}><span style={S.starNum}>{s.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"★".repeat(Math.floor(s.rating))}{"☆".repeat(5-Math.floor(s.rating))}</span></div>
              </div>
            );
          })}
        </>}

        {tab==="vintage" && <>
          <input style={S.search} placeholder="Search name, brand, or category..." value={vintageSearch} onChange={e=>setVintageSearch(e.target.value)} />
          <div style={S.filterRow}>
            <select style={S.sel} value={vCatFilter} onChange={e=>setVCatFilter(e.target.value)}>{VINTAGE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
            <select style={S.sel} value={vEraFilter} onChange={e=>setVEraFilter(e.target.value)}>{VINTAGE_ERAS.map(e=><option key={e}>{e}</option>)}</select>
            <select style={S.sel} value={vRarFilter} onChange={e=>setVRarFilter(e.target.value)}>{VINTAGE_RARITIES.map(r=><option key={r} value={r}>{r==="All"?"All rarities":r}</option>)}</select>
            <button style={S.toggle(vFindableOnly)} onClick={()=>setVFindableOnly(!vFindableOnly)}>FINDABLE</button>
            <button style={S.toggle(vFavOnly)} onClick={()=>setVFavOnly(!vFavOnly)}>♥ SAVED</button>
          </div>
          <div style={S.countLine}>{filteredVintage.length} / {VINTAGE.length} PIECES</div>
          {filteredVintage.map(v=>(
            <div key={v.id} style={S.card} onClick={()=>setSelectedVintage(v)}>
              <button style={S.favBtn(vintageFavs.includes(v.id))} onClick={e=>toggle(setVintageFavs)(v.id,e)}>{vintageFavs.includes(v.id)?"♥":"♡"}</button>
              <div style={S.rank}>#{v.rank}</div>
              <div style={S.cardTitle}>{v.name}</div>
              <div style={S.cardSub}>{v.brand} · {v.era}</div>
              <div style={S.pills}>
                <span style={S.pill(v.rarity)}>{v.rarity}</span>
                <span style={S.era(v.era)}>{v.era}</span>
                <span style={{fontSize:8,color:"#444"}}>{v.category}</span>
                {v.findable && <span style={S.findPill}>FINDABLE</span>}
              </div>
            </div>
          ))}
        </>}

        {tab==="vstores" && <>
          <input style={S.search} placeholder="Search name, city, or specialty..." value={vstoreSearch} onChange={e=>setVstoreSearch(e.target.value)} />
          <div style={S.areaTabs}>{VSTORE_AREAS.map(({key,label})=><button key={key} style={S.areaTab(vstoreArea===key)} onClick={()=>setVstoreArea(key)}>{label}</button>)}</div>
          <div style={S.filterRow}><button style={S.toggle(vstoreFavOnly)} onClick={()=>setVstoreFavOnly(!vstoreFavOnly)}>♥ SAVED</button></div>
          <div style={S.countLine}>{filteredVstores.length} / {VSTORES.length} STORES</div>
          {filteredVstores.map(s=>{
            const open = isOpenNow(s.hours);
            return (
              <div key={s.id} style={S.shopCard} onClick={()=>setSelectedVstore(s)}>
                <button style={S.favBtn(vstoreFavs.includes(s.id))} onClick={e=>toggle(setVstoreFavs)(s.id,e)}>{vstoreFavs.includes(s.id)?"♥":"♡"}</button>
                <div style={S.shopName}>{s.name}</div>
                <div style={S.shopCity}>{s.city}</div>
                <div style={{...S.pills, marginBottom:7}}>
                  <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
                  {open !== null && <span style={S.openBadge(open)}>{open?"OPEN NOW":"CLOSED"}</span>}
                </div>
                <div style={S.shopNotes}>{s.notes}</div>
                <div style={S.stars}><span style={S.starNum}>{s.rating}</span><span style={{fontSize:11,color:"#FBBF24"}}>{"★".repeat(Math.floor(s.rating))}{"☆".repeat(5-Math.floor(s.rating))}</span></div>
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
            <div style={S.mValue}>💰 Value range: {selectedVinyl.value}</div>
            <div style={{marginTop:12}}><SaveBtn isFav={vinylFavs.includes(selectedVinyl.id)} onToggle={e=>toggle(setVinylFavs)(selectedVinyl.id,e)} /></div>
          </div>
        </div>
      )}

      {selectedVintage && (
        <div style={S.modal} onClick={()=>setSelectedVintage(null)}>
          <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
            <button style={S.closeBtn} onClick={()=>setSelectedVintage(null)}>CLOSE ✕</button>
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
            <div style={S.mValue}>💰 Value range: {selectedVintage.value}</div>
            <div style={{marginTop:12}}><SaveBtn isFav={vintageFavs.includes(selectedVintage.id)} onToggle={e=>toggle(setVintageFavs)(selectedVintage.id,e)} /></div>
          </div>
        </div>
      )}

      {selectedShop && <ShopModal shop={selectedShop} favs={shopFavs} favSetter={setShopFavs} onClose={()=>setSelectedShop(null)} />}
      {selectedVstore && <ShopModal shop={selectedVstore} favs={vstoreFavs} favSetter={setVstoreFavs} onClose={()=>setSelectedVstore(null)} />}
    </div>
  );
}
