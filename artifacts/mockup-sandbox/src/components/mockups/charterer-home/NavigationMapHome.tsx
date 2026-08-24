import React, { useMemo, useState } from 'react';
import {
  Anchor,
  ArrowUpRight,
  ChevronDown,
  CircleDot,
  Filter,
  Layers3,
  MapPin,
  Navigation,
  Search,
  Ship,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import './_group.css';

type VesselStatus = 'available' | 'on_hire' | 'laid_up';
type Vessel = {
  id: number;
  name: string;
  type: string;
  status: VesselStatus;
  owner: string;
  flag: string;
  built: number;
  dwt: string;
  route: string;
  position: string;
  eta: string;
};

const vessels: Vessel[] = [
  { id: 1, name: 'Arch michael', type: 'Tug', status: 'available', owner: 'Northshore Marine', flag: 'GB', built: 2017, dwt: '1,240', route: 'Tyne → Rotterdam', position: '18%', eta: '2h 40m' },
  { id: 2, name: 'Sea Warden', type: 'Workboat', status: 'on_hire', owner: 'Harbour Works', flag: 'NO', built: 2019, dwt: '860', route: 'Bergen → Aberdeen', position: '44%', eta: 'Underway' },
  { id: 3, name: 'Meridian 8', type: 'Barge', status: 'available', owner: 'Meridian Fleet', flag: 'NL', built: 2015, dwt: '2,400', route: 'Amsterdam → Hull', position: '66%', eta: '5h 15m' },
  { id: 4, name: 'Caledon Star', type: 'Tug', status: 'available', owner: 'Caledon Towage', flag: 'GB', built: 2021, dwt: '1,080', route: 'Dundee → Esbjerg', position: '78%', eta: '8h 05m' },
];

const statusLabels: Record<VesselStatus, string> = {
  available: 'Available',
  on_hire: 'On hire',
  laid_up: 'Laid up',
};

function VesselMark({
  selected,
  style,
  label,
  status,
  onSelect,
}: {
  selected?: boolean;
  style?: React.CSSProperties;
  label: string;
  status: VesselStatus;
  onSelect: () => void;
}) {
  return (
    <button
      className={`map-vessel ${status} ${selected ? 'is-selected' : ''}`}
      style={style}
      aria-label={`Select ${label} on map`}
      onClick={onSelect}
    >
      <span className="vessel-chevron" />
      <Ship size={14} strokeWidth={2.4} />
    </button>
  );
}

export function NavigationMapHome() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [routeMode, setRouteMode] = useState<'routes' | 'availability'>('routes');

  const filteredVessels = useMemo(() => vessels.filter((vessel) => {
    const query = search.toLowerCase();
    const matchesSearch = `${vessel.name} ${vessel.owner} ${vessel.route}`.toLowerCase().includes(query);
    const matchesType = type === 'All' || type === vessel.type;
    const matchesStatus = status === 'All' || status === vessel.status;
    return matchesSearch && matchesType && matchesStatus;
  }), [search, status, type]);

  const selected = vessels.find((vessel) => vessel.id === selectedId);

  return (
    <main className="navigation-home">
      <style>{`
        .navigation-home { --navy-950:#071d2c; --navy-900:#0b2a3c; --navy-800:#123d51; --navy-700:#1a5265; --paper:#f2e9d5; --paper-dim:#c7c2ae; --ink:#102b35; --signal:#d4ef62; --coral:#ee8a68; min-height:100vh; background:#0a2231; color:var(--paper); padding:24px 16px 40px; font-family:'DM Sans',sans-serif; }
        .navigation-home * { box-sizing:border-box; }
        .home-shell { max-width:560px; margin:0 auto; }
        .eyebrow { color:#93b5ad; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; }
        .home-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .brand-lockup { display:flex; align-items:center; gap:10px; }
        .brand-mark { display:grid; place-items:center; width:35px; height:35px; border:1px solid #577a7c; border-radius:10px; color:var(--signal); background:#153e4c; }
        .brand-name { margin:0; color:var(--paper); font-family:'Space Grotesk',sans-serif; font-size:16px; letter-spacing:-.3px; }
        .top-action { display:grid; place-items:center; width:38px; height:38px; border:1px solid #315968; border-radius:12px; color:#c8d7c6; background:transparent; cursor:pointer; }
        .top-action:hover,.top-action:focus-visible { border-color:var(--signal); color:var(--signal); outline:none; }
        .intro { margin-bottom:16px; }
        .intro h1 { margin:5px 0 4px; color:var(--paper); font-family:'Space Grotesk',sans-serif; font-size:30px; line-height:1.02; letter-spacing:-1.3px; }
        .intro p { margin:0; color:#a4c0b6; font-size:13px; }
        .search-row { display:flex; gap:8px; margin-bottom:14px; }
        .search-box { display:flex; flex:1; align-items:center; gap:9px; min-height:46px; padding:0 13px; border:1px solid #426a72; border-radius:12px; background:#102f40; }
        .search-box:focus-within { border-color:var(--signal); box-shadow:0 0 0 3px rgba(212,239,98,.12); }
        .search-box svg { color:#8fb4ad; flex:none; }
        .search-box input { width:100%; min-width:0; border:0; outline:0; color:var(--paper); background:transparent; font-size:13px; }
        .search-box input::placeholder { color:#88a29e; }
        .filter-button { display:grid; place-items:center; width:46px; border:1px solid #426a72; border-radius:12px; color:var(--paper); background:#173e4c; cursor:pointer; }
        .filter-button.active { border-color:var(--signal); color:var(--signal); background:#214c55; }
        .filter-button:focus-visible,.chip:focus-visible,.route-toggle:focus-visible,.row-button:focus-visible,.map-vessel:focus-visible { outline:2px solid var(--signal); outline-offset:2px; }
        .filter-drawer { margin:-4px 0 14px; padding:12px; border:1px solid #3a6370; border-radius:12px; background:#123548; animation:slide-in .22s ease both; }
        .filter-label { display:block; margin-bottom:7px; color:#8fb0aa; font-size:10px; font-weight:700; letter-spacing:1.1px; text-transform:uppercase; }
        .chip-row { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; }
        .chip { flex:0 0 auto; padding:7px 11px; border:1px solid #4c7076; border-radius:99px; color:#b9cec5; background:transparent; font-size:11px; cursor:pointer; }
        .chip.selected { border-color:var(--signal); color:#122d35; background:var(--signal); }
        .chip + .filter-label { margin-top:12px; }
        .chart-wrap { position:relative; overflow:hidden; height:304px; margin-bottom:14px; border:1px solid #42717a; border-radius:16px; background:var(--navy-800); box-shadow:0 14px 34px rgba(0,0,0,.2); }
        .chart-wrap::before { content:""; position:absolute; inset:0; opacity:.38; background-image:linear-gradient(30deg, transparent 48%, rgba(150,210,191,.2) 49%, transparent 50%), linear-gradient(120deg, transparent 48%, rgba(150,210,191,.16) 49%, transparent 50%); background-size:72px 72px; animation:current-drift 16s linear infinite; }
        .chart-glow { position:absolute; width:180px; height:180px; left:-48px; bottom:-70px; border-radius:50%; background:rgba(36,130,133,.24); filter:blur(22px); }
        .chart-header { position:absolute; z-index:2; top:13px; left:14px; right:14px; display:flex; align-items:center; justify-content:space-between; }
        .chart-title { color:#d8e2cf; font-size:11px; font-weight:700; letter-spacing:.7px; text-transform:uppercase; }
        .chart-meta { color:#8fb6ab; font-family:'Space Grotesk',sans-serif; font-size:10px; }
        .route-line { position:absolute; z-index:1; height:1px; border-top:1px dashed rgba(212,239,98,.66); transform-origin:left center; }
        .route-one { width:79%; left:9%; top:63%; transform:rotate(-16deg); }
        .route-two { width:62%; left:27%; top:34%; transform:rotate(29deg); border-color:rgba(238,138,104,.74); }
        .route-three { width:44%; left:6%; top:28%; transform:rotate(53deg); border-color:rgba(202,224,205,.52); }
        .port { position:absolute; z-index:2; display:flex; align-items:center; gap:5px; color:#bdd0bd; font-size:9px; white-space:nowrap; }
        .port::before { content:""; width:6px; height:6px; border:1px solid var(--signal); border-radius:50%; background:#113d4c; }
        .port.tyne { left:8%; bottom:26%; }.port.rotterdam { right:8%; top:38%; }.port.bergen { left:27%; top:15%; }.port.hull { right:25%; bottom:20%; }
         .map-vessel { position:absolute; z-index:3; display:grid; place-items:center; width:28px; height:28px; border:1px solid #80a89a; border-radius:50%; color:#123541; background:var(--signal); box-shadow:0 4px 12px rgba(0,0,0,.26); cursor:pointer; animation:sail 7s ease-in-out infinite; transition:opacity .2s ease,filter .2s ease; }
        .map-vessel.is-selected { width:34px; height:34px; border:2px solid var(--paper); color:#fff; background:var(--coral); box-shadow:0 0 0 5px rgba(238,138,104,.22),0 6px 16px rgba(0,0,0,.28); }
        .map-vessel .vessel-chevron { position:absolute; right:-4px; bottom:1px; width:0; height:0; border-top:4px solid transparent; border-bottom:4px solid transparent; border-left:7px solid currentColor; transform:rotate(-25deg); }
        .ship-a { left:19%; top:56%; }.ship-b { left:48%; top:29%; animation-delay:-2.6s; background:var(--coral); color:#fff; }.ship-c { left:67%; top:54%; animation-delay:-4.4s; }.ship-d { left:78%; top:75%; animation-delay:-1.2s; }
        .map-control { position:absolute; z-index:4; right:12px; bottom:12px; display:flex; align-items:center; gap:2px; padding:3px; border:1px solid #58797d; border-radius:9px; background:#123447e8; }
        .route-toggle { padding:6px 8px; border:0; border-radius:6px; color:#9eb8b0; background:transparent; font-size:10px; cursor:pointer; }
        .route-toggle.active { color:#122d35; background:var(--signal); font-weight:700; }
        .map-legend { position:absolute; z-index:2; left:14px; bottom:15px; display:flex; align-items:center; gap:6px; color:#91afa6; font-size:10px; }
        .map-legend span { width:6px; height:6px; border-radius:50%; background:var(--signal); }
         .chart-wrap.availability .route-line { opacity:.18; }.chart-wrap.availability .map-vessel.on_hire:not(.is-selected) { opacity:.28; filter:saturate(.3); }.chart-wrap.availability .map-legend { color:var(--signal); }
        .selected-panel { display:flex; align-items:center; gap:11px; margin-bottom:14px; padding:11px 12px; border:1px solid #577d78; border-radius:12px; background:#133847; animation:slide-in .24s ease both; }
        .selected-icon { display:grid; place-items:center; width:33px; height:33px; border-radius:9px; color:#18333b; background:var(--signal); }
        .selected-copy { min-width:0; flex:1; }.selected-copy strong { display:block; color:var(--paper); font-family:'Space Grotesk',sans-serif; font-size:14px; }.selected-copy span { color:#97b8ae; font-size:11px; }
        .inspect-link { display:flex; align-items:center; gap:4px; color:var(--signal); font-size:11px; font-weight:700; text-decoration:none; white-space:nowrap; }
        .summary-strip { display:flex; align-items:center; justify-content:space-between; margin:2px 2px 9px; }.summary-strip h2 { margin:0; color:var(--paper); font-family:'Space Grotesk',sans-serif; font-size:15px; }.summary-strip small { color:#8ba9a2; font-size:10px; }
        .vessel-list { display:grid; gap:7px; }.row-button { display:grid; grid-template-columns:32px 1fr auto; gap:10px; align-items:center; width:100%; padding:10px; border:1px solid #315968; border-radius:12px; color:inherit; text-align:left; background:#102e3e; cursor:pointer; }.row-button:hover,.row-button.selected { border-color:#78938b; background:#173c4a; }.row-mark { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; color:#18333b; background:#d4ef62; }.row-mark.coral { color:#fff; background:#ee8a68; }.row-copy { min-width:0; }.row-name { display:block; overflow:hidden; color:#e9e6d7; font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }.row-route { display:block; margin-top:2px; overflow:hidden; color:#86aaa1; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.row-side { text-align:right; }.status-dot { display:inline-block; width:6px; height:6px; margin-right:4px; border-radius:50%; background:var(--signal); }.status-dot.on_hire { background:var(--coral); }.row-status { display:block; color:#bad2c0; font-size:10px; }.row-dwt { display:block; margin-top:3px; color:#789a98; font-size:9px; }
        .empty-state { padding:32px 18px; border:1px dashed #52757a; border-radius:12px; color:#9eb7ae; text-align:center; background:#102e3e; }.empty-state svg { margin-bottom:8px; color:#d4ef62; }.empty-state strong { display:block; color:var(--paper); font-family:'Space Grotesk',sans-serif; font-size:14px; }.empty-state p { margin:6px 0 0; font-size:11px; }
        @keyframes current-drift { from { background-position:0 0,0 0; } to { background-position:72px 36px,-72px 36px; } } @keyframes sail { 0%,100% { transform:translate3d(0,0,0) rotate(0); } 50% { transform:translate3d(9px,-5px,0) rotate(2deg); } } @keyframes slide-in { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } } @media (prefers-reduced-motion:reduce) { .chart-wrap::before,.map-vessel { animation:none; } .filter-drawer,.selected-panel { animation:none; } }
      `}</style>
      <div className="home-shell">
        <header className="home-top">
          <div className="brand-lockup"><span className="brand-mark"><Anchor size={18} /></span><div><div className="eyebrow">Charterer</div><p className="brand-name">ShipHub</p></div></div>
          <button className="top-action" aria-label="Open navigation menu"><Navigation size={17} /></button>
        </header>

        <section className="intro">
          <div className="eyebrow">North Sea · 06:42 UTC</div>
          <h1>Find the next move.</h1>
          <p>Live availability across the routes that matter.</p>
        </section>

        <div className="search-row">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vessel, owner or route" aria-label="Search vessel, owner or route" /></label>
          <button className={`filter-button ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} aria-label="Toggle vessel filters" aria-expanded={showFilters}><SlidersHorizontal size={18} /></button>
        </div>

        {showFilters && <div className="filter-drawer">
          <span className="filter-label">Vessel type</span>
          <div className="chip-row">{['All', 'Tug', 'Workboat', 'Barge'].map((item) => <button key={item} className={`chip ${type === item ? 'selected' : ''}`} onClick={() => setType(item)}>{item}</button>)}</div>
          <span className="filter-label">Availability</span>
          <div className="chip-row">{['All', 'available', 'on_hire', 'laid_up'].map((item) => <button key={item} className={`chip ${status === item ? 'selected' : ''}`} onClick={() => setStatus(item)}>{item === 'All' ? 'All' : statusLabels[item as VesselStatus]}</button>)}</div>
        </div>}

         <section className={`chart-wrap ${routeMode === 'availability' ? 'availability' : ''}`} aria-label={`Live North Sea vessel map, showing ${routeMode}`}>
          <div className="chart-glow" />
          <div className="chart-header"><span className="chart-title"><Layers3 size={12} style={{ verticalAlign: '-2px', marginRight: 5 }} />Live chart</span><span className="chart-meta">12 vessels moving</span></div>
          <div className="route-line route-one" /><div className="route-line route-two" /><div className="route-line route-three" />
          <span className="port tyne">Tyne</span><span className="port rotterdam">Rotterdam</span><span className="port bergen">Bergen</span><span className="port hull">Hull</span>
           <VesselMark label="Arch michael" status="available" selected={selectedId === 1} onSelect={() => setSelectedId(1)} style={{ left: '18%', top: '54%' }} /><VesselMark label="Sea Warden" status="on_hire" selected={selectedId === 2} onSelect={() => setSelectedId(2)} style={{ left: '48%', top: '29%', animationDelay: '-2.6s', background: 'var(--coral)', color: '#fff' }} /><VesselMark label="Meridian 8" status="available" selected={selectedId === 3} onSelect={() => setSelectedId(3)} style={{ left: '67%', top: '54%', animationDelay: '-4.4s' }} /><VesselMark label="Caledon Star" status="available" selected={selectedId === 4} onSelect={() => setSelectedId(4)} style={{ left: '78%', top: '75%', animationDelay: '-1.2s' }} />
          <div className="map-legend"><span /> Available now</div>
          <div className="map-control"><button className={`route-toggle ${routeMode === 'routes' ? 'active' : ''}`} onClick={() => setRouteMode('routes')}><MapPin size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />Routes</button><button className={`route-toggle ${routeMode === 'availability' ? 'active' : ''}`} onClick={() => setRouteMode('availability')}><CircleDot size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />Availability</button></div>
        </section>

        {selected && <div className="selected-panel"><span className="selected-icon"><Ship size={17} /></span><div className="selected-copy"><strong>{selected.name}</strong><span>{selected.route} · {selected.eta}</span></div><a className="inspect-link" href="#vessel-list">Inspect <ArrowUpRight size={13} /></a><button className="top-action" style={{ width: 26, height: 26, border: 0 }} onClick={() => setSelectedId(null)} aria-label="Clear selected vessel"><X size={14} /></button></div>}

        <section id="vessel-list">
          <div className="summary-strip"><h2>Vessels in view</h2><small><strong style={{ color: 'var(--signal)' }}>{filteredVessels.length}</strong> shown · {vessels.filter((vessel) => vessel.status === 'available').length} available</small></div>
          <div className="vessel-list">
            {filteredVessels.map((vessel) => <button key={vessel.id} className={`row-button ${selectedId === vessel.id ? 'selected' : ''}`} onClick={() => setSelectedId(vessel.id)} aria-label={`Inspect ${vessel.name}`}><span className={`row-mark ${vessel.status === 'on_hire' ? 'coral' : ''}`}><Ship size={15} /></span><span className="row-copy"><span className="row-name">{vessel.name}</span><span className="row-route">{vessel.type} · {vessel.route}</span></span><span className="row-side"><span className="row-status"><i className={`status-dot ${vessel.status}`} />{statusLabels[vessel.status]}</span><span className="row-dwt">{vessel.dwt} DWT</span></span></button>)}
            {filteredVessels.length === 0 && <div className="empty-state"><Filter size={20} /><strong>No vessels on this bearing</strong><p>Try a wider search or clear one of the filters.</p></div>}
          </div>
        </section>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 18, color: '#688b8b' }}><ChevronDown size={16} /></div>
      </div>
    </main>
  );
}

export default NavigationMapHome;