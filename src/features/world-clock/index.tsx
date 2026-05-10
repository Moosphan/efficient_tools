import { useState, useEffect } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface ClockCity { id: string; timezone: string; labelKey: string; flag: string; }

const CITIES: ClockCity[] = [
  { id: 'beijing', timezone: 'Asia/Shanghai', labelKey: 'beijing', flag: '🇨🇳' },
  { id: 'shanghai', timezone: 'Asia/Shanghai', labelKey: 'shanghai', flag: '🇨🇳' },
  { id: 'hongkong', timezone: 'Asia/Hong_Kong', labelKey: 'hongkong', flag: '🇭🇰' },
  { id: 'tokyo', timezone: 'Asia/Tokyo', labelKey: 'tokyo', flag: '🇯🇵' },
  { id: 'seoul', timezone: 'Asia/Seoul', labelKey: 'seoul', flag: '🇰🇷' },
  { id: 'singapore', timezone: 'Asia/Singapore', labelKey: 'singapore', flag: '🇸🇬' },
  { id: 'mumbai', timezone: 'Asia/Kolkata', labelKey: 'mumbai', flag: '🇮🇳' },
  { id: 'dubai', timezone: 'Asia/Dubai', labelKey: 'dubai', flag: '🇦🇪' },
  { id: 'moscow', timezone: 'Europe/Moscow', labelKey: 'moscow', flag: '🇷🇺' },
  { id: 'istanbul', timezone: 'Europe/Istanbul', labelKey: 'istanbul', flag: '🇹🇷' },
  { id: 'london', timezone: 'Europe/London', labelKey: 'london', flag: '🇬🇧' },
  { id: 'paris', timezone: 'Europe/Paris', labelKey: 'paris', flag: '🇫🇷' },
  { id: 'berlin', timezone: 'Europe/Berlin', labelKey: 'berlin', flag: '🇩🇪' },
  { id: 'rome', timezone: 'Europe/Rome', labelKey: 'rome', flag: '🇮🇹' },
  { id: 'madrid', timezone: 'Europe/Madrid', labelKey: 'madrid', flag: '🇪🇸' },
  { id: 'amsterdam', timezone: 'Europe/Amsterdam', labelKey: 'amsterdam', flag: '🇳🇱' },
  { id: 'newyork', timezone: 'America/New_York', labelKey: 'newyork', flag: '🇺🇸' },
  { id: 'chicago', timezone: 'America/Chicago', labelKey: 'chicago', flag: '🇺🇸' },
  { id: 'denver', timezone: 'America/Denver', labelKey: 'denver', flag: '🇺🇸' },
  { id: 'losangeles', timezone: 'America/Los_Angeles', labelKey: 'losangeles', flag: '🇺🇸' },
  { id: 'vancouver', timezone: 'America/Vancouver', labelKey: 'vancouver', flag: '🇨🇦' },
  { id: 'toronto', timezone: 'America/Toronto', labelKey: 'toronto', flag: '🇨🇦' },
  { id: 'saopaulo', timezone: 'America/Sao_Paulo', labelKey: 'saopaulo', flag: '🇧🇷' },
  { id: 'sydney', timezone: 'Australia/Sydney', labelKey: 'sydney', flag: '🇦🇺' },
  { id: 'auckland', timezone: 'Pacific/Auckland', labelKey: 'auckland', flag: '🇳🇿' },
];

const DEFAULT_ENABLED = ['beijing', 'tokyo', 'london', 'newyork', 'losangeles', 'sydney'];

function formatTime(timezone: string, now: Date): { time: string; date: string; offset: string; isDay: boolean } {
  const time = now.toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const date = now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' });
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' }).format(now).split(' ').pop() ?? '';
  const hour = parseInt(now.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }));
  const isDay = hour >= 6 && hour < 20;
  return { time, date, offset, isDay };
}

export default function WorldClock() {
  const { t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('worldClock');
  const [enabledCities, setEnabledCities] = useState<string[]>(DEFAULT_ENABLED);
  const [now, setNow] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleCity = (id: string) => {
    setEnabledCities((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const activeCities = CITIES.filter((c) => enabledCities.includes(c.id));
  const availableCities = CITIES.filter((c) => !enabledCities.includes(c.id));

  return (
    <ToolShell title={name} description={desc}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
        {activeCities.map((city) => {
          const { time, date, offset, isDay } = formatTime(city.timezone, now);
          return (
            <div key={city.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              <span style={{ fontSize: 28 }}>{city.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{ui[city.labelKey] || city.labelKey}</div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--fg)', letterSpacing: 1 }}>{time}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{date} · {offset} · {isDay ? '☀️' : '🌙'}</div>
              </div>
              <button onClick={() => toggleCity(city.id)} style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 4 }} title={ui.remove}>✕</button>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{ui.addCity}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {availableCities.map((city) => (
              <button key={city.id} className="panel-btn panel-btn-sm" onClick={() => { toggleCity(city.id); }}>
                {city.flag} {ui[city.labelKey] || city.labelKey}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="panel-btn" onClick={() => setShowAdd(!showAdd)}>{showAdd ? ui.closeAdd : ui.addCity}</button>
        <button className="panel-btn" onClick={() => setEnabledCities(DEFAULT_ENABLED)}>{ui.resetDefault}</button>
      </div>

      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
