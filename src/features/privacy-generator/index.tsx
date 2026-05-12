import { useState, useMemo, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type Tab = 'privacy' | 'terms' | 'checklist';
type OutputFormat = 'markdown' | 'html';

interface AppConfig {
  appName: string;
  companyName: string;
  contactEmail: string;
  contactAddress: string;
  website: string;
  effectiveDate: string;
  lastUpdatedDate: string;
  jurisdiction: string;
  dpoContact: string;
  dataRetention: string;
  storageType: 'local' | 'cloud' | 'both';
  collectPersonalInfo: boolean;
  collectLocation: boolean;
  collectDeviceId: boolean;
  collectContacts: boolean;
  collectPhotos: boolean;
  collectCamera: boolean;
  collectMicrophone: boolean;
  collectHealth: boolean;
  collectFinancial: boolean;
  collectBrowsing: boolean;
  collectCookies: boolean;
  collectClipboard: boolean;
  collectAdId: boolean;
  useAnalytics: boolean;
  useAds: boolean;
  usePayment: boolean;
  useSocialLogin: boolean;
  useCloudStorage: boolean;
  usePushNotifications: boolean;
  hasSubscription: boolean;
  hasAccountSystem: boolean;
  targetChina: boolean;
  targetEU: boolean;
  targetUS: boolean;
  targetChildren: boolean;
  onAppStore: boolean;
  onGooglePlay: boolean;
  onHuaweiStore: boolean;
  onXiaomiStore: boolean;
  onOppoStore: boolean;
  onVivoStore: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  appName: '', companyName: '', contactEmail: '', contactAddress: '', website: '',
  effectiveDate: new Date().toISOString().split('T')[0],
  lastUpdatedDate: new Date().toISOString().split('T')[0],
  jurisdiction: '中国',
  dpoContact: '', dataRetention: '', storageType: 'cloud',
  collectPersonalInfo: true, collectLocation: false, collectDeviceId: true, collectContacts: false,
  collectPhotos: false, collectCamera: false, collectMicrophone: false, collectHealth: false,
  collectFinancial: false, collectBrowsing: false, collectCookies: true,
  collectClipboard: false, collectAdId: false,
  useAnalytics: true, useAds: false, usePayment: false, useSocialLogin: false,
  useCloudStorage: false, usePushNotifications: true,
  hasSubscription: false, hasAccountSystem: true,
  targetChina: true, targetEU: false, targetUS: false, targetChildren: false,
  onAppStore: true, onGooglePlay: true, onHuaweiStore: false,
  onXiaomiStore: false, onOppoStore: false, onVivoStore: false,
};

// ── References ──

interface RefLink { title: string; url: string; }

const REFERENCES: Record<string, { zh: string; en: string; links: RefLink[] }> = {
  china: {
    zh: '中国法规', en: 'China Laws',
    links: [
      { title: '个人信息保护法 (PIPL)', url: 'http://www.npc.gov.cn/npc/c30834/202108/a8c4e3672c74491a80b53a172bb753fe.shtml' },
      { title: '网络安全法', url: 'http://www.cac.gov.cn/2016-11/07/c_1119867116.htm' },
      { title: '数据安全法', url: 'http://www.npc.gov.cn/npc/c30834/202106/c2c15c3274444f82a4990827e2e74575.shtml' },
      { title: 'App违法违规收集使用个人信息行为认定方法', url: 'https://www.cac.gov.cn/2019-12/27/c_1578986455686625.htm' },
      { title: '常见类型移动互联网应用程序必要个人信息范围规定', url: 'https://www.cac.gov.cn/2021-03/12/c_1617986911456318.htm' },
      { title: '华为应用市场审核指南', url: 'https://developer.huawei.com/consumer/cn/doc/app/agc-help-reviewguide-0000001146717498' },
      { title: '小米应用商店审核规范', url: 'https://dev.mi.com/distribute/doc/details?pId=1710' },
    ],
  },
  apple: {
    zh: 'Apple 审核', en: 'Apple Review',
    links: [
      { title: 'App Store Review Guidelines §5.1 Privacy', url: 'https://developer.apple.com/app-store/review/guidelines/#privacy' },
      { title: 'App Privacy Details (数据标签)', url: 'https://developer.apple.com/app-store/app-privacy-details/' },
      { title: 'ATT Framework (App Tracking Transparency)', url: 'https://developer.apple.com/documentation/apptrackingtransparency' },
      { title: 'Subscription & IAP Guidelines', url: 'https://developer.apple.com/app-store/subscriptions/' },
    ],
  },
  google: {
    zh: 'Google Play', en: 'Google Play',
    links: [
      { title: 'Google Play Developer Policy - Privacy', url: 'https://play.google.com/about/developer-content-policy/' },
      { title: 'Data Safety 填写指南', url: 'https://support.google.com/googleplay/android-developer/answer/10787469' },
      { title: 'Families Policy (面向儿童)', url: 'https://play.google.com/about/families/' },
    ],
  },
  euus: {
    zh: '欧盟/美国', en: 'EU / US',
    links: [
      { title: 'GDPR 全文', url: 'https://gdpr-info.eu/' },
      { title: 'COPPA (儿童在线隐私保护)', url: 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa' },
      { title: 'CCPA (加州消费者隐私法)', url: 'https://oag.ca.gov/privacy/ccpa' },
    ],
  },
};

// ── Checklist ──

interface CheckItem {
  id: string;
  platform: string;
  category: string;
  zh: string;
  en: string;
  required: boolean;
  check: (c: AppConfig) => boolean;
  suggestion: { zh: string; en: string };
  fix?: (c: AppConfig) => Partial<AppConfig>;
  reference?: { title: string; url: string };
  manualOnly?: boolean;
  notApplicable?: (c: AppConfig) => boolean;
}

function isCollectingData(c: AppConfig): boolean {
  return [c.collectPersonalInfo, c.collectLocation, c.collectDeviceId, c.collectContacts, c.collectPhotos, c.collectCamera, c.collectMicrophone, c.collectHealth, c.collectFinancial, c.collectBrowsing, c.collectCookies, c.collectClipboard, c.collectAdId].some(Boolean);
}

function hasThirdParty(c: AppConfig): boolean {
  return c.useAnalytics || c.useAds || c.usePayment || c.useSocialLogin || c.useCloudStorage || c.usePushNotifications;
}

const CHECKLIST: CheckItem[] = [
  // ── Apple & Google: Privacy Policy ──
  {
    id: 'pp_url', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须提供隐私政策链接', en: 'Privacy policy URL required',
    required: true,
    check: (c) => !!c.appName && !!c.contactEmail,
    suggestion: { zh: '请填写应用名称和联系邮箱，生成的隐私政策将包含完整的联系信息', en: 'Fill in app name and contact email to generate a complete privacy policy with contact info' },
    reference: { title: 'Apple Guidelines §5.1.1', url: 'https://developer.apple.com/app-store/review/guidelines/#privacy' },
  },
  {
    id: 'pp_data', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须披露收集的所有数据类型', en: 'Must disclose all data types collected',
    required: true,
    check: (c) => isCollectingData(c),
    notApplicable: (c) => !isCollectingData(c) && !hasThirdParty(c),
    suggestion: { zh: '请勾选您的应用实际收集的所有数据类型，遗漏是审核被拒的最常见原因', en: 'Check ALL data types your app actually collects. Incomplete disclosure is the #1 rejection reason' },
    fix: () => ({ collectPersonalInfo: true }),
    reference: { title: 'Apple App Privacy Details', url: 'https://developer.apple.com/app-store/app-privacy-details/' },
  },
  {
    id: 'pp_purpose', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须说明每项数据的使用目的', en: 'Must explain purpose for each data type',
    required: true,
    check: (c) => isCollectingData(c),
    notApplicable: (c) => !isCollectingData(c),
    suggestion: { zh: '生成的隐私政策已包含数据使用目的说明。请确保与实际用途一致', en: 'The generated policy includes purpose statements. Ensure they match actual usage' },
  },
  {
    id: 'pp_third', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须披露第三方数据共享', en: 'Must disclose third-party data sharing',
    required: true,
    check: (c) => hasThirdParty(c),
    notApplicable: (c) => !hasThirdParty(c),
    suggestion: { zh: '如使用了任何第三方 SDK（统计、推送、支付等），请在「第三方服务」中勾选', en: 'If you use any third-party SDKs (analytics, push, payment, etc.), check them under Third-Party Services' },
    fix: () => ({ useAnalytics: true }),
  },
  {
    id: 'pp_delete', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须提供用户数据删除途径', en: 'Must provide data deletion method',
    required: true,
    check: (c) => !!c.contactEmail,
    notApplicable: (c) => !isCollectingData(c) && !c.hasAccountSystem,
    suggestion: { zh: '请填写联系邮箱，隐私政策中将包含数据删除请求方式', en: 'Fill in contact email so the policy can include a data deletion request method' },
    fix: (c) => c.contactEmail ? {} : {},
  },
  {
    id: 'pp_contact', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须提供有效联系方式', en: 'Must provide valid contact information',
    required: true,
    check: (c) => !!c.contactEmail && (c.contactEmail.includes('@')),
    suggestion: { zh: '请填写有效的联系邮箱地址（需包含 @）', en: 'Enter a valid email address (must contain @)' },
  },
  {
    id: 'pp_retention', platform: 'Apple/Google', category: '隐私政策',
    zh: '必须说明数据保留期限', en: 'Must disclose data retention period',
    required: true,
    check: (c) => !!c.dataRetention,
    notApplicable: (c) => !isCollectingData(c) && !c.hasAccountSystem,
    suggestion: { zh: '请在「高级设置」中填写数据保留期限，如「账号注销后 15 个工作日内删除」', en: 'Fill in data retention period in Advanced settings, e.g. "Within 15 business days after account deletion"' },
    fix: () => ({ dataRetention: '在实现收集目的所必需的期限内保留，账号注销后 15 个工作日内删除' }),
  },
  {
    id: 'pp_child', platform: 'Apple/Google', category: '儿童隐私',
    zh: '如面向儿童，必须符合 COPPA/儿童保护规定', en: 'Must comply with COPPA if targeting children',
    required: false,
    check: (c) => !c.targetChildren,
    suggestion: { zh: '如应用面向 14 岁以下未成年人，需在「目标市场」中勾选「面向儿童」，并确保符合相关法规', en: 'If targeting children under 13, check "Children" under Target Market and ensure COPPA compliance' },
    reference: { title: 'COPPA Rule', url: 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa' },
  },
  // ── Google Play ──
  {
    id: 'ds_form', platform: 'Google Play', category: '数据安全',
    zh: '必须在 Google Play Console 填写数据安全表单', en: 'Must complete Data Safety form in Google Play Console',
    required: true,
    check: (c) => !c.onGooglePlay,
    suggestion: { zh: '请在 Google Play Console → 政策 → 数据安全 中填写表单，内容需与隐私政策一致', en: 'Go to Google Play Console → Policy → Data Safety and fill in the form. Must match your privacy policy' },
    manualOnly: true,
    reference: { title: 'Data Safety 填写指南', url: 'https://support.google.com/googleplay/android-developer/answer/10787469' },
  },
  // ── Apple ──
  {
    id: 'att', platform: 'Apple', category: 'ATT',
    zh: 'iOS 14.5+ 使用广告标识符或追踪需声明 ATT', en: 'Must declare ATT if using IDFA or tracking on iOS 14.5+',
    required: true,
    check: (c) => !c.onAppStore || (!c.useAds && !c.collectAdId),
    suggestion: { zh: '如使用 IDFA 或进行用户追踪，需集成 App Tracking Transparency 框架并在首次弹窗请求授权', en: 'If using IDFA or tracking, integrate ATT framework and request permission via dialog on first launch' },
    fix: () => ({ collectAdId: false }),
    reference: { title: 'ATT Framework', url: 'https://developer.apple.com/documentation/apptrackingtransparency' },
  },
  {
    id: 'sub_terms', platform: 'Apple', category: '订阅',
    zh: '含订阅服务须明确说明订阅条款（价格、续期、取消方式）', en: 'Subscription apps must disclose terms (price, renewal, cancellation)',
    required: false,
    check: (c) => !c.hasSubscription,
    suggestion: { zh: '服务条款中已包含订阅条款模板。请确保实际价格和续期规则与 App Store Connect 中一致', en: 'Terms of Service include subscription clauses. Ensure prices and renewal rules match App Store Connect' },
    reference: { title: 'Subscription Guidelines', url: 'https://developer.apple.com/app-store/subscriptions/' },
  },
  {
    id: 'apple_review_5.1.1', platform: 'Apple', category: '审核',
    zh: 'App Store Connect 须填写隐私政策 URL', en: 'Must provide privacy policy URL in App Store Connect',
    required: true,
    check: (c) => !c.onAppStore || (!!c.website && !!c.appName),
    suggestion: { zh: '将生成的 HTML 隐私政策部署到您的网站，然后在 App Store Connect → App 信息 → 隐私政策 URL 中填写链接', en: 'Deploy the generated HTML privacy policy to your website, then enter the URL in App Store Connect → App Info → Privacy Policy URL' },
    manualOnly: true,
  },
  {
    id: 'apple_review_5.1.2', platform: 'Apple', category: '审核',
    zh: 'App Store Connect 须填写 App 隐私数据标签', en: 'Must complete App Privacy data labels in App Store Connect',
    required: true,
    check: (c) => !c.onAppStore,
    suggestion: { zh: '在 App Store Connect → App 隐私 中如实填写数据收集情况，需与本工具勾选项一致', en: 'Fill in App Privacy section in App Store Connect honestly, matching the checkboxes you selected here' },
    manualOnly: true,
    reference: { title: 'App Privacy Details', url: 'https://developer.apple.com/app-store/app-privacy-details/' },
  },
  // ── Chinese stores ──
  {
    id: 'icp', platform: '中国应用市场', category: '备案',
    zh: '必须完成 ICP 备案', en: 'Must complete ICP filing',
    required: true,
    check: (c) => !c.targetChina,
    suggestion: { zh: '在工信部备案系统 (beian.miit.gov.cn) 完成 ICP 备案，上架时需提供备案号', en: 'Complete ICP filing at beian.miit.gov.cn. You need the filing number when submitting to stores' },
    manualOnly: true,
  },
  {
    id: 'real_name', platform: '中国应用市场', category: '实名',
    zh: '必须支持实名认证（如涉及账号系统）', en: 'Must support real-name verification (if has account system)',
    required: true,
    check: (c) => !c.targetChina || !c.hasAccountSystem,
    suggestion: { zh: '如有用户账号系统，需接入实名认证（如手机号验证）。纯工具类应用可豁免', en: 'If your app has user accounts, integrate real-name verification (e.g., phone number). Pure utility apps may be exempt' },
    manualOnly: true,
  },
  {
    id: 'cancel_account', platform: '中国应用市场', category: '注销',
    zh: '必须提供账号注销功能，且在 15 个工作日内完成', en: 'Must provide account deletion within 15 business days',
    required: true,
    check: (c) => !c.targetChina || !c.hasAccountSystem,
    suggestion: { zh: '在应用设置中提供「注销账号」入口，处理周期不超过 15 个工作日。服务条款中已包含相关条款', en: 'Add "Delete Account" in app settings, process within 15 business days. Terms of Service include this clause' },
    manualOnly: true,
    reference: { title: 'App违法违规收集认定方法', url: 'https://www.cac.gov.cn/2019-12/27/c_1578986455686625.htm' },
  },
  {
    id: 'pop_window', platform: '中国应用市场', category: '弹窗',
    zh: '首次启动必须弹出隐私政策弹窗，用户同意后方可收集信息', en: 'Must show privacy policy popup on first launch before any data collection',
    required: true,
    check: (c) => !c.targetChina,
    notApplicable: (c) => c.targetChina && !isCollectingData(c) && !hasThirdParty(c),
    suggestion: { zh: '实现首次启动弹窗：展示隐私政策摘要 + 「同意」/「不同意」两个按钮。不同意时不得收集任何个人信息', en: 'Implement first-launch popup: show privacy policy summary with "Agree" / "Disagree" buttons. No data collection before consent' },
    manualOnly: true,
    reference: { title: '常见类型APP必要个人信息范围规定', url: 'https://www.cac.gov.cn/2021-03/12/c_1617986911456318.htm' },
  },
  {
    id: 'min_scope', platform: '中国应用市场', category: '最小权限',
    zh: '不得强制收集非必要个人信息，不得因用户拒绝而拒绝提供基本功能', en: 'Must not force-collect unnecessary data; must not deny basic features for declining permissions',
    required: true,
    check: (c) => !c.targetChina,
    notApplicable: (c) => c.targetChina && !isCollectingData(c),
    suggestion: { zh: '确保应用在用户拒绝非必要权限（如位置、通讯录）后仍可正常使用基本功能', en: 'Ensure basic features work even when users decline non-essential permissions (location, contacts, etc.)' },
    manualOnly: true,
    reference: { title: '常见类型APP必要个人信息范围规定', url: 'https://www.cac.gov.cn/2021-03/12/c_1617986911456318.htm' },
  },
  {
    id: 'pipl_dpo', platform: '中国应用市场', category: 'PIPL',
    zh: '处理个人信息须指定保护负责人', en: 'Must designate a DPO when processing personal information (PIPL)',
    required: true,
    check: (c) => !c.targetChina || !!c.dpoContact,
    notApplicable: (c) => c.targetChina && !isCollectingData(c) && !hasThirdParty(c),
    suggestion: { zh: '请在「高级设置」中填写个人信息保护负责人的联系方式（邮箱或电话）', en: 'Fill in DPO contact (email or phone) in Advanced settings' },
    fix: (c) => c.dpoContact ? {} : { dpoContact: c.contactEmail },
    reference: { title: '个人信息保护法 第52条', url: 'http://www.npc.gov.cn/npc/c30834/202108/a8c4e3672c74491a80b53a172bb753fe.shtml' },
  },
  {
    id: 'pipl_sdk', platform: '中国应用市场', category: 'PIPL',
    zh: '须在隐私政策中披露第三方 SDK 列表及各自收集的信息', en: 'Must disclose third-party SDK list and data each SDK collects',
    required: true,
    check: (c) => !c.targetChina || hasThirdParty(c),
    notApplicable: (c) => c.targetChina && !hasThirdParty(c),
    suggestion: { zh: '请在「第三方服务」中勾选所有使用的 SDK 类型。生成的隐私政策将列出各 SDK 的数据收集说明', en: 'Check all SDK types under Third-Party Services. The generated policy will list each SDK\'s data collection' },
    fix: () => ({ useAnalytics: true }),
    reference: { title: 'App违法违规收集认定方法', url: 'https://www.cac.gov.cn/2019-12/27/c_1578986455686625.htm' },
  },
  {
    id: 'china_data_local', platform: '中国应用市场', category: '数据本地化',
    zh: '个人信息和重要数据应存储在境内', en: 'Personal and important data should be stored within China',
    required: true,
    check: (c) => !c.targetChina || c.storageType === 'local',
    notApplicable: (c) => c.targetChina && c.storageType === 'local',
    suggestion: { zh: '如面向中国市场且使用云端存储，建议使用境内服务器（阿里云、腾讯云等），数据出境需进行安全评估。纯本地存储的应用无需担心此问题', en: 'For China market with cloud storage, use domestic servers. Local-only apps are exempt from this requirement' },
    manualOnly: true,
    reference: { title: '数据安全法', url: 'http://www.npc.gov.cn/npc/c30834/202106/c2c15c3274444f82a4990827e2e74575.shtml' },
  },
  // ── GDPR ──
  {
    id: 'gdpr_consent', platform: 'EU/GDPR', category: 'GDPR',
    zh: '须获得用户明确同意（opt-in），不得默认勾选', en: 'Must obtain explicit opt-in consent; no pre-checked boxes',
    required: true,
    check: (c) => !c.targetEU,
    notApplicable: (c) => c.targetEU && !isCollectingData(c) && !c.collectCookies,
    suggestion: { zh: '面向欧盟用户时，Cookie 和数据收集须获得明确同意（点击「同意」按钮），不得默认勾选', en: 'For EU users, cookies and data collection require explicit opt-in consent. No pre-checked boxes allowed' },
    manualOnly: true,
    reference: { title: 'GDPR Article 7', url: 'https://gdpr-info.eu/art-7-gdpr/' },
  },
  {
    id: 'gdpr_dpo', platform: 'EU/GDPR', category: 'GDPR',
    zh: '大规模处理个人数据时须指定数据保护官 (DPO)', en: 'Must appoint DPO for large-scale data processing',
    required: false,
    check: (c) => !c.targetEU || !!c.dpoContact,
    notApplicable: (c) => c.targetEU && !isCollectingData(c) && !hasThirdParty(c),
    suggestion: { zh: '如大规模处理欧盟用户数据，请在「高级设置」中填写 DPO 联系方式', en: 'If processing EU user data at scale, fill in DPO contact in Advanced settings' },
    fix: (c) => c.dpoContact ? {} : { dpoContact: c.contactEmail },
    reference: { title: 'GDPR Article 37', url: 'https://gdpr-info.eu/art-37-gdpr/' },
  },
  {
    id: 'gdpr_breach', platform: 'EU/GDPR', category: 'GDPR',
    zh: '须建立数据泄露通知机制（72 小时内通知监管机构）', en: 'Must have breach notification mechanism (72h to authority)',
    required: true,
    check: (c) => !c.targetEU,
    notApplicable: (c) => c.targetEU && !isCollectingData(c) && !c.hasAccountSystem,
    suggestion: { zh: '建立数据泄露应急流程：发现泄露后 72 小时内通知监管机构，必要时通知用户', en: 'Establish breach response: notify authority within 72 hours of discovery, notify users if necessary' },
    manualOnly: true,
    reference: { title: 'GDPR Article 33', url: 'https://gdpr-info.eu/art-33-gdpr/' },
  },
  {
    id: 'gdpr_basis', platform: 'EU/GDPR', category: 'GDPR',
    zh: '须在隐私政策中说明数据处理的法律依据', en: 'Must state legal basis for data processing',
    required: true,
    check: (c) => !c.targetEU,
    notApplicable: (c) => c.targetEU && !isCollectingData(c) && !hasThirdParty(c),
    suggestion: { zh: '生成的隐私政策已包含 GDPR 法律依据说明（合同履行、同意、合法利益等）', en: 'The generated policy includes GDPR legal basis (contract, consent, legitimate interest)' },
  },
  {
    id: 'gdpr_transfer', platform: 'EU/GDPR', category: 'GDPR',
    zh: '跨境数据传输须有合法机制（SCC/充分性认定）', en: 'Cross-border transfers require legal mechanism (SCC / adequacy)',
    required: true,
    check: (c) => !c.targetEU,
    notApplicable: (c) => c.targetEU && !isCollectingData(c) && !hasThirdParty(c),
    suggestion: { zh: '如数据传输至欧盟境外，需使用标准合同条款 (SCC) 或获得充分性认定', en: 'If transferring data outside EU, use Standard Contractual Clauses (SCC) or adequacy decision' },
    manualOnly: true,
    reference: { title: 'GDPR Chapter V', url: 'https://gdpr-info.eu/chapter-5/' },
  },
  // ── COPPA ──
  {
    id: 'coppa', platform: 'US/COPPA', category: 'COPPA',
    zh: '面向 13 岁以下儿童需获得家长可验证同意', en: 'Must obtain verifiable parental consent for children under 13',
    required: true,
    check: (c) => !c.targetChildren,
    suggestion: { zh: '如面向 13 岁以下儿童，需实现家长同意验证机制（如信用卡验证、身份证验证等）', en: 'For children under 13, implement verifiable parental consent (credit card, ID verification, etc.)' },
    manualOnly: true,
    reference: { title: 'COPPA Rule', url: 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa' },
  },
  // ── US State Laws ──
  {
    id: 'ccpa', platform: 'US/CCPA', category: 'CCPA',
    zh: '加州用户有权选择退出个人信息出售 (Do Not Sell)', en: 'California users must have "Do Not Sell My Personal Information" option',
    required: false,
    check: (c) => !c.targetUS || !c.useAds,
    suggestion: { zh: '如面向美国用户且使用广告 SDK，需提供「不出售我的个人信息」选项', en: 'For US users with ad SDKs, provide a "Do Not Sell My Personal Information" option' },
    manualOnly: true,
    reference: { title: 'CCPA', url: 'https://oag.ca.gov/privacy/ccpa' },
  },
];

// ── Markdown to HTML ──

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>\n$1</ul>')
    .replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p>$1</p>')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>(<(?:h[1-6]|ul|ol|li|hr|div)[^>]*>)/g, '$1')
    .replace(/(<\/(?:h[1-6]|ul|ol|li|hr|div)>)<\/p>/g, '$1');
  return html;
}

function wrapInHtmlTemplate(title: string, bodyHtml: string, lastUpdatedDate: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.8; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 24px; background: #fff; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #eee; }
    h2 { font-size: 18px; font-weight: 600; margin: 28px 0 12px; color: #222; }
    h3 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
    p { margin: 10px 0; }
    ul { padding-left: 24px; margin: 10px 0; }
    li { margin: 6px 0; }
    hr { border: none; border-top: 1px solid #eee; margin: 28px 0; }
    strong { font-weight: 600; }
    em { color: #666; font-style: italic; }
    @media (max-width: 640px) { body { padding: 20px 16px; } h1 { font-size: 20px; } }
  </style>
</head>
<body>
${bodyHtml}
<footer style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
  Last updated: ${lastUpdatedDate}
</footer>
</body>
</html>`;
}

// ── Document Generators ──

function generatePrivacyPolicy(c: AppConfig, lang: 'zh' | 'en'): string {
  const isZh = lang === 'zh';
  const dataItems: string[] = [];
  if (c.collectPersonalInfo) dataItems.push(isZh ? '个人身份信息（姓名、邮箱、电话等）' : 'Personal identity information (name, email, phone, etc.)');
  if (c.collectLocation) dataItems.push(isZh ? '位置信息（GPS、基站、Wi-Fi 定位）' : 'Location data (GPS, cell tower, Wi-Fi)');
  if (c.collectDeviceId) dataItems.push(isZh ? '设备标识符（IMEI、OAID、IDFA、Android ID 等）' : 'Device identifiers (IMEI, OAID, IDFA, Android ID, etc.)');
  if (c.collectContacts) dataItems.push(isZh ? '通讯录信息' : 'Contacts');
  if (c.collectPhotos) dataItems.push(isZh ? '相册/存储空间' : 'Photos/Storage');
  if (c.collectCamera) dataItems.push(isZh ? '相机' : 'Camera');
  if (c.collectMicrophone) dataItems.push(isZh ? '麦克风/录音' : 'Microphone');
  if (c.collectHealth) dataItems.push(isZh ? '健康与健身数据' : 'Health and fitness data');
  if (c.collectFinancial) dataItems.push(isZh ? '财务信息（支付卡号、银行账户等）' : 'Financial information (payment card, bank account)');
  if (c.collectBrowsing) dataItems.push(isZh ? '浏览记录与搜索历史' : 'Browsing history and search logs');
  if (c.collectCookies) dataItems.push(isZh ? 'Cookie 和类似跟踪技术' : 'Cookies and similar tracking technologies');
  if (c.collectClipboard) dataItems.push(isZh ? '剪贴板数据' : 'Clipboard data');
  if (c.collectAdId) dataItems.push(isZh ? '广告标识符（IDFA / GAID）' : 'Advertising identifiers (IDFA / GAID)');

  const thirdParties: string[] = [];
  if (c.useAnalytics) thirdParties.push(isZh ? '数据分析服务（如 Google Analytics、Firebase、友盟等）' : 'Analytics services (e.g., Google Analytics, Firebase)');
  if (c.useAds) thirdParties.push(isZh ? '广告投放服务（如 Google AdMob、穿山甲、Unity Ads 等）' : 'Advertising services (e.g., Google AdMob, Unity Ads)');
  if (c.usePayment) thirdParties.push(isZh ? '支付处理服务（如 Apple Pay、微信支付、支付宝、Stripe 等）' : 'Payment processors (e.g., Apple Pay, Stripe, PayPal)');
  if (c.useSocialLogin) thirdParties.push(isZh ? '社交登录服务（如微信、QQ、Apple Sign In、Google Sign In）' : 'Social login (e.g., Google Sign In, Apple Sign In)');
  if (c.useCloudStorage) thirdParties.push(isZh ? '云存储与服务器服务（如 AWS、阿里云、腾讯云等）' : 'Cloud storage (e.g., AWS, Google Cloud, Azure)');
  if (c.usePushNotifications) thirdParties.push(isZh ? '推送通知服务（如 APNs、FCM、个推、极光等）' : 'Push notification services (e.g., APNs, FCM)');

  const retention = c.dataRetention || (isZh ? '在实现收集目的所必需的期限内保留' : 'as long as necessary to fulfill the purposes described');

  if (isZh) {
    let md = `# ${c.appName || '[应用名称]'} 隐私政策

**生效日期：** ${c.effectiveDate}
**最后更新：** ${c.lastUpdatedDate}

${c.companyName || '[公司名称]'}（以下简称"我们"）深知个人信息对您的重要性，我们将按照《中华人民共和国个人信息保护法》《网络安全法》《数据安全法》等法律法规要求，采取相应的安全保护措施来保护您的个人信息。本《隐私政策》适用于 ${c.appName || '[应用名称]'} 应用程序（以下简称"本应用"）。

---

## 一、我们收集的信息

在您使用本应用时，我们可能收集以下信息：

${dataItems.map((d) => `- ${d}`).join('\n')}

我们仅会收集实现产品功能所必要的信息，不会收集与服务无关的个人信息。

## 二、信息的使用目的

我们收集的信息将用于以下目的：

- 向您提供、维护和改进我们的服务
- 进行数据分析以优化用户体验
- 发送服务相关通知和更新
- 保障账户安全和防范欺诈
- 遵守法律法规要求

${c.targetEU ? `**法律依据（GDPR）：** 我们处理您个人数据的法律依据包括：履行与您的合同义务、获得您的明确同意、遵守法律义务、以及维护我们的合法利益。` : ''}

## 三、信息的共享与披露

我们不会将您的个人信息出售给第三方。在以下情况下，我们可能会共享您的信息：

${thirdParties.length > 0 ? `**第三方服务提供商：**\n${thirdParties.map((t) => `- ${t}`).join('\n')}` : '我们目前不与任何第三方服务共享您的个人信息。'}

**法律要求的披露：** 在法律法规、法律程序、政府主管部门强制性要求的情况下，我们可能会披露您的信息。

## 四、信息的存储与安全

${c.storageType === 'local' ? `- 您的数据存储在您的设备本地（如本地数据库、文件系统），不会上传至我们的服务器
- 我们通过设备操作系统提供的安全机制（如加密存储、沙盒隔离、权限控制）来保护您的数据安全
- 卸载应用后，本地存储的数据将随之删除` : c.storageType === 'both' ? `- 您的部分数据存储在设备本地（如本地数据库、文件系统），部分数据存储在${c.targetChina ? '中华人民共和国境内' : '安全的'}服务器上
- 对于本地数据，我们通过设备操作系统提供的安全机制保护；对于云端数据，我们采取业界标准的安全技术措施保护，包括数据加密、访问控制、安全审计等
${c.targetEU ? '- 如涉及跨境传输，我们将依据标准合同条款（SCC）或获得您的明确同意\n' : ''}` : `- 我们采取业界标准的安全技术措施来保护您的个人信息，包括数据加密、访问控制、安全审计等
- 您的个人信息存储在${c.targetChina ? '中华人民共和国境内' : '安全的服务器上'}${c.targetEU ? '，如涉及跨境传输，我们将依据标准合同条款（SCC）或获得您的明确同意' : ''}`}
- 我们仅在实现本隐私政策所述目的所必需的期限内保留您的个人信息：${retention}

## 五、您的权利

您依法享有以下权利：

- **访问权：** 您有权访问我们持有的您的个人信息
- **更正权：** 您有权要求更正不准确的个人信息
- **删除权：** 您有权要求删除您的个人信息
- **撤回同意：** 您有权随时撤回对个人信息处理的同意
- **注销账号：** 您可以通过本应用内的设置页面或联系我们将账号注销${c.targetChina ? '，我们将在 15 个工作日内完成处理' : ''}
- **可携带权：** 您有权获取您的个人信息副本${c.targetEU ? '，并有权将数据转移至其他控制者' : ''}
${c.targetEU ? '- **投诉权：** 您有权向当地数据保护监管机构提出投诉\n' : ''}${c.collectCookies ? `
## 六、Cookie 和跟踪技术

我们使用 Cookie 和类似技术来：
- 维持您的登录状态
- 记住您的偏好设置
- 分析应用使用情况
${c.useAds ? '- 提供个性化广告\n' : ''}
您可以通过系统设置管理和控制 Cookie。${c.targetEU ? '在欧盟地区，我们会在首次访问时征求您对非必要 Cookie 的同意。' : ''}` : ''}

## ${c.collectCookies ? '七' : '六'}、${c.targetChina ? '未成年人保护' : "Children's Privacy"}

${c.targetChildren ? (isZh ? '我们的应用面向儿童用户。我们严格遵守《儿童个人信息网络保护规定》，不会在未获得监护人同意的情况下收集 14 岁以下未成年人的个人信息。' : 'Our App is directed to children. We comply with COPPA and do not knowingly collect personal information from children under 13 without parental consent.') : (isZh ? '我们高度重视未成年人个人信息的保护。如果您是未满 14 周岁的未成年人，请在您的监护人陪同下阅读本隐私政策，并在征得监护人同意后使用我们的服务。' : 'Our App is not directed to children under the age of 13. We do not knowingly collect personal information from children.')}

${c.targetChina ? `## ${c.collectCookies ? '八' : '七'}、隐私政策的更新

我们可能会不时更新本隐私政策。更新后的隐私政策将在本应用内公布，并在必要时通过应用内通知或弹窗的方式告知您。重大变更时，我们将再次征求您的同意。

## ${c.collectCookies ? '九' : '八'}、联系我们

如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：

- **邮箱：** ${c.contactEmail || '[邮箱地址]'}
${c.contactAddress ? `- **地址：** ${c.contactAddress}` : ''}
${c.website ? `- **网站：** ${c.website}` : ''}
${c.dpoContact ? `- **个人信息保护负责人：** ${c.dpoContact}` : ''}

---

*本隐私政策自发布之日起生效。*

---

**${c.companyName || '[公司名称]'}` : `## ${c.collectCookies ? '八' : '七'}、Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the App and, where required, through in-app notifications.

## ${c.collectCookies ? '九' : '八'}、Contact Us

If you have any questions about this Privacy Policy, please contact us:

- **Email:** ${c.contactEmail || '[email address]'}
${c.contactAddress ? `- **Address:** ${c.contactAddress}` : ''}
${c.website ? `- **Website:** ${c.website}` : ''}
${c.dpoContact ? `- **Data Protection Officer:** ${c.dpoContact}` : ''}

---

*This Privacy Policy is effective as of the date stated above.*`}`;

    return md;
  }

  // English version
  let md = `# ${c.appName || '[App Name]'} Privacy Policy

**Effective Date:** ${c.effectiveDate}
**Last Updated:** ${c.lastUpdatedDate}

${c.companyName || '[Company Name]'} ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use ${c.appName || '[App Name]'} (the "App").

---

## 1. Information We Collect

We may collect the following types of information when you use our App:

${dataItems.map((d) => `- ${d}`).join('\n')}

We only collect information that is necessary for the functioning of our App.

## 2. How We Use Your Information

We use the information we collect to:

- Provide, maintain, and improve our services
- Conduct analytics to optimize user experience
- Send service-related notifications and updates
- Ensure account security and prevent fraud
- Comply with legal obligations

${c.targetEU ? `**Legal Basis (GDPR):** We process your personal data based on: performance of a contract, your explicit consent, compliance with legal obligations, and our legitimate interests.` : ''}

## 3. Information Sharing and Disclosure

We do not sell your personal information to third parties. We may share your information in the following circumstances:

${thirdParties.length > 0 ? `**Third-Party Service Providers:**\n${thirdParties.map((t) => `- ${t}`).join('\n')}` : 'We do not currently share your personal information with any third-party services.'}

**Legal Requirements:** We may disclose your information when required by law, legal process, or governmental authorities.

## 4. Data Storage and Security

${c.storageType === 'local' ? `- Your data is stored locally on your device (e.g., local database, file system) and is not uploaded to our servers
- We rely on your device's built-in security mechanisms (such as encrypted storage, sandboxing, and permission controls) to protect your data
- When you uninstall the app, locally stored data will be deleted` : c.storageType === 'both' ? `- Some of your data is stored locally on your device, and some is stored on ${c.targetChina ? 'servers within China' : 'secure servers'}
- Local data is protected by your device's security mechanisms; cloud data is protected by industry-standard measures including encryption, access control, and security auditing
${c.targetEU ? '- Cross-border transfers comply with Standard Contractual Clauses (SCC) or require your explicit consent\n' : ''}` : `- We employ industry-standard security measures including encryption, access control, and security auditing
- Your personal information is stored on ${c.targetChina ? 'servers within China' : 'secure servers'}${c.targetEU ? '. Cross-border transfers comply with Standard Contractual Clauses (SCC) or require your explicit consent' : ''}`}
- We retain your personal information only for as long as necessary: ${retention}

## 5. Your Rights

You have the following rights regarding your personal information:

- **Access:** You have the right to access your personal information we hold
- **Correction:** You have the right to request correction of inaccurate information
- **Deletion:** You have the right to request deletion of your personal information
- **Withdraw Consent:** You have the right to withdraw consent at any time
- **Account Deletion:** You may delete your account through in-app settings or by contacting us
- **Data Portability:** You have the right to obtain a copy of your personal data${c.targetEU ? ' and transfer it to another controller' : ''}
${c.targetEU ? '- **Lodge a Complaint:** You have the right to lodge a complaint with a supervisory authority\n' : ''}${c.collectCookies ? `
## 6. Cookies and Tracking Technologies

We use cookies and similar technologies to:
- Maintain your login session
- Remember your preferences
- Analyze app usage patterns
${c.useAds ? '- Provide personalized advertising\n' : ''}
You can manage cookies through your device settings.${c.targetEU ? ' In the EU, we obtain consent for non-essential cookies on first visit.' : ''}` : ''}

## ${c.collectCookies ? '7' : '6'}. Children's Privacy

${c.targetChildren ? 'Our App is directed to children under 13. We comply with the Children\'s Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13 without parental consent.' : 'Our App is not directed to children under the age of 13. We do not knowingly collect personal information from children.'}

## ${c.collectCookies ? '8' : '7'}. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the App and, where required, through in-app notifications.

## ${c.collectCookies ? '9' : '8'}. Contact Us

If you have any questions about this Privacy Policy, please contact us:

- **Email:** ${c.contactEmail || '[email address]'}
${c.contactAddress ? `- **Address:** ${c.contactAddress}` : ''}
${c.website ? `- **Website:** ${c.website}` : ''}
${c.dpoContact ? `- **Data Protection Officer:** ${c.dpoContact}` : ''}

---

*This Privacy Policy is effective as of the date stated above.*`;

  return md;
}

function generateTermsOfService(c: AppConfig, lang: 'zh' | 'en'): string {
  const isZh = lang === 'zh';

  if (isZh) {
    return `# ${c.appName || '[应用名称]'} 服务条款

**生效日期：** ${c.effectiveDate}
**最后更新：** ${c.lastUpdatedDate}

欢迎使用 ${c.appName || '[应用名称]'}！在使用本应用之前，请仔细阅读以下服务条款。

---

## 一、服务条款的接受

通过下载、安装或使用本应用，即表示您同意受本服务条款的约束。如果您不同意本条款的任何内容，请立即停止使用本应用。

## 二、服务说明

${c.appName || '[应用名称]'} 是由 ${c.companyName || '[公司名称]'} 开发和运营的移动应用程序。我们保留随时修改、暂停或终止服务的权利。

${c.hasAccountSystem ? `## 三、用户账号

- 您需要注册账号才能使用本应用的全部功能
- 您有责任维护账号的安全性，包括保护您的密码
- 您不得将账号转让或借给他人使用
- 如发现账号被盗用，请立即通知我们
- 我们保留在违反本条款时暂停或终止您账号的权利
${c.targetChina ? '- 您可以随时申请注销账号，我们将在 15 个工作日内完成处理\n' : ''}
## 四、用户行为规范` : `## 三、用户行为规范`}

使用本应用时，您同意不会：

- 违反任何适用的法律法规
- 侵犯他人的知识产权或其他权利
- 传播恶意软件或进行有害活动
- 尝试未经授权访问我们的系统或其他用户的账号
- 使用自动化手段（如机器人、爬虫）访问本应用
- 干扰或破坏本应用的正常运行
- 利用本应用从事任何违法犯罪活动

## ${c.hasAccountSystem ? '五' : '四'}、知识产权

- 本应用及其所有内容（包括但不限于文字、图片、标志、软件、代码）均为 ${c.companyName || '[公司名称]'} 或其许可方的财产
- 未经明确授权，您不得复制、修改、分发、反编译或出售本应用的任何部分

${c.hasSubscription ? `## ${c.hasAccountSystem ? '六' : '五'}、订阅与应用内购买

- 本应用可能提供订阅服务或应用内购买项目
- 订阅将通过您的应用商店账户（Apple App Store / Google Play）扣费
- 订阅将自动续期，除非您在当前计费周期结束前至少 24 小时取消
- 您可以随时在应用商店的账户设置中管理和取消订阅
- 取消订阅后，您仍可在当前计费周期结束前继续使用订阅功能
- 所有购买一经完成概不退款，除非适用法律另有规定
- 免费试用期（如有）内取消将不会产生费用

` : ''}## ${c.hasSubscription ? (c.hasAccountSystem ? '七' : '六') : (c.hasAccountSystem ? '六' : '五')}、免责声明

- 本应用按"现状"和"可用性"提供，不作任何明示或暗示的保证
- 我们不保证本应用不会中断或无错误
- 在法律允许的最大范围内，我们不对因使用本应用而产生的任何间接、附带或后果性损害承担责任

## ${c.hasSubscription ? (c.hasAccountSystem ? '八' : '七') : (c.hasAccountSystem ? '七' : '六')}、责任限制

在适用法律允许的最大范围内，${c.companyName || '[公司名称]'} 对因本服务引起的或与之相关的任何损害不承担赔偿责任，无论该等损害是基于合同、侵权或其他法律理论。我们的总赔偿责任不超过您在过去 12 个月内向我们支付的金额。

## ${c.hasSubscription ? (c.hasAccountSystem ? '九' : '八') : (c.hasAccountSystem ? '八' : '七')}、第三方链接

本应用可能包含指向第三方网站或服务的链接。我们不对这些第三方的内容、隐私政策或做法承担责任。

## ${c.hasSubscription ? (c.hasAccountSystem ? '十' : '九') : (c.hasAccountSystem ? '九' : '八')}、条款的修改

我们保留不时修改本服务条款的权利。修改后的条款将在本应用内公布。继续使用本应用即表示您接受修改后的条款。

## ${c.hasSubscription ? (c.hasAccountSystem ? '十一' : '十') : (c.hasAccountSystem ? '十' : '九')}、适用法律与争议解决

- 本服务条款受 ${c.jurisdiction} 法律管辖
- 因本条款引起的任何争议应首先通过友好协商解决
${c.targetChina ? '- 协商不成的，应提交至有管辖权的人民法院解决' : '- 协商不成的，应提交至有管辖权的仲裁机构或法院解决'}

## ${c.hasSubscription ? (c.hasAccountSystem ? '十二' : '十一') : (c.hasAccountSystem ? '十一' : '十')}、可分割性

如果本条款的任何条款被认定为不可执行，该条款将在法律允许的最大范围内予以执行，其余条款继续具有完全效力。

## ${c.hasSubscription ? (c.hasAccountSystem ? '十三' : '十二') : (c.hasAccountSystem ? '十二' : '十一')}、联系我们

如果您对本服务条款有任何疑问，请联系我们：

- **邮箱：** ${c.contactEmail || '[邮箱地址]'}
${c.contactAddress ? `- **地址：** ${c.contactAddress}` : ''}

---

*本服务条款自发布之日起生效。*`;
  }

  // English
  return `# ${c.appName || '[App Name]'} Terms of Service

**Effective Date:** ${c.effectiveDate}
**Last Updated:** ${c.lastUpdatedDate}

Welcome to ${c.appName || '[App Name]'}! Please read these Terms of Service carefully before using the App.

---

## 1. Acceptance of Terms

By downloading, installing, or using the App, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please stop using the App immediately.

## 2. Description of Services

${c.appName || '[App Name]'} is a mobile application developed and operated by ${c.companyName || '[Company Name]'}. We reserve the right to modify, suspend, or discontinue the service at any time.

${c.hasAccountSystem ? `## 3. User Accounts

- You need to register an account to access all features of the App
- You are responsible for maintaining the security of your account and password
- You may not transfer or share your account with others
- Please notify us immediately if you suspect unauthorized access to your account
- We reserve the right to suspend or terminate your account for violations of these terms

## 4. User Conduct` : `## 3. User Conduct`}

When using the App, you agree not to:

- Violate any applicable laws or regulations
- Infringe upon the intellectual property or other rights of others
- Distribute malware or engage in harmful activities
- Attempt unauthorized access to our systems or other users' accounts
- Use automated means (e.g., bots, crawlers) to access the App
- Interfere with or disrupt the operation of the App

## ${c.hasAccountSystem ? '5' : '4'}. Intellectual Property

- The App and all its content (including but not limited to text, images, logos, software) are the property of ${c.companyName || '[Company Name]'} or its licensors
- You may not copy, modify, distribute, decompile, or sell any part of the App without explicit authorization

${c.hasSubscription ? `## ${c.hasAccountSystem ? '6' : '5'}. Subscriptions and In-App Purchases

- The App may offer subscription services or in-app purchases
- Subscriptions are billed through your app store account (Apple App Store / Google Play)
- Subscriptions automatically renew unless you cancel at least 24 hours before the end of the current billing period
- You can manage and cancel subscriptions in your app store account settings
- After cancellation, you retain access until the end of the current billing period
- All purchases are non-refundable unless required by applicable law
- Free trial periods (if offered) will not incur charges if canceled during the trial

` : ''}## ${c.hasSubscription ? (c.hasAccountSystem ? '7' : '6') : (c.hasAccountSystem ? '6' : '5')}. Disclaimer of Warranties

- The App is provided on an "as is" and "as available" basis without warranties of any kind
- We do not guarantee that the App will be uninterrupted or error-free
- To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from the use of the App

## ${c.hasSubscription ? (c.hasAccountSystem ? '8' : '7') : (c.hasAccountSystem ? '7' : '6')}. Limitation of Liability

To the maximum extent permitted by applicable law, ${c.companyName || '[Company Name]'} shall not be liable for any damages arising out of or in connection with the service. Our total liability shall not exceed the amount you paid us in the past 12 months.

## ${c.hasSubscription ? (c.hasAccountSystem ? '9' : '8') : (c.hasAccountSystem ? '8' : '7')}. Third-Party Links

The App may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of any third parties.

## ${c.hasSubscription ? (c.hasAccountSystem ? '10' : '9') : (c.hasAccountSystem ? '9' : '8')}. Modifications to Terms

We reserve the right to modify these Terms of Service from time to time. Modified terms will be posted in the App. Continued use of the App constitutes acceptance of the modified terms.

## ${c.hasSubscription ? (c.hasAccountSystem ? '11' : '10') : (c.hasAccountSystem ? '10' : '9')}. Governing Law and Disputes

- These Terms of Service shall be governed by the laws of ${c.jurisdiction}
- Any disputes arising from these terms shall first be resolved through friendly negotiation
${c.targetEU ? '- Disputes not resolved through negotiation shall be submitted to the competent courts' : '- Disputes not resolved through negotiation shall be submitted to the competent arbitration body or court'}

## ${c.hasSubscription ? (c.hasAccountSystem ? '12' : '11') : (c.hasAccountSystem ? '11' : '10')}. Severability

If any provision of these terms is held to be unenforceable, that provision will be enforced to the maximum extent permissible, and the remaining provisions will remain in full force and effect.

## ${c.hasSubscription ? (c.hasAccountSystem ? '13' : '12') : (c.hasAccountSystem ? '12' : '11')}. Contact Us

If you have any questions about these Terms of Service, please contact us:

- **Email:** ${c.contactEmail || '[email address]'}
${c.contactAddress ? `- **Address:** ${c.contactAddress}` : ''}

---

*These Terms of Service are effective as of the date stated above.*`;
}

// ── Main Component ──

export default function PrivacyGenerator() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('privacy');
  const [tab, setTab] = useState<Tab>('privacy');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [outputLang, setOutputLang] = useState<'zh' | 'en'>('zh');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('html');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRefs, setShowRefs] = useState(false);

  const update = (key: keyof AppConfig, value: any) => setConfig((prev) => ({ ...prev, [key]: value }));

  const applyFix = useCallback((fix: (c: AppConfig) => Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...fix(prev) }));
  }, []);

  const fixAll = useCallback(() => {
    setConfig((prev) => {
      const merged = { ...prev };
      for (const item of CHECKLIST) {
        const na = item.notApplicable?.(merged) ?? false;
        if (!na && !item.check(merged) && item.fix) {
          Object.assign(merged, item.fix(merged));
        }
      }
      return merged;
    });
  }, []);

  const privacyDoc = useMemo(() => generatePrivacyPolicy(config, outputLang), [config, outputLang]);
  const termsDoc = useMemo(() => generateTermsOfService(config, outputLang), [config, outputLang]);

  const privacyHtml = useMemo(() => {
    const title = `${config.appName || (outputLang === 'zh' ? '应用' : 'App')} - ${outputLang === 'zh' ? '隐私政策' : 'Privacy Policy'}`;
    return wrapInHtmlTemplate(title, markdownToHtml(privacyDoc), config.lastUpdatedDate);
  }, [privacyDoc, config.appName, config.lastUpdatedDate, outputLang]);

  const termsHtml = useMemo(() => {
    const title = `${config.appName || (outputLang === 'zh' ? '应用' : 'App')} - ${outputLang === 'zh' ? '服务条款' : 'Terms of Service'}`;
    return wrapInHtmlTemplate(title, markdownToHtml(termsDoc), config.lastUpdatedDate);
  }, [termsDoc, config.appName, config.lastUpdatedDate, outputLang]);

  const checklistResults = useMemo(() => {
    return CHECKLIST.map((item) => {
      const na = item.notApplicable?.(config) ?? false;
      const passed = na || item.check(config);
      return { ...item, passed, na };
    });
  }, [config]);

  const applicableResults = checklistResults.filter((r) => !r.na);
  const failedWithFix = applicableResults.filter((r) => !r.passed && r.fix);
  const passCount = applicableResults.filter((r) => r.passed).length;
  const currentDoc = tab === 'privacy' ? privacyDoc : termsDoc;
  const currentHtml = tab === 'privacy' ? privacyHtml : termsHtml;

  const copyDoc = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, []);

  const downloadDoc = useCallback((text: string, filename: string, mimeType: string) => {
    const blob = new Blob([text], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const CheckboxField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="priv-checkbox"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>
  );

  const fileBase = tab === 'privacy' ? 'privacy-policy' : 'terms-of-service';

  return (
    <ToolShell title={name} description={desc}>
      <div className="priv-tabs">
        {(['privacy', 'terms', 'checklist'] as Tab[]).map((tb) => (
          <button key={tb} className={`priv-tab${tab === tb ? ' priv-tab-active' : ''}`} onClick={() => setTab(tb)}>
            {ui[`tab_${tb}`]}{tb === 'checklist' && ` (${passCount}/${applicableResults.length})`}
          </button>
        ))}
      </div>

      <div className="priv-layout">
        {/* Config Panel */}
        <div className="priv-config">
          <div className="priv-section">
            <div className="priv-section-title">{ui.basicInfo}</div>
            <div className="priv-field"><label>{ui.appName} *</label><input className="input-field" value={config.appName} onChange={(e) => update('appName', e.target.value)} placeholder={ui.appNamePlaceholder} /></div>
            <div className="priv-field"><label>{ui.companyName} *</label><input className="input-field" value={config.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder={ui.companyNamePlaceholder} /></div>
            <div className="priv-field"><label>{ui.contactEmail} *</label><input className="input-field" value={config.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="contact@example.com" /></div>
            <div className="priv-field"><label>{ui.website}</label><input className="input-field" value={config.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" /></div>
            <div className="priv-field"><label>{ui.contactAddress}</label><input className="input-field" value={config.contactAddress} onChange={(e) => update('contactAddress', e.target.value)} /></div>
            <div className="priv-field"><label>{ui.effectiveDate}</label><input type="date" className="input-field" value={config.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} /></div>
            <div className="priv-field"><label>{ui.lastUpdatedDate}</label><input type="date" className="input-field" value={config.lastUpdatedDate} onChange={(e) => update('lastUpdatedDate', e.target.value)} /></div>
          </div>

          <div className="priv-section">
            <div className="priv-section-title">{ui.dataCollection}</div>
            <div className="priv-checkbox-grid">
              <CheckboxField label={ui.d_personal} checked={config.collectPersonalInfo} onChange={(v) => update('collectPersonalInfo', v)} />
              <CheckboxField label={ui.d_location} checked={config.collectLocation} onChange={(v) => update('collectLocation', v)} />
              <CheckboxField label={ui.d_deviceId} checked={config.collectDeviceId} onChange={(v) => update('collectDeviceId', v)} />
              <CheckboxField label={ui.d_contacts} checked={config.collectContacts} onChange={(v) => update('collectContacts', v)} />
              <CheckboxField label={ui.d_photos} checked={config.collectPhotos} onChange={(v) => update('collectPhotos', v)} />
              <CheckboxField label={ui.d_camera} checked={config.collectCamera} onChange={(v) => update('collectCamera', v)} />
              <CheckboxField label={ui.d_microphone} checked={config.collectMicrophone} onChange={(v) => update('collectMicrophone', v)} />
              <CheckboxField label={ui.d_health} checked={config.collectHealth} onChange={(v) => update('collectHealth', v)} />
              <CheckboxField label={ui.d_financial} checked={config.collectFinancial} onChange={(v) => update('collectFinancial', v)} />
              <CheckboxField label={ui.d_browsing} checked={config.collectBrowsing} onChange={(v) => update('collectBrowsing', v)} />
              <CheckboxField label={ui.d_cookies} checked={config.collectCookies} onChange={(v) => update('collectCookies', v)} />
              <CheckboxField label={ui.d_clipboard} checked={config.collectClipboard} onChange={(v) => update('collectClipboard', v)} />
              <CheckboxField label={ui.d_adId} checked={config.collectAdId} onChange={(v) => update('collectAdId', v)} />
            </div>
          </div>

          <div className="priv-section">
            <div className="priv-section-title">{ui.thirdParty}</div>
            <div className="priv-checkbox-grid">
              <CheckboxField label={ui.t_analytics} checked={config.useAnalytics} onChange={(v) => update('useAnalytics', v)} />
              <CheckboxField label={ui.t_ads} checked={config.useAds} onChange={(v) => update('useAds', v)} />
              <CheckboxField label={ui.t_payment} checked={config.usePayment} onChange={(v) => update('usePayment', v)} />
              <CheckboxField label={ui.t_social} checked={config.useSocialLogin} onChange={(v) => update('useSocialLogin', v)} />
              <CheckboxField label={ui.t_cloud} checked={config.useCloudStorage} onChange={(v) => update('useCloudStorage', v)} />
              <CheckboxField label={ui.t_push} checked={config.usePushNotifications} onChange={(v) => update('usePushNotifications', v)} />
            </div>
          </div>

          <div className="priv-section">
            <div className="priv-section-title">{ui.targetMarket}</div>
            <div className="priv-checkbox-grid">
              <CheckboxField label={ui.m_china} checked={config.targetChina} onChange={(v) => update('targetChina', v)} />
              <CheckboxField label={ui.m_eu} checked={config.targetEU} onChange={(v) => update('targetEU', v)} />
              <CheckboxField label={ui.m_us} checked={config.targetUS} onChange={(v) => update('targetUS', v)} />
              <CheckboxField label={ui.m_children} checked={config.targetChildren} onChange={(v) => update('targetChildren', v)} />
            </div>
          </div>

          <div className="priv-section">
            <div className="priv-section-title">{ui.storePlatform}</div>
            <div className="priv-checkbox-grid">
              <CheckboxField label={ui.s_appstore} checked={config.onAppStore} onChange={(v) => update('onAppStore', v)} />
              <CheckboxField label={ui.s_googleplay} checked={config.onGooglePlay} onChange={(v) => update('onGooglePlay', v)} />
              <CheckboxField label={ui.s_huawei} checked={config.onHuaweiStore} onChange={(v) => update('onHuaweiStore', v)} />
              <CheckboxField label={ui.s_xiaomi} checked={config.onXiaomiStore} onChange={(v) => update('onXiaomiStore', v)} />
              <CheckboxField label={ui.s_oppo} checked={config.onOppoStore} onChange={(v) => update('onOppoStore', v)} />
              <CheckboxField label={ui.s_vivo} checked={config.onVivoStore} onChange={(v) => update('onVivoStore', v)} />
            </div>
          </div>

          <div className="priv-section">
            <button className="priv-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
              <span className={`priv-advanced-arrow${showAdvanced ? ' priv-advanced-arrow-open' : ''}`}>&#9654;</span>
              {ui.advancedSettings}
            </button>
            {showAdvanced && (
              <>
                <div className="priv-field">
                  <label>{ui.storageType}</label>
                  <div className="priv-radio-group">
                    {(['local', 'cloud', 'both'] as const).map((st) => (
                      <label key={st} className={`priv-radio${config.storageType === st ? ' priv-radio-active' : ''}`}>
                        <input type="radio" name="storageType" checked={config.storageType === st} onChange={() => update('storageType', st)} />
                        <span>{ui[`storage${st.charAt(0).toUpperCase() + st.slice(1)}`]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="priv-field"><label>{ui.jurisdiction}</label><input className="input-field" value={config.jurisdiction} onChange={(e) => update('jurisdiction', e.target.value)} /></div>
                <div className="priv-field"><label>{ui.dataRetention}</label><input className="input-field" value={config.dataRetention} onChange={(e) => update('dataRetention', e.target.value)} placeholder={ui.retentionPlaceholder} /></div>
                <div className="priv-field"><label>{ui.dpoContact}</label><input className="input-field" value={config.dpoContact} onChange={(e) => update('dpoContact', e.target.value)} placeholder={ui.dpoPlaceholder} /></div>
                <div className="priv-checkbox-grid" style={{ marginTop: 8 }}>
                  <CheckboxField label={ui.hasSubscription} checked={config.hasSubscription} onChange={(v) => update('hasSubscription', v)} />
                  <CheckboxField label={ui.hasAccountSystem} checked={config.hasAccountSystem} onChange={(v) => update('hasAccountSystem', v)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="tool-panel">
          <div className="panel-header">
            <div className="priv-output-controls">
              <div className="priv-lang-toggle">
                <button className={`panel-btn panel-btn-sm${outputLang === 'zh' ? ' accent' : ''}`} onClick={() => setOutputLang('zh')}>中文</button>
                <button className={`panel-btn panel-btn-sm${outputLang === 'en' ? ' accent' : ''}`} onClick={() => setOutputLang('en')}>EN</button>
              </div>
              {tab !== 'checklist' && (
                <div className="priv-format-toggle">
                  <button className={`panel-btn panel-btn-sm${outputFormat === 'markdown' ? ' accent' : ''}`} onClick={() => setOutputFormat('markdown')}>{ui.formatMarkdown}</button>
                  <button className={`panel-btn panel-btn-sm${outputFormat === 'html' ? ' accent' : ''}`} onClick={() => setOutputFormat('html')}>{ui.formatHTML}</button>
                </div>
              )}
              <div className="panel-actions">
                {tab !== 'checklist' && (
                  <>
                    <button className="panel-btn" onClick={() => copyDoc(outputFormat === 'html' ? currentHtml : currentDoc)}>{copied ? t('common.copied') : t('common.copy')}</button>
                    {outputFormat === 'html' ? (
                      <button className="panel-btn accent" onClick={() => downloadDoc(currentHtml, `${fileBase}.html`, 'text/html;charset=utf-8')}>{ui.downloadHTML}</button>
                    ) : (
                      <button className="panel-btn" onClick={() => downloadDoc(currentDoc, `${fileBase}.md`, 'text/markdown;charset=utf-8')}>{t('common.download')}</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="priv-output">
            {tab === 'privacy' && (
              outputFormat === 'html'
                ? <div className="priv-doc-html" dangerouslySetInnerHTML={{ __html: markdownToHtml(privacyDoc) }} />
                : <pre className="priv-doc">{privacyDoc}</pre>
            )}
            {tab === 'terms' && (
              outputFormat === 'html'
                ? <div className="priv-doc-html" dangerouslySetInnerHTML={{ __html: markdownToHtml(termsDoc) }} />
                : <pre className="priv-doc">{termsDoc}</pre>
            )}
            {tab === 'checklist' && (
              <div className="priv-checklist">
                <div className="priv-checklist-header">
                  <span className="priv-checklist-score">{passCount}/{applicableResults.length}</span>
                  <span className="priv-checklist-label">{ui.complianceScore}</span>
                </div>

                {failedWithFix.length > 0 && (
                  <div className="priv-fix-all-bar">
                    <span className="priv-fix-all-text">
                      {lang === 'zh'
                        ? `${failedWithFix.length} 项可自动修复`
                        : `${failedWithFix.length} items can be auto-fixed`}
                    </span>
                    <button className="priv-fix-all-btn" onClick={fixAll}>{ui.fixAll}</button>
                  </div>
                )}

                {checklistResults.map((item) => (
                  <div key={item.id} className={`priv-check-item ${item.na ? 'priv-check-na' : item.passed ? 'priv-check-pass' : 'priv-check-fail'}`}>
                    <span className="priv-check-icon">{item.na ? '–' : item.passed ? '✓' : '✕'}</span>
                    <div className="priv-check-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="priv-check-platform">{item.platform}</span>
                        {item.na ? (
                          <span className="priv-severity priv-severity-na">{ui.notApplicable}</span>
                        ) : item.required ? (
                          <span className="priv-severity priv-severity-must">{ui.mustFix}</span>
                        ) : (
                          <span className="priv-severity priv-severity-rec">{ui.recommended}</span>
                        )}
                        {item.manualOnly && !item.passed && !item.na && (
                          <span className="priv-severity priv-severity-rec">{ui.manualAction}</span>
                        )}
                      </div>
                      <span className="priv-check-text">{lang === 'zh' ? item.zh : item.en}</span>
                      {!item.passed && !item.na && (
                        <div className="priv-check-actions">
                          <div className="priv-suggestion">
                            {ui.suggestion}：{lang === 'zh' ? item.suggestion.zh : item.suggestion.en}
                          </div>
                          {item.fix && (
                            <button className="priv-fix-btn" onClick={() => applyFix(item.fix!)}>
                              {ui.fixItem}
                            </button>
                          )}
                          {item.reference && (
                            <a className="priv-ref-link" href={item.reference.url} target="_blank" rel="noopener noreferrer">
                              {ui.viewRef}：{item.reference.title} ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* References section */}
                <div className="priv-references">
                  <button className="priv-ref-toggle" onClick={() => setShowRefs(!showRefs)}>
                    <span className={`priv-advanced-arrow${showRefs ? ' priv-advanced-arrow-open' : ''}`}>&#9654;</span>
                    {ui.references}
                  </button>
                  {showRefs && (
                    <div className="priv-ref-grid">
                      {Object.entries(REFERENCES).map(([key, group]) => (
                        <div key={key} className="priv-ref-group">
                          <div className="priv-ref-group-title">{lang === 'zh' ? group.zh : group.en}</div>
                          <ul className="priv-ref-list">
                            {group.links.map((link) => (
                              <li key={link.url} className="priv-ref-item">
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                  {link.title}
                                  <span className="priv-ref-ext">↗</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
