import { useState } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

type CountryId = 'CN' | 'US' | 'JP' | 'GB' | 'DE' | 'KR' | 'FR' | 'CA' | 'AU' | 'SG';

interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal: string;
  country: string;
}

// ── Real address data pools ──

const CN = {
  surnames: ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'],
  givenNames: ['伟', '芳', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '华', '玲', '军', '平', '志远', '思琪', '子涵', '浩然', '欣怡', '雨桐', '一诺', '宇航'],
  cities: [
    { city: '北京市', state: '北京市', postal: () => `10${rnd(0,9)}${rnd(10,99)}` },
    { city: '上海市', state: '上海市', postal: () => `20${rnd(0,9)}${rnd(10,99)}` },
    { city: '广州市', state: '广东省', postal: () => `51${rnd(0,9)}${rnd(10,99)}` },
    { city: '深圳市', state: '广东省', postal: () => `518${rnd(0,9)}${rnd(10,99)}` },
    { city: '杭州市', state: '浙江省', postal: () => `310${rnd(0,9)}${rnd(10,99)}` },
    { city: '成都市', state: '四川省', postal: () => `610${rnd(0,9)}${rnd(10,99)}` },
    { city: '武汉市', state: '湖北省', postal: () => `430${rnd(0,9)}${rnd(10,99)}` },
    { city: '南京市', state: '江苏省', postal: () => `210${rnd(0,9)}${rnd(10,99)}` },
    { city: '重庆市', state: '重庆市', postal: () => `400${rnd(0,9)}${rnd(10,99)}` },
    { city: '西安市', state: '陕西省', postal: () => `710${rnd(0,9)}${rnd(10,99)}` },
    { city: '天津市', state: '天津市', postal: () => `300${rnd(0,9)}${rnd(10,99)}` },
    { city: '苏州市', state: '江苏省', postal: () => `215${rnd(0,9)}${rnd(10,99)}` },
  ],
  districts: ['朝阳区', '海淀区', '浦东新区', '天河区', '南山区', '西湖区', '武侯区', '鼓楼区', '雨花台区', '雁塔区', '和平区', '姑苏区', '福田区', '龙华区', '江干区', '余杭区', '锦江区', '青羊区', '玄武区', '建邺区'],
  streets: ['人民路', '中山路', '解放大道', '建设路', '和平街', '文化路', '胜利路', '长安街', '建国路', '学院路', '科技路', '创业大道', '湖滨路', '花园路', '光明路', '新华路', '朝阳路', '迎宾大道', '创新路', '发展大道'],
  phonePrefix: ['138', '139', '136', '158', '159', '188', '189', '135', '137', '150', '151', '152', '186', '187', '176', '177', '166', '199'],
  format: (a: Address) => `${a.state} ${a.city}${a.line1}\n${a.name} 收\n${a.phone}\n${a.postal}`,
};

const US = {
  firstNames: ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen'],
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'],
  cities: [
    { city: 'New York', state: 'NY', postal: () => `100${rnd(10,99)}` },
    { city: 'Los Angeles', state: 'CA', postal: () => `900${rnd(10,99)}` },
    { city: 'Chicago', state: 'IL', postal: () => `606${rnd(10,99)}` },
    { city: 'Houston', state: 'TX', postal: () => `770${rnd(10,99)}` },
    { city: 'Phoenix', state: 'AZ', postal: () => `850${rnd(10,99)}` },
    { city: 'San Francisco', state: 'CA', postal: () => `941${rnd(10,99)}` },
    { city: 'Seattle', state: 'WA', postal: () => `981${rnd(10,99)}` },
    { city: 'Boston', state: 'MA', postal: () => `021${rnd(10,99)}` },
    { city: 'Portland', state: 'OR', postal: () => `972${rnd(10,99)}` },
    { city: 'Austin', state: 'TX', postal: () => `787${rnd(10,99)}` },
  ],
  streetNames: ['Main', 'Oak', 'Maple', 'Cedar', 'Elm', 'Pine', 'Walnut', 'Washington', 'Park', 'Lake', 'Hill', 'Forest', 'River', 'Sunset', 'Broadway', 'Market', 'Church', 'Spring', 'Highland', 'Union'],
  streetTypes: ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Ct', 'Way', 'Pl', 'Rd'],
  format: (a: Address) => `${a.name}\n${a.line1}\n${a.city}, ${a.state} ${a.postal}\nUnited States`,
};

const JP = {
  lastNames: ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '松本', '井上', '木村', '林', '斎藤', '清水', '山崎', '阿部'],
  firstNames: ['太郎', '花子', '一郎', '美咲', '健太', 'さくら', '大輔', '由美', '翔', '結衣', '悠人', '陽菜', '蓮', '凛', '颯太', '芽依', '隼', '葵', '悠真', '莉子'],
  cities: [
    { city: '東京都渋谷区', postal: () => `150-${rnd(100,999)}` },
    { city: '東京都新宿区', postal: () => `160-${rnd(100,999)}` },
    { city: '東京都港区', postal: () => `106-${rnd(100,999)}` },
    { city: '大阪市中央区', postal: () => `542-${rnd(100,999)}` },
    { city: '横浜市西区', postal: () => `220-${rnd(100,999)}` },
    { city: '名古屋市中区', postal: () => `460-${rnd(100,999)}` },
    { city: '京都市中京区', postal: () => `604-${rnd(100,999)}` },
    { city: '福岡市中央区', postal: () => `810-${rnd(100,999)}` },
    { city: '札幌市中央区', postal: () => `060-${rnd(100,999)}` },
    { city: '仙台市青葉区', postal: () => `980-${rnd(100,999)}` },
  ],
  towns: ['神宮前', '恵比寿', '代官山', '表参道', '銀座', '丸の内', '六本木', '浅草', '上野', '池袋', '品川', '大手町', '日本橋', '築地', 'お台場'],
  format: (a: Address) => `〒${a.postal}\n${a.city}${a.line1}\n${a.name} 様\n${a.phone}`,
};

const GB = {
  firstNames: ['Oliver', 'Amelia', 'George', 'Isla', 'Harry', 'Ava', 'Noah', 'Emily', 'Jack', 'Sophia', 'Leo', 'Lily', 'Charlie', 'Grace', 'Oscar', 'Mia', 'Jacob', 'Freya', 'Thomas', 'Rosie'],
  lastNames: ['Smith', 'Jones', 'Williams', 'Taylor', 'Davies', 'Brown', 'Wilson', 'Evans', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Robinson', 'Wood', 'Thompson', 'White', 'Watson', 'Jackson', 'Wright'],
  cities: [
    { city: 'London', postal: () => `EC${rnd(1,4)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Manchester', postal: () => `M${rnd(1,3)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Birmingham', postal: () => `B${rnd(1,5)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Edinburgh', postal: () => `EH${rnd(1,3)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Bristol', postal: () => `BS${rnd(1,3)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Leeds', postal: () => `LS${rnd(1,3)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Liverpool', postal: () => `L${rnd(1,3)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
    { city: 'Oxford', postal: () => `OX${rnd(1,3)} ${rnd(1,9)}${String.fromCharCode(65+rnd(0,25))}${String.fromCharCode(65+rnd(0,25))}` },
  ],
  streets: ['High Street', 'Station Road', 'Church Lane', 'Park Avenue', 'Victoria Road', 'George Street', 'King Street', 'Queen Street', 'Broadway', 'Mill Lane', 'The Green', 'West End', 'London Road', 'New Street', 'Market Place'],
  format: (a: Address) => `${a.name}\n${a.line1}\n${a.city}\n${a.postal}\nUnited Kingdom`,
};

const DE = {
  firstNames: ['Lukas', 'Mia', 'Finn', 'Emma', 'Leon', 'Hannah', 'Paul', 'Sophie', 'Max', 'Emilia', 'Felix', 'Marie', 'Noah', 'Lena', 'Elias', 'Lea', 'Ben', 'Clara', 'Henry', 'Anna'],
  lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Hartmann'],
  cities: [
    { city: 'Berlin', state: 'Berlin', postal: () => `10${rnd(10,99)}${rnd(10,99)}` },
    { city: 'München', state: 'Bayern', postal: () => `80${rnd(10,99)}${rnd(10,99)}` },
    { city: 'Hamburg', state: 'Hamburg', postal: () => `20${rnd(10,99)}${rnd(10,99)}` },
    { city: 'Frankfurt', state: 'Hessen', postal: () => `60${rnd(10,99)}${rnd(10,99)}` },
    { city: 'Köln', state: 'Nordrhein-Westfalen', postal: () => `50${rnd(10,99)}${rnd(10,99)}` },
    { city: 'Stuttgart', state: 'Baden-Württemberg', postal: () => `70${rnd(10,99)}${rnd(10,99)}` },
    { city: 'Düsseldorf', state: 'Nordrhein-Westfalen', postal: () => `40${rnd(10,99)}${rnd(10,99)}` },
    { city: 'Leipzig', state: 'Sachsen', postal: () => `04${rnd(10,99)}${rnd(10,99)}` },
  ],
  streets: ['Hauptstraße', 'Berliner Straße', 'Schulstraße', 'Gartenstraße', 'Bahnhofstraße', 'Dorfstraße', 'Ringstraße', 'Bergstraße', 'Waldstraße', 'Kirchstraße', 'Lindenstraße', 'Marktstraße'],
  format: (a: Address) => `${a.name}\n${a.line1}\n${a.postal} ${a.city}\nGermany`,
};

const KR = {
  lastNames: ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'],
  firstNames: ['민수', '지영', '현우', '수진', '준호', '은지', '성민', '미래', '도윤', '서연', '시우', '하은', '지호', '서현', '주원', '윤서', '건우', '예은', '태현', '수빈'],
  cities: [
    { city: '서울특별시', state: '서울', postal: () => `0${rnd(1,6)}${rnd(100,999)}` },
    { city: '부산광역시', state: '부산', postal: () => `4${rnd(1,9)}${rnd(100,999)}` },
    { city: '인천광역시', state: '인천', postal: () => `2${rnd(1,3)}${rnd(100,999)}` },
    { city: '대전광역시', state: '대전', postal: () => `3${rnd(1,5)}${rnd(100,999)}` },
    { city: '대구광역시', state: '대구', postal: () => `4${rnd(1,9)}${rnd(100,999)}` },
    { city: '광주광역시', state: '광주', postal: () => `6${rnd(1,2)}${rnd(100,999)}` },
    { city: '수원시', state: '경기도', postal: () => `16${rnd(1,9)}${rnd(100,999)}` },
  ],
  dongs: ['강남구', '서초구', '송파구', '마포구', '영등포구', '종로구', '중구', '용산구', '성동구', '동작구'],
  streets: ['테헤란로', '강남대로', '올림픽로', '성수이로', '도산대로', '삼성로', '봉은사로', '학동로', '논현로', '역삼로'],
  format: (a: Address) => `${a.name}\n${a.line1}\n${a.city} ${a.state}\n(${a.postal}) Republic of Korea`,
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rnd(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateAddress(country: CountryId): Address {
  switch (country) {
    case 'CN': {
      const c = pick(CN.cities);
      return {
        name: pick(CN.surnames) + pick(CN.givenNames),
        phone: pick(CN.phonePrefix) + String(rnd(10000000, 99999999)),
        line1: pick(CN.districts) + pick(CN.streets) + rnd(1, 200) + '号',
        city: c.city, state: c.state, postal: c.postal(),
        country: '中国',
      };
    }
    case 'US': {
      const c = pick(US.cities);
      return {
        name: pick(US.firstNames) + ' ' + pick(US.lastNames),
        phone: `+1 (${rnd(200, 999)}) ${rnd(100, 999)}-${rnd(1000, 9999)}`,
        line1: rnd(10, 9999) + ' ' + pick(US.streetNames) + ' ' + pick(US.streetTypes),
        city: c.city, state: c.state, postal: c.postal(),
        country: 'United States',
      };
    }
    case 'JP': {
      const c = pick(JP.cities);
      return {
        name: pick(JP.lastNames) + ' ' + pick(JP.firstNames),
        phone: `+81-${rnd(3,6)}0-${rnd(1000,9999)}-${rnd(1000,9999)}`,
        line1: pick(JP.towns) + rnd(1, 20) + '-' + rnd(1, 15) + '-' + rnd(1, 20),
        city: c.city, postal: c.postal(),
        country: '日本',
      };
    }
    case 'GB': {
      const c = pick(GB.cities);
      return {
        name: pick(GB.firstNames) + ' ' + pick(GB.lastNames),
        phone: `+44 ${rnd(1000,9999)} ${rnd(100000,999999)}`,
        line1: rnd(1, 200) + ' ' + pick(GB.streets),
        city: c.city, postal: c.postal(),
        country: 'United Kingdom',
      };
    }
    case 'DE': {
      const c = pick(DE.cities);
      return {
        name: pick(DE.firstNames) + ' ' + pick(DE.lastNames),
        phone: `+49 ${rnd(100,999)} ${rnd(1000000,9999999)}`,
        line1: pick(DE.streets) + ' ' + rnd(1, 200),
        city: c.city, state: c.state, postal: c.postal(),
        country: 'Germany',
      };
    }
    case 'KR': {
      const c = pick(KR.cities);
      return {
        name: pick(KR.lastNames) + pick(KR.firstNames),
        phone: `+82-10-${rnd(1000,9999)}-${rnd(1000,9999)}`,
        line1: pick(KR.dongs) + ' ' + pick(KR.streets) + ' ' + rnd(1, 200),
        city: c.city, state: c.state, postal: c.postal(),
        country: '대한민국',
      };
    }
    case 'FR': {
      return {
        name: pick(['Jean', 'Pierre', 'Marie', 'Sophie', 'Louis', 'Camille', 'Antoine', 'Juliette', 'Hugo', 'Léa']) + ' ' + pick(['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Moreau']),
        phone: `+33 ${rnd(1,9)} ${rnd(10,99)} ${rnd(10,99)} ${rnd(10,99)} ${rnd(10,99)}`,
        line1: rnd(1, 200) + ' ' + pick(['Rue de la Paix', 'Avenue des Champs-Élysées', 'Boulevard Saint-Germain', 'Rue de Rivoli', 'Avenue Montaigne', 'Rue du Faubourg', 'Place Bellecour', 'Cours de la Liberté']),
        city: pick(['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille', 'Nantes']),
        postal: `${rnd(10,99)}00${rnd(0,9)}`,
        country: 'France',
      };
    }
    case 'CA': {
      return {
        name: pick(['Liam', 'Olivia', 'Noah', 'Emma', 'Ethan', 'Ava', 'Mason', 'Sophia', 'Logan', 'Isabella']) + ' ' + pick(['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'MacDonald', 'Gagnon', 'Johnson', 'Taylor']),
        phone: `+1 (${rnd(200,999)}) ${rnd(100,999)}-${rnd(1000,9999)}`,
        line1: rnd(10, 9999) + ' ' + pick(['King Street', 'Queen Street', 'Main Street', 'Bay Street', 'Yonge Street', 'Elm Street', 'Maple Avenue', 'Oak Drive']),
        city: pick(['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Halifax']),
        state: pick(['ON', 'BC', 'QC', 'AB', 'MB', 'NS']),
        postal: `${String.fromCharCode(65+rnd(0,25))}${rnd(0,9)}${String.fromCharCode(65+rnd(0,25))} ${rnd(0,9)}${String.fromCharCode(65+rnd(0,25))}${rnd(0,9)}`,
        country: 'Canada',
      };
    }
    case 'AU': {
      return {
        name: pick(['Jack', 'Oliver', 'William', 'Charlotte', 'Mia', 'Noah', 'Thomas', 'Amelia', 'James', 'Isla']) + ' ' + pick(['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Anderson', 'Martin']),
        phone: `+61 ${rnd(2,9)} ${rnd(1000,9999)} ${rnd(1000,9999)}`,
        line1: rnd(1, 200) + ' ' + pick(['George Street', 'Collins Street', 'Bourke Street', 'King William Street', 'Elizabeth Street', 'Pitt Street', 'Queen Street', 'Adelaide Terrace']),
        city: pick(['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Darwin']),
        state: pick(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT', 'TAS', 'NT']),
        postal: String(rnd(1000, 9999)),
        country: 'Australia',
      };
    }
    case 'SG': {
      return {
        name: pick(['Wei Jie', 'Jia Yi', 'Zi Yang', 'Xin Yi', 'Jun Wei', 'Hui Min', 'Cheng Wei', 'Li Ting', 'Ming Xuan', 'Yu Xuan']),
        phone: `+65 ${rnd(8,9)}${rnd(100,999)} ${rnd(1000,9999)}`,
        line1: rnd(1, 200) + ' ' + pick(['Orchard Road', 'Raffles Place', 'Marina Bay', 'Tanjong Pagar', 'Bugis', 'Ang Mo Kio', 'Tampines', 'Jurong East']) + ' #' + rnd(1, 20) + '-' + rnd(1, 99),
        city: 'Singapore',
        postal: String(rnd(100000, 999999)),
        country: 'Singapore',
      };
    }
  }
}

const COUNTRIES: { id: CountryId; label: string; flag: string }[] = [
  { id: 'CN', label: '中国', flag: '🇨🇳' },
  { id: 'US', label: '美国', flag: '🇺🇸' },
  { id: 'JP', label: '日本', flag: '🇯🇵' },
  { id: 'GB', label: '英国', flag: '🇬🇧' },
  { id: 'DE', label: '德国', flag: '🇩🇪' },
  { id: 'KR', label: '韩国', flag: '🇰🇷' },
  { id: 'FR', label: '法国', flag: '🇫🇷' },
  { id: 'CA', label: '加拿大', flag: '🇨🇦' },
  { id: 'AU', label: '澳大利亚', flag: '🇦🇺' },
  { id: 'SG', label: '新加坡', flag: '🇸🇬' },
];

export default function AddressGenerator() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('addressGen');
  const [country, setCountry] = useState<CountryId>('CN');
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<Address[]>([]);

  const generate = () => {
    setResults(Array.from({ length: count }, () => generateAddress(country)));
  };

  const copyAll = () => {
    const text = results.map((a, i) => `--- #${i + 1} ---\n${formatAddress(a, lang)}`).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const copyOne = (addr: Address) => navigator.clipboard.writeText(formatAddress(addr, lang));

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">{t('common.settings')}</div>
          <div className="uuid-config">
            <div className="uuid-config-row">
              <label>{ui.country}</label>
              <div className="panel-actions" style={{ flexWrap: 'wrap' }}>
                {COUNTRIES.map((c) => (
                  <button key={c.id} className={`panel-btn panel-btn-sm${country === c.id ? ' accent' : ''}`} onClick={() => setCountry(c.id)}>
                    {c.flag} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="uuid-config-row">
              <label>{ui.count}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', minWidth: 24 }}>{count}</span>
              </div>
            </div>
            <button className="panel-btn accent" onClick={generate} style={{ marginTop: 8, width: '100%' }}>{ui.generate}</button>
          </div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">
            {t('common.output')}
            {results.length > 0 && (
              <div className="panel-actions">
                <button className="panel-btn" onClick={copyAll}>{ui.copyAll}</button>
              </div>
            )}
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', maxHeight: 500 }}>
            {results.length > 0 ? results.map((addr, i) => (
              <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-mono)', lineHeight: 1.8, position: 'relative' }}>
                <button className="panel-btn panel-btn-sm" onClick={() => copyOne(addr)} style={{ position: 'absolute', top: 8, right: 8 }}>{t('common.copy')}</button>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>{formatAddress(addr, lang)}</pre>
              </div>
            )) : (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('common.waiting')}</div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}

function formatAddress(a: Address, lang: string): string {
  const isZh = lang === 'zh';
  const L = {
    name: isZh ? '姓名' : 'Name',
    phone: isZh ? '电话' : 'Phone',
    address: isZh ? '地址' : 'Address',
    city: isZh ? '城市' : 'City',
    postal: isZh ? '邮编' : 'Postal',
    country: isZh ? '国家' : 'Country',
  };
  const lines = [];
  lines.push(`${L.name}: ${a.name}`);
  lines.push(`${L.phone}: ${a.phone}`);
  lines.push(`${L.address}: ${a.line1}`);
  if (a.line2) lines.push(`  ${a.line2}`);
  const cityLine = [a.state, a.city].filter(Boolean).join(' ');
  lines.push(`${L.city}: ${cityLine}`);
  lines.push(`${L.postal}: ${a.postal}`);
  if (a.country) lines.push(`${L.country}: ${a.country}`);
  return lines.join('\n');
}
