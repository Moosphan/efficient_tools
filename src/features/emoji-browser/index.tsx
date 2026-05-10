import { useState, useMemo } from 'react';
import rawEmojiData from 'emoji-datasource';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

interface EmojiEntry { emoji: string; name: string; category: string; subcategory: string; }

function codepointToEmoji(unified: string): string {
  return unified.split('-').map((cp) => String.fromCodePoint(parseInt(cp, 16))).join('');
}

const EMOJI_DB: EmojiEntry[] = (rawEmojiData as any[])
  .filter((e: any) => e.unified && e.category !== 'Component')
  .sort((a: any, b: any) => a.sort_order - b.sort_order)
  .map((e: any) => ({
    emoji: codepointToEmoji(e.unified),
    name: e.short_name.replace(/_/g, ' '),
    category: e.category,
    subcategory: e.subcategory || '',
  }));

const CATEGORIES = [...new Set(EMOJI_DB.map((e) => e.category))];

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  'Smileys & Emotion': { zh: '表情', en: 'Smileys' },
  'People & Body': { zh: '人物', en: 'People' },
  'Animals & Nature': { zh: '动物与自然', en: 'Animals' },
  'Food & Drink': { zh: '食物', en: 'Food' },
  'Travel & Places': { zh: '旅行', en: 'Travel' },
  'Activities': { zh: '活动', en: 'Activities' },
  'Objects': { zh: '物品', en: 'Objects' },
  'Symbols': { zh: '符号', en: 'Symbols' },
  'Flags': { zh: '旗帜', en: 'Flags' },
};

const PLATFORM_NOTES_ZH = `## Emoji 平台差异说明

不同操作系统和平台对 Emoji 的渲染存在显著差异，同一个 Unicode 码点在不同设备上可能呈现完全不同的视觉效果。

### 主要差异来源

| 平台 | 渲染风格 | 特点 |
|------|---------|------|
| **Apple (iOS/macOS)** | 圆润、拟物化 | 色彩饱和度高，细节丰富，是最常见的参考样式 |
| **Google (Android/Web)** | 扁平、简洁 | 线条更粗，颜色更鲜艳，部分表情风格与 Apple 差异大 |
| **Microsoft (Windows)** | 3D → 扁平 | Windows 11 起改为扁平化，但仍有部分旧式 3D 渲染 |
| **Samsung** | 独特风格 | 早期与 Apple 差异极大，近年趋于标准化 |
| **Twitter/X (Twemoji)** | 扁平卡通 | 开源且广泛使用，风格介于 Apple 和 Google 之间 |

### 常见差异案例

- **😅 Grinning Face with Sweat**: Apple 表示"尴尬的笑"，部分旧平台曾表示"热"
- **🔫 Pistol**: Apple 2016 年改为水枪，其他平台陆续跟进，但造型各异
- **💀 Skull**: Apple 为白色骷髅，Google 为灰色，风格差异明显
- **🫠 Melting Face**: 2022 年新增 Emoji，各平台渲染差异较大
- **🫡 Saluting Face**: 2022 年新增，各平台手势角度不同
- **🤗 Hugging Face**: 部分平台的"拥抱"手势看起来像"招手"
- **🙏 Folded Hands**: 部分平台是"祈祷"，部分是"击掌"，含义理解有分歧
- **😤 Face with Steam From Nose**: 在日本文化中表示" triumph"，西方理解为"angry"

### Emoji 版本与支持

Emoji 每年由 Unicode Consortium 发布新版本，各平台跟进时间不同：
- Unicode 15.0 (2022): 新增 31 个 Emoji
- Unicode 15.1 (2023): 新增 118 个 Emoji
- Unicode 16.0 (2024): 新增 7 个 Emoji

旧设备可能无法显示新版本 Emoji，显示为方框 □ 或问号。

### 使用建议

1. 跨平台场景中，避免依赖单个 Emoji 的视觉效果来传达关键含义
2. 关键信息请同时使用文字说明，不要仅靠 Emoji
3. 面向国际用户时注意文化差异（如 👍 在中东部分地区有负面含义）
4. 技术文档中 Emoji 可能影响搜索和解析，谨慎使用`;

const PLATFORM_NOTES_ENH = `## Emoji Platform Differences

The same Unicode codepoint can look dramatically different across platforms.

### Rendering Styles

| Platform | Style | Notes |
|----------|-------|-------|
| **Apple (iOS/macOS)** | Rounded, skeuomorphic | Rich detail, high saturation |
| **Google (Android/Web)** | Flat, clean | Thicker lines, vivid colors |
| **Microsoft (Windows)** | 3D → Flat | Windows 11 switched to flat style |
| **Samsung** | Unique | Historically very different, now more standard |
| **Twitter/X (Twemoji)** | Flat cartoon | Open source, widely used |

### Common Differences

- **😅**: Apple = "nervous laugh", some older platforms = "hot"
- **🔫**: Apple changed to water gun in 2016, others followed
- **💀**: Apple = white skull, Google = gray skull
- **🫠 / 🫡**: 2022 additions, significant cross-platform variation
- **🤗**: Some platforms show "wave" instead of "hug"
- **🙏**: Ambiguous between "prayer" and "high five"

### Recommendations

1. Don't rely on a single Emoji's appearance for critical meaning
2. Always include text alongside Emoji for important information
3. Be aware of cultural differences (e.g. 👍 has negative connotations in some regions)
4. New Emoji may not render on older devices (shows □ or ?)`;

export default function EmojiBrowser() {
  const { lang, t } = useI18n();
  const { name, desc, ui, help } = useToolI18n('emoji');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const filtered = useMemo(() => {
    return EMOJI_DB.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.emoji.includes(q) || e.name.toLowerCase().includes(q) || e.subcategory.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, category]);

  const copyEmoji = (emoji: string) => {
    navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji(null), 1200);
  };

  const getCatLabel = (cat: string) => CATEGORY_LABELS[cat]?.[lang] ?? cat;

  return (
    <ToolShell title={name} description={desc}>
      <div className="tool-layout">
        <div className="tool-panel">
          <div className="panel-header">
            {ui.search}
            <div className="panel-actions">
              <button className={`panel-btn panel-btn-sm${showNotes ? ' accent' : ''}`} onClick={() => setShowNotes(!showNotes)}>{ui.platformNotes}</button>
            </div>
          </div>
          <div style={{ padding: '8px 16px' }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ui.placeholder} style={{ width: '100%', padding: '8px 12px', background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ padding: '0 16px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button className={`panel-btn panel-btn-sm${category === 'all' ? ' accent' : ''}`} onClick={() => setCategory('all')}>{ui.all} ({EMOJI_DB.length})</button>
            {CATEGORIES.map((c) => {
              const count = EMOJI_DB.filter((e) => e.category === c).length;
              return (
                <button key={c} className={`panel-btn panel-btn-sm${category === c ? ' accent' : ''}`} onClick={() => setCategory(c)}>{getCatLabel(c)} ({count})</button>
              );
            })}
          </div>
          <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: 2, maxHeight: 400, overflow: 'auto' }}>
            {filtered.map((e, i) => (
              <button
                key={`${e.emoji}-${i}`}
                onClick={() => copyEmoji(e.emoji)}
                title={`${e.emoji} ${e.name}`}
                style={{ padding: '6px 0', fontSize: 20, background: copiedEmoji === e.emoji ? 'var(--accent-bg, rgba(99,102,241,0.15))' : 'transparent', border: copiedEmoji === e.emoji ? '1px solid var(--accent)' : '1px solid transparent', borderRadius: 4, cursor: 'pointer' }}
              >
                {e.emoji}
              </button>
            ))}
          </div>
          <div style={{ padding: '4px 16px 12px', fontSize: 11, color: 'var(--muted)' }}>{filtered.length} / {EMOJI_DB.length} emoji · {ui.clickToCopy}</div>
        </div>
        <div className="tool-panel">
          <div className="panel-header">{showNotes ? ui.platformNotes : ui.details}</div>
          {showNotes ? (
            <div style={{ padding: 16, fontSize: 13, lineHeight: 1.8, overflow: 'auto', maxHeight: 600 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13 }}>{lang === 'zh' ? PLATFORM_NOTES_ZH : PLATFORM_NOTES_ENH}</pre>
            </div>
          ) : (
            <div style={{ padding: 12, overflow: 'auto', maxHeight: 600 }}>
              {filtered.length > 0 ? filtered.slice(0, 200).map((e, i) => (
                <div key={`${e.emoji}-detail-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 24, minWidth: 32, textAlign: 'center' }}>{e.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{getCatLabel(e.category)} · {e.subcategory}</div>
                  </div>
                  <button className="panel-btn panel-btn-sm" onClick={() => copyEmoji(e.emoji)} style={{ flexShrink: 0 }}>{copiedEmoji === e.emoji ? '✓' : t('common.copy')}</button>
                </div>
              )) : <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 24 }}>{ui.noResults}</div>}
              {filtered.length > 200 && <div style={{ padding: 12, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{ui.showingFirst}</div>}
            </div>
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} params={help.params} />}
    </ToolShell>
  );
}
