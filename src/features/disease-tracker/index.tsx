import { useState, useEffect, useCallback, useRef } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

interface DonEntry {
  Title: string;
  PublicationDate: string;
  ItemDefaultUrl: string;
  DonId: string;
  Overview?: string;
  Assessment?: string;
  summary?: OutbreakSummary;
}

interface OutbreakSummary {
  locations: string[];
  cases: string;
  deaths: string;
  fatalityRate: string;
  spread: string;
  spreadDetails: string[];
  severity: 'low' | 'medium' | 'high';
  alertLevel: 'safe' | 'watch' | 'warning' | 'danger';
  alertMessage: string;
  rawText: string;
}

interface CovidGlobal {
  cases: number;
  deaths: number;
  recovered: number;
  active: number;
  todayCases: number;
  todayDeaths: number;
  casesPerOneMillion: number;
  updated: number;
}

interface WhoNewsItem {
  title: string;
  pubDate: string;
  link: string;
  description: string;
  categories: string[];
}

// ── Constants ──

const WHO_DON_API = 'https://www.who.int/api/news/diseaseoutbreaknews?$orderby=PublicationDate%20desc&$top=15&$select=Title,PublicationDate,ItemDefaultUrl,DonId,Overview,Assessment';
const COVID_API = 'https://disease.sh/v3/covid-19/all';
const WHO_RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.who.int/rss-feeds/news-english.xml';
const CACHE_KEY = 'dt_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// ── Disease Knowledge Base ──

const DISEASES: Record<string, { zh: { name: string; desc: string; symptoms: string[]; prevention: string[] }; en: { name: string; desc: string; symptoms: string[]; prevention: string[] } }> = {
  covid: {
    zh: { name: 'COVID-19 (新型冠状病毒)', desc: '由 SARS-CoV-2 引起的呼吸道传染病，可通过飞沫和气溶胶传播。', symptoms: ['发热、干咳、乏力', '嗅觉/味觉减退', '咽痛、鼻塞、腹泻', '重症可出现呼吸困难'], prevention: ['接种疫苗及加强针', '在密闭公共场所佩戴口罩', '勤洗手，避免触摸面部', '保持室内通风', '出现症状及时就医并自我隔离'] },
    en: { name: 'COVID-19', desc: 'Respiratory illness caused by SARS-CoV-2, transmitted via droplets and aerosols.', symptoms: ['Fever, dry cough, fatigue', 'Loss of smell/taste', 'Sore throat, nasal congestion', 'Severe: difficulty breathing'], prevention: ['Get vaccinated and boosted', 'Wear masks in enclosed public spaces', 'Wash hands frequently, avoid touching face', 'Keep indoor spaces ventilated', 'Seek medical care and isolate if symptomatic'] },
  },
  influenza: {
    zh: { name: '流感 (Influenza)', desc: '由流感病毒引起的急性呼吸道传染病，秋冬季高发，变异性强。', symptoms: ['突发高热 (38°C 以上)', '全身肌肉酸痛、头痛', '咳嗽、咽痛、流涕', '乏力、食欲减退'], prevention: ['每年接种流感疫苗', '勤洗手，注意呼吸道卫生', '避免去人群密集场所', '增强体质，保证睡眠'] },
    en: { name: 'Influenza (Flu)', desc: 'Acute respiratory illness caused by influenza viruses, peaks in autumn/winter, highly variable.', symptoms: ['Sudden high fever (38°C+)', 'Muscle aches, headache', 'Cough, sore throat, runny nose', 'Fatigue, loss of appetite'], prevention: ['Get annual flu vaccine', 'Wash hands, practice respiratory hygiene', 'Avoid crowded places during peak season', 'Maintain healthy lifestyle and sleep'] },
  },
  measles: {
    zh: { name: '麻疹 (Measles)', desc: '由麻疹病毒引起的高度传染性疾病，通过飞沫传播，传染性极强。', symptoms: ['高热、咳嗽、流涕', '眼结膜充血', '口腔柯氏斑', '全身红色斑丘疹'], prevention: ['接种麻疹疫苗 (MMR)', '避免与患者密切接触', '保持室内通风', '患者需隔离至出疹后 5 天'] },
    en: { name: 'Measles', desc: 'Highly contagious viral disease transmitted via droplets. Extremely infectious.', symptoms: ['High fever, cough, runny nose', 'Conjunctivitis (red eyes)', 'Koplik spots in mouth', 'Widespread red maculopapular rash'], prevention: ['Get MMR vaccine', 'Avoid close contact with infected persons', 'Keep indoor spaces ventilated', 'Isolate patients until 5 days after rash onset'] },
  },
  avian_flu: {
    zh: { name: '禽流感 (Avian Influenza)', desc: '由甲型流感病毒引起的动物传染病，偶可感染人类，病死率较高。', symptoms: ['高热 (39°C 以上)', '咳嗽、呼吸困难', '肌肉酸痛、头痛', '重症可发展为肺炎、多器官衰竭'], prevention: ['避免接触活禽和野生鸟类', '禽肉蛋类彻底煮熟', '出现流感症状及时就医并告知接触史', '从事禽类工作者做好个人防护'] },
    en: { name: 'Avian Influenza', desc: 'Animal influenza caused by type A viruses, occasionally infects humans with high fatality rate.', symptoms: ['High fever (39°C+)', 'Cough, difficulty breathing', 'Muscle aches, headache', 'Severe: pneumonia, multi-organ failure'], prevention: ['Avoid contact with live poultry and wild birds', 'Cook poultry and eggs thoroughly', 'Seek medical care promptly with exposure history', 'PPE for poultry workers'] },
  },
  hantavirus: {
    zh: { name: '汉坦病毒 (Hantavirus)', desc: '由啮齿动物传播的病毒，可引起汉坦病毒肺综合征或肾综合征出血热。', symptoms: ['发热、肌肉疼痛', '头痛、呕吐、腹泻', '肺综合征：呼吸困难', '肾综合征：少尿、出血'], prevention: ['防鼠灭鼠，封堵鼠洞', '清理鼠类排泄物时戴口罩手套', '食物妥善保存，避免鼠类接触', '野外露营注意防鼠'] },
    en: { name: 'Hantavirus', desc: 'Virus transmitted by rodents, causes Hantavirus Pulmonary Syndrome or Hemorrhagic Fever with Renal Syndrome.', symptoms: ['Fever, muscle pain', 'Headache, vomiting, diarrhea', 'Pulmonary: difficulty breathing', 'Renal: oliguria, bleeding'], prevention: ['Rodent control, seal holes and gaps', 'Wear mask/gloves when cleaning rodent droppings', 'Store food properly away from rodents', 'Take precautions when camping outdoors'] },
  },
  mpox: {
    zh: { name: '猴痘 (Mpox)', desc: '由猴痘病毒引起的传染病，通过密切接触传播，可引起皮疹和淋巴结肿大。', symptoms: ['发热、头痛、肌肉酸痛', '淋巴结肿大', '皮疹：斑疹→丘疹→水疱→脓疱→结痂', '皮疹多见于面部、四肢'], prevention: ['避免与确诊患者密切接触', '接触动物时做好防护', '接种天花疫苗可提供交叉保护', '出现皮疹及时就医'] },
    en: { name: 'Mpox', desc: 'Disease caused by monkeypox virus, spreads through close contact, causes rash and lymphadenopathy.', symptoms: ['Fever, headache, muscle aches', 'Swollen lymph nodes', 'Rash: macules → papules → vesicles → pustules → scabs', 'Rash mainly on face and limbs'], prevention: ['Avoid close contact with confirmed cases', 'Take precautions when handling animals', 'Smallpox vaccine provides cross-protection', 'Seek medical care if rash develops'] },
  },
};

// ── Helpers ──

function timeAgo(dateStr: string, lang: 'zh' | 'en'): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return lang === 'zh' ? `${mins} 分钟前` : `${mins}m ago`;
  if (hours < 24) return lang === 'zh' ? `${hours} 小时前` : `${hours}h ago`;
  return lang === 'zh' ? `${days} 天前` : `${days}d ago`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function parseNumber(text: string): number | null {
  // Handle "X million", "X thousand" etc.
  const wordMatch = text.match(/(\d+(?:\.\d+)?)\s*(million|billion|thousand)/i);
  if (wordMatch) {
    const num = parseFloat(wordMatch[1]);
    const mult = wordMatch[2].toLowerCase();
    if (mult === 'million') return num * 1000000;
    if (mult === 'billion') return num * 1000000000;
    if (mult === 'thousand') return num * 1000;
  }
  // Handle comma-separated numbers
  const numMatch = text.match(/(\d[\d,]*)/);
  if (numMatch) return parseInt(numMatch[1].replace(/,/g, ''));
  return null;
}

function parseOutbreakSummary(overview: string, assessment: string, title: string): OutbreakSummary {
  const text = stripHtml(overview || '');
  const assessText = stripHtml(assessment || '');
  const fullText = text + ' ' + assessText;
  const lowerText = fullText.toLowerCase();

  // Extract locations from title (format: "Disease - Country" or "Disease - Region, Country")
  const titleParts = title.split(' - ');
  const titleLocations = titleParts.length > 1 ? titleParts.slice(1).join(' - ').split(',').map(s => s.trim()).filter(Boolean) : [];

  // Extract locations from text patterns
  const locationPatterns = [
    /(?:in|from|reported in|occurring in|affected (?:areas?|countries|regions?|provinces?|districts?|cities))[:\s]+([A-Z][a-zA-Z\s,()]+?)(?:\.|;|\n|and\s+\d)/gi,
    /(\d+)\s+(?:cases?|deaths?)\s+(?:have been\s+)?(?:reported|confirmed|detected)\s+in\s+([A-Z][a-zA-Z\s,]+)/gi,
    /(?:country|countries|region|area|province|state|city|district)[:\s]+([A-Z][a-zA-Z\s,()]+)/gi,
  ];

  const locations = new Set<string>(titleLocations);
  for (const pattern of locationPatterns) {
    let match;
    while ((match = pattern.exec(fullText)) !== null) {
      const loc = (match[1] || match[2] || '').trim();
      if (loc && loc.length > 2 && loc.length < 60) locations.add(loc);
    }
  }

  // Extract case counts - more comprehensive patterns
  const casePatterns = [
    /(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)\s*(?:confirmed|laboratory-confirmed|total|cumulative|suspected|probable)?\s*cases?/gi,
    /(?:a total of|reported|confirmed|detected|identified|registered|recorded)\s*(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)\s*cases?/gi,
    /cases?[:\s]*(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)/gi,
    /(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)\s*(?:people|persons|individuals|patients)\s*(?:have been\s+)?(?:infected|affected|hospitalized|diagnosed)/gi,
    /(?:case[\s-]?count|total)[^\d]*?(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)/gi,
  ];

  let cases = '';
  for (const pattern of casePatterns) {
    const match = pattern.exec(fullText);
    if (match) {
      const parsed = parseNumber(match[1]);
      if (parsed && parsed > 0) {
        cases = String(parsed);
        break;
      }
    }
  }

  // Extract death counts - more comprehensive patterns
  const deathPatterns = [
    /(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)\s*(?:confirmed\s+|reported\s+)?deaths?/gi,
    /(?:a total of|reported|confirmed)\s*(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)\s*deaths?/gi,
    /deaths?[:\s]*(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)/gi,
    /(?:killed|fatalities|dead)[^\d]*?(\d[\d,]*(?:\.\d+)?(?:\s*(?:million|billion|thousand))?)/gi,
    /case[\s-]fatality\s+(?:rate|ratio)[:\s]*(\d[\d,.]*)\s*%/gi,
  ];

  let deaths = '';
  let explicitFatalityRate = '';
  for (const pattern of deathPatterns) {
    const match = pattern.exec(fullText);
    if (match) {
      if (match[0].includes('%') || match[0].includes('fatality rate')) {
        explicitFatalityRate = match[1] + '%';
      } else {
        const parsed = parseNumber(match[1]);
        if (parsed && parsed > 0) {
          deaths = String(parsed);
        }
      }
      if (deaths || explicitFatalityRate) break;
    }
  }

  // Calculate fatality rate
  let fatalityRate = explicitFatalityRate;
  if (!fatalityRate && cases && deaths) {
    const c = parseInt(cases);
    const d = parseInt(deaths);
    if (c > 0 && d > 0) {
      fatalityRate = ((d / c) * 100).toFixed(1) + '%';
    }
  }

  // Determine spread status and details
  const spreadIndicators = {
    high: ['rapidly spreading', 'widespread', 'escalating', 'surge', 'outbreak expanding', 'increasing trend', 'significant increase', 'mass gathering', 'pandemic', 'epidemic spreading', 'community transmission', 'sustained transmission', 'accelerating', 'exponential', 'alarming', 'unprecedented'],
    medium: ['ongoing transmission', 'continued cases', 'new cases reported', 'sporadic cases', 'clusters', 'limited transmission', 'local transmission', 'small number of cases', 'stable'],
    low: ['contained', 'controlled', 'declining', 'decreasing trend', 'no new cases', 'resolved', 'under control', 'isolated cases', 'single case', 'eliminated', 'eradicated'],
  };

  let severity: 'low' | 'medium' | 'high' = 'medium';
  let spread = '';
  const spreadDetails: string[] = [];

  if (spreadIndicators.high.some(k => lowerText.includes(k))) {
    severity = 'high';
    spread = '快速扩散 / 持续升级';
  } else if (spreadIndicators.low.some(k => lowerText.includes(k))) {
    severity = 'low';
    spread = '已控制 / 趋势下降';
  } else {
    severity = 'medium';
    spread = '持续传播中';
  }

  // Collect spread details
  if (lowerText.includes('human-to-human')) spreadDetails.push('人传人');
  if (lowerText.includes('animal-to-human') || lowerText.includes('zoonotic')) spreadDetails.push('动物传人');
  if (lowerText.includes('travel-related') || lowerText.includes('imported case')) spreadDetails.push('旅行相关');
  if (lowerText.includes('multi-country') || lowerText.includes('multiple countries') || lowerText.includes('cross-border')) spreadDetails.push('多国蔓延');
  if (lowerText.includes('hospital') || lowerText.includes('healthcare')) spreadDetails.push('院内感染');
  if (lowerText.includes('asymptomatic')) spreadDetails.push('无症状传播');
  if (lowerText.includes('new variant') || lowerText.includes('mutation')) spreadDetails.push('变异株');

  // Determine alert level based on multiple factors
  let alertLevel: 'safe' | 'watch' | 'warning' | 'danger' = 'safe';
  let alertMessage = '';

  const caseNum = parseInt(cases) || 0;
  const deathNum = parseInt(deaths) || 0;
  const rate = fatalityRate ? parseFloat(fatalityRate) : 0;

  if (severity === 'high' && (caseNum > 1000 || rate > 5)) {
    alertLevel = 'danger';
    alertMessage = '高风险：疫情快速扩散，建议密切关注并做好防护准备';
  } else if (severity === 'high' || rate > 2 || caseNum > 500) {
    alertLevel = 'warning';
    alertMessage = '中高风险：疫情有扩散趋势，建议关注动态并储备基本防疫物资';
  } else if (severity === 'medium' || caseNum > 100) {
    alertLevel = 'watch';
    alertMessage = '关注中：疫情持续，建议保持基本防护意识';
  } else {
    alertLevel = 'safe';
    alertMessage = '低风险：疫情可控，保持日常卫生习惯即可';
  }

  // Add context to alert message
  if (spreadDetails.includes('人传人') && alertLevel !== 'danger') {
    alertMessage += '；存在人传人风险';
  }
  if (spreadDetails.includes('多国蔓延')) {
    alertMessage += '；已扩散至多国';
  }

  return {
    locations: [...locations].slice(0, 5),
    cases: caseNum > 0 ? caseNum.toLocaleString() : '',
    deaths: deathNum > 0 ? deathNum.toLocaleString() : '',
    fatalityRate,
    spread,
    spreadDetails,
    severity,
    alertLevel,
    alertMessage,
    rawText: text.slice(0, 300),
  };
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache<T>(key: string, data: T) {
  try { localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

// ── Main Component ──

export default function DiseaseTracker() {
  const { lang, t } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('disease');
  const [outbreaks, setOutbreaks] = useState<DonEntry[]>([]);
  const [covid, setCovid] = useState<CovidGlobal | null>(null);
  const [whoNews, setWhoNews] = useState<WhoNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // WHO DON
    try {
      const cached = getCache<DonEntry[]>('don');
      if (cached) {
        setOutbreaks(cached);
      } else {
        const res = await fetch(WHO_DON_API, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          const items: DonEntry[] = (data.value || []).map((v: any) => {
            const entry: DonEntry = {
              Title: v.Title,
              PublicationDate: v.PublicationDate,
              ItemDefaultUrl: v.ItemDefaultUrl,
              DonId: v.DonId,
              Overview: v.Overview,
              Assessment: v.Assessment,
            };
            entry.summary = parseOutbreakSummary(v.Overview || '', v.Assessment || '', v.Title);
            return entry;
          });
          setOutbreaks(items);
          setCache('don', items);
        }
      }
    } catch { /* ignore */ }

    // COVID stats
    try {
      const cached = getCache<CovidGlobal>('covid');
      if (cached) {
        setCovid(cached);
      } else {
        const res = await fetch(COVID_API, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          setCovid(data);
          setCache('covid', data);
        }
      }
    } catch { /* ignore */ }

    // WHO RSS news
    try {
      const cached = getCache<WhoNewsItem[]>('rss');
      if (cached) {
        setWhoNews(cached);
      } else {
        const res = await fetch(WHO_RSS_API, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          const items: WhoNewsItem[] = (data.items || []).slice(0, 10).map((v: any) => ({
            title: v.title,
            pubDate: v.pubDate,
            link: v.link,
            description: stripHtml(v.description || ''),
            categories: v.categories || [],
          }));
          setWhoNews(items);
          setCache('rss', items);
        }
      }
    } catch { /* ignore */ }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const toggleCheck = (id: string) => setChecked((p) => ({ ...p, [id]: !p[id] }));

  const PREP_CHECKLIST = lang === 'zh' ? [
    { id: 'mask', cat: '防护物资', text: '储备医用口罩 / N95 口罩 (建议 2 周用量)' },
    { id: 'sanitizer', cat: '防护物资', text: '储备酒精消毒液 / 免洗洗手液' },
    { id: 'gloves', cat: '防护物资', text: '一次性手套' },
    { id: 'medicine', cat: '药品储备', text: '退烧药 (布洛芬/对乙酰氨基酚)' },
    { id: 'cold_meds', cat: '药品储备', text: '感冒药、止咳药' },
    { id: 'thermometer', cat: '监测工具', text: '体温计 (电子/红外)' },
    { id: 'oximeter', cat: '监测工具', text: '血氧仪 (建议有老人小孩的家庭)' },
    { id: 'test_kit', cat: '监测工具', text: '抗原检测试剂盒' },
    { id: 'food', cat: '生活物资', text: '储备 1-2 周的食品和饮用水' },
    { id: 'vitamins', cat: '生活物资', text: '维生素 C、D 等营养补充剂' },
    { id: 'docs', cat: '信息准备', text: '记录附近医院/发热门诊地址和电话' },
    { id: 'insurance', cat: '信息准备', text: '确认医疗保险覆盖范围' },
  ] : [
    { id: 'mask', cat: 'Protection', text: 'Stock surgical/N95 masks (2-week supply)' },
    { id: 'sanitizer', cat: 'Protection', text: 'Stock alcohol sanitizer / hand sanitizer' },
    { id: 'gloves', cat: 'Protection', text: 'Disposable gloves' },
    { id: 'medicine', cat: 'Medicine', text: 'Fever reducers (Ibuprofen/Paracetamol)' },
    { id: 'cold_meds', cat: 'Medicine', text: 'Cold and cough medicine' },
    { id: 'thermometer', cat: 'Monitoring', text: 'Thermometer (digital/infrared)' },
    { id: 'oximeter', cat: 'Monitoring', text: 'Pulse oximeter (recommended for families)' },
    { id: 'test_kit', cat: 'Monitoring', text: 'Rapid antigen test kits' },
    { id: 'food', cat: 'Supplies', text: 'Stock 1-2 weeks of food and water' },
    { id: 'vitamins', cat: 'Supplies', text: 'Vitamin C, D supplements' },
    { id: 'docs', cat: 'Info', text: 'Note nearby hospital/fever clinic addresses and phones' },
    { id: 'insurance', cat: 'Info', text: 'Confirm health insurance coverage' },
  ];

  const checkedCount = PREP_CHECKLIST.filter((c) => checked[c.id]).length;

  // Detect disease keywords in outbreak titles
  const detectDisease = (title: string): string | null => {
    const t = title.toLowerCase();
    if (t.includes('covid') || t.includes('sars-cov')) return 'covid';
    if (t.includes('influenza') || t.includes('flu') || t.includes('h5n') || t.includes('h7n') || t.includes('h9n')) return t.includes('avian') || t.includes('h5n') || t.includes('h7n') || t.includes('h9n') ? 'avian_flu' : 'influenza';
    if (t.includes('measles')) return 'measles';
    if (t.includes('hantavirus')) return 'hantavirus';
    if (t.includes('mpox') || t.includes('monkeypox')) return 'mpox';
    return null;
  };

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="dt-layout">
        {/* Left: Outbreak News */}
        <div className="dt-left">
          {/* COVID Stats Bar */}
          {covid && (
            <div className="dt-covid-bar">
              <div className="dt-covid-title">{ui.covidGlobal || 'COVID-19 Global'}</div>
              <div className="dt-covid-stats">
                <div className="dt-covid-stat">
                  <span className="dt-covid-val">{formatNumber(covid.cases)}</span>
                  <span className="dt-covid-label">{ui.totalCases || 'Total Cases'}</span>
                </div>
                <div className="dt-covid-stat">
                  <span className="dt-covid-val dt-val-red">{formatNumber(covid.deaths)}</span>
                  <span className="dt-covid-label">{ui.totalDeaths || 'Deaths'}</span>
                </div>
                <div className="dt-covid-stat">
                  <span className="dt-covid-val dt-val-green">{formatNumber(covid.recovered)}</span>
                  <span className="dt-covid-label">{ui.recovered || 'Recovered'}</span>
                </div>
                <div className="dt-covid-stat">
                  <span className="dt-covid-val dt-val-amber">+{formatNumber(covid.todayCases)}</span>
                  <span className="dt-covid-label">{ui.todayCases || 'Today'}</span>
                </div>
              </div>
              <div className="dt-covid-updated">
                {ui.updated || 'Updated'}: {new Date(covid.updated).toLocaleString()}
              </div>
            </div>
          )}

          {/* WHO Outbreak News */}
          <div className="dt-section">
            <div className="dt-section-title">
              {ui.outbreakNews || 'WHO Disease Outbreak News'}
              <button className="cc-refresh-btn" onClick={fetchData} disabled={loading}>↻ {ui.refresh || 'Refresh'}</button>
            </div>
            {loading && outbreaks.length === 0 ? (
              <div className="dt-loading">{ui.loading || 'Loading...'}</div>
            ) : error ? (
              <div className="error-msg">{error}</div>
            ) : (
              <div className="dt-news-list">
                {outbreaks.map((item) => {
                  const dk = detectDisease(item.Title);
                  const s = item.summary;
                  return (
                    <div key={item.DonId} className="dt-news-item">
                      <div className="dt-news-meta">
                        <span className="dt-news-date">{new Date(item.PublicationDate).toLocaleDateString()}</span>
                        <span className="dt-news-id">{item.DonId}</span>
                        <span className="dt-news-ago">{timeAgo(item.PublicationDate, lang)}</span>
                        {s && (
                          <span className={`dt-severity dt-severity-${s.severity}`}>
                            {s.severity === 'high' ? '🔴' : s.severity === 'medium' ? '🟡' : '🟢'}
                            {s.severity === 'high' ? (lang === 'zh' ? '高风险' : 'High') : s.severity === 'medium' ? (lang === 'zh' ? '中风险' : 'Medium') : (lang === 'zh' ? '低风险' : 'Low')}
                          </span>
                        )}
                      </div>
                      <a
                        className="dt-news-title"
                        href={`https://www.who.int${item.ItemDefaultUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.Title}
                        <span className="priv-ref-ext">↗</span>
                      </a>
                      {s && (
                        <div className="dt-summary">
                          {s.locations.length > 0 && (
                            <div className="dt-summary-row">
                              <span className="dt-summary-icon">📍</span>
                              <span className="dt-summary-label">{ui.locations || 'Location'}:</span>
                              <span className="dt-summary-val">{s.locations.join(', ')}</span>
                            </div>
                          )}
                          {(s.cases || s.deaths) && (
                            <div className="dt-summary-row">
                              <span className="dt-summary-icon">📊</span>
                              {s.cases && <span className="dt-summary-val"><strong>{s.cases}</strong> {lang === 'zh' ? '例确诊' : 'cases'}</span>}
                              {s.cases && s.deaths && <span className="dt-summary-sep">·</span>}
                              {s.deaths && <span className="dt-summary-val dt-val-red"><strong>{s.deaths}</strong> {lang === 'zh' ? '例死亡' : 'deaths'}</span>}
                              {s.fatalityRate && <span className="dt-summary-sep">·</span>}
                              {s.fatalityRate && <span className="dt-summary-val">{lang === 'zh' ? '病死率' : 'CFR'}: <strong>{s.fatalityRate}</strong></span>}
                            </div>
                          )}
                          {s.spread && (
                            <div className="dt-summary-row">
                              <span className="dt-summary-icon">📡</span>
                              <span className="dt-summary-label">{ui.spread || 'Spread'}:</span>
                              <span className="dt-summary-val">{s.spread}</span>
                            </div>
                          )}
                          {s.spreadDetails.length > 0 && (
                            <div className="dt-spread-tags">
                              {s.spreadDetails.map((tag, i) => (
                                <span key={i} className="dt-spread-tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          {s.alertMessage && (
                            <div className={`dt-alert dt-alert-${s.alertLevel}`}>
                              <span className="dt-alert-icon">
                                {s.alertLevel === 'danger' ? '🚨' : s.alertLevel === 'warning' ? '⚠️' : s.alertLevel === 'watch' ? '👁️' : '✅'}
                              </span>
                              <span className="dt-alert-text">{s.alertMessage}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {dk && (
                        <button className="dt-news-info-btn" onClick={() => setSelectedDisease(dk)}>
                          {ui.viewInfo || 'View Info'}: {DISEASES[dk]?.[lang]?.name}
                        </button>
                      )}
                    </div>
                  );
                })}
                {outbreaks.length === 0 && !loading && (
                  <div className="dt-empty">{ui.noData || 'No outbreak data available'}</div>
                )}
              </div>
            )}
          </div>

          {/* WHO General News */}
          {whoNews.length > 0 && (
            <div className="dt-section">
              <div className="dt-section-title">{ui.whoNews || 'WHO Latest News'}</div>
              <div className="dt-news-list">
                {whoNews.map((item, i) => (
                  <div key={i} className="dt-news-item">
                    <div className="dt-news-meta">
                      <span className="dt-news-date">{new Date(item.pubDate).toLocaleDateString()}</span>
                      <span className="dt-news-ago">{timeAgo(item.pubDate, lang)}</span>
                    </div>
                    <a className="dt-news-title" href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                      <span className="priv-ref-ext">↗</span>
                    </a>
                    {item.description && <div className="dt-news-desc">{item.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Disease Info + Checklist */}
        <div className="dt-right">
          {/* Disease Selector */}
          <div className="dt-section">
            <div className="dt-section-title">{ui.diseaseInfo || 'Disease Encyclopedia'}</div>
            <div className="dt-disease-grid">
              {Object.entries(DISEASES).map(([key, d]) => (
                <button
                  key={key}
                  className={`dt-disease-btn${selectedDisease === key ? ' dt-disease-active' : ''}`}
                  onClick={() => setSelectedDisease(selectedDisease === key ? null : key)}
                >
                  {d[lang].name.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Disease Detail */}
          {selectedDisease && DISEASES[selectedDisease] && (
            <div className="dt-section dt-disease-detail">
              <div className="dt-disease-name">{DISEASES[selectedDisease][lang].name}</div>
              <p className="dt-disease-desc">{DISEASES[selectedDisease][lang].desc}</p>
              <div className="dt-disease-subtitle">{ui.symptoms || 'Symptoms'}</div>
              <ul className="dt-disease-list">
                {DISEASES[selectedDisease][lang].symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              <div className="dt-disease-subtitle">{ui.prevention || 'Prevention'}</div>
              <ul className="dt-disease-list dt-list-green">
                {DISEASES[selectedDisease][lang].prevention.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {/* Preparation Checklist */}
          <div className="dt-section">
            <button className="dt-checklist-toggle" onClick={() => setShowChecklist(!showChecklist)}>
              <span className={`priv-advanced-arrow${showChecklist ? ' priv-advanced-arrow-open' : ''}`}>&#9654;</span>
              {ui.prepChecklist || 'Preparation Checklist'}
              <span className="dt-checklist-count">{checkedCount}/{PREP_CHECKLIST.length}</span>
            </button>
            {showChecklist && (
              <div className="dt-checklist">
                {PREP_CHECKLIST.map((item) => (
                  <label key={item.id} className={`dt-check-item${checked[item.id] ? ' dt-check-done' : ''}`}>
                    <input type="checkbox" checked={!!checked[item.id]} onChange={() => toggleCheck(item.id)} />
                    <span className="dt-check-cat">{item.cat}</span>
                    <span className="dt-check-text">{item.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Help Section */}
          {help && (
            <div className="dt-section dt-help-section">
              <HelpSection title={help.title} features={help.features} usage={help.usage} />
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
