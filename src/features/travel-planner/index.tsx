import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { useToast } from '../../shared/context/ToastContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

interface Attraction { name: string; type: string; desc: string; seasons: string[]; }
interface City { id: string; name: string; lat: number; lng: number; province: string; attractions: Attraction[]; }
interface Route { id: number; startId: string; includeStartCity: boolean; cities: string[]; days: number; theme: string; desc: string; }
interface LlmConfig { provider: string; apiKey: string; model: string; baseUrl: string; }

const STORAGE_KEY = 'travel_llm_config';

// ── Season utils ──

function getCurrentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return '春';
  if (m >= 5 && m <= 7) return '夏';
  if (m >= 8 && m <= 10) return '秋';
  return '冬';
}

const SEASONS = ['春', '夏', '秋', '冬'];
const SEASON_LABELS: Record<string, { zh: string; en: string }> = {
  '春': { zh: '春季 (3-5月)', en: 'Spring (Mar-May)' },
  '夏': { zh: '夏季 (6-8月)', en: 'Summer (Jun-Aug)' },
  '秋': { zh: '秋季 (9-11月)', en: 'Autumn (Sep-Nov)' },
  '冬': { zh: '冬季 (12-2月)', en: 'Winter (Dec-Feb)' },
};

// ── City & Attraction Data (50 cities, 200+ attractions) ──

const CITIES: City[] = [
  // ── 华北 ──
  { id: 'beijing', name: '北京', lat: 39.90, lng: 116.40, province: '北京', attractions: [
    { name: '故宫', type: '历史', desc: '明清皇宫，世界文化遗产', seasons: ['春', '秋', '冬'] },
    { name: '长城(八达岭)', type: '历史', desc: '万里长城最著名段落', seasons: ['春', '秋'] },
    { name: '天坛', type: '历史', desc: '明清祭天场所', seasons: ['春', '秋', '冬'] },
    { name: '颐和园', type: '园林', desc: '皇家园林，昆明湖万寿山', seasons: ['春', '夏', '秋'] },
    { name: '南锣鼓巷', type: '街区', desc: '老北京胡同文化体验', seasons: ['春', '秋', '冬'] },
    { name: '什刹海', type: '街区', desc: '老北京风情，冬天可滑冰', seasons: ['春', '秋', '冬'] },
  ]},
  { id: 'tianjin', name: '天津', lat: 39.08, lng: 117.20, province: '天津', attractions: [
    { name: '五大道', type: '街区', desc: '万国建筑博物馆', seasons: ['春', '秋'] },
    { name: '古文化街', type: '街区', desc: '天津民俗文化', seasons: ['春', '秋', '冬'] },
    { name: '瓷房子', type: '历史', desc: '瓷片贴面的法式建筑', seasons: ['春', '夏', '秋'] },
  ]},
  { id: 'chengde', name: '承德', lat: 40.95, lng: 117.96, province: '河北', attractions: [
    { name: '避暑山庄', type: '历史', desc: '清代皇家园林，夏都', seasons: ['夏', '秋'] },
    { name: '外八庙', type: '历史', desc: '藏传佛教寺庙群', seasons: ['夏', '秋'] },
  ]},
  // ── 华东 ──
  { id: 'shanghai', name: '上海', lat: 31.23, lng: 121.47, province: '上海', attractions: [
    { name: '外滩', type: '地标', desc: '万国建筑博览群', seasons: ['春', '秋', '冬'] },
    { name: '东方明珠', type: '地标', desc: '上海地标电视塔', seasons: ['春', '秋'] },
    { name: '豫园', type: '园林', desc: '江南古典园林', seasons: ['春', '秋'] },
    { name: '田子坊', type: '街区', desc: '文艺创意街区', seasons: ['春', '秋'] },
    { name: '迪士尼', type: '主题', desc: '上海迪士尼乐园', seasons: ['春', '秋'] },
  ]},
  { id: 'hangzhou', name: '杭州', lat: 30.27, lng: 120.15, province: '浙江', attractions: [
    { name: '西湖', type: '自然', desc: '人间天堂，世界文化遗产', seasons: ['春', '夏', '秋'] },
    { name: '灵隐寺', type: '历史', desc: '千年古刹', seasons: ['春', '秋'] },
    { name: '龙井村', type: '体验', desc: '品龙井茶，赏茶园风光', seasons: ['春'] },
    { name: '宋城', type: '主题', desc: '宋文化主题公园', seasons: ['春', '夏', '秋'] },
    { name: '千岛湖', type: '自然', desc: '天下第一秀水', seasons: ['夏', '秋'] },
  ]},
  { id: 'suzhou', name: '苏州', lat: 31.30, lng: 120.59, province: '江苏', attractions: [
    { name: '拙政园', type: '园林', desc: '中国四大名园之首', seasons: ['春', '夏', '秋'] },
    { name: '虎丘', type: '历史', desc: '吴中第一名胜', seasons: ['春', '秋'] },
    { name: '平江路', type: '街区', desc: '水乡古街', seasons: ['春', '秋'] },
    { name: '周庄', type: '小镇', desc: '中国第一水乡', seasons: ['春', '秋'] },
  ]},
  { id: 'nanjing', name: '南京', lat: 32.06, lng: 118.80, province: '江苏', attractions: [
    { name: '中山陵', type: '历史', desc: '孙中山先生陵墓', seasons: ['春', '秋'] },
    { name: '夫子庙', type: '历史', desc: '秦淮河畔文化地标', seasons: ['春', '秋', '冬'] },
    { name: '明孝陵', type: '历史', desc: '明太祖朱元璋陵墓', seasons: ['春', '秋'] },
    { name: '玄武湖', type: '自然', desc: '城中湖泊公园', seasons: ['春', '夏', '秋'] },
  ]},
  { id: 'huangshan', name: '黄山', lat: 30.14, lng: 118.17, province: '安徽', attractions: [
    { name: '黄山风景区', type: '自然', desc: '五岳归来不看山', seasons: ['春', '秋', '冬'] },
    { name: '宏村', type: '历史', desc: '画里乡村，世界文化遗产', seasons: ['春', '秋'] },
    { name: '西递', type: '历史', desc: '明清古村落', seasons: ['春', '秋'] },
  ]},
  { id: 'qingdao', name: '青岛', lat: 36.07, lng: 120.38, province: '山东', attractions: [
    { name: '栈桥', type: '地标', desc: '青岛标志性建筑', seasons: ['夏', '秋'] },
    { name: '八大关', type: '街区', desc: '万国建筑群', seasons: ['春', '夏', '秋'] },
    { name: '崂山', type: '自然', desc: '海上第一名山', seasons: ['春', '夏', '秋'] },
    { name: '金沙滩', type: '自然', desc: '亚洲第一滩', seasons: ['夏'] },
  ]},
  { id: 'xiamen', name: '厦门', lat: 24.48, lng: 118.09, province: '福建', attractions: [
    { name: '鼓浪屿', type: '历史', desc: '万国建筑博物馆', seasons: ['春', '秋', '冬'] },
    { name: '南普陀寺', type: '历史', desc: '闽南佛教圣地', seasons: ['春', '秋'] },
    { name: '曾厝垵', type: '街区', desc: '文艺渔村', seasons: ['春', '秋'] },
    { name: '环岛路', type: '自然', desc: '海滨骑行路线', seasons: ['秋', '冬'] },
  ]},
  // ── 华南 ──
  { id: 'guangzhou', name: '广州', lat: 23.13, lng: 113.26, province: '广东', attractions: [
    { name: '广州塔', type: '地标', desc: '小蛮腰', seasons: ['秋', '冬'] },
    { name: '陈家祠', type: '历史', desc: '岭南建筑典范', seasons: ['秋', '冬'] },
    { name: '沙面', type: '街区', desc: '欧陆风情小岛', seasons: ['秋', '冬'] },
    { name: '白云山', type: '自然', desc: '羊城第一秀', seasons: ['秋', '冬'] },
  ]},
  { id: 'shenzhen', name: '深圳', lat: 22.54, lng: 114.06, province: '广东', attractions: [
    { name: '世界之窗', type: '主题', desc: '微缩世界景观', seasons: ['秋', '冬'] },
    { name: '大梅沙', type: '自然', desc: '海滨浴场', seasons: ['夏'] },
    { name: '华侨城', type: '主题', desc: '创意文化园', seasons: ['秋', '冬'] },
  ]},
  { id: 'sanya', name: '三亚', lat: 18.25, lng: 109.51, province: '海南', attractions: [
    { name: '亚龙湾', type: '自然', desc: '天下第一湾', seasons: ['冬', '春'] },
    { name: '天涯海角', type: '地标', desc: '浪漫海滨胜地', seasons: ['冬', '春'] },
    { name: '南山寺', type: '历史', desc: '南海观音', seasons: ['冬', '春'] },
    { name: '蜈支洲岛', type: '自然', desc: '潜水胜地', seasons: ['冬', '春'] },
  ]},
  { id: 'zhuhai', name: '珠海', lat: 22.27, lng: 113.58, province: '广东', attractions: [
    { name: '长隆海洋王国', type: '主题', desc: '世界级海洋主题公园', seasons: ['春', '秋', '冬'] },
    { name: '情侣路', type: '自然', desc: '海滨浪漫之路', seasons: ['秋', '冬'] },
  ]},
  // ── 华中 ──
  { id: 'changsha', name: '长沙', lat: 28.23, lng: 112.94, province: '湖南', attractions: [
    { name: '橘子洲头', type: '自然', desc: '湘江中的绿洲', seasons: ['春', '秋'] },
    { name: '岳麓山', type: '自然', desc: '千年学府岳麓书院', seasons: ['春', '秋'] },
    { name: '太平老街', type: '街区', desc: '长沙美食文化街', seasons: ['春', '秋', '冬'] },
    { name: '张家界', type: '自然', desc: '阿凡达取景地', seasons: ['春', '秋'] },
  ]},
  { id: 'wuhan', name: '武汉', lat: 30.59, lng: 114.31, province: '湖北', attractions: [
    { name: '黄鹤楼', type: '历史', desc: '天下江山第一楼', seasons: ['春', '秋'] },
    { name: '东湖', type: '自然', desc: '中国最大城中湖', seasons: ['春'] },
    { name: '户部巷', type: '美食', desc: '武汉早点一条街', seasons: ['春', '秋', '冬'] },
    { name: '武大樱花', type: '自然', desc: '三月樱花季', seasons: ['春'] },
  ]},
  { id: 'luoyang', name: '洛阳', lat: 34.68, lng: 112.45, province: '河南', attractions: [
    { name: '龙门石窟', type: '历史', desc: '中国四大石窟之一', seasons: ['春', '秋'] },
    { name: '白马寺', type: '历史', desc: '中国第一古刹', seasons: ['春', '秋'] },
    { name: '老君山', type: '自然', desc: '道教圣地', seasons: ['春', '夏', '秋'] },
    { name: '洛阳牡丹', type: '自然', desc: '四月牡丹花会', seasons: ['春'] },
  ]},
  { id: 'zhengzhou', name: '郑州', lat: 34.75, lng: 113.65, province: '河南', attractions: [
    { name: '少林寺', type: '历史', desc: '天下武功出少林', seasons: ['春', '秋'] },
    { name: '嵩山', type: '自然', desc: '五岳之中岳', seasons: ['春', '秋'] },
  ]},
  // ── 西南 ──
  { id: 'chengdu', name: '成都', lat: 30.57, lng: 104.07, province: '四川', attractions: [
    { name: '大熊猫基地', type: '自然', desc: '近距离观赏大熊猫', seasons: ['春', '秋', '冬'] },
    { name: '宽窄巷子', type: '街区', desc: '老成都文化缩影', seasons: ['春', '秋', '冬'] },
    { name: '锦里', type: '街区', desc: '三国文化一条街', seasons: ['春', '秋', '冬'] },
    { name: '都江堰', type: '历史', desc: '两千年水利工程', seasons: ['春', '夏', '秋'] },
    { name: '青城山', type: '自然', desc: '道教名山', seasons: ['夏', '秋'] },
    { name: '九寨沟', type: '自然', desc: '人间仙境', seasons: ['秋'] },
  ]},
  { id: 'chongqing', name: '重庆', lat: 29.43, lng: 106.91, province: '重庆', attractions: [
    { name: '洪崖洞', type: '地标', desc: '山城地标，千与千寻同款', seasons: ['春', '秋', '冬'] },
    { name: '磁器口', type: '街区', desc: '千年古镇', seasons: ['春', '秋', '冬'] },
    { name: '长江索道', type: '体验', desc: '空中看山城', seasons: ['春', '秋', '冬'] },
    { name: '武隆天坑', type: '自然', desc: '世界自然遗产', seasons: ['春', '夏', '秋'] },
  ]},
  { id: 'kunming', name: '昆明', lat: 25.04, lng: 102.72, province: '云南', attractions: [
    { name: '石林', type: '自然', desc: '世界地质公园', seasons: ['春', '夏', '秋', '冬'] },
    { name: '滇池', type: '自然', desc: '高原明珠', seasons: ['冬'] },
    { name: '翠湖', type: '自然', desc: '红嘴鸥栖息地', seasons: ['冬'] },
  ]},
  { id: 'dali', name: '大理', lat: 25.61, lng: 100.27, province: '云南', attractions: [
    { name: '洱海', type: '自然', desc: '高原湖泊，环湖骑行', seasons: ['春', '夏', '秋'] },
    { name: '大理古城', type: '历史', desc: '白族文化体验', seasons: ['春', '冬'] },
    { name: '苍山', type: '自然', desc: '十九峰十八溪', seasons: ['春', '夏', '秋'] },
    { name: '双廊', type: '小镇', desc: '洱海边最美小镇', seasons: ['春', '秋'] },
  ]},
  { id: 'lijiang', name: '丽江', lat: 26.87, lng: 100.23, province: '云南', attractions: [
    { name: '丽江古城', type: '历史', desc: '世界文化遗产', seasons: ['春', '夏', '秋', '冬'] },
    { name: '玉龙雪山', type: '自然', desc: '终年积雪的神山', seasons: ['冬', '春'] },
    { name: '泸沽湖', type: '自然', desc: '高原明珠，摩梭文化', seasons: ['春', '夏', '秋'] },
  ]},
  { id: 'guiyang', name: '贵阳', lat: 26.65, lng: 106.63, province: '贵州', attractions: [
    { name: '黄果树瀑布', type: '自然', desc: '中国最大瀑布', seasons: ['夏'] },
    { name: '黔灵山', type: '自然', desc: '城市森林公园', seasons: ['春', '秋'] },
    { name: '青岩古镇', type: '历史', desc: '明清古镇', seasons: ['春', '秋'] },
  ]},
  // ── 西北 ──
  { id: 'xian', name: '西安', lat: 34.34, lng: 108.94, province: '陕西', attractions: [
    { name: '兵马俑', type: '历史', desc: '秦始皇陵兵马俑', seasons: ['春', '秋'] },
    { name: '古城墙', type: '历史', desc: '保存最完整的古城墙', seasons: ['春', '秋', '冬'] },
    { name: '大雁塔', type: '历史', desc: '唐代佛塔', seasons: ['春', '秋'] },
    { name: '回民街', type: '美食', desc: '西安特色美食街区', seasons: ['春', '秋', '冬'] },
    { name: '华山', type: '自然', desc: '五岳之西岳，险峻天下', seasons: ['春', '秋'] },
  ]},
  { id: 'lanzhou', name: '兰州', lat: 36.06, lng: 103.83, province: '甘肃', attractions: [
    { name: '黄河铁桥', type: '地标', desc: '黄河第一桥', seasons: ['夏', '秋'] },
    { name: '中山桥', type: '历史', desc: '百年铁桥', seasons: ['夏', '秋'] },
    { name: '敦煌莫高窟', type: '历史', desc: '世界艺术宝库', seasons: ['春', '秋'] },
  ]},
  { id: 'xining', name: '西宁', lat: 36.62, lng: 101.78, province: '青海', attractions: [
    { name: '青海湖', type: '自然', desc: '中国最大湖泊', seasons: ['夏'] },
    { name: '茶卡盐湖', type: '自然', desc: '天空之镜', seasons: ['夏', '秋'] },
    { name: '塔尔寺', type: '历史', desc: '藏传佛教格鲁派六大寺', seasons: ['夏', '秋'] },
  ]},
  { id: 'urumqi', name: '乌鲁木齐', lat: 43.83, lng: 87.62, province: '新疆', attractions: [
    { name: '天山天池', type: '自然', desc: '高山湖泊', seasons: ['夏', '秋'] },
    { name: '大巴扎', type: '街区', desc: '中亚风情市场', seasons: ['夏', '秋'] },
    { name: '喀纳斯', type: '自然', desc: '神的后花园', seasons: ['夏', '秋'] },
  ]},
  { id: 'yinchuan', name: '银川', lat: 38.49, lng: 106.23, province: '宁夏', attractions: [
    { name: '沙坡头', type: '自然', desc: '沙漠与黄河交汇', seasons: ['春', '秋'] },
    { name: '西夏王陵', type: '历史', desc: '东方金字塔', seasons: ['春', '秋'] },
  ]},
  // ── 东北 ──
  { id: 'harbin', name: '哈尔滨', lat: 45.80, lng: 126.53, province: '黑龙江', attractions: [
    { name: '冰雪大世界', type: '主题', desc: '世界最大冰雪主题公园', seasons: ['冬'] },
    { name: '圣索菲亚教堂', type: '历史', desc: '远东最大东正教堂', seasons: ['夏', '冬'] },
    { name: '中央大街', type: '街区', desc: '欧式建筑步行街', seasons: ['夏', '冬'] },
    { name: '太阳岛', type: '自然', desc: '松花江上的绿岛', seasons: ['夏'] },
  ]},
  { id: 'changchun', name: '长春', lat: 43.88, lng: 125.32, province: '吉林', attractions: [
    { name: '净月潭', type: '自然', desc: '亚洲最大人工林海', seasons: ['夏', '秋', '冬'] },
    { name: '伪满皇宫', type: '历史', desc: '溥仪皇宫旧址', seasons: ['春', '秋'] },
  ]},
  { id: 'dalian', name: '大连', lat: 38.91, lng: 121.60, province: '辽宁', attractions: [
    { name: '星海广场', type: '地标', desc: '亚洲最大城市广场', seasons: ['夏', '秋'] },
    { name: '老虎滩', type: '自然', desc: '海洋公园', seasons: ['夏'] },
    { name: '金石滩', type: '自然', desc: '国家地质公园', seasons: ['夏', '秋'] },
  ]},
  { id: 'shenyang', name: '沈阳', lat: 41.80, lng: 123.43, province: '辽宁', attractions: [
    { name: '沈阳故宫', type: '历史', desc: '清初皇宫', seasons: ['春', '秋'] },
    { name: '张氏帅府', type: '历史', desc: '张作霖父子故居', seasons: ['春', '秋'] },
  ]},
  // ── 更多热门 ──
  { id: 'guilin', name: '桂林', lat: 25.27, lng: 110.29, province: '广西', attractions: [
    { name: '漓江', type: '自然', desc: '桂林山水甲天下', seasons: ['春', '夏', '秋'] },
    { name: '阳朔西街', type: '街区', desc: '背包客天堂', seasons: ['春', '夏', '秋'] },
    { name: '龙脊梯田', type: '自然', desc: '壮观的梯田景观', seasons: ['春', '秋'] },
    { name: '象鼻山', type: '自然', desc: '桂林市徽', seasons: ['春', '夏', '秋'] },
  ]},
  { id: 'nanning', name: '南宁', lat: 22.82, lng: 108.32, province: '广西', attractions: [
    { name: '青秀山', type: '自然', desc: '城市绿肺', seasons: ['春', '冬'] },
    { name: '德天瀑布', type: '自然', desc: '亚洲第一跨国瀑布', seasons: ['夏', '秋'] },
  ]},
  { id: 'lhasa', name: '拉萨', lat: 29.65, lng: 91.10, province: '西藏', attractions: [
    { name: '布达拉宫', type: '历史', desc: '世界屋脊上的宫殿', seasons: ['夏', '秋'] },
    { name: '大昭寺', type: '历史', desc: '藏传佛教圣地', seasons: ['夏', '秋'] },
    { name: '纳木错', type: '自然', desc: '世界最高湖泊之一', seasons: ['夏'] },
  ]},
];

// ── LLM Providers ──

const LLM_PROVIDERS = [
  { id: 'qwen', name: '通义千问 (Qwen)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id: 'moonshot', name: '月之暗面 (Kimi)', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
  { id: 'zhipu', name: '智谱 (GLM)', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-flash', 'glm-4'] },
  { id: 'custom', name: '自定义 (OpenAI 兼容)', baseUrl: '', models: [] },
];

// ── Route Generation ──

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const THEMES = [
  { name: '自然风光', filter: (c: City, season: string) => c.attractions.some((a) => a.type === '自然' && a.seasons.includes(season)) },
  { name: '历史人文', filter: (c: City, season: string) => c.attractions.some((a) => a.type === '历史' && a.seasons.includes(season)) },
  { name: '美食之旅', filter: (c: City, _s: string) => c.attractions.some((a) => a.type === '美食') },
  { name: '文艺小城', filter: (c: City, _s: string) => c.attractions.some((a) => a.type === '街区' || a.type === '小镇') },
  { name: '亲子乐园', filter: (c: City, _s: string) => c.attractions.some((a) => a.type === '主题') },
  { name: '当季最佳', filter: (c: City, season: string) => c.attractions.some((a) => a.seasons.includes(season)) },
];

function buildRoute(startId: string, endId: string | null, days: number, season: string, themeIdx: number, includeStartCity: boolean): Route | null {
  const start = CITIES.find((c) => c.id === startId);
  if (!start) return null;
  const theme = THEMES[themeIdx];
  const maxStops = Math.min(days, 7);

  let candidates = CITIES
    .filter((c) => c.id !== startId && c.id !== endId && theme.filter(c, season))
    .map((c) => ({ city: c, dist: haversine(start, c) }))
    .sort((a, b) => a.dist - b.dist);

  if (endId) {
    // Route must go from start toward end — filter cities that are "between" or near the line
    const end = CITIES.find((c) => c.id === endId)!;
    const directDist = haversine(start, end);
    candidates = candidates
      .filter((c) => {
        const viaDist = haversine(start, c.city) + haversine(c.city, end);
        return viaDist < directDist * 1.6; // allow 60% detour
      })
      .sort((a, b) => a.dist - b.dist);
  }

  const reservedSlots = (includeStartCity ? 1 : 0) + (endId ? 1 : 0);
  const stopCount = Math.max(maxStops - reservedSlots, 0);
  const stops = candidates.slice(0, stopCount).map((c) => c.city.id);
  const cities = includeStartCity ? [startId, ...stops] : stops;
  if (endId && endId !== startId) cities.push(endId);

  if (cities.length < (includeStartCity ? 2 : 1)) return null;

  const cityNames = cities.map((id) => CITIES.find((c) => c.id === id)?.name).filter(Boolean).join(' → ');

  return {
    id: themeIdx + 1,
    startId,
    includeStartCity,
    cities,
    days,
    theme: theme.name,
    desc: includeStartCity ? `${theme.name}：${cityNames}` : `${theme.name}：${start.name} 出发 → ${cityNames}`,
  };
}

function generateRoutes(startId: string, endId: string | null, days: number, season: string, includeStartCity: boolean): Route[] {
  const routes: Route[] = [];
  for (let i = 0; i < THEMES.length; i++) {
    const route = buildRoute(startId, endId, days, season, i, includeStartCity);
    if (route) routes.push(route);
  }
  return routes;
}

function getFlexibleAiCandidates(startId: string, days: number, season: string, includeStartCity: boolean): City[] {
  const start = CITIES.find((c) => c.id === startId);
  if (!start) return [];

  const limit = Math.min(Math.max(days * 2, 6), 10);
  const nearby = CITIES
    .filter((c) => c.id !== startId)
    .filter((c) => c.attractions.some((a) => a.seasons.includes(season)))
    .map((c) => ({ city: c, dist: haversine(start, c) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((item) => item.city);

  return includeStartCity ? [start, ...nearby] : nearby;
}

function extractOrderedCitiesFromAiContent(content: string): string[] {
  const matchedIds: string[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const headerMatch = line.replace(/\*\*/g, '').match(/Day\s*\d+\s*[|｜–—\-:：]?\s*(.*)/i);
    const source = headerMatch?.[1]?.trim() || line;
    const city = CITIES.find((item) => source.includes(item.name));
    if (city && !seen.has(city.id)) {
      seen.add(city.id);
      matchedIds.push(city.id);
    }
  }

  return matchedIds;
}

// ── Leaflet icon fix ──
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── AI Itinerary Component ──

function AiItinerary({ content }: { content: string }) {
  // Split by day headers: **Day X**, Day X |, ## Day X, etc.
  const dayBlocks = content.split(/(?=(?:\*\*)?Day\s*\d+)/i).filter((s) => s.trim());
  const footerLines: string[] = [];

  const cleanLine = (line: string) => line
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/u, '')
    .replace(/^\s*(?:[-*•·▪▫▸▶◦→]+)\s*/u, '')
    .replace(/^\s*(?:[\p{Extended_Pictographic}\uFE0F\u200D]+)\s*/u, '')
    .trim();

  const splitRouteStops = (line: string) => cleanLine(line)
    .split(/\s*(?:->|→|➡️|➜|⟶|—|–)\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const splitInlineItems = (line: string) => cleanLine(line)
    .split(/\s*[|｜]\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const classifyLine = (line: string) => {
    const normalized = cleanLine(line);
    if (!normalized) return 'other' as const;
    if (/^(交通|transport)\b/i.test(normalized) || /高铁|飞机|航班|火车|动车|自驾|打车|巴士|公交|train|flight|drive|bus/i.test(normalized)) return 'transport' as const;
    if (/^(住宿|hotel|stay|airbnb|酒店|民宿|旅馆)/i.test(normalized)) return 'stay' as const;
    if (/^(美食|午餐|晚餐|早餐|夜宵|lunch|dinner|breakfast|food|餐|吃)/i.test(normalized)) return 'food' as const;
    if (/^(景点|游览|visit|attraction)/i.test(normalized) || /博物馆|公园|寺|塔|山|湖|海|街区|古城|古镇|乐园|广场|宫|园|峡谷|草原/i.test(normalized)) return 'spots' as const;
    return 'other' as const;
  };

  // Separate footer (tips/budget) from day blocks
  const days = dayBlocks.filter((block) => {
    if (!/Day\s*\d+/i.test(block)) {
      footerLines.push(block);
      return false;
    }
    return true;
  });

  if (days.length === 0) {
    // Fallback: render as plain text lines
    return (
      <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--fg)' }}>
        {content.split('\n').filter((l) => l.trim()).map((line, i) => (
          <div key={i} style={{ padding: '3px 0' }}>{line.replace(/^\*\*(.*?)\*\*/,'$1')}</div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {days.map((block, di) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        // First line is the day header
        const headerLine = lines[0]?.replace(/\*\*/g, '') || `Day ${di + 1}`;
        const headerMatch = headerLine.match(/Day\s*(\d+)\s*[|｜–—\-:：]?\s*(.*)/i);
        const dayNum = headerMatch ? parseInt(headerMatch[1]) : di + 1;
        const city = headerMatch?.[2]?.trim() || '';
        const bodyLines = lines.slice(1);

        // Categorize body lines by content keywords
        const transport = bodyLines.filter((l) => classifyLine(l) === 'transport').map(cleanLine);
        const spots = bodyLines.filter((l) => classifyLine(l) === 'spots');
        const food = bodyLines.filter((l) => classifyLine(l) === 'food').map(cleanLine);
        const stay = bodyLines.filter((l) => classifyLine(l) === 'stay').map(cleanLine);
        const others = bodyLines.filter((l) => classifyLine(l) === 'other').map(cleanLine);

        const routeStops = spots.flatMap(splitRouteStops).filter(Boolean);
        const activitySummary = others[0] || (routeStops.length > 0 ? `串联 ${routeStops.length} 个打卡点` : '');
        const foodItems = food.flatMap(splitInlineItems);
        const stayItems = stay.flatMap(splitInlineItems);
        const lineColor = '#ddd4c8';
        const paperColor = '#faf7f2';
        const inkColor = '#201a17';
        const mutedColor = '#6f665f';
        const accentColor = '#9a4420';

        return (
          <div key={di} style={{
            border: `1px solid ${lineColor}`,
            borderRadius: 2,
            background: paperColor,
            boxShadow: '0 1px 0 rgba(255,255,255,0.85)',
            overflow: 'hidden',
          }}>
            {/* Day header */}
            <div style={{
              padding: '16px 18px 14px',
              borderBottom: `1px solid ${lineColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: accentColor,
                    lineHeight: 1.2,
                    fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}>
                    DAY {String(dayNum).padStart(2, '0')}
                  </div>
                  {city && (
                    <div style={{
                      fontSize: 21,
                      fontWeight: 700,
                      color: inkColor,
                      lineHeight: 1.15,
                      letterSpacing: 0.1,
                      fontFamily: '"Georgia", "Times New Roman", serif',
                    }}>
                      {city}
                    </div>
                  )}
                  {activitySummary && (
                    <div style={{
                      fontSize: 13,
                      color: mutedColor,
                      marginTop: 8,
                      lineHeight: 1.68,
                      maxWidth: '26ch',
                    }}>
                      {activitySummary}
                    </div>
                  )}
                </div>
                {routeStops.length > 0 && (
                  <div style={{
                    flexShrink: 0,
                    fontSize: 12,
                    color: mutedColor,
                    lineHeight: 1.5,
                    textAlign: 'right',
                    paddingTop: 2,
                  }}>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.9,
                      color: accentColor,
                      fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}>
                      Stops
                    </div>
                    <div>{routeStops.length} 个打卡点</div>
                  </div>
                )}
              </div>
            </div>

            {/* Content items */}
            <div style={{ padding: '8px 18px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Transport */}
              {transport.map((t, i) => (
                <div key={`t${i}`} style={{
                  padding: '12px 0',
                  borderBottom: `1px solid ${lineColor}`,
                }}>
                  <div style={{
                    fontSize: 11,
                    color: accentColor,
                    letterSpacing: 0.9,
                    fontWeight: 700,
                    fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}>行程</div>
                  <div style={{
                    fontSize: 14,
                    color: inkColor,
                    fontWeight: 600,
                    lineHeight: 1.82,
                  }}>{t}</div>
                </div>
              ))}

              {/* Spots */}
              {routeStops.length > 0 && (
                <div style={{
                  padding: '14px 0 12px',
                  borderBottom: (others.length > 0 || foodItems.length > 0 || stayItems.length > 0) ? `1px solid ${lineColor}` : 'none',
                }}>
                  <div style={{
                    fontSize: 11,
                    color: accentColor,
                    letterSpacing: 0.9,
                    fontWeight: 700,
                    fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}>
                    打卡点
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {routeStops.map((stop, i) => (
                      <div key={`${stop}-${i}`} style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr',
                        alignItems: 'start',
                        gap: 12,
                        padding: '12px 0',
                        borderTop: i === 0 ? 'none' : `1px dashed ${lineColor}`,
                        color: inkColor,
                        fontSize: 15,
                        lineHeight: 1.75,
                      }}>
                        <span style={{
                          width: 22,
                          height: 22,
                          border: `1px solid ${lineColor}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 1,
                          background: '#fffdfa',
                          color: accentColor,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontWeight: 600, letterSpacing: 0.05 }}>{stop}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other lines (activities, descriptions) */}
              {others.map((o, i) => (
                <div key={`o${i}`} style={{
                  padding: '12px 0',
                  borderBottom: (i === others.length - 1 && foodItems.length === 0 && stayItems.length === 0) ? 'none' : `1px solid ${lineColor}`,
                }}>
                  {i === 0 && (
                    <div style={{
                      fontSize: 11,
                      color: accentColor,
                      letterSpacing: 0.9,
                      fontWeight: 700,
                      fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}>备注</div>
                  )}
                  <span style={{
                    fontSize: 11,
                    color: accentColor,
                    letterSpacing: 0.9,
                    fontWeight: 700,
                    fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                    textTransform: 'uppercase',
                    display: 'none',
                  }} />
                  <div style={{ fontSize: 14, color: mutedColor, lineHeight: 1.8, letterSpacing: 0.03 }}>{o}</div>
                </div>
              ))}

              {/* Food & Stay */}
              {(foodItems.length > 0 || stayItems.length > 0) && (
                <div style={{ paddingTop: 12 }}>
                  {foodItems.length > 0 && (
                    <div style={{ marginBottom: stayItems.length > 0 ? 14 : 0 }}>
                      <div style={{
                        fontSize: 11,
                        color: accentColor,
                        letterSpacing: 0.9,
                        fontWeight: 700,
                        fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}>餐食</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {foodItems.map((item, i) => (
                          <div key={`fi${i}`} style={{
                            fontSize: 14,
                            color: inkColor,
                            lineHeight: 1.8,
                            paddingLeft: 16,
                            position: 'relative',
                          }}>
                            <span style={{ position: 'absolute', left: 0, top: 0, color: mutedColor }}>-</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {stayItems.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: 11,
                        color: accentColor,
                        letterSpacing: 0.9,
                        fontWeight: 700,
                        fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                      }}>住宿</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stayItems.map((item, i) => (
                          <div key={`si${i}`} style={{
                            fontSize: 14,
                            color: inkColor,
                            lineHeight: 1.8,
                            paddingLeft: 16,
                            position: 'relative',
                          }}>
                            <span style={{ position: 'absolute', left: 0, top: 0, color: mutedColor }}>-</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider between days */}
            {di < days.length - 1 && (
              <div style={{ height: 0, marginTop: 4 }} />
            )}
          </div>
        );
      })}

      {/* Footer */}
      {footerLines.length > 0 && (
        <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          {footerLines.map((line, i) => (
            <div key={i}>{line.replace(/\*\*/g, '')}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ──

export default function TravelPlanner() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('travel');
  const { showToast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const linesRef = useRef<L.Polyline[]>([]);

  const [startCity, setStartCity] = useState('beijing');
  const [includeStartCity, setIncludeStartCity] = useState(true);
  const [days, setDays] = useState(5);
  const [season, setSeason] = useState(getCurrentSeason());
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'routes' | 'region' | 'ai'>('routes');
  const [showSettings, setShowSettings] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // LLM config
  const [llmProvider, setLlmProvider] = useState('qwen');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');

  const provider = LLM_PROVIDERS.find((p) => p.id === llmProvider) ?? LLM_PROVIDERS[0];

  // Load saved config
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const cfg: LlmConfig = JSON.parse(saved);
        setLlmProvider(cfg.provider || 'qwen');
        setLlmApiKey(cfg.apiKey || '');
        setLlmModel(cfg.model || '');
        setLlmBaseUrl(cfg.baseUrl || '');
      }
    } catch { /* ignore */ }
  }, []);

  const saveConfig = useCallback(() => {
    const cfg: LlmConfig = { provider: llmProvider, apiKey: llmApiKey, model: llmModel || provider.models[0] || '', baseUrl: llmBaseUrl || provider.baseUrl };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    setShowSettings(false);
  }, [llmProvider, llmApiKey, llmModel, llmBaseUrl, provider]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([35.0, 105.0], 4);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18,
    }).addTo(map);
    leafletMap.current = map;
    map.on('click', (e: L.LeafletMouseEvent) => {
      let nearest: City | null = null;
      let minDist = Infinity;
      for (const city of CITIES) {
        const d = haversine({ lat: e.latlng.lat, lng: e.latlng.lng }, city);
        if (d < minDist) { minDist = d; nearest = city; }
      }
      if (nearest && minDist < 200) { setSelectedCity(nearest.id); setLeftTab('region'); }
    });
    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  // Update map
  const updateMap = useCallback((routeCities: string[], highlight?: string, originId?: string, includeOriginInRoute = true) => {
    const map = leafletMap.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    linesRef.current.forEach((l) => l.remove());
    markersRef.current = [];
    linesRef.current = [];

    const startId = originId ?? routeCities[0];
    const pathIds = startId && (!includeOriginInRoute || routeCities[0] !== startId)
      ? [startId, ...routeCities]
      : routeCities;

    for (const city of CITIES) {
      const isRoute = routeCities.includes(city.id);
      const isStart = city.id === startId;
      const isEnd = city.id === routeCities[routeCities.length - 1] && routeCities.length > 0 && city.id !== startId;
      const isHighlight = city.id === highlight;
      const size = isStart || isEnd ? 28 : isHighlight ? 24 : isRoute ? 20 : 14;
      const color = isStart ? '#ef4444' : isEnd ? '#10b981' : isHighlight ? '#f59e0b' : isRoute ? '#6366f1' : '#94a3b8';
      const routeIndex = routeCities.indexOf(city.id);
      const label = isStart ? '起' : isEnd ? '终' : isRoute ? String(routeIndex + (includeOriginInRoute ? 0 : 1)) : '';

      const marker = L.marker([city.lat, city.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${isStart || isEnd || isHighlight ? '#fff' : 'transparent'};box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:${size > 20 ? 12 : 10}px;color:#fff;font-weight:700;">${label}</div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        }),
      }).addTo(map);
      marker.bindTooltip(city.name, { permanent: isRoute || isHighlight || isStart, direction: 'top', offset: [0, -10] });
      marker.on('click', () => { setSelectedCity(city.id); setLeftTab('region'); });
      markersRef.current.push(marker);
    }

    if (pathIds.length > 1) {
      const latlngs = pathIds.map((id) => { const c = CITIES.find((cc) => cc.id === id)!; return L.latLng(c.lat, c.lng); });
      const line = L.polyline(latlngs, { color: '#6366f1', weight: 3, opacity: 0.8, dashArray: '8 4' }).addTo(map);
      linesRef.current.push(line);
      map.fitBounds(line.getBounds().pad(0.15));
    }
  }, []);

  // Generate
  const handleGenerate = useCallback(() => {
    const newRoutes = generateRoutes(startCity, null, days, season, includeStartCity);
    setRoutes(newRoutes);
    setSelectedRoute(newRoutes.length > 0 ? 0 : null);
    setAiResult('');
    updateMap(newRoutes[0]?.cities ?? [], undefined, startCity, includeStartCity);
  }, [startCity, days, season, includeStartCity, updateMap]);

  // Select route
  const handleSelectRoute = useCallback((idx: number) => {
    setSelectedRoute(idx);
    setAiResult('');
    updateMap(routes[idx].cities, undefined, routes[idx].startId, routes[idx].includeStartCity);
  }, [routes, updateMap]);

  // AI suggest
  const handleAiSuggest = useCallback(async () => {
    const cfg: LlmConfig | null = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || ''); } catch { return null; } })();
    if (!cfg?.apiKey) {
      showToast(ui.llmConfigHint);
      setShowSettings(true);
      return;
    }

    const city = CITIES.find((c) => c.id === startCity)!;
    const candidateCities = getFlexibleAiCandidates(startCity, days, season, includeStartCity);
    const candidateNames = candidateCities.map((c) => c.name).join('、');
    const currentSeason = SEASON_LABELS[season]?.[lang as 'zh' | 'en'] || season;
    const attractionGuide = candidateCities
      .map((candidateCity) => {
        const seasonalAttractions = candidateCity.attractions
          .filter((a) => a.seasons.includes(season))
          .slice(0, 5)
          .map((a) => a.name)
          .join('、');
        return seasonalAttractions ? `${candidateCity.name}：${seasonalAttractions}` : `${candidateCity.name}：可自由补充合适景点`;
      })
      .filter(Boolean)
      .join('\n');

    const prompt = lang === 'zh'
      ? `规划从${city.name}出发的${days}天旅行。季节：${currentSeason}。

请你自主决定本次路线，不要照搬固定推荐路线。可以从这些候选城市中灵活选择 2-4 个进行组合：${candidateNames || '请自行判断附近合适城市'}。
如果存在多种合理路线，优先给出一个灵活、自然、和常见模板不完全相同的方案。

优先从以下城市景点中安排行程：
${attractionGuide || '请按路线城市选择最合适的当地代表性景点'}

规则：
- 每天只在一个城市游玩
- ${includeStartCity ? '需要安排出发城市的游玩内容' : '不要安排出发城市的景点或游玩内容，第一天如需离开出发城市，只写前往首个游玩城市的交通'}
- ${includeStartCity ? 'Day 1 可以是出发城市' : 'Day 1 必须是首个真正游玩城市，不要写出发城市'}
- ${includeStartCity ? '可以自然提到出发城市' : `除交通行外，不要在任何一天标题、景点、餐食、住宿中出现出发城市“${city.name}”`}
- 🚄交通行只在需要前往下一个城市时才写，同一城市内不写交通行
- 交通格式：XX→XX 高铁约Xh / 飞机约Xh / 自驾约Xh
- 不要任何开场白、总结、废话
- 每行内容尽量简短，不要超过30个字

格式：

Day 1 | 城市名
📍 景点A → 景点B → 景点C
🍜 午餐XX | 晚餐XX
🏨 XX区域

Day 2 | 下一个城市名
🚄 上一个城市→当前城市 高铁约Xh
📍 景点A → 景点B
🍜 午餐XX | 晚餐XX
🏨 XX区域

最后一行：
💡 贴士
💰 人均XX元/天

方案标识：${Date.now()}`
      : `Plan a ${days}-day trip from ${city.name}. Season: ${currentSeason}.

Choose the route yourself instead of reusing any fixed recommended route. You may flexibly combine 2-4 cities from these candidates: ${candidateNames || 'choose suitable nearby cities yourself'}.
If multiple routes are reasonable, prefer a fresh, natural plan rather than a repetitive default template.

Prefer attractions from these city candidates:
${attractionGuide || 'Pick representative attractions that fit the route cities'}

Rules:
- Each day in ONE city only
- ${includeStartCity ? 'Include sightseeing in the departure city when appropriate' : 'Do NOT arrange attractions or sightseeing in the departure city; if leaving on day 1, only add transport to the first destination city'}
- ${includeStartCity ? 'Day 1 may be the departure city' : 'Day 1 must be the first actual sightseeing city, not the departure city'}
- ${includeStartCity ? 'You may mention the departure city naturally' : `Do not mention the departure city "${city.name}" anywhere except on transport lines`}
- 🚄 transport line ONLY when moving to a different city, not within same city
- Transport format: XX→XX ~Xh train / flight / drive
- No intro, no summary, no fluff
- Keep each line under 30 chars

Format:

Day 1 | City
📍 Attraction A → B → C
🍜 Lunch XX | Dinner XX
🏨 Area

Day 2 | Next City
🚄 PrevCity→CurrCity ~Xh train
📍 Attraction A → B
🍜 Food XX
🏨 Area

Last line:
💡 Tip
💰 ~$XX/person/day

Plan token: ${Date.now()}`

    setAiLoading(true);
    setAiResult('');
    setLeftTab('ai');
    updateMap([], undefined, startCity, false);

    try {
      const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.model || provider.models[0],
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 3000,
        }),
      });
      if (!resp.ok) throw new Error(`API Error: ${resp.status}`);
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || 'No response';
      setAiResult(content);
      const aiRouteCities = extractOrderedCitiesFromAiContent(content);
      if (aiRouteCities.length > 0) {
        updateMap(aiRouteCities, undefined, startCity, includeStartCity);
      } else {
        updateMap([], undefined, startCity, false);
      }
    } catch (e) {
      setAiResult(`**Error:** ${e instanceof Error ? e.message : 'Request failed'}\n\nPlease check your API Key and network, or click ⚙️ to update config.`);
    } finally {
      setAiLoading(false);
    }
  }, [startCity, days, season, lang, provider, showToast, ui.llmConfigHint, updateMap, includeStartCity]);

  useEffect(() => {
    setAiResult('');
  }, [startCity, days, season, includeStartCity]);

  useEffect(() => {
    setRoutes([]);
    setSelectedRoute(null);
    setAiResult('');
    updateMap([], undefined, startCity, false);
  }, [startCity, days, season, includeStartCity, updateMap]);

  const selectedCityData = useMemo(() => CITIES.find((c) => c.id === selectedCity), [selectedCity]);

  const settingsButton = (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowSettings(!showSettings)} style={{
        padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
        background: showSettings ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 12, color: showSettings ? 'var(--accent)' : 'var(--muted)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        {ui.llmSettings}
      </button>
      {showSettings && (
        <div style={{
          position: 'absolute', top: 40, right: 0, zIndex: 9999, width: 320,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', padding: 16,
        }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.provider}</label>
            <select value={llmProvider} onChange={(e) => { setLlmProvider(e.target.value); setLlmModel(''); setLlmBaseUrl(''); }} style={{ width: '100%', padding: '6px 8px', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}>
              {LLM_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.apiKey}</label>
            <input type="password" value={llmApiKey} onChange={(e) => setLlmApiKey(e.target.value)} placeholder="sk-..." style={{ width: '100%', padding: '6px 8px', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          {provider.models.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.model}</label>
              <select value={llmModel || provider.models[0]} onChange={(e) => setLlmModel(e.target.value)} style={{ width: '100%', padding: '6px 8px', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}>
                {provider.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          {llmProvider === 'custom' && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.baseUrl}</label>
              <input type="text" value={llmBaseUrl} onChange={(e) => setLlmBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" style={{ width: '100%', padding: '6px 8px', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="panel-btn accent" onClick={saveConfig} style={{ flex: 1 }}>{ui.saveConfig}</button>
            <button className="panel-btn" onClick={() => setShowSettings(false)}>✕</button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>{ui.configNote}</div>
        </div>
      )}
    </div>
  );

  return (
    <ToolShell title={name} description={desc} headerRight={settingsButton}>
      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, height: 'calc(100vh - 180px)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Config */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{ui.planTrip}</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.startCity}</label>
              <select value={startCity} onChange={(e) => setStartCity(e.target.value)} style={{ width: '100%', padding: '6px 8px', background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13 }}>
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.province})</option>)}
              </select>
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 10,
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface-2)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={includeStartCity}
                onChange={(e) => setIncludeStartCity(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{ui.includeStartCity}</span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{ui.includeStartCityHint}</span>
              </span>
            </label>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.days}: {days} {ui.dayUnit}</label>
              <input type="range" min={2} max={14} value={days} onChange={(e) => setDays(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{ui.season}</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {SEASONS.map((s) => (
                  <button key={s} className={`panel-btn panel-btn-sm${season === s ? ' accent' : ''}`} onClick={() => setSeason(s)} style={{ flex: 1 }}>
                    {SEASON_LABELS[s]?.[lang as 'zh' | 'en']?.split(' ')[0] || s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="panel-btn accent" onClick={handleGenerate} style={{ flex: 1 }}>{ui.generateRoute}</button>
              <button className="panel-btn" onClick={handleAiSuggest} disabled={aiLoading} title={ui.aiSuggest} style={{ flex: 1 }}>
                {aiLoading ? '⏳' : '🤖'} {ui.aiSuggest}
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
            {([['routes', `${ui.routes}${routes.length > 0 ? ` (${routes.length})` : ''}`], ['ai', `🤖 ${ui.aiTab}`], ['region', `📍 ${ui.attractions}`]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setLeftTab(key)} style={{
                flex: 1, padding: '8px 8px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: leftTab === key ? 'var(--surface)' : 'var(--surface-2)',
                color: leftTab === key ? 'var(--accent)' : 'var(--muted)',
                borderBottom: leftTab === key ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
            {/* Routes tab */}
            {leftTab === 'routes' && (
              <>
                {routes.length > 0 ? routes.map((r, i) => (
                  <div key={r.id} onClick={() => handleSelectRoute(i)} style={{
                    padding: '10px 12px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
                    background: selectedRoute === i ? 'var(--accent-bg, rgba(99,102,241,0.1))' : 'var(--surface-2)',
                    border: selectedRoute === i ? '1px solid var(--accent)' : '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-bg, rgba(99,102,241,0.1))', padding: '1px 6px', borderRadius: 4 }}>{r.theme}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{r.days}{ui.dayUnit}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.6 }}>
                      {r.includeStartCity
                        ? r.cities.map((id) => CITIES.find((c) => c.id === id)?.name).join(' → ')
                        : `${CITIES.find((c) => c.id === r.startId)?.name} 出发 → ${r.cities.map((id) => CITIES.find((c) => c.id === id)?.name).join(' → ')}`}
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '32px 0' }}>
                    {ui.generateHint}
                  </div>
                )}
              </>
            )}

            {/* Region tab */}
            {leftTab === 'region' && (
              <>
                {selectedCityData ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>📍 {selectedCityData.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>{selectedCityData.province} · {ui.seasonFilter}</div>
                    {selectedCityData.attractions.filter((a) => a.seasons.includes(season)).map((a, i) => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-bg, rgba(99,102,241,0.1))', padding: '1px 5px', borderRadius: 3 }}>{a.type}</span>
                          <span style={{ fontWeight: 600 }}>{a.name}</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{a.seasons.join('/')}</span>
                        </div>
                        <div style={{ color: 'var(--muted)', marginTop: 3, fontSize: 11 }}>{a.desc}</div>
                      </div>
                    ))}
                    {selectedCityData.attractions.filter((a) => a.seasons.includes(season)).length === 0 && (
                      <div style={{ color: 'var(--muted)', fontSize: 12, padding: '16px 0', textAlign: 'center' }}>
                        {ui.noSeasonalAttractions}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '32px 0' }}>
                    {ui.clickCityHint}
                  </div>
                )}
              </>
            )}

            {/* AI tab */}
            {leftTab === 'ai' && (
              <div>
                {aiLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
                    <div>{ui.aiGenerating}</div>
                  </div>
                ) : aiResult ? (
                  <AiItinerary content={aiResult} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
                    <div>{ui.aiHint}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div ref={mapRef} style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
