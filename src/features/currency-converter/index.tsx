import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Number to formal English words (invoice/cheque style) ──

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numberToWords(-n);

  let result = '';
  if (n >= 1000000) {
    result += numberToWords(Math.floor(n / 1000000)) + ' Million ';
    n %= 1000000;
  }
  if (n >= 1000) {
    result += numberToWords(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  if (n >= 100) {
    result += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
    if (n > 0) result += 'and ';
  }
  if (n >= 20) {
    result += TENS[Math.floor(n / 10)];
    n %= 10;
    if (n > 0) result += '-' + ONES[n];
  } else if (n > 0) {
    result += ONES[n];
  }
  return result.trim();
}

// Currency unit names for formal invoice writing
const UNIT_MAP: Record<string, { formal: string; singular: string; plural: string; cent: string }> = {
  USD: { formal: 'US Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  EUR: { formal: 'Euros', singular: 'Euro', plural: 'Euros', cent: 'Cents' },
  GBP: { formal: 'Pounds Sterling', singular: 'Pound', plural: 'Pounds', cent: 'Pence' },
  JPY: { formal: 'Japanese Yen', singular: 'Yen', plural: 'Yen', cent: '' },
  CNY: { formal: 'Chinese Yuan', singular: 'Yuan', plural: 'Yuan', cent: 'Fen' },
  KRW: { formal: 'Korean Won', singular: 'Won', plural: 'Won', cent: '' },
  HKD: { formal: 'Hong Kong Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  TWD: { formal: 'Taiwan Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  SGD: { formal: 'Singapore Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  AUD: { formal: 'Australian Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  CAD: { formal: 'Canadian Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  CHF: { formal: 'Swiss Francs', singular: 'Franc', plural: 'Francs', cent: 'Centimes' },
  INR: { formal: 'Indian Rupees', singular: 'Rupee', plural: 'Rupees', cent: 'Paise' },
  THB: { formal: 'Thai Baht', singular: 'Baht', plural: 'Baht', cent: 'Satang' },
  MYR: { formal: 'Malaysian Ringgit', singular: 'Ringgit', plural: 'Ringgit', cent: 'Sen' },
  RUB: { formal: 'Russian Rubles', singular: 'Ruble', plural: 'Rubles', cent: 'Kopecks' },
  BRL: { formal: 'Brazilian Reais', singular: 'Real', plural: 'Reais', cent: 'Centavos' },
  MXN: { formal: 'Mexican Pesos', singular: 'Peso', plural: 'Pesos', cent: 'Centavos' },
  ZAR: { formal: 'South African Rand', singular: 'Rand', plural: 'Rand', cent: 'Cents' },
  AED: { formal: 'UAE Dirhams', singular: 'Dirham', plural: 'Dirhams', cent: 'Fils' },
  SAR: { formal: 'Saudi Riyals', singular: 'Riyal', plural: 'Riyals', cent: 'Halalas' },
  TRY: { formal: 'Turkish Lira', singular: 'Lira', plural: 'Lira', cent: 'Kurus' },
  NZD: { formal: 'New Zealand Dollars', singular: 'Dollar', plural: 'Dollars', cent: 'Cents' },
  SEK: { formal: 'Swedish Kronor', singular: 'Krona', plural: 'Kronor', cent: 'Ore' },
  DKK: { formal: 'Danish Kroner', singular: 'Krone', plural: 'Kroner', cent: 'Ore' },
  PLN: { formal: 'Polish Zloty', singular: 'Zloty', plural: 'Zloty', cent: 'Groszy' },
  VND: { formal: 'Vietnamese Dong', singular: 'Dong', plural: 'Dong', cent: '' },
  PHP: { formal: 'Philippine Pesos', singular: 'Peso', plural: 'Pesos', cent: 'Centavos' },
  IDR: { formal: 'Indonesian Rupiah', singular: 'Rupiah', plural: 'Rupiah', cent: 'Sen' },
  EGP: { formal: 'Egyptian Pounds', singular: 'Pound', plural: 'Pounds', cent: 'Piastres' },
};

function formatAmountWithCommas(num: number, decimals = 2): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function amountToFormalEnglish(amount: number, currencyCode: string): string {
  if (isNaN(amount) || amount < 0) return '';
  const unit = UNIT_MAP[currencyCode];
  if (!unit) return '';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  const mainWord = numberToWords(integerPart);

  if (!unit.cent || decimalPart === 0) {
    return `${unit.formal} ${mainWord} Only`;
  }

  const centWord = numberToWords(decimalPart);
  return `${unit.formal} ${mainWord} and ${centWord} ${unit.cent} Only`;
}

// ── Types ──

interface RatesResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  time_next_update_utc: string;
  rates: Record<string, number>;
}

interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

const CACHE_KEY = 'cc_rates_cache';

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  lastUpdate: string;
  nextUpdate: string;
  timestamp: number;
}

function getCachedRates(base: string): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (cached.base !== base) return null;
    // Cache valid for 24 hours
    if (Date.now() - cached.timestamp > 24 * 60 * 60 * 1000) return null;
    return cached;
  } catch { return null; }
}

function setCachedRates(data: CachedRates) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Popular currencies with bilingual + formal invoice names ──

interface CurrencyEntry {
  zh: string;       // Common Chinese name
  en: string;       // Common English name
  formal: string;   // Formal name for invoices/documents (Chinese standard)
  symbol: string;
  flag: string;
}

const CURRENCY_INFO: Record<string, CurrencyEntry> = {
  USD: { zh: '美元', en: 'US Dollar', formal: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { zh: '欧元', en: 'Euro', formal: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { zh: '英镑', en: 'British Pound', formal: 'Pound Sterling', symbol: '£', flag: '🇬🇧' },
  JPY: { zh: '日元', en: 'Japanese Yen', formal: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  CNY: { zh: '人民币', en: 'Chinese Yuan', formal: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  KRW: { zh: '韩元', en: 'Korean Won', formal: 'Korean Won', symbol: '₩', flag: '🇰🇷' },
  HKD: { zh: '港币', en: 'Hong Kong Dollar', formal: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  TWD: { zh: '新台币', en: 'Taiwan Dollar', formal: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  SGD: { zh: '新加坡元', en: 'Singapore Dollar', formal: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  AUD: { zh: '澳元', en: 'Australian Dollar', formal: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CAD: { zh: '加元', en: 'Canadian Dollar', formal: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  CHF: { zh: '瑞士法郎', en: 'Swiss Franc', formal: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  INR: { zh: '印度卢比', en: 'Indian Rupee', formal: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  THB: { zh: '泰铢', en: 'Thai Baht', formal: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  MYR: { zh: '马来西亚林吉特', en: 'Malaysian Ringgit', formal: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  RUB: { zh: '俄罗斯卢布', en: 'Russian Ruble', formal: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  BRL: { zh: '巴西雷亚尔', en: 'Brazilian Real', formal: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  MXN: { zh: '墨西哥比索', en: 'Mexican Peso', formal: 'Mexican Peso', symbol: 'Mex$', flag: '🇲🇽' },
  ZAR: { zh: '南非兰特', en: 'South African Rand', formal: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  AED: { zh: '阿联酋迪拉姆', en: 'UAE Dirham', formal: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  SAR: { zh: '沙特里亚尔', en: 'Saudi Riyal', formal: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  TRY: { zh: '土耳其里拉', en: 'Turkish Lira', formal: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  NZD: { zh: '新西兰元', en: 'New Zealand Dollar', formal: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  SEK: { zh: '瑞典克朗', en: 'Swedish Krona', formal: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  DKK: { zh: '丹麦克朗', en: 'Danish Krone', formal: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  PLN: { zh: '波兰兹罗提', en: 'Polish Zloty', formal: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  VND: { zh: '越南盾', en: 'Vietnamese Dong', formal: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  PHP: { zh: '菲律宾比索', en: 'Philippine Peso', formal: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  IDR: { zh: '印尼盾', en: 'Indonesian Rupiah', formal: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  EGP: { zh: '埃及镑', en: 'Egyptian Pound', formal: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
};

const POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'HKD', 'TWD', 'SGD', 'AUD', 'CAD', 'CHF'];

const API_BASE = 'https://open.er-api.com/v6/latest';
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// ── Countdown Timer (isolated to avoid parent re-renders) ──

function CountdownTimer({ nextUpdate, label }: { nextUpdate: string; label: string }) {
  const [display, setDisplay] = useState('--:--');

  useEffect(() => {
    if (!nextUpdate) { setDisplay('--:--'); return; }
    const target = new Date(nextUpdate).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      if (diff <= 0) { setDisplay('0:00'); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextUpdate]);

  return <span>{label}: {display}</span>;
}

// ── Main Component ──

export default function CurrencyConverter() {
  const { lang, t } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('currency');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('CNY');
  const [amount, setAmount] = useState('1');
  const [lastUpdate, setLastUpdate] = useState('');
  const [nextUpdate, setNextUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [baseSearch, setBaseSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [showBaseList, setShowBaseList] = useState(false);
  const [showTargetList, setShowTargetList] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const baseScrollRef = useRef(0);
  const targetScrollRef = useRef(0);

  // Fetch rates with fallback
  const fetchRates = useCallback(async (base: string) => {
    setLoading(true);
    setError('');

    // Try primary API: open.er-api.com
    try {
      const res = await fetch(`${API_BASE}/${base}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RatesResponse = await res.json();
      if (data.result === 'success' && data.rates) {
        setRates(data.rates);
        setLastUpdate(data.time_last_update_utc);
        setNextUpdate(data.time_next_update_utc);
        setCachedRates({ base, rates: data.rates, lastUpdate: data.time_last_update_utc, nextUpdate: data.time_next_update_utc, timestamp: Date.now() });
        setLoading(false);
        return;
      }
    } catch { /* fallback */ }

    // Try fallback API: frankfurter.dev
    try {
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${base}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FrankfurterResponse = await res.json();
      if (data.rates) {
        // frankfurter doesn't include base currency in rates, add it
        const rates = { ...data.rates, [base]: 1 };
        const now = new Date().toUTCString();
        setRates(rates);
        setLastUpdate(`${data.date} (ECB)`);
        setNextUpdate('');
        setCachedRates({ base, rates, lastUpdate: `${data.date} (ECB)`, nextUpdate: '', timestamp: Date.now() });
        setLoading(false);
        return;
      }
    } catch { /* use cache */ }

    // Try cache
    const cached = getCachedRates(base);
    if (cached) {
      setRates(cached.rates);
      setLastUpdate(cached.lastUpdate + ' (cached)');
      setNextUpdate(cached.nextUpdate);
      setError('');
    } else {
      setError(lang === 'zh' ? '网络连接失败，请检查网络后重试' : 'Network error. Please check your connection and retry.');
    }
    setLoading(false);
  }, [lang]);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchRates(baseCurrency);
    const interval = setInterval(() => fetchRates(baseCurrency), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [baseCurrency, fetchRates]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (baseRef.current && !baseRef.current.contains(e.target as Node)) setShowBaseList(false);
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) setShowTargetList(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Conversion
  const convertedAmount = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || !rates[targetCurrency]) return '';
    const result = num * rates[targetCurrency];
    return result.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, rates, targetCurrency]);

  const rate = useMemo(() => {
    if (!rates[targetCurrency]) return '';
    return rates[targetCurrency].toFixed(6);
  }, [rates, targetCurrency]);

  const reverseRate = useMemo(() => {
    if (!rates[targetCurrency]) return '';
    return (1 / rates[targetCurrency]).toFixed(6);
  }, [rates, targetCurrency]);

  // Swap
  const swap = useCallback(() => {
    setBaseCurrency(targetCurrency);
    setTargetCurrency(baseCurrency);
    setBaseSearch('');
    setTargetSearch('');
  }, [baseCurrency, targetCurrency]);

  // Currency list filtering — only show currencies defined in CURRENCY_INFO
  const supportedCurrencies = useMemo(() => Object.keys(CURRENCY_INFO).filter((c) => rates[c]).sort(), [rates]);

  const filterCurrencies = (search: string, exclude: string) => {
    const s = search.toUpperCase();
    return supportedCurrencies.filter((c) => c !== exclude && (c.includes(s) || (CURRENCY_INFO[c]?.zh || '').includes(search) || (CURRENCY_INFO[c]?.en || '').toLowerCase().includes(search.toLowerCase())));
  };

  const CurrencyDropdown = ({
    value, onChange, search, setSearch, show, setShow, exclude, refEl, scrollPosRef,
  }: {
    value: string; onChange: (v: string) => void; search: string; setSearch: (s: string) => void;
    show: boolean; setShow: (s: boolean) => void; exclude: string; refEl: React.RefObject<HTMLDivElement | null>;
    scrollPosRef: React.MutableRefObject<number>;
  }) => {
    const info = CURRENCY_INFO[value];
    const filtered = useMemo(() => filterCurrencies(search, exclude), [search, exclude, supportedCurrencies]);
    const listRef = useRef<HTMLDivElement>(null);

    // Restore scroll position after render
    useEffect(() => {
      if (listRef.current && show) {
        listRef.current.scrollTop = scrollPosRef.current;
      }
    });

    const handleScroll = () => {
      if (listRef.current) {
        scrollPosRef.current = listRef.current.scrollTop;
      }
    };

    const getName = (ci: CurrencyEntry | undefined, code: string) => {
      if (!ci) return code;
      return lang === 'zh' ? ci.zh : ci.en;
    };

    return (
      <div className="cc-selector" ref={refEl}>
        <button className="cc-selector-btn" onClick={() => setShow(!show)}>
          <span className="cc-flag">{info?.flag || '💱'}</span>
          <span className="cc-code">{value}</span>
          <span className="cc-name">{getName(info, value)}</span>
          <span className="cc-arrow">{show ? '▲' : '▼'}</span>
        </button>
        {show && (
          <div className="cc-dropdown">
            <input
              className="cc-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ui.searchCurrency || 'Search currency...'}
              autoFocus
            />
            <div className="cc-list" ref={listRef} onScroll={handleScroll}>
              {filtered.map((c) => {
                const ci = CURRENCY_INFO[c];
                return (
                  <button
                    key={c}
                    className={`cc-item${c === value ? ' cc-item-active' : ''}`}
                    onClick={() => { onChange(c); setShow(false); setSearch(''); }}
                  >
                    <span className="cc-flag">{ci?.flag || '💱'}</span>
                    <span className="cc-code">{c}</span>
                    <span className="cc-item-name">{getName(ci, c)}</span>
                    <span className="cc-rate">{rates[c]?.toFixed(4) || ''}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && <div className="cc-empty">{ui.noResults || 'No results'}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="cc-layout">
        {/* Converter */}
        <div className="cc-converter">
          {/* Amount */}
          <div className="cc-amount-row">
            <label className="cc-amount-label">{ui.amount || 'Amount'}</label>
            <input
              className="cc-amount-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
            />
          </div>

          {/* From */}
          <div className="cc-row">
            <label className="cc-row-label">{ui.from || 'From'}</label>
            <CurrencyDropdown
              value={baseCurrency} onChange={setBaseCurrency}
              search={baseSearch} setSearch={setBaseSearch}
              show={showBaseList} setShow={setShowBaseList}
              exclude={targetCurrency} refEl={baseRef} scrollPosRef={baseScrollRef}
            />
          </div>

          {/* Swap */}
          <div className="cc-swap-row">
            <button className="cc-swap-btn" onClick={swap} title={ui.swap || 'Swap'}>⇅</button>
          </div>

          {/* To */}
          <div className="cc-row">
            <label className="cc-row-label">{ui.to || 'To'}</label>
            <CurrencyDropdown
              value={targetCurrency} onChange={setTargetCurrency}
              search={targetSearch} setSearch={setTargetSearch}
              show={showTargetList} setShow={setShowTargetList}
              exclude={baseCurrency} refEl={targetRef} scrollPosRef={targetScrollRef}
            />
          </div>

          {/* Result */}
          <div className="cc-result">
            {loading ? (
              <div className="cc-loading">{ui.loading || 'Loading rates...'}</div>
            ) : error ? (
              <div className="error-msg">{error}</div>
            ) : (
              <>
                <div className="cc-result-amount">
                  <span className="cc-result-symbol">{CURRENCY_INFO[baseCurrency]?.symbol}</span>
                  <span className="cc-result-value">{amount || '0'}</span>
                  <span className="cc-result-code">{baseCurrency}</span>
                </div>
                <div className="cc-result-equals">=</div>
                <div className="cc-result-converted">
                  <span className="cc-result-symbol">{CURRENCY_INFO[targetCurrency]?.symbol}</span>
                  <span className="cc-result-value">{convertedAmount || '0'}</span>
                  <span className="cc-result-code">{targetCurrency}</span>
                </div>
                <div className="cc-result-rate">
                  1 {baseCurrency} = {rate} {targetCurrency}
                  <br />
                  1 {targetCurrency} = {reverseRate} {baseCurrency}
                </div>
                <div className="cc-result-formal">
                  <div className="cc-formal-line">
                    <span className="cc-formal-label">Total:</span>
                    {targetCurrency} {convertedAmount || '0'}
                  </div>
                  <div className="cc-formal-line">
                    <span className="cc-formal-label">Say:</span>
                    {amountToFormalEnglish(parseFloat(convertedAmount?.replace(/,/g, '') || '0') || 0, targetCurrency)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status bar */}
          <div className="cc-status">
            <span className="cc-status-update">
              {ui.lastUpdate || 'Updated'}: {lastUpdate ? new Date(lastUpdate).toLocaleString() : '—'}
            </span>
            <CountdownTimer nextUpdate={nextUpdate} label={ui.nextUpdate || 'Next'} />
            <button className="cc-refresh-btn" onClick={() => fetchRates(baseCurrency)} disabled={loading}>
              ↻ {ui.refresh || 'Refresh'}
            </button>
          </div>
        </div>

        {/* Rate table */}
        <div className="cc-table-wrap">
          <div className="cc-table-title">{ui.popularRates || 'Popular Rates'} ({baseCurrency})</div>
          <div className="cc-table">
            {POPULAR.filter((c) => c !== baseCurrency && rates[c]).map((c) => {
              const ci = CURRENCY_INFO[c];
              return (
                <button
                  key={c}
                  className={`cc-table-row${c === targetCurrency ? ' cc-table-row-active' : ''}`}
                  onClick={() => setTargetCurrency(c)}
                >
                  <span className="cc-table-flag">{ci?.flag || '💱'}</span>
                  <span className="cc-table-code">{c}</span>
                  <span className="cc-table-name">{lang === 'zh' ? ci?.zh : ci?.en || c}</span>
                  <span className="cc-table-rate">{rates[c]?.toFixed(4)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
