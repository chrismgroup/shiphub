import React, { useMemo, useState } from 'react';
import { Anchor, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
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
};

const vessels: Vessel[] = [
  { id: 1, name: 'Arch michael', type: 'Tug', status: 'available', owner: 'Northshore Marine', flag: 'GB', built: 2017, dwt: '1,240' },
  { id: 2, name: 'Sea Warden', type: 'Workboat', status: 'on_hire', owner: 'Harbour Works', flag: 'NO', built: 2019, dwt: '860' },
  { id: 3, name: 'Meridian 8', type: 'Barge', status: 'available', owner: 'Meridian Fleet', flag: 'NL', built: 2015, dwt: '2,400' },
];

const statusLabels: Record<VesselStatus, string> = {
  available: 'Available',
  on_hire: 'On Hire',
  laid_up: 'Laid Up',
};

export function Current() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  const filteredVessels = useMemo(() => vessels.filter((vessel) => {
    const matchesSearch = `${vessel.name} ${vessel.owner}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'All' || type === vessel.type;
    const matchesStatus = status === 'All' || status === vessel.status;
    return matchesSearch && matchesType && matchesStatus;
  }), [search, status, type]);

  return (
    <main style={{ minHeight: '100vh', padding: '68px 16px 90px', background: 'var(--shiphub-background)' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ color: 'var(--shiphub-primary-strong)', fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>ShipHub</div>
            <h1 style={{ margin: '2px 0 0', fontFamily: 'Space Grotesk', fontSize: 26, lineHeight: 1.15 }}>Vessel Market</h1>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} aria-label="Toggle filters" style={{ width: 38, height: 38, border: `1px solid ${showFilters ? 'var(--shiphub-primary)' : 'var(--shiphub-border)'}`, borderRadius: 10, background: showFilters ? 'var(--shiphub-primary)' : 'var(--shiphub-muted)', display: 'grid', placeItems: 'center' }}>
            <SlidersHorizontal size={16} color={showFilters ? '#fff' : 'var(--shiphub-muted-foreground)'} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', marginBottom: 10, border: `1px solid var(--shiphub-border)`, borderRadius: 10, background: 'var(--shiphub-muted)' }}>
          <div><strong style={{ display: 'block', color: 'var(--shiphub-primary-strong)', fontFamily: 'Space Grotesk', fontSize: 18 }}>{vessels.length}</strong><small style={{ color: 'var(--shiphub-muted-foreground)', textTransform: 'uppercase', letterSpacing: .4 }}>Listings</small></div>
          <div><strong style={{ display: 'block', color: 'var(--shiphub-primary-strong)', fontFamily: 'Space Grotesk', fontSize: 18 }}>{vessels.filter((vessel) => vessel.status === 'available').length}</strong><small style={{ color: 'var(--shiphub-muted-foreground)', textTransform: 'uppercase', letterSpacing: .4 }}>Available</small></div>
          <small style={{ marginLeft: 'auto', color: 'var(--shiphub-muted-foreground)' }}>Updated just now</small>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', border: `1px solid var(--shiphub-border)`, borderRadius: 10, background: 'var(--shiphub-muted)' }}>
          <Search size={15} color="var(--shiphub-muted-foreground)" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vessels…" aria-label="Search vessels" style={{ minWidth: 0, flex: 1, border: 0, outline: 0, background: 'transparent', color: 'var(--shiphub-foreground)' }} />
        </label>
        {showFilters && (
          <div style={{ paddingTop: 8 }}>
            <small style={{ display: 'block', marginBottom: 4, color: 'var(--shiphub-muted-foreground)', fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase' }}>Type</small>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
              {['All', 'Tug', 'Workboat', 'Barge'].map((item) => <button key={item} onClick={() => setType(item)} style={{ flex: '0 0 auto', padding: '5px 12px', border: `1px solid ${type === item ? 'var(--shiphub-primary)' : 'var(--shiphub-border)'}`, borderRadius: 20, background: type === item ? 'var(--shiphub-primary)' : 'var(--shiphub-muted)', color: type === item ? '#fff' : 'var(--shiphub-muted-foreground)', fontSize: 12 }}>{item}</button>)}
            </div>
            <small style={{ display: 'block', marginBottom: 4, color: 'var(--shiphub-muted-foreground)', fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase' }}>Status</small>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
              {['All', 'available', 'on_hire', 'laid_up'].map((item) => <button key={item} onClick={() => setStatus(item)} style={{ flex: '0 0 auto', padding: '5px 12px', border: `1px solid ${status === item ? 'var(--shiphub-primary)' : 'var(--shiphub-border)'}`, borderRadius: 20, background: status === item ? 'var(--shiphub-primary)' : 'var(--shiphub-muted)', color: status === item ? '#fff' : 'var(--shiphub-muted-foreground)', fontSize: 12 }}>{item === 'All' ? item : statusLabels[item as VesselStatus]}</button>)}
            </div>
          </div>
        )}
      </header>
      <section style={{ display: 'grid', gap: 12, paddingTop: 12 }}>
        {filteredVessels.map((vessel) => (
          <article key={vessel.id} style={{ overflow: 'hidden', border: `1px solid var(--shiphub-border)`, borderRadius: 14, background: 'var(--shiphub-card)', boxShadow: '0 4px 14px rgba(17,17,17,.05)' }}>
            <div style={{ position: 'relative', height: 150, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #dce7c8, #aab8a0)' }}>
              <Anchor size={32} color="rgba(17,17,17,.45)" />
              <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 8px', borderRadius: 99, background: 'var(--shiphub-primary)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{statusLabels[vessel.status]}</span>
              <span style={{ position: 'absolute', bottom: 10, left: 10, padding: '4px 8px', borderRadius: 99, background: 'rgba(255,255,255,.85)', color: 'var(--shiphub-foreground)', fontSize: 11 }}>{vessel.type} · {vessel.flag}</span>
            </div>
            <div style={{ padding: 12 }}>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: 18 }}>{vessel.name}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, margin: '10px 0', padding: '8px 0', borderTop: `1px solid var(--shiphub-border)`, borderBottom: `1px solid var(--shiphub-border)`, color: 'var(--shiphub-muted-foreground)', fontSize: 12 }}>
                <span><strong style={{ display: 'block', color: 'var(--shiphub-foreground)' }}>{vessel.dwt}</strong>DWT</span>
                <span><strong style={{ display: 'block', color: 'var(--shiphub-foreground)' }}>{vessel.built}</strong>Built</span>
              </div>
              <small style={{ color: 'var(--shiphub-muted-foreground)' }}>{vessel.owner}</small>
            </div>
          </article>
        ))}
        {filteredVessels.length === 0 && <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--shiphub-muted-foreground)' }}>No vessels found</div>}
      </section>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20, color: 'var(--shiphub-muted-foreground)' }}><ChevronDown size={16} /></div>
    </main>
  );
}

export default Current;