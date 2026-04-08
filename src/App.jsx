import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import { VINYLS, SHOPS, ERAS, GENRES, RARITIES } from "./data";

const rarityColor = (r) => {
  if (r === "holy grail") return { bg:"#3D0000", text:"#FF6B6B", border:"#8B0000" };
  if (r === "very rare") return { bg:"#1A0A2E", text:"#C084FC", border:"#7C3AED" };
  if (r === "rare") return { bg:"#0A1628", text:"#60A5FA", border:"#2563EB" };
  return { bg:"#0A1A0A", text:"#4ADE80", border:"#16A34A" };
};

const eraColor = (era) => {
  const map = { "1930s":"#B45309","1950s":"#D97706","1960s":"#9333EA","1970s":"#DC2626","1980s":"#2563EB","1990s":"#059669","2000s":"#D97706","2010s":"#7C3AED" };
  return map[era] || "#6B7280";
};

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
  const [aiMessages, setAiMessages] = useState([
    { role:"assistant", content:"Hey! I'm your vinyl hunting AI. Ask me anything — how to spot a first pressing, what matrix codes to look for, which shops to hit for a genre, or anything about the 100 records on this list. Let's dig." }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [aiMessages]);

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
      && (shopArea === "all" || s.area === shopArea);
  });

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    const newMessages = [...aiMessages, { role:"user", content:userMsg }];
    setAiMessages(newMessages);
    setAiLoading(true);
    try {
      const response = await fetch("/api/chat", {
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system:"You are an expert vinyl record collector with 30+ years crate-digging the Bay Area and LA. You know the 100 most collectible records by heart — pressing details, matrix codes, label variations, what to look for. You know every record shop in Oakland, Berkeley, San Francisco, and Los Angeles. Give concise, practical advice a phone user can act on immediately. Be direct and passionate like a collector, not a textbook.",
          messages:newMessages.map(m => ({ role:m.role, content:m.content }))
        })
      });
      const data = await response.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Couldn't connect — try again!";
      setAiMessages([...newMessages, { role:"assistant", content:reply }]);
    } catch {
      setAiMessages([...newMessages, { role:"assistant", content:"Connection issue — try again in a moment." }]);
    }
    setAiLoading(false);
  };

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
    shopCard:{ background:"#111", border:"1px solid #1E1E1E", borderRadius:8, padding:"12px", marginBottom:7, cursor:"pointer" },
    shopName:{ fontSize:14, color:"#FFF", marginBottom:2 },
    shopCity:{ fontSize:10, color:"#FF4444", marginBottom:6, letterSpacing:"0.07em" },
    shopNotes:{ fontSize:12, color:"#777", lineHeight:1.55 },
    stars:{ display:"flex", gap:3, alignItems:"center", marginTop:6 },
    starNum:{ fontSize:11, color:"#FBBF24" },
    areaTabs:{ display:"flex", gap:6, marginBottom:10 },
    areaTab:(a)=>({ padding:"6px 12px", borderRadius:99, fontSize:9, letterSpacing:"0.08em", cursor:"pointer", background:a?"#FF4444":"#111", color:a?"#000":"#555", border:a?"1px solid #FF4444":"1px solid #222", fontFamily:"inherit", textTransform:"uppercase" }),
    chatWrap:{ display:"flex", flexDirection:"column", height:"calc(100vh - 130px)" },
    chatMsgs:{ flex:1, overflowY:"auto", paddingBottom:8 },
    bubble:(u)=>({ maxWidth:"86%", marginLeft:u?"auto":0, marginBottom:9, background:u?"#FF4444":"#161616", border:u?"none":"1px solid #222", borderRadius:u?"12px 12px 2px 12px":"12px 12px 12px 2px", padding:"10px 12px", fontSize:13, color:u?"#000":"#BBBBBB", lineHeight:1.65, whiteSpace:"pre-wrap" }),
    chatInputRow:{ display:"flex", gap:7, borderTop:"1px solid #1E1E1E", paddingTop:10 },
    chatIn:{ flex:1, background:"#111", border:"1px solid #222", borderRadius:6, padding:"9px 11px", color:"#E5E5E5", fontSize:13, fontFamily:"inherit", outline:"none", resize:"none" },
    sendBtn:{ background:"#FF4444", border:"none", borderRadius:6, padding:"9px 14px", color:"#000", cursor:"pointer", fontSize:14, fontWeight:"bold" }
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div style={S.logoRow}>
          <div style={S.disc} />
          <div>
            <div style={S.logoText}>VINYL HUNTER</div>
            <div style={S.logoSub}>COLLECTOR'S FIELD GUIDE · BAY AREA & LA</div>
          </div>
        </div>
        <div style={S.tabs}>
          {[["hunt","THE 100"],["shops","SHOPS"],["ai","AI EXPERT"]].map(([k,l])=>(
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
          <div style={S.countLine}>{filteredVinyls.length} / 100 RECORDS</div>
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
            {[["all","ALL"],["bay","BAY AREA"],["la","LOS ANGELES"]].map(([k,l])=>(
              <button key={k} style={S.areaTab(shopArea===k)} onClick={()=>setShopArea(k)}>{l}</button>
            ))}
          </div>
          <div style={S.countLine}>{filteredShops.length} / {SHOPS.length} SHOPS</div>
          {filteredShops.map(s=>(
            <div key={s.id} style={S.shopCard} onClick={()=>setSelectedShop(s)}>
              <div style={S.shopName}>{s.name}</div>
              <div style={S.shopCity}>{s.city} · {s.area==="bay"?"Bay Area":"Los Angeles"}</div>
              <div style={{...S.pills, marginBottom:7}}>
                <span style={{fontSize:8,padding:"3px 7px",borderRadius:99,background:"#1A1A1A",color:"#555",border:"1px solid #222"}}>{s.specialty}</span>
              </div>
              <div style={S.shopNotes}>{s.notes}</div>
              <div style={S.stars}>
                <span style={S.starNum}>{s.rating}</span>
                <span style={{fontSize:11,color:"#FBBF24"}}>{"★".repeat(Math.floor(s.rating))}{"☆".repeat(5-Math.floor(s.rating))}</span>
              </div>
            </div>
          ))}
        </>}

        {tab==="ai" && (
          <div style={S.chatWrap}>
            <div style={S.chatMsgs}>
              {aiMessages.map((m,i)=>(
                <div key={i} style={S.bubble(m.role==="user")}>{m.content}</div>
              ))}
              {aiLoading && <div style={S.bubble(false)}>Digging through the crates...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={S.chatInputRow}>
              <textarea ref={inputRef} style={S.chatIn} rows={2}
                placeholder="Ask about pressing IDs, matrix codes, shops by genre..."
                value={aiInput} onChange={e=>setAiInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAiMessage();} }} />
              <button style={S.sendBtn} onClick={sendAiMessage}>↑</button>
            </div>
          </div>
        )}
      </div>

      {selectedVinyl && (
        <div style={S.modal} onClick={()=>setSelectedVinyl(null)}>
          <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
            <button style={S.closeBtn} onClick={()=>setSelectedVinyl(null)}>CLOSE ✕</button>
            <div style={S.mRank}>#{selectedVinyl.rank} OF 100</div>
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

      {selectedShop && (
        <div style={S.modal} onClick={()=>setSelectedShop(null)}>
          <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
            <button style={S.closeBtn} onClick={()=>setSelectedShop(null)}>CLOSE ✕</button>
            <div style={S.stars}><span style={S.starNum}>{selectedShop.rating}</span><span style={{fontSize:12,color:"#FBBF24"}}>{"★".repeat(Math.floor(selectedShop.rating))}</span></div>
            <div style={{...S.mTitle, marginTop:8}}>{selectedShop.name}</div>
            <div style={{...S.shopCity, fontSize:12, marginBottom:12}}>{selectedShop.city} · {selectedShop.area==="bay"?"Bay Area":"Los Angeles"}</div>
            <div style={{...S.pills, marginBottom:12}}>
              <span style={{fontSize:9,padding:"4px 9px",borderRadius:99,background:"#1A1A1A",color:"#666",border:"1px solid #222",letterSpacing:"0.06em"}}>{selectedShop.specialty}</span>
            </div>
            <div style={S.mMeta}>
              <span style={S.mMetaH}>Address:</span> {selectedShop.address}
              {selectedShop.phone && <><br/><span style={S.mMetaH}>Phone:</span> {selectedShop.phone}</>}
            </div>
            <div style={S.mDesc}>{selectedShop.notes}</div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}
